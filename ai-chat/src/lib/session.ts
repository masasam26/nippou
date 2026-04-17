const SESSION_KEY = "ai-chat-session-id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, crypto.randomUUID());
}
