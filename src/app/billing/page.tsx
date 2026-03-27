"use client";

import { PrestigeBilling } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";

export default function BillingPage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-white/50 text-sm mt-1">
            View available plans, manage your subscription, and access checkout.
          </p>
        </div>

        <PrestigeBilling
          clientId={PRESTIGE_CONFIG.clientId}
          baseUrl={PRESTIGE_CONFIG.baseUrl}
          scopes={[...PRESTIGE_CONFIG.scopes]}
          redirectUri={PRESTIGE_CONFIG.redirectUri}
        />
      </div>
    </PageShell>
  );
}
