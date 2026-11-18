export type CookieSecure = "auto" | "true" | "false";

export type AppConfig = {
  readonly username: string;
  readonly password: string;
  readonly dataDir: string;
  readonly cookieSecure: CookieSecure;
  readonly timeZone: string;
};

const MIN_PASSWORD_LENGTH = 12;

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const username = env.APP_USERNAME ?? "";
  if (username.trim() === "") {
    throw new Error("APP_USERNAME não está definida. Copie .env.example para .env e escolha um usuário.");
  }
  const password = env.APP_PASSWORD ?? "";
  if (password === "") {
    throw new Error("APP_PASSWORD não está definida. Copie .env.example para .env e escolha uma senha.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`APP_PASSWORD precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const cookieSecure = env.COOKIE_SECURE ?? "auto";
  if (cookieSecure !== "auto" && cookieSecure !== "true" && cookieSecure !== "false") {
    throw new Error('COOKIE_SECURE deve ser "auto", "true" ou "false".');
  }

  return {
    username,
    password,
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
