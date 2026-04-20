import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { errorHandler } from "../../middlewares/errorHandler";
import dailyReportsRouter from "../../routes/dailyReports";

const SECRET = "test-secret";

// Prisma Client のモック（jest.mock はホイストされるため内部で jest.fn() を定義）
jest.mock("@prisma/client", () => {
  const mocks = {
    dailyReport: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mocks),
    __mocks: mocks,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks } = require("@prisma/client");

const mockDailyReportFindMany: jest.Mock = __mocks.dailyReport.findMany;
const mockDailyReportCount: jest.Mock = __mocks.dailyReport.count;
const mockDailyReportCreate: jest.Mock = __mocks.dailyReport.create;
const mockCustomerFindMany: jest.Mock = __mocks.customer.findMany;

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/v1/daily-reports", dailyReportsRouter);
  app.use(errorHandler);
  return app;
}

function makeToken(userId: number, role: "sales" | "manager"): string {
  return jwt.sign({ user_id: userId, role }, SECRET, { expiresIn: "24h" });
}

const salesToken = makeToken(1, "sales");
const managerToken = makeToken(3, "manager");

const now = new Date("2026-04-18T09:00:00Z");

const makeReport = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  reportId: 1,
  userId: 1,
  reportDate: new Date("2026-04-18"),
  problem: null,
  plan: null,
  status: "draft",
  createdAt: now,
  updatedAt: now,
  user: { userId: 1, name: "山田 太郎" },
  visitRecords: [],
  comments: [],
  ...overrides,
});

describe("GET /v1/daily-reports", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AT-DR-001 #8: 未認証
  it("未認証でアクセス: 401 UNAUTHORIZED", async () => {
    const res = await request(buildApp()).get("/v1/daily-reports");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // AT-DR-001 #1: 自分の日報一覧取得
  it("sales が自分の日報一覧取得: 自分の日報のみ返る (200)", async () => {
    const reports = [makeReport(), makeReport({ reportId: 2, reportDate: new Date("2026-04-17") })];
    mockDailyReportCount.mockResolvedValue(2);
    mockDailyReportFindMany.mockResolvedValue(reports);

    const res = await request(buildApp())
      .get("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);

    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.userId).toBe(1);
  });

  // AT-DR-001 #2: sales が user_id=2 を指定しても自分の日報のみ
  it("sales が user_id=2 指定: user_id は無視され自分の日報のみ (200)", async () => {
    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([makeReport()]);

    const res = await request(buildApp())
      .get("/v1/daily-reports?user_id=2")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.userId).toBe(1);
  });

  // AT-DR-001 #3: manager が全ユーザーの日報取得
  it("manager が全ユーザーの日報取得: 全ユーザーの日報が返る (200)", async () => {
    const reports = [
      makeReport(),
      makeReport({ reportId: 2, userId: 2, user: { userId: 2, name: "佐藤 花子" } }),
    ];
    mockDailyReportCount.mockResolvedValue(2);
    mockDailyReportFindMany.mockResolvedValue(reports);

    const res = await request(buildApp())
      .get("/v1/daily-reports")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.userId).toBeUndefined();
  });

  // AT-DR-001 #4: manager が user_id=1 で絞り込み
  it("manager が user_id=1 で絞り込み: 山田の日報のみ返る (200)", async () => {
    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([makeReport()]);

    const res = await request(buildApp())
      .get("/v1/daily-reports?user_id=1")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.userId).toBe(1);
  });

  // AT-DR-001 #5: status で絞り込み
  it("status=draft で絞り込み: 下書きのみ返る (200)", async () => {
    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([makeReport()]);

    const res = await request(buildApp())
      .get("/v1/daily-reports?status=draft")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.status).toBe("draft");
  });

  // AT-DR-001 #6: 期間で絞り込み
  it("date_from・date_to で絞り込み: 指定期間内の日報のみ返る (200)", async () => {
    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([makeReport()]);

    const res = await request(buildApp())
      .get("/v1/daily-reports?date_from=2026-04-01&date_to=2026-04-10")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    const { where } = mockDailyReportFindMany.mock.calls[0][0];
    expect(where.reportDate?.gte).toEqual(new Date("2026-04-01"));
    expect(where.reportDate?.lte).toEqual(new Date("2026-04-10"));
  });

  // AT-DR-001 #7: ページネーション
  it("ページネーション: page=2, per_page=20, total=25 → 5件返る (200)", async () => {
    const fiveReports = Array.from({ length: 5 }, (_, i) =>
      makeReport({ reportId: i + 21, reportDate: new Date(`2026-04-${i + 1}`) })
    );
    mockDailyReportCount.mockResolvedValue(25);
    mockDailyReportFindMany.mockResolvedValue(fiveReports);

    const res = await request(buildApp())
      .get("/v1/daily-reports?page=2&per_page=20")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(5);
    expect(res.body.data.pagination.total).toBe(25);
    expect(res.body.data.pagination.total_pages).toBe(2);
    expect(res.body.data.pagination.page).toBe(2);

    const { skip, take } = mockDailyReportFindMany.mock.calls[0][0];
    expect(skip).toBe(20);
    expect(take).toBe(20);
  });

  it("レスポンスフィールドを確認: report_id・user・status・visit_count など", async () => {
    const report = makeReport({
      visitRecords: [{ visitId: 1 }, { visitId: 2 }],
      status: "submitted",
    });
    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([report]);

    const res = await request(buildApp())
      .get("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    const item = res.body.data.items[0];
    expect(item.report_id).toBe(1);
    expect(item.user).toEqual({ user_id: 1, name: "山田 太郎" });
    expect(item.report_date).toBe("2026-04-18");
    expect(item.status).toBe("submitted");
    expect(item.visit_count).toBe(2);
    expect(item.created_at).toBeDefined();
    expect(item.updated_at).toBeDefined();
  });
});

describe("POST /v1/daily-reports", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AT-DR-002 #5: manager が作成 → 403
  it("manager が作成: 403 FORBIDDEN", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ report_date: "2026-04-18" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // 未認証
  it("未認証でアクセス: 401 UNAUTHORIZED", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .send({ report_date: "2026-04-18" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // AT-DR-002 #1: 正常作成（下書き）
  it("正常作成（下書き）: 訪問記録2件 → 201", async () => {
    mockCustomerFindMany.mockResolvedValue([
      { customerId: 10 },
      { customerId: 15 },
    ]);
    const createdReport = makeReport({
      status: "draft",
      visitRecords: [
        {
          visitId: 1,
          customer: { customerId: 10, companyName: "株式会社○○" },
          visitContent: "初回提案",
          visitOrder: 1,
        },
        {
          visitId: 2,
          customer: { customerId: 15, companyName: "株式会社△△" },
          visitContent: "フォローアップ",
          visitOrder: 2,
        },
      ],
    });
    mockDailyReportCreate.mockResolvedValue(createdReport);

    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        report_date: "2026-04-18",
        visit_records: [
          { customer_id: 10, visit_content: "初回提案", visit_order: 1 },
          { customer_id: 15, visit_content: "フォローアップ", visit_order: 2 },
        ],
        status: "draft",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.report_id).toBe(1);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.visit_records).toHaveLength(2);
    expect(res.body.data.user).toEqual({ user_id: 1, name: "山田 太郎" });
    expect(res.body.data.report_date).toBe("2026-04-18");
  });

  // AT-DR-002 #2: 正常作成（提出）
  it("正常作成（提出）: status=submitted → 201, status=submitted で返る", async () => {
    mockCustomerFindMany.mockResolvedValue([{ customerId: 10 }]);
    const createdReport = makeReport({
      status: "submitted",
      visitRecords: [
        {
          visitId: 1,
          customer: { customerId: 10, companyName: "株式会社○○" },
          visitContent: "提案",
          visitOrder: 1,
        },
      ],
    });
    mockDailyReportCreate.mockResolvedValue(createdReport);

    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        report_date: "2026-04-18",
        visit_records: [{ customer_id: 10, visit_content: "提案", visit_order: 1 }],
        status: "submitted",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("submitted");
  });

  // AT-DR-002 #3: 訪問記録なしで作成
  it("訪問記録なしで作成: 正常に作成される (201)", async () => {
    const createdReport = makeReport({ visitRecords: [] });
    mockDailyReportCreate.mockResolvedValue(createdReport);

    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        report_date: "2026-04-18",
        visit_records: [],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.visit_records).toHaveLength(0);
  });

  // AT-DR-002 #4: 同日に2回作成 → 409
  it("同日に2回作成: 409 CONFLICT", async () => {
    mockDailyReportCreate.mockRejectedValue({ code: "P2002" });

    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ report_date: "2026-04-18" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  // バリデーション: report_date が未入力
  it("report_date が未入力: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // バリデーション: report_date が不正な形式
  it("report_date が不正な形式: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ report_date: "20260418" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // UT-V-001 #4: visit_content が1001文字
  it("visit_content が1001文字: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        report_date: "2026-04-18",
        visit_records: [
          { customer_id: 1, visit_content: "a".repeat(1001), visit_order: 1 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // UT-V-001 #6: problem が2001文字
  it("problem が2001文字: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ report_date: "2026-04-18", problem: "a".repeat(2001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // UT-V-001 #7: plan が2001文字
  it("plan が2001文字: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ report_date: "2026-04-18", plan: "a".repeat(2001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // UT-V-001 #8: status が不正な値
  it("status が不正な値: 400 VALIDATION_ERROR", async () => {
    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ report_date: "2026-04-18", status: "published" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // UT-V-001 #9: customer_id が存在しない
  it("存在しない customer_id: 400 VALIDATION_ERROR", async () => {
    mockCustomerFindMany.mockResolvedValue([]);

    const res = await request(buildApp())
      .post("/v1/daily-reports")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        report_date: "2026-04-18",
        visit_records: [{ customer_id: 9999, visit_content: "テスト", visit_order: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
