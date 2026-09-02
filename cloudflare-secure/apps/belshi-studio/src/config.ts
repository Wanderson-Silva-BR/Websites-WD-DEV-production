export type AppConfig = {
  name: string;
  kind: "store" | "studio" | "public-figure" | "agency";
  allowRegistration: boolean;
  sessionTtlSeconds: number;
};

export function appConfig(env: Record<string, string>): AppConfig {
  const ttl = Number(env.SESSION_TTL_SECONDS || 43200);
  return {
    name: env.APP_NAME || "WD DEV Secure App",
    kind: (env.APP_KIND as AppConfig["kind"]) || "agency",
    allowRegistration: env.ALLOW_REGISTRATION === "true",
    sessionTtlSeconds: Number.isFinite(ttl) ? Math.min(Math.max(ttl, 900), 86400) : 43200,
  };
}
