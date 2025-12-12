import { query } from "express-validator";

export const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

export const sortValidation = [
  query("sort")
    .optional()
    .isIn(["newest", "mostLiked", "mostDisliked"])
    .withMessage("Sort must be one of: newest, mostLiked, mostDisliked"),
];
