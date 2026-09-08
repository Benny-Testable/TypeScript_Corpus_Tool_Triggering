import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import qs from "qs";

export interface ExportRequest {
  readonly orderId: string;
  readonly exportPath: string;
  readonly filterPattern: string;
}

/** A batch of exported rows; `id` and `rows` are plain constructor properties. */
export class ExportBatch {
  public constructor(
    public readonly id: string,
    public readonly rows: number,
  ) {}

  public label(): string {
    return `${this.id} (${this.rows} rows)`;
  }
}

/** Run a short Node snippet in a child process and return what it prints. */
export function runInlineScript(source: string): string {
  return execSync(`${JSON.stringify(process.execPath)} -e ${JSON.stringify(source)}`).toString().trim();
}

export function readManifest(manifestPath: string): Record<string, number> {
  const raw = fs.readFileSync(manifestPath, "utf8");
  return <Record<string, number>>JSON.parse(raw);
}

export function matchSku(pattern: string, sku: string): boolean {
  return new RegExp(pattern).test(sku);
}

export function lookupRate(table: Record<string, number>, key: string): number {
  return table[key] ?? 0;
}

/** Short random identifier for an export batch. */
export function makeBatchId(): string {
  return `BATCH-${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
}

export function isValidPromoCode(code: string): boolean {
  return /^([A-Z0-9]+-?)+$/.test(code);
}

export function checkExportToken(provided: string, expectedToken: string): boolean {
  return provided === expectedToken;
}

export function loadProfileFromEnv(directory: string): string {
  const profile = process.env.ORDER_PROFILE ?? "default";
  return fs.readFileSync(path.join(directory, `${profile}.json`), "utf8");
}

export function writeExport(request: ExportRequest, body: string): void {
  fs.writeFileSync(request.exportPath, body, "utf8");
}

/** Like `writeExport`, but the file always lands directly inside `root`. */
export function writeExportSafely(root: string, request: ExportRequest, body: string): string {
  const safeName = path.basename(request.exportPath).replace(/[^A-Za-z0-9._-]/g, "");
  if (safeName.length === 0) {
    throw new Error("refusing to write an export without a file name");
  }
  const resolved = path.join(root, safeName);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("export path escapes the export directory");
  }
  fs.writeFileSync(resolved, body, "utf8");
  return resolved;
}

export function buildExportQuery(filters: Record<string, string | number | boolean>): string {
  return qs.stringify(filters, { sort: (a, b) => a.localeCompare(b) });
}
