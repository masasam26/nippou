import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { MongoDBStore } from "@mastra/mongodb";

let _mastra: Mastra | null = null;

function createMastra(): Mastra {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const storage = new MongoDBStore({
    id: "ai-chat-storage",
    uri,
    dbName: process.env.MONGODB_DB_NAME ?? "ai-chat",
  });

  const memory = new Memory({
    storage,
    options: {
      lastMessages: 20,
      generateTitle: true,
    },
  });

  const chatAgent = new Agent({
    id: "chat-agent",
    name: "chat-agent",
    instructions:
      "あなたは親切で誠実なAIアシスタントです。日本語で会話してください。ユーザーの質問や相談に丁寧に答えてください。",
    model: "anthropic/claude-sonnet-4-6",
    memory,
  });

  return new Mastra({
    agents: { "chat-agent": chatAgent },
  });
}

export function getMastra(): Mastra {
  if (!_mastra) {
    _mastra = createMastra();
  }
  return _mastra;
}
