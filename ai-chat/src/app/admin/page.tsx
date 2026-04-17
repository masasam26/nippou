"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronRight, ArrowLeft } from "lucide-react";

type Thread = {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
};

type MessagePart = { type: string; text?: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  parts?: MessagePart[];
  createdAt?: string;
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/conversations", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        setError("認証に失敗しました。シークレットを確認してください。");
        return;
      }
      const data = await res.json();
      setThreads(data.threads ?? []);
      setAuthorized(true);
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(thread: Thread) {
    setSelectedThread(thread);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations/${thread.id}`, {
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">管理画面へのアクセス</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="管理シークレットを入力"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button onClick={login} disabled={loading || !secret} className="w-full">
              {loading ? "確認中…" : "ログイン"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー: 会話一覧 */}
      <aside className="w-72 border-r flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">会話ログ</h2>
          <Badge variant="secondary" className="ml-auto text-xs">
            {threads.length}
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          {threads.length === 0 && (
            <p className="text-muted-foreground text-sm px-4 py-8 text-center">
              会話がありません
            </p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => loadThread(t)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-muted/60 transition-colors text-sm",
                selectedThread?.id === t.id && "bg-muted"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {t.title ?? "無題の会話"}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {new Date(t.updatedAt).toLocaleString("ja-JP")}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            </button>
          ))}
        </ScrollArea>
      </aside>

      {/* メインエリア: メッセージ詳細 */}
      <main className="flex-1 flex flex-col">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            左の一覧から会話を選んでください
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <button
                onClick={() => setSelectedThread(null)}
                className="md:hidden"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <p className="font-semibold text-sm">
                  {selectedThread.title ?? "無題の会話"}
                </p>
                <p className="text-muted-foreground text-xs">
                  ID: {selectedThread.id}
                </p>
              </div>
            </div>
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {loading && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    読み込み中…
                  </p>
                )}
                {!loading && messages.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    メッセージがありません
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={m.id ?? i}>
                    <div
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="space-y-1 max-w-[75%]">
                        <Badge
                          variant={m.role === "user" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {m.role === "user" ? "ユーザー" : "AI"}
                        </Badge>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          )}
                        >
                          {m.parts?.find((p) => p.type === "text")?.text ?? m.content ?? ""}
                        </div>
                      </div>
                    </div>
                    {i < messages.length - 1 && (
                      <Separator className="my-2 opacity-30" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </main>
    </div>
  );
}
