import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment,
  getReplies,
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// Validation rules
const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
  body('pageId')
    .trim()
    .notEmpty()
    .withMessage('Page ID is required'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
];

const updateCommentValidation = [
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
];

const commentIdValidation = [
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),
];

const pageIdValidation = [
  param('pageId')
    .trim()
    .notEmpty()
    .withMessage('Page ID is required'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['newest', 'mostLiked', 'mostDisliked'])
    .withMessage('Sort must be one of: newest, mostLiked, mostDisliked'),
];

// Routes
router.get(
  '/:pageId',
  pageIdValidation,
  paginationValidation,
  validate,
  getComments
);

router.post(
  '/',
  authenticate,
  createCommentValidation,
  validate,
  createComment
);

router.put(
  '/:commentId',
  authenticate,
  updateCommentValidation,
  validate,
  updateComment
);

router.delete(
  '/:commentId',
  authenticate,
  commentIdValidation,
  validate,
  deleteComment
);

router.post(
  '/:commentId/like',
  authenticate,
  commentIdValidation,
  validate,
  likeComment
);

router.post(
  '/:commentId/dislike',
  authenticate,
  commentIdValidation,
  validate,
  dislikeComment
);

router.get(
  '/:commentId/replies',
  commentIdValidation,
  validate,
  getReplies
);

export default router;
