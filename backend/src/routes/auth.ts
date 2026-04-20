import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import { authenticate } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email({ message: "メールアドレスの形式が正しくありません" }),
  password: z.string().min(1, { message: "パスワードは必須です" }),
});

// POST /v1/auth/login
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return next(
        new AppError(400, "VALIDATION_ERROR", "入力値が正しくありません", details)
      );
    }

    const { email, password } = parsed.data;

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (err) {
      return next(err);
    }

    if (!user) {
      return next(
        new AppError(401, "UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません")
      );
    }

    if (!user.isActive) {
      return next(
        new AppError(401, "UNAUTHORIZED", "このアカウントは無効化されています")
      );
    }

    let passwordMatch: boolean;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      return next(err);
    }

    if (!passwordMatch) {
      return next(
        new AppError(401, "UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません")
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(
        new AppError(500, "INTERNAL_SERVER_ERROR", "サーバーエラーが発生しました")
      );
    }

    const token = jwt.sign(
      { user_id: user.userId, role: user.role },
      secret,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      data: {
        token,
        user: {
          user_id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  }
);

// POST /v1/auth/logout
router.post(
  "/logout",
  authenticate,
  (_req: Request, res: Response): void => {
    res.status(204).send();
  }
);

export default router;
