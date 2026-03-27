"use client";

import { useEffect, useState } from "react";

export default function CallbackPage() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDesc = params.get("error_description");

    const debug: string[] = [
      `URL: ${window.location.href}`,
      `code: ${code ? code.slice(0, 8) + "..." : "null"}`,
      `error: ${error ?? "none"}`,
      `error_description: ${errorDesc ?? "none"}`,
      `window.opener: ${window.opener ? "exists" : "NULL"}`,
      `window.opener === window: ${String(window.opener === window)}`,
    ];

    if (error) {
      debug.push(`OAuth error received: ${error} — ${errorDesc ?? ""}`);
      setDebugInfo(debug.join("\n"));
      setStatus("error");
      return;
    }

    if (!code) {
      debug.push("No authorization code in URL");
      setDebugInfo(debug.join("\n"));
      setStatus("error");
      return;
    }

    if (!window.opener) {
      debug.push("window.opener is null — trying postMessage to parent anyway");
      // Try posting to parent as fallback
      try {
        window.parent.postMessage({ type: "prestige-callback", code }, "*");
        debug.push("Posted to window.parent");
      } catch (e) {
        debug.push(`parent postMessage failed: ${String(e)}`);
      }
      // Also try self-closing popup approach — store code in localStorage
      // so the opener can pick it up
      try {
        localStorage.setItem("prestige_callback_code", code);
        debug.push("Stored code in localStorage as fallback");
      } catch (e) {
        debug.push(`localStorage fallback failed: ${String(e)}`);
      }
      setDebugInfo(debug.join("\n"));
      setStatus("error");
      return;
    }

    // Normal flow: post code to opener
    try {
      window.opener.postMessage({ type: "prestige-callback", code }, "*");
      debug.push("Successfully posted code to opener");
      setDebugInfo(debug.join("\n"));
      setStatus("success");
      setTimeout(() => window.close(), 1500);
    } catch (e) {
      debug.push(`postMessage to opener failed: ${String(e)}`);
      setDebugInfo(debug.join("\n"));
      setStatus("error");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="max-w-lg w-full">
        {status === "processing" && (
          <p className="text-white/50 text-center">Processing login...</p>
        )}
        {status === "success" && (
          <p className="text-emerald-400 text-center">
            Login successful! This window will close.
          </p>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <p className="text-red-400 text-center text-lg">
              Login failed
            </p>
            <pre className="bg-gray-900 border border-white/10 rounded-lg p-4 text-xs text-white/60 font-mono whitespace-pre-wrap overflow-auto">
              {debugInfo}
            </pre>
            <p className="text-white/30 text-xs text-center">
              You can close this window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
