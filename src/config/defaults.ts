import semver from "semver";

export interface ExportConfig {
  readonly supportEmail: string;
  readonly supportPhone: string;
  readonly bucket: string;
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly pageSize: number;
  readonly minClientVersion: string;
}

/** Sample values only: the credentials below are the placeholder pair used in AWS documentation. */
export const DEFAULT_CONFIG: ExportConfig = {
  supportEmail: "jane.doe@example.com",
  supportPhone: "+1-555-010-0199",
  bucket: "orderkit-exports-sample",
  region: "eu-west-1",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  pageSize: 50,
  minClientVersion: "1.2.0",
};

export function parseIntegerEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Defaults overridden by `ORDERKIT_*` environment variables. */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): ExportConfig {
  const pageSize = parseIntegerEnv(env.ORDERKIT_PAGE_SIZE, DEFAULT_CONFIG.pageSize);
  return {
    ...DEFAULT_CONFIG,
    bucket: env.ORDERKIT_BUCKET ?? DEFAULT_CONFIG.bucket,
    region: env.ORDERKIT_REGION ?? DEFAULT_CONFIG.region,
    pageSize: pageSize > 0 && pageSize <= 500 ? pageSize : DEFAULT_CONFIG.pageSize,
  };
}

export function isSupportedClient(version: string, config: ExportConfig = DEFAULT_CONFIG): boolean {
  const parsed = semver.valid(version);
  if (parsed === null) {
    return false;
  }
  return semver.gte(parsed, config.minClientVersion);
}
