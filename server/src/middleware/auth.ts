import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http.js";
import { verifyToken } from "../utils/token.js";

export const requireAuth = (request: Request, _response: Response, next: NextFunction): void => {
  const header = request.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authorization header is required"));
    return;
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyToken(token);

  if (!payload) {
    next(new ApiError(401, "Invalid token"));
    return;
  }

  request.auth = payload;
  next();
};

export const requireRole = (role: "buyer" | "seller") => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth) {
      next(new ApiError(401, "Unauthorized"));
      return;
    }

    if (request.auth.role !== role) {
      next(new ApiError(403, `This endpoint requires the ${role} role`));
      return;
    }

    next();
  };
};
