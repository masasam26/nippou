import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";

const router = Router();
const prisma = new PrismaClient();

const getReportsQuerySchema = z.object({
  user_id: z.coerce.number().int().positive().optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date_fromはYYYY-MM-DD形式で入力してください" })
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date_toはYYYY-MM-DD形式で入力してください" })
    .optional(),
  status: z.enum(["draft", "submitted"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

// GET /v1/daily-reports
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = getReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return next(
        new AppError(400, "VALIDATION_ERROR", "クエリパラメータが正しくありません", details)
      );
    }

    const { user_id, date_from, date_to, status, page, per_page } = parsed.data;
    const currentUser = req.user!;

    type ReportWhere = {
      userId?: number;
      reportDate?: { gte?: Date; lte?: Date };
      status?: "draft" | "submitted";
    };

    const where: ReportWhere = {};

    if (currentUser.role === "sales") {
      where.userId = currentUser.user_id;
    } else if (user_id !== undefined) {
      where.userId = user_id;
    }

    if (date_from !== undefined || date_to !== undefined) {
      where.reportDate = {};
      if (date_from !== undefined) where.reportDate.gte = new Date(date_from);
      if (date_to !== undefined) where.reportDate.lte = new Date(date_to);
    }

    if (status !== undefined) {
      where.status = status;
    }

    try {
      const [total, items] = await Promise.all([
        prisma.dailyReport.count({ where }),
        prisma.dailyReport.findMany({
          where,
          skip: (page - 1) * per_page,
          take: per_page,
          orderBy: { reportDate: "desc" },
          include: {
            user: { select: { userId: true, name: true } },
            visitRecords: { select: { visitId: true } },
          },
        }),
      ]);

      res.status(200).json({
        data: {
          items: items.map((r) => ({
            report_id: r.reportId,
            user: { user_id: r.user.userId, name: r.user.name },
            report_date: r.reportDate.toISOString().slice(0, 10),
            status: r.status,
            visit_count: r.visitRecords.length,
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
          })),
          pagination: {
            total,
            page,
            per_page,
            total_pages: Math.ceil(total / per_page),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

const visitRecordSchema = z.object({
  customer_id: z.number().int().positive({ message: "customer_idは正の整数を指定してください" }),
  visit_content: z
    .string()
    .min(1, { message: "訪問内容は必須です" })
    .max(1000, { message: "訪問内容は1000文字以内で入力してください" }),
  visit_order: z.number().int().positive({ message: "visit_orderは正の整数を指定してください" }),
});

const createReportSchema = z.object({
  report_date: z
    .string({ message: "report_dateは必須です" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "report_dateはYYYY-MM-DD形式で入力してください" }),
  visit_records: z.array(visitRecordSchema).default([]),
  problem: z
    .string()
    .max(2000, { message: "課題・相談は2000文字以内で入力してください" })
    .optional(),
  plan: z
    .string()
    .max(2000, { message: "明日やることは2000文字以内で入力してください" })
    .optional(),
  status: z.enum(["draft", "submitted"]).default("draft"),
});

// POST /v1/daily-reports
router.post(
  "/",
  authenticate,
  requireRole("sales"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return next(
        new AppError(400, "VALIDATION_ERROR", "入力値が正しくありません", details)
      );
    }

    const { report_date, visit_records, problem, plan, status } = parsed.data;
    const userId = req.user!.user_id;

    if (visit_records.length > 0) {
      const customerIds = visit_records.map((r) => r.customer_id);
      let customers;
      try {
        customers = await prisma.customer.findMany({
          where: { customerId: { in: customerIds } },
          select: { customerId: true },
        });
      } catch (err) {
        return next(err);
      }
      const foundIds = customers.map((c) => c.customerId);
      const missingId = customerIds.find((id) => !foundIds.includes(id));
      if (missingId !== undefined) {
        return next(
          new AppError(400, "VALIDATION_ERROR", "指定された顧客IDが存在しません", [
            { field: "customer_id", message: `customer_id: ${missingId} は存在しません` },
          ])
        );
      }
    }

    let report;
    try {
      report = await prisma.dailyReport.create({
        data: {
          userId,
          reportDate: new Date(report_date),
          problem: problem ?? null,
          plan: plan ?? null,
          status,
          visitRecords: {
            create: visit_records.map((r) => ({
              customerId: r.customer_id,
              visitContent: r.visit_content,
              visitOrder: r.visit_order,
            })),
          },
        },
        include: {
          user: { select: { userId: true, name: true } },
          visitRecords: {
            include: {
              customer: { select: { customerId: true, companyName: true } },
            },
            orderBy: { visitOrder: "asc" },
          },
          comments: {
            include: {
              user: { select: { userId: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return next(
          new AppError(409, "CONFLICT", "指定した日付の日報は既に存在します")
        );
      }
      return next(err);
    }

    res.status(201).json({
      data: {
        report_id: report.reportId,
        user: { user_id: report.user.userId, name: report.user.name },
        report_date: report.reportDate.toISOString().slice(0, 10),
        visit_records: report.visitRecords.map((v) => ({
          visit_id: v.visitId,
          customer: {
            customer_id: v.customer.customerId,
            company_name: v.customer.companyName,
          },
          visit_content: v.visitContent,
          visit_order: v.visitOrder,
        })),
        problem: report.problem,
        plan: report.plan,
        status: report.status,
        comments: report.comments.map((c) => ({
          comment_id: c.commentId,
          user: { user_id: c.user.userId, name: c.user.name },
          body: c.body,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      },
    });
  }
);

export default router;
