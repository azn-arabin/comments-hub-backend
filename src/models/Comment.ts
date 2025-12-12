import mongoose, { Schema } from 'mongoose';
import { IComment } from '../types';

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    pageId: {
      type: String,
      required: [true, 'Page ID is required'],
      index: true, // Index for faster queries by page
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
commentSchema.index({ pageId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for likes count
commentSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

// Virtual for dislikes count
commentSchema.virtual('dislikesCount').get(function () {
  return this.dislikes.length;
});

// Virtual for replies count
commentSchema.virtual('repliesCount').get(function () {
  return this.replies.length;
});

// Ensure virtuals are included in JSON
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Middleware to update parent's replies array when a reply is created
commentSchema.post('save', async function (doc) {
  if (doc.parentComment) {
    await mongoose
      .model<IComment>('Comment')
      .findByIdAndUpdate(doc.parentComment, {
        $addToSet: { replies: doc._id },
      });
  }
});

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
