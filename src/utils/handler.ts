import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an Express async request handler to ensure that any thrown or rejected errors
 * are properly forwarded to Express's error-handling middleware via `next(error)`.
 *
 * Without this wrapper, errors thrown inside async route handlers would not be caught by Express.
 *
 * @param func - The original Express RequestHandler function (can be async).
 * @returns A wrapped RequestHandler that executes `func` and forwards any error to `next`.
 */

export const wrapRequestHandler = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
