import { Request, Response, NextFunction } from "express";

// Middleware to set response message for the route
export const ResponseMessage = (message: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.responseMessage = message;
    next();
  };
};
