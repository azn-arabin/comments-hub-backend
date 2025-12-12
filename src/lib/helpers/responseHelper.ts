import { Response } from "express";

interface Meta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface SuccessResponseParams {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: unknown;
  meta?: Meta;
}

interface FailureResponseParams {
  res: Response;
  statusCode?: number;
  message?: string;
  errorType?: string;
  error?: unknown;
}

interface FieldErrorResponseParams {
  res: Response;
  statusCode?: number;
  message?: string;
  field: string;
}

export const sendSuccessResponse = ({
  res,
  statusCode = 200,
  message = "Request processed successfully",
  data,
  meta,
}: SuccessResponseParams): void => {
  const response: Record<string, unknown> = {
    status: "success",
    message,
  };

  if (meta !== undefined) {
    response.meta = meta;
  }
  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

export const sendFailureResponse = ({
  res,
  statusCode = 500,
  message,
  errorType,
  error,
}: FailureResponseParams): void => {
  const response: any = {
    status: "error",
    errors: {
      common: {
        msg: message || "Internal Server Error",
      },
    },
  };

  if (errorType) {
    response.errorType = errorType;
  }

  if (error !== undefined) {
    response.errors.external = error;
  }

  res.status(statusCode).json(response);
};

export const sendSubscriptionFailureResponse = ({
  res,
  statusCode = 403,
  message = "Subscription required",
}: {
  res: Response;
  statusCode?: number;
  message?: string;
}): void => {
  res.status(statusCode).json({
    status: "error",
    errorType: "SUBSCRIPTION_REQUIRED",
    errors: {
      common: {
        msg: message,
      },
    },
  });
};

export const sendFieldErrorResponse = ({
  res,
  statusCode = 409,
  message,
  field,
}: FieldErrorResponseParams): void => {
  res.status(statusCode).json({
    status: "error",
    errors: {
      [field]: {
        msg: message || "Internal Server Error",
        path: field,
      },
    },
  });
};
