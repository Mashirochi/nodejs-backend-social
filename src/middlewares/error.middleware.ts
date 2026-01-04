import HTTP_STATUS from "@/utils/constants/httpStatus";
import { ErrorWithStatus } from "@/utils/errors";
import { NextFunction, Request, Response } from "express";

function omit<T extends Record<string, any>, K extends readonly (keyof T)[]>(obj: T, keys: K): Omit<T, K[number]> {
  const clone = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
}

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ["status"]));
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ["stack"])
  });
};
