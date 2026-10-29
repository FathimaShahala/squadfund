import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    // pending: waiting for admin approval, active: full access,
    // left: member quit (can rejoin), removed: admin removed them (cannot rejoin by themselves)
    status: { type: String, enum: ["pending", "active", "left", "removed"], default: "active" },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

// A user has at most one membership record per group
membershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });
membershipSchema.index({ groupId: 1, status: 1 });

export default mongoose.model("Membership", membershipSchema);
