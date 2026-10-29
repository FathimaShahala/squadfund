import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    goalAmount: { type: Number, min: 0, default: 0 }, // 0 means no goal
    monthlyAmount: { type: Number, required: true, min: 1 },
    dueDay: { type: Number, min: 1, max: 28, default: 5 }, // day of month, max 28 so every month has it
    requireApproval: { type: Boolean, default: false }, // admin must approve new members
    inviteCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
