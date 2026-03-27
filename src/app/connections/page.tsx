"use client";

import { usePrestigeAuth } from "@prestige-app-cloud/react";
import { PRESTIGE_CONFIG } from "@/lib/prestige-config";
import { PageShell } from "@/components/page-shell";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Connection, AppConfig } from "@prestige-app-cloud/sdk";

// ---------------------------------------------------------------------------
// Design tokens — terminal aesthetic
// ---------------------------------------------------------------------------

const terminalFont =
  "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

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

/**
 * Public config returned by the /api/v1/app-config/public endpoint.
 * Used to control which templates to show, whether to show the
 * account prompt, and theme settings.
 */
interface PublicConfig {
  appName: string;
  showAccountPrompt: boolean;
  requireAccount: boolean;
  syncMode?: "two_way" | "one_way" | "proxy_only" | "manual_fill";
  enabledFeatures?: Record<string, boolean>;
  templates: AppConfig["templates"];
  theme?: AppConfig["theme"];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a template type string to a human-readable badge label. */
function typeBadgeLabel(type: string): string {
  const MAP: Record<string, string> = {
    standard_api: "std-api",
    magic_api: "magic-api",
    custom: "custom",
    oauth: "oauth",
    webhook: "webhook",
  };
  return MAP[type] ?? type;
}

/**
 * Mask a secret value for display, keeping the first 3 and last 4 characters
 * visible if the value is long enough.
 */
function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 3)}...${value.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Terminal-style connection card. Dark background, monospace font,
 * green accent labels. No macOS window chrome — just a mini terminal block.
 */
function ConnectionCard({
  card,
  manualValues,
  requireAccount,
  proxyOnly,
  onSaveManual,
}: {
  card: CardData;
  manualValues: Record<string, string>;
  requireAccount: boolean;
  proxyOnly: boolean;
  onSaveManual: (templateId: string, values: Record<string, string>) => void;
}) {
  // Local draft state for manual form inputs.
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
    const nonEmpty: Record<string, string> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (v.trim()) nonEmpty[k] = v.trim();
    }
    onSaveManual(card.templateId, nonEmpty);
    setSaved(true);
  };

  const allFilled = card.filled;

  // Determine whether manual fill is allowed
  const canManualFill = !requireAccount && !proxyOnly;

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #222",
        borderRadius: "8px",
        padding: "16px",
        fontFamily: terminalFont,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Card header: template name + type badge + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              color: "#e0e0e0",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card.templateName}
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: "4px",
              padding: "1px 8px",
              fontSize: "10px",
              color: "#888",
              border: "1px solid #333",
              borderRadius: "4px",
              background: "#0a0a0a",
            }}
          >
            {typeBadgeLabel(card.type)}
          </span>
        </div>

        {allFilled && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "#4ade80",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <span style={{ fontSize: "13px" }}>&#10003;</span>
            connected
          </span>
        )}
      </div>

      {/* Placeholder fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {card.placeholders.map((ph) => {
          const cloudValue = card.filledValues[ph.name];
          const isFilled =
            cloudValue === true ||
            (typeof cloudValue === "string" && cloudValue.length > 0);
          const displayValue =
            typeof cloudValue === "string" ? maskValue(cloudValue) : null;

          if (isFilled) {
            // Cloud-filled field — read-only with green checkmark
            return (
              <div key={ph.name}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#666",
                    marginBottom: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {ph.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(74, 222, 128, 0.06)",
                    border: "1px solid rgba(74, 222, 128, 0.2)",
                    borderRadius: "4px",
                    padding: "6px 10px",
                  }}
                >
                  <span style={{ color: "#4ade80", fontSize: "12px" }}>
                    &#10003;
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#4ade80",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayValue ?? "filled"}
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
              <div
                style={{
                  fontSize: "10px",
                  color: "#666",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {ph.label}
              </div>
              {canManualFill ? (
                <>
                  <input
                    type={ph.type === "secret" ? "password" : "text"}
                    value={localVal}
                    onChange={(e) => handleChange(ph.name, e.target.value)}
                    placeholder={`enter ${ph.label.toLowerCase()}`}
                    style={{
                      width: "100%",
                      background: "#0a0a0a",
                      border: `1px solid ${hasSavedLocal ? "rgba(74, 222, 128, 0.3)" : "#222"}`,
                      borderRadius: "4px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "#e0e0e0",
                      fontFamily: terminalFont,
                      outline: "none",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(74, 222, 128, 0.4)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = hasSavedLocal
                        ? "rgba(74, 222, 128, 0.3)"
                        : "#222";
                    }}
                  />
                  {hasSavedLocal && !localVal && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(74, 222, 128, 0.6)",
                        marginTop: "2px",
                      }}
                    >
                      previously saved locally
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #222",
                    borderRadius: "4px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    color: "#555",
                  }}
                >
                  connect with Prestige Cloud to fill
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button: only show when manual fill is allowed and at least one field is NOT cloud-filled */}
      {!allFilled && canManualFill && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "4px",
            borderTop: "1px solid #1a1a1a",
          }}
        >
          <span style={{ fontSize: "10px", color: "#555" }}>
            manual entry
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saved || Object.values(draft).every((v) => !v.trim())}
            style={{
              background: saved
                ? "rgba(74, 222, 128, 0.12)"
                : "rgba(74, 222, 128, 0.08)",
              border: `1px solid ${saved ? "rgba(74, 222, 128, 0.4)" : "rgba(74, 222, 128, 0.2)"}`,
              borderRadius: "4px",
              padding: "4px 14px",
              fontFamily: terminalFont,
              fontSize: "11px",
              color: saved ? "#4ade80" : "#aaa",
              cursor:
                saved || Object.values(draft).every((v) => !v.trim())
                  ? "default"
                  : "pointer",
              opacity:
                saved || Object.values(draft).every((v) => !v.trim())
                  ? 0.5
                  : 1,
              transition: "all 0.15s",
            }}
          >
            {saved ? "saved" : "save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terminal-style Sync Banner
// ---------------------------------------------------------------------------

function SyncBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(74, 222, 128, 0.2)",
        borderRadius: "8px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontFamily: terminalFont,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "#4ade80", fontSize: "14px" }}>&#9729;</span>
        <span style={{ fontSize: "12px", color: "#888" }}>
          <span style={{ color: "#e0e0e0", fontWeight: 500 }}>
            connect with Prestige Cloud
          </span>{" "}
          to sync credentials from your vault
        </span>
      </div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          background: "rgba(74, 222, 128, 0.08)",
          border: "1px solid rgba(74, 222, 128, 0.3)",
          borderRadius: "4px",
          padding: "5px 16px",
          fontFamily: terminalFont,
          fontSize: "11px",
          color: "#4ade80",
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(74, 222, 128, 0.15)";
          e.currentTarget.style.borderColor = "#4ade80";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(74, 222, 128, 0.08)";
          e.currentTarget.style.borderColor = "rgba(74, 222, 128, 0.3)";
        }}
      >
        $ connect
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
  const [allManual, setAllManual] = useState<
    Record<string, Record<string, string>>
  >({});
  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dynamic public config fetched from the server — controls which
  // templates to show, whether to show the account prompt banner, etc.
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null);

  // Track whether the initial data has been loaded at least once so we can
  // suppress the loading skeleton on background re-fetches.
  const hasLoadedOnce = useRef(false);

  // NOTE: We do NOT auto-load manual values from localStorage.
  // Manual fill means starting with BLANK fields. Values are only
  // shown after the user explicitly saves them in this session.

  // -- Fetch public config (always, even when authenticated) --
  // This ensures we respect the latest integrationConfig from the
  // developer dashboard (selectedTemplateIds, showAccountPrompt,
  // requireAccount, theme).
  const fetchPublicConfig = useCallback(async () => {
    try {
      const cfg = await client.getPublicAppConfig();
      setPublicConfig(cfg);
    } catch {
      // Non-critical — fall back to appConfig from auth hook
    }
  }, [client]);

  // -- Fetch connections / public config depending on auth state --
  const fetchData = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    setFetchError(null);

    try {
      // Always fetch the latest public config
      await fetchPublicConfig();

      if (isConnected) {
        const conns = await client.getConnections();
        setConnections(conns);
      } else {
        setConnections([]);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [isConnected, client, fetchPublicConfig]);

  // Fetch on mount and whenever auth state changes
  useEffect(() => {
    hasLoadedOnce.current = false;
    void fetchData();
  }, [fetchData]);

  // -- Re-fetch when the tab regains focus (visibilitychange) --
  // This ensures changes made in the Prestige Cloud dashboard
  // (e.g. toggling templates, changing theme) are picked up immediately.
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

  // -- Save manual values handler --
  const handleSaveManual = useCallback(
    (templateId: string, values: Record<string, string>) => {
      client.saveManualValues(templateId, values);
      setAllManual((prev) => ({ ...prev, [templateId]: values }));
    },
    [client],
  );

  // -- Resolve effective config: prefer publicConfig, fall back to appConfig --
  const effectiveConfig = publicConfig ?? appConfig;
  const showAccountPrompt = effectiveConfig?.showAccountPrompt ?? true;
  const requireAccount = effectiveConfig?.requireAccount ?? false;
  const syncMode: string = (publicConfig as PublicConfig | null)?.syncMode ?? "manual_fill";
  const isProxyOnly = syncMode === "proxy_only";
  const isAutoFill = syncMode === "two_way" || syncMode === "one_way";

  // -- Build the unified card list, filtered by the public config --
  const cards: CardData[] = (() => {
    // Determine which template IDs to show from the public config
    const allowedTemplateIds = publicConfig?.templates?.map(
      (t) => t.templateId,
    );

    // Use the public config templates as the base — these are the templates
    // the developer selected in the dashboard. This ensures we always show
    // the right templates regardless of connection status.
    const baseTemplates = effectiveConfig?.templates ?? [];

    // If connected AND we got connections back, merge fill status
    if (isConnected && connections.length > 0) {
      const connMap = new Map(connections.map((c) => [c.templateId, c]));

      return baseTemplates.map((tpl) => {
        const conn = connMap.get(tpl.templateId);
        if (conn) {
          return {
            templateId: tpl.templateId,
            templateName: tpl.templateName,
            templateSlug: tpl.templateSlug,
            type: tpl.type,
            placeholders: tpl.placeholders,
            filled: conn.hasConnection,
            filledValues: conn.filledValues,
          };
        }
        // Template exists in config but no connection yet — show as empty
        return {
          templateId: tpl.templateId,
          templateName: tpl.templateName,
          templateSlug: tpl.templateSlug,
          type: tpl.type,
          placeholders: tpl.placeholders,
          filled: false,
          filledValues: {},
        };
      });
    }

    // Disconnected OR connected but no connections returned:
    // show all templates as empty (ready for manual fill)
    return baseTemplates.map((tpl) => ({
      templateId: tpl.templateId,
      templateName: tpl.templateName,
      templateSlug: tpl.templateSlug,
      type: tpl.type,
      placeholders: tpl.placeholders,
      filled: false,
      filledValues: {},
    }));
  })();

  // -- Derive theme accent color from config --
  const themeAccent =
    effectiveConfig?.theme?.primaryColor ?? "#4ade80";

  // -- Render --
  return (
    <PageShell>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Page header — terminal style */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontFamily: terminalFont,
              fontSize: "14px",
              color: themeAccent,
              marginBottom: "4px",
            }}
          >
            $ connections --list
          </div>
          <div
            style={{
              fontFamily: terminalFont,
              fontSize: "12px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              {isProxyOnly
                ? "api connections are proxied server-side. no credentials needed."
                : isAutoFill
                  ? "credentials auto-filled from your prestige cloud vault."
                  : "enter credentials manually or connect to sync from vault."}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#444",
                background: "#1a1a1a",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              mode: {syncMode.replace("_", "-")}
            </span>
          </div>
        </div>

        {/* Sync banner (only shown when disconnected, not proxy_only, and showAccountPrompt is enabled) */}
        {!isConnected &&
          !isProxyOnly &&
          state !== "loading" &&
          showAccountPrompt && (
            <div style={{ marginBottom: "16px" }}>
              <SyncBanner onConnect={() => void login()} />
            </div>
          )}

        {/* Proxy-only info banner */}
        {isProxyOnly && (
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              padding: "14px 16px",
              fontFamily: terminalFont,
              fontSize: "12px",
              color: "#888",
              marginBottom: "16px",
            }}
          >
            <span style={{ color: themeAccent }}>proxy mode:</span> all API requests
            are proxied through Prestige Cloud server-side. No credentials are exposed
            to the client.
          </div>
        )}

        {/* Error banner */}
        {fetchError && (
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: terminalFont,
              fontSize: "12px",
              color: "#ef4444",
              marginBottom: "16px",
            }}
          >
            error: failed to load connections — {fetchError}
          </div>
        )}

        {/* Loading skeleton — terminal style */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "12px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    height: "14px",
                    width: "160px",
                    background: "#1a1a1a",
                    borderRadius: "3px",
                    marginBottom: "12px",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    width: "80px",
                    background: "#1a1a1a",
                    borderRadius: "3px",
                    marginBottom: "16px",
                  }}
                />
                <div
                  style={{
                    height: "28px",
                    width: "100%",
                    background: "#1a1a1a",
                    borderRadius: "3px",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    height: "28px",
                    width: "100%",
                    background: "#1a1a1a",
                    borderRadius: "3px",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Connection cards grid — 2 columns */}
        {!loading && cards.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "12px",
            }}
          >
            {cards.map((card) => (
              <ConnectionCard
                key={card.templateId}
                card={card}
                manualValues={allManual[card.templateId] ?? {}}
                requireAccount={requireAccount}
                proxyOnly={isProxyOnly}
                onSaveManual={handleSaveManual}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && cards.length === 0 && !fetchError && (
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              padding: "48px 16px",
              textAlign: "center",
              fontFamily: terminalFont,
            }}
          >
            <div
              style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}
            >
              no api templates configured
            </div>
            <div style={{ fontSize: "11px", color: "#333" }}>
              the developer has not added any templates to this app yet
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
