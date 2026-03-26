"use client";

import { PrestigeCallback } from "@prestige-app-cloud/react";

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <p className="text-white/50 font-mono text-sm mb-4">
          Processing OAuth callback...
        </p>
        <PrestigeCallback
          onSuccess={() => console.log("[test-app] callback success")}
          onError={(err) => console.error("[test-app] callback error:", err)}
        />
      </div>
    </div>
  );
}
