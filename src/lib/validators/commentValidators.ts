import { body, param } from "express-validator";
import { paginationValidation, sortValidation } from "./commonValidators";

export const getCommentsValidator = [
  param("pageId")
    .trim()
    .notEmpty()
    .withMessage("Page ID is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Page ID must be between 1 and 200 characters"),
  ...paginationValidation,
  ...sortValidation,
];

export const createCommentValidator = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
  body("pageId")
    .trim()
    .notEmpty()
    .withMessage("Page ID is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Page ID must be between 1 and 200 characters"),
  body("parentCommentId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid parent comment ID"),
];

export const updateCommentValidator = [
  param("commentId")
    .notEmpty()
    .withMessage("Comment ID is required")
    .isMongoId()
    .withMessage("Invalid comment ID"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
];

export const commentIdValidator = [
  param("commentId")
    .notEmpty()
    .withMessage("Comment ID is required")
    .isMongoId()
    .withMessage("Invalid comment ID"),
];
