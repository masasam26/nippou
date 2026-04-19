import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { AppError, errorHandler } from "../../middlewares/errorHandler";

function buildApp(handler: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.get("/test", handler);
  app.use(errorHandler);
  return app;
}

describe("errorHandler middleware", () => {
  it("handles AppError with correct status and body", async () => {
    const app = buildApp((_req, _res, next) => {
      next(new AppError(400, "VALIDATION_ERROR", "入力値が不正です", [
        { field: "email", message: "メール形式で入力してください" },
      ]));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        details: [{ field: "email", message: "メール形式で入力してください" }],
      },
    });
  });

  it("handles unknown errors as 500", async () => {
    const app = buildApp((_req, _res, next) => {
      next(new Error("unexpected error"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("handles AppError without details", async () => {
    const app = buildApp((_req, _res, next) => {
      next(new AppError(404, "NOT_FOUND", "リソースが見つかりません"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(404);
    expect(res.body.error).not.toHaveProperty("details");
  });
});
