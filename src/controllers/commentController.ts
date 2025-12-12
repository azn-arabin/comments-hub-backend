import { Response } from "express";
import Comment from "../models/Comment";
import { AuthRequest, PaginationQuery } from "../types";
import { Types } from "mongoose";
import { getSocketService } from "../utils/socket";
import {
  sendSuccessResponse,
  sendFailureResponse,
} from "../lib/helpers/responseHelper";
import { paginate } from "../lib/helpers/paginationHelper";

// @desc    Get all comments for a page
// @route   GET /api/comments/:pageId
// @access  Public
export const getComments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { pageId } = req.params;
    const {
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query as PaginationQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build sort criteria
    let sortCriteria: any = { createdAt: -1 };
    if (sort === "mostLiked") {
      sortCriteria = { likesCount: -1, createdAt: -1 };
    } else if (sort === "mostDisliked") {
      sortCriteria = { dislikesCount: -1, createdAt: -1 };
    }

    const query = { pageId, isDeleted: false, parentComment: null };

    // Use pagination helper for simple sorting
    if (sort === "newest") {
      const result = await paginate(Comment, query, {
        page: pageNum,
        pageSize: limitNum,
        sort: sortCriteria,
        populate: { path: "author", select: "-password" },
      });

      sendSuccessResponse({
        res,
        statusCode: 200,
        message: "Comments fetched successfully",
        data: result.items,
        meta: result.meta,
      });
      return;
    }

    // Use aggregation for like/dislike sorting
    const totalComments = await Comment.countDocuments(query);
    const skip = (pageNum - 1) * limitNum;
    const sortField = sort === "mostLiked" ? "likes" : "dislikes";

    const comments = await Comment.aggregate([
      { $match: query },
      {
        $addFields: {
          [`${sortField}Count`]: { $size: `$${sortField}` },
        },
      },
      { $sort: sortCriteria },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          "author.password": 0,
        },
      },
    ]);

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "Comments fetched successfully",
      data: comments,
      meta: {
        totalItems: totalComments,
        totalPages: Math.ceil(totalComments / limitNum),
        currentPage: pageNum,
        pageSize: limitNum,
      },
    });
  } catch (error: any) {
    console.error("Get comments error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error fetching comments",
      error,
    });
  }
};

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { content, pageId, parentCommentId } = req.body;

    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    // Validate parent comment if provided
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        sendFailureResponse({
          res,
          statusCode: 404,
          message: "Parent comment not found",
          errorType: "NOT_FOUND",
        });
        return;
      }
    }

    const comment = await Comment.create({
      content,
      pageId,
      author: req.user.userId,
      parentComment: parentCommentId || null,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "-password")
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitNewComment(pageId, populatedComment);
    } catch (error) {
      console.log("Socket service not available");
    }

    sendSuccessResponse({
      res,
      statusCode: 201,
      message: "Comment created successfully",
      data: populatedComment,
    });
  } catch (error: any) {
    console.error("Create comment error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error creating comment",
      error,
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private
export const updateComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      sendFailureResponse({
        res,
        statusCode: 404,
        message: "Comment not found",
        errorType: "NOT_FOUND",
      });
      return;
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.userId) {
      sendFailureResponse({
        res,
        statusCode: 403,
        message: "Not authorized to update this comment",
        errorType: "FORBIDDEN",
      });
      return;
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("author", "-password")
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitUpdateComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log("Socket service not available");
    }

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error: any) {
    console.error("Update comment error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error updating comment",
      error,
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      sendFailureResponse({
        res,
        statusCode: 404,
        message: "Comment not found",
        errorType: "NOT_FOUND",
      });
      return;
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.userId) {
      sendFailureResponse({
        res,
        statusCode: 403,
        message: "Not authorized to delete this comment",
        errorType: "FORBIDDEN",
      });
      return;
    }

    // Soft delete
    comment.isDeleted = true;
    const pageId = comment.pageId;
    await comment.save();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitDeleteComment(pageId, commentId);
    } catch (error) {
      console.log("Socket service not available");
    }

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "Comment deleted successfully",
      data: null,
    });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error deleting comment",
      error,
    });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:commentId/like
// @access  Private
export const likeComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      sendFailureResponse({
        res,
        statusCode: 404,
        message: "Comment not found",
        errorType: "NOT_FOUND",
      });
      return;
    }

    const userId = new Types.ObjectId(req.user.userId);

    // Check if already liked
    const alreadyLiked = comment.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      // Remove like
      comment.likes = comment.likes.filter((id) => !id.equals(userId));
    } else {
      // Add like and remove dislike if exists
      comment.likes.push(userId);
      comment.dislikes = comment.dislikes.filter((id) => !id.equals(userId));
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("author", "-password")
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitLikeComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log("Socket service not available");
    }

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: alreadyLiked ? "Like removed" : "Comment liked",
      data: updatedComment,
    });
  } catch (error: any) {
    console.error("Like comment error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error liking comment",
      error,
    });
  }
};

// @desc    Dislike a comment
// @route   POST /api/comments/:commentId/dislike
// @access  Private
export const dislikeComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      sendFailureResponse({
        res,
        statusCode: 404,
        message: "Comment not found",
        errorType: "NOT_FOUND",
      });
      return;
    }

    const userId = new Types.ObjectId(req.user.userId);

    // Check if already disliked
    const alreadyDisliked = comment.dislikes.some((id) => id.equals(userId));

    if (alreadyDisliked) {
      // Remove dislike
      comment.dislikes = comment.dislikes.filter((id) => !id.equals(userId));
    } else {
      // Add dislike and remove like if exists
      comment.dislikes.push(userId);
      comment.likes = comment.likes.filter((id) => !id.equals(userId));
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("author", "-password")
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitDislikeComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log("Socket service not available");
    }

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: alreadyDisliked ? "Dislike removed" : "Comment disliked",
      data: updatedComment,
    });
  } catch (error: any) {
    console.error("Dislike comment error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error disliking comment",
      error,
    });
  }
};

// @desc    Get replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
export const getReplies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate("author", "-password")
      .lean();

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "Replies fetched successfully",
      data: replies,
    });
  } catch (error: any) {
    console.error("Get replies error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error fetching replies",
      error,
    });
  }
};
