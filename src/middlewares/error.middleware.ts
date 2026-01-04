import HTTP_STATUS from "@/utils/constants/httpStatus";
import { ErrorWithStatus, EntityError } from "@/utils/errors";
import { NextFunction, Request, Response } from "express";

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const responseMessage = res.locals.responseMessage || null;

  if (err instanceof EntityError) {
    const errorMessages = Object.values(err.errors).map((error) => error.msg);

    return res.status(err.status).json({
      statusCode: err.status,
      success: false,
      message: responseMessage || err.message,
      errors: errorMessages
    });
  }

  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json({
      statusCode: err.status,
      success: false,
      message: responseMessage || err.message,
      errors: [err.message]
    });
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });

  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    statusCode: statusCode,
    success: false,
    message: responseMessage || err.message || "Internal Server Error",
    errors: [err.message || "Internal Server Error"]
  });
};
