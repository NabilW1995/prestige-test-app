"use client";

import { usePrestigeAuth } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Connection, AppConfig } from "@prestige-app-cloud/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Unified shape for a single connection card.
 * In connected mode this is built from the Connection API response;
 * in disconnected mode it is derived from the public AppConfig templates.
 */
interface CardData {
  templateId: string;
  templateName: string;
  templateSlug: string;
  type: string;
  placeholders: Array<{ name: string; label: string; type: string }>;
  /** Whether all required fields are filled on the server side. */
  filled: boolean;
  /**
   * Per-placeholder fill status.
   * Booleans when the user only has connections:read scope,
   * actual strings when connections:read_full scope is granted.
   */
  filledValues: Record<string, boolean | string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a template type string to a human-readable badge label. */
function typeBadgeLabel(type: string): string {
  const MAP: Record<string, string> = {
    standard_api: "Standard API",
    magic_api: "Magic API",
    custom: "Custom",
    oauth: "OAuth",
    webhook: "Webhook",
  };
  return MAP[type] ?? type;
}

/**
 * Mask a secret value for display, keeping the first 3 and last 4 characters
 * visible if the value is long enough.
 */
function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 3)}...${ value.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single connection card that displays its placeholders.
 * Supports both "filled from cloud" and "manual entry" modes.
 */
function ConnectionCard({
  card,
  manualValues,
  onSaveManual,
}: {
  card: CardData;
  manualValues: Record<string, string>;
  onSaveManual: (templateId: string, values: Record<string, string>) => void;
}) {
  // Local draft state for manual form inputs.
  // Initialised from any previously-saved manual values.
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const ph of card.placeholders) {
      initial[ph.name] = manualValues[ph.name] ?? "";
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Only persist non-empty values
    const nonEmpty: Record<string, string> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (v.trim()) nonEmpty[k] = v.trim();
    }
    onSaveManual(card.templateId, nonEmpty);
    setSaved(true);
  };

  // Determine whether every placeholder is cloud-filled
  const allFilled = card.filled;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
      {/* Header: template name + type badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {card.templateName}
          </h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/60">
            {typeBadgeLabel(card.type)}
          </span>
        </div>

        {allFilled && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium mt-1">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Connected
          </span>
        )}
      </div>

      {/* Placeholder fields */}
      <div className="flex flex-col gap-3">
        {card.placeholders.map((ph) => {
          const cloudValue = card.filledValues[ph.name];
          // Cloud-filled: boolean true means filled (masked), string means actual value
          const isFilled =
            cloudValue === true || (typeof cloudValue === "string" && cloudValue.length > 0);
          const displayValue =
            typeof cloudValue === "string" ? maskValue(cloudValue) : null;

          if (isFilled) {
            // Read-only filled field
            return (
              <div key={ph.name}>
                <label className="block text-xs font-medium text-white/50 mb-1">
                  {ph.label}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                  <svg
                    className="w-4 h-4 text-emerald-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-sm text-emerald-300 font-mono truncate">
                    {displayValue ?? "Filled"}
                  </span>
                </div>
              </div>
            );
          }

          // Manual entry field (not filled from cloud)
          const localVal = draft[ph.name] ?? "";
          const hasSavedLocal = !!(manualValues[ph.name]?.trim());

          return (
            <div key={ph.name}>
              <label className="block text-xs font-medium text-white/50 mb-1">
                {ph.label}
              </label>
              <input
                type={ph.type === "secret" ? "password" : "text"}
                value={localVal}
                onChange={(e) => handleChange(ph.name, e.target.value)}
                placeholder={`Enter ${ph.label.toLowerCase()}`}
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-white/5 text-white placeholder:text-white/30 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 ${
                  hasSavedLocal
                    ? "border-emerald-500/30"
                    : "border-white/10"
                }`}
              />
              {hasSavedLocal && !localVal && (
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  Previously saved locally
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button: only show when at least one field is NOT cloud-filled */}
      {!allFilled && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-white/30">Enter values manually</p>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-default"
            disabled={
              saved || Object.values(draft).every((v) => !v.trim())
            }
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync Banner
// ---------------------------------------------------------------------------

function SyncBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <svg
          className="w-5 h-5 text-emerald-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.81 4.97A4.5 4.5 0 0118 19.5H6.75z"
          />
        </svg>
        <p className="text-sm text-white/70">
          <span className="text-white font-medium">Connect with Prestige Cloud</span>{" "}
          to sync your API credentials from your vault.
        </p>
      </div>
      <button
        onClick={onConnect}
        className="shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
      >
        Connect
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ConnectionsPage() {
  const { state, client, appConfig, login } = usePrestigeAuth({
    clientId: PRESTIGE_CONFIG.clientId,
    baseUrl: PRESTIGE_CONFIG.baseUrl,
    redirectUri: PRESTIGE_CONFIG.redirectUri,
    scopes: [...PRESTIGE_CONFIG.scopes],
  });

  const isConnected = state === "connected";

  // Server-side connections (fetched when authenticated)
  const [connections, setConnections] = useState<Connection[]>([]);
  // Locally-stored manual values keyed by templateId
  const [allManual, setAllManual] = useState<Record<string, Record<string, string>>>({});
  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Track whether the initial data has been loaded at least once so we can
  // suppress the loading skeleton on background re-fetches.
  const hasLoadedOnce = useRef(false);

  // ── Load manual values from localStorage on mount ──────────────────
  useEffect(() => {
    setAllManual(client.getAllManualValues());
  }, [client]);

  // ── Fetch connections / public config depending on auth state ───────
  const fetchData = useCallback(async () => {
    // Only show the full loading state on the very first fetch
    if (!hasLoadedOnce.current) setLoading(true);
    setFetchError(null);

    try {
      if (isConnected) {
        const conns = await client.getConnections();
        setConnections(conns);
      } else {
        // In disconnected mode we rely solely on appConfig.templates
        // which usePrestigeAuth already fetches via getPublicAppConfig().
        setConnections([]);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [isConnected, client]);

  // Fetch on mount and whenever auth state changes
  useEffect(() => {
    // Reset for fresh state when auth changes
    hasLoadedOnce.current = false;
    void fetchData();
  }, [fetchData]);

  // ── Re-fetch when the tab regains focus (visibilitychange) ─────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchData]);

  // ── Save manual values handler ─────────────────────────────────────
  const handleSaveManual = useCallback(
    (templateId: string, values: Record<string, string>) => {
      client.saveManualValues(templateId, values);
      setAllManual((prev) => ({ ...prev, [templateId]: values }));
    },
    [client],
  );

  // ── Build the unified card list ────────────────────────────────────
  const cards: CardData[] = (() => {
    if (isConnected && connections.length > 0) {
      // Build cards from the connections API response (has live fill status)
      return connections.map((conn) => {
        // The Connection type does not carry placeholders directly.
        // Merge placeholder metadata from appConfig.templates if available.
        const tpl = appConfig?.templates.find(
          (t) => t.templateId === conn.templateId,
        );
        return {
          templateId: conn.templateId,
          templateName: conn.templateName,
          templateSlug: conn.templateSlug,
          type: conn.type,
          placeholders: tpl?.placeholders ?? Object.keys(conn.filledValues).map((k) => ({
            name: k,
            label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            type: "text",
          })),
          filled: conn.hasConnection,
          filledValues: conn.filledValues,
        };
      });
    }

    // Disconnected: fall back to appConfig.templates (public config)
    if (appConfig?.templates) {
      return appConfig.templates.map((tpl) => ({
        templateId: tpl.templateId,
        templateName: tpl.templateName,
        templateSlug: tpl.templateSlug,
        type: tpl.type,
        placeholders: tpl.placeholders,
        filled: false,
        filledValues: {},
      }));
    }

    return [];
  })();

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your API connections. Enter credentials manually or sync them
            from your Prestige Cloud vault.
          </p>
        </div>

        {/* Sync banner (only shown when disconnected) */}
        {!isConnected && state !== "loading" && (
          <SyncBanner onConnect={() => void login()} />
        )}

        {/* Error banner */}
        {fetchError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm text-red-300">
            Failed to load connections: {fetchError}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse"
              >
                <div className="h-5 w-40 bg-white/10 rounded mb-3" />
                <div className="h-4 w-24 bg-white/10 rounded mb-5" />
                <div className="h-9 w-full bg-white/10 rounded mb-3" />
                <div className="h-9 w-full bg-white/10 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Connection cards grid */}
        {!loading && cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <ConnectionCard
                key={card.templateId}
                card={card}
                manualValues={allManual[card.templateId] ?? {}}
                onSaveManual={handleSaveManual}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && cards.length === 0 && !fetchError && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-16 text-center">
            <svg
              className="w-10 h-10 text-white/20 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.856-2.07a4.5 4.5 0 00-6.364-6.364L4.5 8.257m6.364 6.364L15 10.5"
              />
            </svg>
            <p className="text-white/40 text-sm">
              No API templates have been configured for this app yet.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
