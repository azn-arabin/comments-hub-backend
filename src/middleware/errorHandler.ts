import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  success: boolean;
  error: string;
  stack?: string;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const response: ErrorResponse = {
    success: false,
    error: message,
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error: any = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
