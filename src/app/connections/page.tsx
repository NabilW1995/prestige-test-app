"use client";

import { PrestigeAPICloud } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";

export default function ConnectionsPage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your API connections. Enter credentials manually or sync them
            from your Prestige Cloud vault.
          </p>
        </div>

        <PrestigeAPICloud
          clientId={PRESTIGE_CONFIG.clientId}
          baseUrl={PRESTIGE_CONFIG.baseUrl}
          scopes={[...PRESTIGE_CONFIG.scopes]}
          redirectUri={PRESTIGE_CONFIG.redirectUri}
          onReady={() => console.log("Connected!")}
          onError={(err) => console.error(err)}
          onManualSave={(templateId, values) =>
            console.log("Manual save:", templateId, values)
          }
        />
      </div>
    </PageShell>
  );
}
