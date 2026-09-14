import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = <T extends Request>(
  handler: (request: T, response: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (request: T, response: Response, next: NextFunction): void => {
    handler(request, response, next).catch(next);
  };
};

export const ok = (response: Response, data: unknown, statusCode = 200): void => {
  response.status(statusCode).json({
    success: true,
    data,
  });
};
