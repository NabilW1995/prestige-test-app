"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrestigeAuth } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/connections", label: "Connections" },
  { href: "/billing", label: "Billing" },
  { href: "/usage", label: "Usage" },
  { href: "/ai", label: "AI Chat" },
];

export function Nav() {
  const pathname = usePathname();
  const { state, login, logout } = usePrestigeAuth({
    clientId: PRESTIGE_CONFIG.clientId,
    baseUrl: PRESTIGE_CONFIG.baseUrl,
    redirectUri: PRESTIGE_CONFIG.redirectUri,
    scopes: [...PRESTIGE_CONFIG.scopes],
  });

  const isConnected = state === "connected";

  return (
    <nav className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-emerald-400 font-bold text-lg tracking-tight">
              Prestige
            </span>
            <span className="text-white/50 text-sm font-medium">Test App</span>
          </Link>

          {/* Navigation links */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Auth status + action */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium ${
                isConnected ? "text-emerald-400" : "text-white/40"
              }`}
            >
              {state === "loading"
                ? "Loading..."
                : isConnected
                  ? "Connected"
                  : "Not connected"}
            </span>

            {isConnected ? (
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => void login()}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
