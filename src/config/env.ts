export type NodeEnv = "development" | "test" | "production";

export interface EnvConfig {
  nodeEnv: NodeEnv;
  port: number;
  timeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  trustProxy: boolean;
  webhookSecret?: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  corsAllowedOrigins: string[];
}

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

export function loadEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  const issues: string[] = [];

  const nodeEnv = parseNodeEnv(env.NODE_ENV, issues);
  const port = parsePort(env.PORT, issues);

  const timeoutMs = parsePositiveInteger(env.REQUEST_TIMEOUT_MS, "REQUEST_TIMEOUT_MS", 30_000, issues);
  const rateLimitWindowMs = parsePositiveInteger(
    env.RATE_LIMIT_WINDOW_MS,
    "RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
    issues,
  );
  const rateLimitMax = parsePositiveInteger(env.RATE_LIMIT_MAX, "RATE_LIMIT_MAX", 100, issues);
  const trustProxy = parseBoolean(env.TRUST_PROXY, "TRUST_PROXY", false, issues);

  const webhookSecret = parseOptionalString(env.WEBHOOK_SECRET);
  const jwtIssuer = parseOptionalString(env.JWT_ISSUER);
  const jwtAudience = parseOptionalString(env.JWT_AUDIENCE);
  const corsAllowedOrigins = parseStringList(env.CORS_ALLOWED_ORIGINS);

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return {
    nodeEnv,
    port,
    timeoutMs,
    rateLimitWindowMs,
    rateLimitMax,
    trustProxy,
    webhookSecret,
    jwtIssuer,
    jwtAudience,
    corsAllowedOrigins,
  };
}

function parseNodeEnv(rawValue: string | undefined, issues: string[]): NodeEnv {
  if (rawValue === undefined) return "development";

  const value = rawValue.trim();
  const allowedValues: NodeEnv[] = ["development", "test", "production"];

  if (value.length === 0) {
    issues.push("NODE_ENV must be a non-empty value when provided.");
    return "development";
  }

  if (!allowedValues.includes(value as NodeEnv)) {
    issues.push("NODE_ENV must be one of: development, test, production.");
    return "development";
  }

  return value as NodeEnv;
}

function parsePort(rawValue: string | undefined, issues: string[]): number {
  return parseIntegerInRange(rawValue, "PORT", 3001, 1, 65535, issues);
}

function parsePositiveInteger(
  rawValue: string | undefined,
  key: string,
  defaultValue: number,
  issues: string[],
): number {
  return parseIntegerInRange(rawValue, key, defaultValue, 1, Number.MAX_SAFE_INTEGER, issues);
}

function parseIntegerInRange(
  rawValue: string | undefined,
  key: string,
  defaultValue: number,
  min: number,
  max: number,
  issues: string[],
): number {
  if (rawValue === undefined) return defaultValue;

  const value = rawValue.trim();
  if (value.length === 0) {
    issues.push(`${key} must be a non-empty integer when provided.`);
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    issues.push(`${key} must be a whole number between ${min} and ${max}.`);
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    issues.push(`${key} must be a whole number between ${min} and ${max}.`);
    return defaultValue;
  }

  return parsed;
}

function parseBoolean(
  rawValue: string | undefined,
  key: string,
  defaultValue: boolean,
  issues: string[],
): boolean {
  if (rawValue === undefined) return defaultValue;

  const value = rawValue.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;

  issues.push(`${key} must be either true or false.`);
  return defaultValue;
}

function parseOptionalString(rawValue: string | undefined): string | undefined {
  const value = rawValue?.trim();
  return value ? value : undefined;
}

function parseStringList(rawValue: string | undefined): string[] {
  if (!rawValue) return [];

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}