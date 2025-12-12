import { Response } from "express";
import User from "../models/User";
import { generateToken } from "../config/jwt";
import { AuthRequest } from "../types";
import {
  sendSuccessResponse,
  sendFailureResponse,
  sendFieldErrorResponse,
} from "../lib/helpers/responseHelper";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      const message =
        existingUser.email === email
          ? "Email already registered"
          : "Username already taken";
      sendFieldErrorResponse({
        res,
        statusCode: 409,
        message,
        field,
      });
      return;
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    sendSuccessResponse({
      res,
      statusCode: 201,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error registering user",
      error,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
        errorType: "AUTHENTICATION_FAILED",
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
        errorType: "AUTHENTICATION_FAILED",
      });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error logging in",
      error,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendFailureResponse({
        res,
        statusCode: 401,
        message: "Not authenticated",
        errorType: "UNAUTHORIZED",
      });
      return;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      sendFailureResponse({
        res,
        statusCode: 404,
        message: "User not found",
        errorType: "NOT_FOUND",
      });
      return;
    }

    sendSuccessResponse({
      res,
      statusCode: 200,
      message: "User data fetched successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    sendFailureResponse({
      res,
      statusCode: 500,
      message: "Error fetching user data",
      error,
    });
  }
};
