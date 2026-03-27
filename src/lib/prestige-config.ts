export const PRESTIGE_CONFIG = {
  clientId:
    "4f7bd95420ec493e56fbc0ccb1d8506b02c1bd14097312abad2eaecaa788927d",
  baseUrl: "https://prestige-cloud.vercel.app",
  redirectUri: "https://prestige-test-app.vercel.app/callback",
  scopes: [
    "profile",
    "connections:read",
    "connections:write",
    "connections:proxy",
    "billing:read",
    "billing:manage",
    "ai:chat",
    "ai:embeddings",
    "ai:usage",
    "files:read",
    "files:write",
    "billing:usage",
    "data:read",
  ],
} as const;
