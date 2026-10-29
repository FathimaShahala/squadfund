import mongoose from "mongoose";
import Group from "../models/Group.js";
import Membership from "../models/Membership.js";

// Put this on EVERY route that has :groupId. Only active members get through.
// Sets req.group and req.membership for the handlers after it.
export async function groupAccess(req, res, next) {
  const { groupId } = req.params;
  const notFound = () => res.status(404).json({ message: "Group not found" });

  if (!mongoose.isValidObjectId(groupId)) return notFound();

  const membership = await Membership.findOne({
    groupId,
    userId: req.user._id,
    status: "active",
  });
  // Same 404 for "doesn't exist" and "not your group" so outsiders can't probe for groups
  if (!membership) return notFound();

  const group = await Group.findById(groupId);
  if (!group) return notFound();

  req.group = group;
  req.membership = membership;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.membership?.role !== "admin") {
    return res.status(403).json({ message: "Only the group admin can do this" });
  }
  next();
}
