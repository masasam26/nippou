import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../../middlewares/auth";
import { errorHandler } from "../../middlewares/errorHandler";

const SECRET = "test-secret";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get("/protected", authenticate, (req, res) => {
    res.json({ user: req.user });
  });
  app.use(errorHandler);
  return app;
}

describe("authenticate middleware", () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it("passes with valid token", async () => {
    const token = jwt.sign({ user_id: 1, role: "sales" }, SECRET);
    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ user_id: 1, role: "sales" });
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(buildApp()).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
