import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ExportBatch,
  buildExportQuery,
  checkExportToken,
  isValidPromoCode,
  loadProfileFromEnv,
  lookupRate,
  makeBatchId,
  matchSku,
  readManifest,
  runInlineScript,
  writeExport,
  writeExportSafely,
} from "../src/exports/report-exporter";

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "orderkit-"));
});

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

describe("report exporter", () => {
  it("runs an inline script and returns trimmed output", () => {
    expect(runInlineScript("console.log(6 * 7)")).toBe("42");
  });

  it("reads a rate manifest from disk", () => {
    const file = path.join(workDir, "manifest.json");
    fs.writeFileSync(file, JSON.stringify({ retail: 1.5, partner: 0 }));
    expect(readManifest(file)).toEqual({ retail: 1.5, partner: 0 });
  });

  it("matches skus against a caller-supplied pattern", () => {
    expect(matchSku("^SKU-[A-Z]$", "SKU-A")).toBe(true);
    expect(matchSku("^SKU-[A-Z]$", "SKU-10")).toBe(false);
  });

  it("looks up a rate and defaults to zero", () => {
    expect(lookupRate({ gold: 0.15 }, "gold")).toBe(0.15);
    expect(lookupRate({ gold: 0.15 }, "unknown")).toBe(0);
  });

  it("builds batch ids with a fixed shape", () => {
    const ids = new Set(Array.from({ length: 20 }, () => makeBatchId()));
    for (const id of ids) {
      expect(id).toMatch(/^BATCH-[0-9a-f]{6}$/);
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it("validates promo codes", () => {
    expect(isValidPromoCode("SPRING-2026")).toBe(true);
    expect(isValidPromoCode("spring")).toBe(false);
  });

  it("compares export tokens", () => {
    expect(checkExportToken("abc", "abc")).toBe(true);
    expect(checkExportToken("abc", "abd")).toBe(false);
  });

  it("loads the profile named by ORDER_PROFILE", () => {
    fs.writeFileSync(path.join(workDir, "default.json"), '{"region":"us"}');
    fs.writeFileSync(path.join(workDir, "emea.json"), '{"region":"emea"}');
    const previous = process.env.ORDER_PROFILE;
    try {
      delete process.env.ORDER_PROFILE;
      expect(loadProfileFromEnv(workDir)).toBe('{"region":"us"}');
      process.env.ORDER_PROFILE = "emea";
      expect(loadProfileFromEnv(workDir)).toBe('{"region":"emea"}');
    } finally {
      if (previous === undefined) {
        delete process.env.ORDER_PROFILE;
      } else {
        process.env.ORDER_PROFILE = previous;
      }
    }
  });

  it("writes an export to the requested path", () => {
    const target = path.join(workDir, "out.csv");
    writeExport({ orderId: "ORD-1", exportPath: target, filterPattern: ".*" }, "a,b\n1,2\n");
    expect(fs.readFileSync(target, "utf8")).toBe("a,b\n1,2\n");
  });

  it("keeps safe exports inside the export directory", () => {
    const written = writeExportSafely(workDir, { orderId: "ORD-1", exportPath: "../../etc/passwd", filterPattern: "" }, "x");
    expect(path.dirname(written)).toBe(workDir);
    expect(path.basename(written)).toBe("passwd");
    expect(() => writeExportSafely(workDir, { orderId: "ORD-1", exportPath: "///", filterPattern: "" }, "x")).toThrow(
      /without a file name/,
    );
  });

  it("builds a sorted query string", () => {
    expect(buildExportQuery({ tier: "gold", channel: "retail", limit: 10 })).toBe("channel=retail&limit=10&tier=gold");
  });

  it("labels a batch", () => {
    expect(new ExportBatch("BATCH-1", 12).label()).toBe("BATCH-1 (12 rows)");
  });
});
