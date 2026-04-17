import { Hono } from "hono";
import { handle } from "hono/vercel";
import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createUIMessageStreamResponse } from "ai";
import { getMastra } from "@/mastra";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

// POST /api/chat — メッセージ送信・ストリーミング応答
app.post("/chat", async (c) => {
  const params = await c.req.json();
  const { sessionId } = params;

  if (!sessionId) {
    return c.json({ error: "sessionId is required" }, 400);
  }

  const stream = await handleChatStream({
    mastra: getMastra(),
    agentId: "chat-agent",
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: sessionId,
        resource: "chat",
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createUIMessageStreamResponse({ stream: stream as any });
});

// GET /api/conversations/:sessionId — 会話履歴取得
app.get("/conversations/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const agent = getMastra().getAgentById("chat-agent");
  const memory = await agent.getMemory();

  try {
    const response = await memory?.recall({
      threadId: sessionId,
      resourceId: "chat",
    });
    const messages = toAISdkV5Messages(response?.messages ?? []);
    return c.json({ messages });
  } catch {
    return c.json({ messages: [] });
  }
});

// GET /api/admin/conversations — 全会話一覧（管理画面用）
app.get("/admin/conversations", async (c) => {
  const secret = c.req.header("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const agent = getMastra().getAgentById("chat-agent");
  const memory = await agent.getMemory();

  try {
    const result = await memory?.listThreads({
      filter: { resourceId: "chat" },
      perPage: false,
    });
    const threads = result?.threads;
    return c.json({ threads: threads ?? [] });

  } catch {
    return c.json({ threads: [] });
  }
});

// GET /api/admin/conversations/:threadId — 特定会話の詳細（管理画面用）
app.get("/admin/conversations/:threadId", async (c) => {
  const secret = c.req.header("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const threadId = c.req.param("threadId");
  const agent = getMastra().getAgentById("chat-agent");
  const memory = await agent.getMemory();

  try {
    const response = await memory?.recall({
      threadId,
      resourceId: "chat",
    });
    const messages = toAISdkV5Messages(response?.messages ?? []);
    return c.json({ messages });
  } catch {
    return c.json({ messages: [] });
  }
});

export const GET = handle(app);
export const POST = handle(app);
