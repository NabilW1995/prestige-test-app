"use client";

import { Nav } from "./nav";

/**
 * Shared page shell that wraps every page with the navigation bar
 * and a consistent content container. This is a client component
 * because the Nav bar uses the usePrestigeAuth hook.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
