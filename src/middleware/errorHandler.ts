import { Request, Response, NextFunction } from "express";
import { sendFailureResponse } from "../lib/helpers/responseHelper";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  sendFailureResponse({
    res,
    statusCode,
    message,
    errorType: err.errorType || "INTERNAL_ERROR",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
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
