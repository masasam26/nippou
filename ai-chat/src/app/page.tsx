"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { getSessionId, resetSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SendHorizonal, Bot, RotateCcw, AlertCircle } from "lucide-react";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [savedMessages, setSavedMessages] = useState<UIMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSavedMessages(data.messages ?? []);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    messages: savedMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ sessionId }),
    }),
  });

  // --- 前略 ---
  const isLoading = status === "streaming" || status === "submitted";

  // 1. 自動スクロールのuseEffectを先に書く（常に呼び出されるようにする）
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. 早期リターンはすべてのHooksより後に置く
  if (!historyLoaded) return null;

  function handleReset() {

    resetSessionId();
    window.location.reload();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b px-4 py-3 flex items-center gap-2">
        <Bot className="size-5 text-primary" />
        <h1 className="font-semibold text-lg">AIチャット</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="ml-auto text-muted-foreground gap-1.5"
          title="新しい会話を始める"
        >
          <RotateCcw className="size-4" />
          <span className="text-xs">会話をリセット</span>
        </Button>
      </header>

      {/* メッセージ一覧 */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16 text-sm">
              メッセージを入力して会話を始めてください。
            </div>
          )}
          {messages.map((m) => {
            const textPart = m.parts?.find((p) => p.type === "text");
            const text = textPart && "text" in textPart ? textPart.text : "";
            if (!text) return null;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[75%] text-sm whitespace-pre-wrap break-words",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-muted-foreground">
                入力中…
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>エラーが発生しました。もう一度お試しください。</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* 入力フォーム */}
      <div className="border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="メッセージを入力…"
            disabled={isLoading || !sessionId}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim() || !sessionId}
            size="icon"
          >
            <SendHorizonal className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
