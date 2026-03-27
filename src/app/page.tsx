"use client";

import { usePrestigeAuth } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserProfile } from "@prestige-app-cloud/sdk";

const FEATURE_CARDS = [
  {
    label: "Connections",
    href: "/connections",
    description: "Manage API connections and credentials",
    scopes: ["connections:read", "connections:write"],
  },
  {
    label: "Billing",
    href: "/billing",
    description: "View plans and manage subscription",
    scopes: ["billing:read", "billing:manage"],
  },
  {
    label: "Usage",
    href: "/usage",
    description: "Monitor resource usage and limits",
    scopes: ["billing:usage"],
  },
  {
    label: "AI Chat",
    href: "/ai",
    description: "Chat with AI through the Prestige gateway",
    scopes: ["ai:chat"],
  },
];

export default function HomePage() {
  const { state, client, login } = usePrestigeAuth({
    clientId: PRESTIGE_CONFIG.clientId,
    baseUrl: PRESTIGE_CONFIG.baseUrl,
    redirectUri: PRESTIGE_CONFIG.redirectUri,
    scopes: [...PRESTIGE_CONFIG.scopes],
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (state !== "connected") {
      setProfile(null);
      return;
    }

    let cancelled = false;
    client
      .getUserProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        // Profile fetch failed -- not critical for the home page
      });

    return () => {
      cancelled = true;
    };
  }, [state, client]);

  const isConnected = state === "connected";

  return (
    <PageShell>
      <div className="space-y-10">
        {/* Hero section */}
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Prestige Cloud{" "}
            <span className="text-emerald-400">Test App</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
            A demo application showcasing the Prestige Cloud SDK integration
            with OAuth authentication, API connections, billing, usage tracking,
            and AI chat.
          </p>

          {!isConnected && state !== "loading" && (
            <button
              onClick={() => void login()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Login with Prestige Cloud
            </button>
          )}

          {state === "loading" && (
            <p className="text-white/40 text-sm">Checking auth status...</p>
          )}
        </section>

        {/* User info card (shown when connected) */}
        {isConnected && profile && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-4">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full border border-white/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">
                  {profile.name}
                </p>
                <p className="text-white/50 text-sm">{profile.email}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Connected
              </span>
            </div>
          </section>
        )}

        {/* Feature cards */}
        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-4">
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURE_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-emerald-500/40 hover:bg-white/[0.07] transition-all"
              >
                <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition-colors">
                  {card.label}
                </h3>
                <p className="text-white/50 text-sm mb-3">
                  {card.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {card.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
