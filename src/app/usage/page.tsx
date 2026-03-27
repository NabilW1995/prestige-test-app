"use client";

import { PrestigeUsage } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";

export default function UsagePage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
          <p className="text-white/50 text-sm mt-1">
            Monitor your resource consumption, API call limits, and subscription
            renewal date.
          </p>
        </div>

        <PrestigeUsage
          clientId={PRESTIGE_CONFIG.clientId}
          baseUrl={PRESTIGE_CONFIG.baseUrl}
          scopes={[...PRESTIGE_CONFIG.scopes]}
          redirectUri={PRESTIGE_CONFIG.redirectUri}
        />
      </div>
    </PageShell>
  );
}
