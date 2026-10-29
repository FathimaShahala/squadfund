import { Router } from "express";
import rateLimit from "express-rate-limit";
import { auth } from "../middleware/auth.js";
import { groupAccess, requireAdmin } from "../middleware/groupAccess.js";
import { validate } from "../middleware/validate.js";
import {
  createGroup,
  myGroups,
  joinGroup,
  getGroup,
  updateGroup,
  listMembers,
  approveMember,
  removeMember,
  leaveGroup,
  regenerateInvite,
  createGroupSchema,
  updateGroupSchema,
  joinSchema,
} from "../controllers/groupController.js";

const router = Router();

// slows down anyone trying to guess invite codes
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: { message: "Too many attempts, try again later" },
});

router.use(auth); // every group route needs a logged-in user

router.post("/", validate(createGroupSchema), createGroup);
router.get("/", myGroups);
router.post("/join", joinLimiter, validate(joinSchema), joinGroup); // keep above "/:groupId"

// Everything below has :groupId, so groupAccess blocks non-members
router.get("/:groupId", groupAccess, getGroup);
router.patch("/:groupId", groupAccess, requireAdmin, validate(updateGroupSchema), updateGroup);
router.get("/:groupId/members", groupAccess, listMembers);
router.post("/:groupId/members/:userId/approve", groupAccess, requireAdmin, approveMember);
router.delete("/:groupId/members/:userId", groupAccess, requireAdmin, removeMember);
router.post("/:groupId/leave", groupAccess, leaveGroup);
router.post("/:groupId/invite/regenerate", groupAccess, requireAdmin, regenerateInvite);

export default router;
