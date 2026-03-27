"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePrestigeAuth } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";
import type { PrestigeClient } from "@prestige-app-cloud/sdk";
import type { AiChatMessage } from "@prestige-app-cloud/sdk";

export default function AiChatPage() {
  const { state, client: rawClient, login } = usePrestigeAuth({
    clientId: PRESTIGE_CONFIG.clientId,
    baseUrl: PRESTIGE_CONFIG.baseUrl,
    redirectUri: PRESTIGE_CONFIG.redirectUri,
    scopes: [...PRESTIGE_CONFIG.scopes],
  });

  // The usePrestigeAuth hook resolves the PrestigeClient type from the React
  // package's nested SDK v0.2.0 dependency, which predates the AI methods.
  // At runtime the actual instance is v0.3.0 (installed at the top level),
  // so we cast to the v0.3.0 type to access aiChat().
  const client = rawClient as unknown as PrestigeClient;

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConnected = state === "connected";

  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !isConnected) return;

    setError(null);
    const userMessage: AiChatMessage = { role: "user", content: trimmed };

    // Append user message and clear input immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await client.aiChat({
        messages: [...messages, userMessage],
      });

      const assistantMessage = response.choices[0]?.message;
      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get AI response";
      setError(message);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, isConnected, client, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Chat</h1>
          <p className="text-white/50 text-sm mt-1">
            Send messages to an AI model through the Prestige Cloud AI gateway.
          </p>
        </div>

        {/* Login prompt when not connected */}
        {!isConnected && state !== "loading" && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60 mb-4">
              You need to be connected to Prestige Cloud to use AI Chat.
            </p>
            <button
              onClick={() => void login()}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              Login with Prestige Cloud
            </button>
          </div>
        )}

        {state === "loading" && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/40">Checking auth status...</p>
          </div>
        )}

        {/* Chat interface (shown when connected) */}
        {isConnected && (
          <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col h-[calc(100vh-16rem)]">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-sm">
                    Send a message to start the conversation.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600/80 text-white"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-lg px-4 py-2.5 text-sm text-white/50">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse [animation-delay:0.2s]">
                        .
                      </span>
                      <span className="animate-pulse [animation-delay:0.4s]">
                        .
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error display */}
            {error && (
              <div className="px-4 pb-2">
                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
