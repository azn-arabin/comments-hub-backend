import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

const validatorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors).length === 0) {
    return next();
  }

  res.status(400).json({
    status: "error",
    success: false,
    errors: mappedErrors,
  });
};

export default validatorMiddleware;
