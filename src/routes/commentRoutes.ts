import { Router } from "express";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment,
  getReplies,
} from "../controllers/commentController";
import { authenticate } from "../middleware/auth";
import validatorMiddleware from "../middleware/validatorMiddleware";
import {
  getCommentsValidator,
  createCommentValidator,
  updateCommentValidator,
  commentIdValidator,
} from "../lib/validators/commentValidators";

const router = Router();

// Routes
router.get("/:pageId", getCommentsValidator, validatorMiddleware, getComments);

router.post(
  "/",
  authenticate,
  createCommentValidator,
  validatorMiddleware,
  createComment
);

router.put(
  "/:commentId",
  authenticate,
  updateCommentValidator,
  validatorMiddleware,
  updateComment
);

router.delete(
  "/:commentId",
  authenticate,
  commentIdValidator,
  validatorMiddleware,
  deleteComment
);

router.post(
  "/:commentId/like",
  authenticate,
  commentIdValidator,
  validatorMiddleware,
  likeComment
);

router.post(
  "/:commentId/dislike",
  authenticate,
  commentIdValidator,
  validatorMiddleware,
  dislikeComment
);

router.get(
  "/:commentId/replies",
  commentIdValidator,
  validatorMiddleware,
  getReplies
);

export default router;
