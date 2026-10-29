import mongoose from "mongoose";
import { z } from "zod";
import Group from "../models/Group.js";
import Membership from "../models/Membership.js";
import { generateInviteCode } from "../utils/inviteCode.js";

// ---------- validation schemas (no zod defaults: Mongoose schema supplies them,
// so a PATCH never resets fields the admin didn't send) ----------
const groupFields = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters").max(60),
  description: z.string().trim().max(200, "Description is too long (max 200)"),
  monthlyAmount: z.coerce.number().min(1, "Monthly amount must be at least 1"),
  goalAmount: z.coerce.number().min(0, "Goal cannot be negative"),
  dueDay: z.coerce.number().int().min(1, "Due day must be 1 to 28").max(28, "Due day must be 1 to 28"),
  requireApproval: z.boolean(),
});

export const createGroupSchema = groupFields.partial({
  description: true,
  goalAmount: true,
  dueDay: true,
  requireApproval: true,
});

export const updateGroupSchema = groupFields.partial();

export const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Enter the invite code").max(20),
});

// ---------- helpers ----------
const groupDTO = (g, { role, memberCount, includeInvite = true }) => ({
  id: g._id,
  name: g.name,
  description: g.description,
  monthlyAmount: g.monthlyAmount,
  goalAmount: g.goalAmount,
  dueDay: g.dueDay,
  requireApproval: g.requireApproval,
  status: g.status,
  inviteCode: includeInvite ? g.inviteCode : undefined,
  createdAt: g.createdAt,
  myRole: role,
  memberCount,
});

const activeCount = (groupId) => Membership.countDocuments({ groupId, status: "active" });

async function createGroupWithUniqueCode(data) {
  for (let i = 0; i < 5; i++) {
    try {
      return await Group.create({ ...data, inviteCode: generateInviteCode() });
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.inviteCode) continue; // code clash, try another
      throw err;
    }
  }
  throw new Error("Could not generate an invite code, please try again");
}

const badId = (res) => res.status(404).json({ message: "Member not found" });

// ---------- handlers ----------
export async function createGroup(req, res) {
  const group = await createGroupWithUniqueCode({ ...req.body, createdBy: req.user._id });

  try {
    await Membership.create({
      userId: req.user._id,
      groupId: group._id,
      role: "admin",
      status: "active",
      joinedAt: new Date(),
    });
  } catch (err) {
    await Group.deleteOne({ _id: group._id }); // don't leave a group with no admin
    throw err;
  }

  res.status(201).json({ group: groupDTO(group, { role: "admin", memberCount: 1 }) });
}

export async function myGroups(req, res) {
  const memberships = await Membership.find({
    userId: req.user._id,
    status: { $in: ["active", "pending"] },
  })
    .populate("groupId")
    .sort({ createdAt: -1 });

  const valid = memberships.filter((m) => m.groupId);
  const ids = valid.map((m) => m.groupId._id);

  const counts = await Membership.aggregate([
    { $match: { groupId: { $in: ids }, status: "active" } },
    { $group: { _id: "$groupId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const groups = valid.map((m) => ({
    ...groupDTO(m.groupId, {
      role: m.role,
      memberCount: countMap.get(String(m.groupId._id)) || 0,
      includeInvite: m.status === "active",
    }),
    membershipStatus: m.status, // "pending" = waiting for admin approval
  }));

  res.json({ groups });
}

export async function joinGroup(req, res) {
  const group = await Group.findOne({
    inviteCode: req.body.inviteCode.toUpperCase(),
    status: "active",
  });
  if (!group) return res.status(404).json({ message: "Invalid invite code" });

  let membership = await Membership.findOne({ userId: req.user._id, groupId: group._id });

  if (membership) {
    if (membership.status === "active") {
      return res.status(409).json({ message: "You are already a member of this group" });
    }
    if (membership.status === "pending") {
      return res.status(409).json({ message: "Your request is already waiting for admin approval" });
    }
    if (membership.status === "removed") {
      return res.status(403).json({ message: "You were removed from this group by its admin" });
    }
    // status "left": allowed to join again below
  }

  const status = group.requireApproval ? "pending" : "active";
  membership ??= new Membership({ userId: req.user._id, groupId: group._id });
  membership.role = "member";
  membership.status = status;
  membership.joinedAt = status === "active" ? new Date() : undefined;

  try {
    await membership.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "You have already requested to join" });
    throw err;
  }

  res.status(201).json({
    status,
    message:
      status === "pending"
        ? "Request sent. The admin needs to approve you."
        : `You joined ${group.name}`,
    group: { id: group._id, name: group.name },
  });
}

export async function getGroup(req, res) {
  const memberCount = await activeCount(req.group._id);
  res.json({ group: groupDTO(req.group, { role: req.membership.role, memberCount }) });
}

export async function updateGroup(req, res) {
  Object.assign(req.group, req.body);
  await req.group.save();
  const memberCount = await activeCount(req.group._id);
  res.json({ group: groupDTO(req.group, { role: req.membership.role, memberCount }) });
}

export async function listMembers(req, res) {
  const isAdmin = req.membership.role === "admin";

  const rows = await Membership.find({
    groupId: req.group._id,
    status: isAdmin ? { $in: ["active", "pending"] } : "active",
  })
    .populate("userId", "name email phone")
    .sort({ joinedAt: 1, createdAt: 1 });

  const toMember = (m) => ({
    userId: m.userId._id,
    name: m.userId.name,
    email: m.userId.email,
    phone: isAdmin ? m.userId.phone : undefined, // phone numbers are only visible to the admin
    role: m.role,
    joinedAt: m.joinedAt,
    isMe: m.userId._id.equals(req.user._id),
  });

  const usable = rows.filter((m) => m.userId);
  res.json({
    members: usable.filter((m) => m.status === "active").map(toMember),
    pending: usable.filter((m) => m.status === "pending").map(toMember),
  });
}

export async function approveMember(req, res) {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return badId(res);

  const membership = await Membership.findOneAndUpdate(
    { groupId: req.group._id, userId, status: "pending" },
    { status: "active", joinedAt: new Date() },
    { new: true }
  );
  if (!membership) return res.status(404).json({ message: "No pending request from this user" });

  res.json({ message: "Member approved" });
}

// Admin: reject a pending request or remove an active member
export async function removeMember(req, res) {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return badId(res);

  const target = await Membership.findOne({ groupId: req.group._id, userId });
  if (!target || !["active", "pending"].includes(target.status)) return badId(res);

  if (target.userId.equals(req.user._id)) {
    return res.status(400).json({ message: "Use 'Leave group' to leave yourself" });
  }
  if (target.role === "admin") {
    return res.status(400).json({ message: "An admin cannot be removed" });
  }

  if (target.status === "pending") {
    await target.deleteOne();
    return res.json({ message: "Request rejected" });
  }

  target.status = "removed";
  await target.save();
  res.json({ message: "Member removed" });
}

export async function leaveGroup(req, res) {
  if (req.membership.role === "admin") {
    return res.status(400).json({
      message: "The admin cannot leave the group. Hand over admin rights or close the group first.",
    });
  }
  req.membership.status = "left";
  await req.membership.save();
  res.json({ message: "You left the group" });
}

export async function regenerateInvite(req, res) {
  for (let i = 0; i < 5; i++) {
    try {
      req.group.inviteCode = generateInviteCode();
      await req.group.save();
      return res.json({ inviteCode: req.group.inviteCode });
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
  }
  throw new Error("Could not generate an invite code, please try again");
}
