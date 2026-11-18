export type CookieSecure = "auto" | "true" | "false";

export type AppConfig = {
  readonly dataDir: string;
  readonly cookieSecure: CookieSecure;
  readonly timeZone: string;
};

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const cookieSecure = env.COOKIE_SECURE ?? "auto";
  if (cookieSecure !== "auto" && cookieSecure !== "true" && cookieSecure !== "false") {
    throw new Error('COOKIE_SECURE deve ser "auto", "true" ou "false".');
  }

  return {
    dataDir: env.DATA_DIR || "./data",
    cookieSecure,
    timeZone: env.TZ || "America/Sao_Paulo",
  };
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= loadConfig(process.env);
  return cached;
}
