import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import { errorHandler } from "../../middlewares/errorHandler";

const SECRET = "test-secret";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get(
    "/manager-only",
    authenticate,
    requireRole("manager"),
    (_req, res) => {
      res.json({ ok: true });
    }
  );
  app.use(errorHandler);
  return app;
}

describe("requireRole middleware", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it("allows manager role", async () => {
    const token = jwt.sign({ user_id: 3, role: "manager" }, SECRET);
    const res = await request(buildApp())
      .get("/manager-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("returns 403 for sales role", async () => {
    const token = jwt.sign({ user_id: 1, role: "sales" }, SECRET);
    const res = await request(buildApp())
      .get("/manager-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
