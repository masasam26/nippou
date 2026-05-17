import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "./auth";
import { AppError } from "./errorHandler";

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "認証が必要です"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "権限がありません"));
    }
    next();
  };
}
