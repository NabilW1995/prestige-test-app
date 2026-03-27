"use client";

import { PrestigeCallback } from "@prestige-app-cloud/react";

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <PrestigeCallback
        onSuccess={() => console.log("Auth success")}
        onError={(err) => console.error(err)}
      />
    </div>
  );
}
