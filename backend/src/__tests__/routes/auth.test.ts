import request from "supertest";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorHandler } from "../../middlewares/errorHandler";
import authRouter from "../../routes/auth";

// Prisma Client のモック
jest.mock("@prisma/client", () => {
  const mockFindUnique = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockFindUnique,
      },
    })),
    __mockFindUnique: mockFindUnique,
  };
});

// bcrypt のモック
jest.mock("bcrypt");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// モックした PrismaClient のインスタンスから findUnique を取得するヘルパー
function getMockFindUnique() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { __mockFindUnique } = require("@prisma/client");
  return __mockFindUnique as jest.Mock;
}

const SECRET = "test-secret";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/v1/auth", authRouter);
  app.use(errorHandler);
  return app;
}

const activeUser = {
  userId: 1,
  name: "山田 太郎",
  email: "yamada@example.com",
  password: "$2b$10$hashedpassword",
  role: "sales" as const,
  isActive: true,
  department: null,
  createdAt: new Date(),
};

const inactiveUser = {
  ...activeUser,
  userId: 4,
  email: "inactive@example.com",
  isActive: false,
};

describe("POST /v1/auth/login", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AT-AUTH-001 #1: 正常ログイン
  it("正常ログイン: token と user が返る (200)", async () => {
    getMockFindUnique().mockResolvedValue(activeUser);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "yamada@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toMatchObject({
      user_id: 1,
      name: "山田 太郎",
      email: "yamada@example.com",
      role: "sales",
    });

    // token が有効な JWT であることを確認
    const decoded = jwt.verify(res.body.data.token, SECRET) as jwt.JwtPayload;
    expect(decoded.user_id).toBe(1);
    expect(decoded.role).toBe("sales");
  });

  // AT-AUTH-001 #2: パスワード不一致
  it("パスワード不一致: 401 UNAUTHORIZED", async () => {
    getMockFindUnique().mockResolvedValue(activeUser);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "yamada@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // AT-AUTH-001 #3: 存在しないメール
  it("存在しないメール: 401 UNAUTHORIZED", async () => {
    getMockFindUnique().mockResolvedValue(null);

    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "notexist@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // AT-AUTH-001 #4: 無効化ユーザーでログイン
  it("無効化ユーザー (is_active=false): 401 UNAUTHORIZED", async () => {
    getMockFindUnique().mockResolvedValue(inactiveUser);

    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "inactive@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // バリデーション: 不正なメール形式
  it("不正なメール形式: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // バリデーション: パスワード未入力
  it("パスワード未入力: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/auth/login")
      .send({ email: "yamada@example.com", password: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /v1/auth/logout", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  // AT-AUTH-002 #1: 正常ログアウト
  it("正常ログアウト: 204", async () => {
    const token = jwt.sign({ user_id: 1, role: "sales" }, SECRET, {
      expiresIn: "24h",
    });

    const res = await request(buildApp())
      .post("/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  // AT-AUTH-002 #2: 認証なしでログアウト
  it("認証なし (Authorizationヘッダーなし): 401 UNAUTHORIZED", async () => {
    const res = await request(buildApp()).post("/v1/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // 無効なトークンでログアウト
  it("無効なトークン: 401 UNAUTHORIZED", async () => {
    const res = await request(buildApp())
      .post("/v1/auth/logout")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
