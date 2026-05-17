import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface JwtPayload {
  user_id: number;
  role: "sales" | "manager";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new AppError(401, "UNAUTHORIZED", "認証トークンが必要です")
    );
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(
      new AppError(500, "INTERNAL_SERVER_ERROR", "サーバーエラーが発生しました")
    );
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです"));
  }
}
