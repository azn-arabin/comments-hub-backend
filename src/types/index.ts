import { Request } from "express";
import { Document, Types } from "mongoose";

// User Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Comment Interface
export interface IComment extends Document {
  _id: Types.ObjectId;
  content: string;
  author: Types.ObjectId | IUser;
  pageId: string;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  parentComment?: Types.ObjectId;
  replies: Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request with User
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

// Pagination Query
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: "newest" | "mostLiked" | "mostDisliked";
}

// Socket Events
export enum SocketEvents {
  CONNECTION = "connection",
  DISCONNECT = "disconnect",
  JOIN_PAGE = "joinPage",
  LEAVE_PAGE = "leavePage",
  NEW_COMMENT = "newComment",
  UPDATE_COMMENT = "updateComment",
  DELETE_COMMENT = "deleteComment",
  LIKE_COMMENT = "likeComment",
  DISLIKE_COMMENT = "dislikeComment",
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalComments: number;
  };
}
