"use client";

import { useState } from "react";
import {
  PrestigeAPICloud,
  PrestigeHealthCheck,
  PrestigeBilling,
  PrestigeUsage,
  usePrestigeAuth,
} from "@prestige-app-cloud/react";

const CLIENT_ID =
  "4f7bd95420ec493e56fbc0ccb1d8506b02c1bd14097312abad2eaecaa788927d";
const SCOPES = [
  "profile",
  "connections:read",
  "connections:write",
  "connections:proxy",
  "billing:read",
  "billing:manage",
  "billing:usage",
];

type Section = "auth" | "apis" | "billing" | "usage" | "health";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("auth");
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/callback`
      : "";

  const sections: { id: Section; label: string }[] = [
    { id: "auth", label: "Auth + APIs" },
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
    { id: "health", label: "Health Check" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-emerald-400 font-mono">
                prestige-test-app
              </h1>
              <p className="text-xs text-white/40 font-mono">
                SDK integration testbench
              </p>
            </div>
            <div className="text-xs text-white/30 font-mono">
              clientId: {CLIENT_ID.slice(0, 12)}...
            </div>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="border-b border-white/10 bg-gray-900/30">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-3 text-sm font-mono transition-colors ${
                  activeSection === s.id
                    ? "text-emerald-400 border-b-2 border-emerald-400"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {activeSection === "auth" && (
          <TestSection title="Auth + API Cloud">
            <PrestigeAPICloud
              clientId={CLIENT_ID}
              scopes={SCOPES}
              redirectUri={redirectUri}
              onReady={() => console.log("[test-app] onReady fired")}
              onError={(err) => console.error("[test-app] onError:", err)}
              onTokens={(tokens) =>
                console.log("[test-app] onTokens:", tokens)
              }
              onManualSave={(templateId, values) =>
                console.log("[test-app] onManualSave:", templateId, values)
              }
            />
          </TestSection>
        )}

        {activeSection === "billing" && (
          <TestSection title="Billing">
            <PrestigeBilling
              clientId={CLIENT_ID}
              scopes={SCOPES}
              redirectUri={redirectUri}
            />
          </TestSection>
        )}

        {activeSection === "usage" && (
          <TestSection title="Usage">
            <PrestigeUsage
              clientId={CLIENT_ID}
              scopes={SCOPES}
              redirectUri={redirectUri}
            />
          </TestSection>
        )}

        {activeSection === "health" && (
          <TestSection title="Health Check">
            <PrestigeHealthCheck
              clientId={CLIENT_ID}
              onComplete={(results) =>
                console.log("[test-app] health check:", results)
              }
            />
          </TestSection>
        )}

        {/* Debug Info */}
        <div className="mt-8 rounded-lg border border-white/5 bg-gray-900/30 p-4">
          <h3 className="text-xs font-mono text-white/30 mb-2">
            Debug Info
          </h3>
          <DebugInfo redirectUri={redirectUri} />
        </div>
      </main>
    </div>
  );
}

function TestSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-mono text-white/50 mb-4">
        {">"} testing: {title}
      </h2>
      <div className="rounded-lg border border-white/10 bg-gray-900/50 p-4">
        {children}
      </div>
    </div>
  );
}

function DebugInfo({ redirectUri }: { redirectUri: string }) {
  const { state, tokens, appConfig, login, logout } = usePrestigeAuth({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
  });

  return (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex gap-2">
        <span className="text-white/40">auth_state:</span>
        <span
          className={
            state === "connected"
              ? "text-emerald-400"
              : state === "loading"
                ? "text-yellow-400"
                : "text-red-400"
          }
        >
          {state}
        </span>
      </div>
      {tokens && (
        <div className="flex gap-2">
          <span className="text-white/40">access_token:</span>
          <span className="text-white/50">
            {tokens.accessToken.slice(0, 16)}...
          </span>
        </div>
      )}
      {appConfig && (
        <div className="flex gap-2">
          <span className="text-white/40">app:</span>
          <span className="text-white/70">{appConfig.appName}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-white/40">redirect_uri:</span>
        <span className="text-white/50">{redirectUri}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-white/40">scopes:</span>
        <span className="text-white/50">{SCOPES.join(", ")}</span>
      </div>
      <div className="flex gap-2 mt-2">
        {state === "disconnected" && (
          <button
            onClick={login}
            className="px-3 py-1 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30"
          >
            Connect
          </button>
        )}
        {state === "connected" && (
          <button
            onClick={logout}
            className="px-3 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-950/30"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
