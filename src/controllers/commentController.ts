import { Response } from 'express';
import Comment from '../models/Comment';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';
import { Types } from 'mongoose';
import { getSocketService } from '../utils/socket';

// @desc    Get all comments for a page
// @route   GET /api/comments/:pageId
// @access  Public
export const getComments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { pageId } = req.params;
    const { page = '1', limit = '10', sort = 'newest' } = req.query as PaginationQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort criteria
    let sortCriteria: any = { createdAt: -1 }; // Default: newest
    if (sort === 'mostLiked') {
      sortCriteria = { likesCount: -1, createdAt: -1 };
    } else if (sort === 'mostDisliked') {
      sortCriteria = { dislikesCount: -1, createdAt: -1 };
    }

    // Get only top-level comments (no parent)
    const query = { pageId, isDeleted: false, parentComment: null };

    // Get total count
    const totalComments = await Comment.countDocuments(query);

    // Get comments with aggregation for sorting by array length
    let comments;
    
    if (sort === 'mostLiked' || sort === 'mostDisliked') {
      const sortField = sort === 'mostLiked' ? 'likes' : 'dislikes';
      comments = await Comment.aggregate([
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
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        { $unwind: '$author' },
        {
          $project: {
            'author.password': 0,
          },
        },
      ]);
    } else {
      comments = await Comment.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .populate('author', '-password')
        .lean();
    }

    const totalPages = Math.ceil(totalComments / limitNum);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalComments,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching comments',
    } as ApiResponse);
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
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    // Validate parent comment if provided
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        res.status(404).json({
          success: false,
          error: 'Parent comment not found',
        } as ApiResponse);
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
      .populate('author', '-password')
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitNewComment(pageId, populatedComment);
    } catch (error) {
      console.log('Socket service not available');
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating comment',
    } as ApiResponse);
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
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      } as ApiResponse);
      return;
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment',
      } as ApiResponse);
      return;
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', '-password')
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitUpdateComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log('Socket service not available');
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating comment',
    } as ApiResponse);
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
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      } as ApiResponse);
      return;
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment',
      } as ApiResponse);
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
      console.log('Socket service not available');
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting comment',
    } as ApiResponse);
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
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      } as ApiResponse);
      return;
    }

    const userId = new Types.ObjectId(req.user.userId);

    // Check if already liked
    const alreadyLiked = comment.likes.some(id => id.equals(userId));

    if (alreadyLiked) {
      // Remove like
      comment.likes = comment.likes.filter(id => !id.equals(userId));
    } else {
      // Add like and remove dislike if exists
      comment.likes.push(userId);
      comment.dislikes = comment.dislikes.filter(id => !id.equals(userId));
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', '-password')
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitLikeComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log('Socket service not available');
    }

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed' : 'Comment liked',
      data: updatedComment,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error liking comment',
    } as ApiResponse);
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
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      } as ApiResponse);
      return;
    }

    const userId = new Types.ObjectId(req.user.userId);

    // Check if already disliked
    const alreadyDisliked = comment.dislikes.some(id => id.equals(userId));

    if (alreadyDisliked) {
      // Remove dislike
      comment.dislikes = comment.dislikes.filter(id => !id.equals(userId));
    } else {
      // Add dislike and remove like if exists
      comment.dislikes.push(userId);
      comment.likes = comment.likes.filter(id => !id.equals(userId));
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', '-password')
      .lean();

    // Emit socket event
    try {
      const socketService = getSocketService();
      socketService.emitDislikeComment(comment.pageId, updatedComment);
    } catch (error) {
      console.log('Socket service not available');
    }

    res.status(200).json({
      success: true,
      message: alreadyDisliked ? 'Dislike removed' : 'Comment disliked',
      data: updatedComment,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Dislike comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error disliking comment',
    } as ApiResponse);
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
      .populate('author', '-password')
      .lean();

    res.status(200).json({
      success: true,
      data: replies,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching replies',
    } as ApiResponse);
  }
};
