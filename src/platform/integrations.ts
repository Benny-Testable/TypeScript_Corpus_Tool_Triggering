/**
 * Platform integrations: argument parsing, record snapshots and the HTTP
 * export stack. Third-party packages are imported here and nowhere else.
 */
import cloneDeep from "lodash/cloneDeep";
import parseArgs from "minimist";
import type { OrderRecord } from "../models/order-record";

export interface CliOptions {
  readonly channel: string;
  readonly limit: number;
  readonly verbose: boolean;
}

/** minimist -- argv parsing for the sample runner. */
export function parseOptions(argv: readonly string[]): CliOptions {
  const parsed = parseArgs(argv.slice(), {
    string: ["channel"],
    boolean: ["verbose"],
    default: { channel: "retail", limit: 25, verbose: false },
  });
  return {
    channel: String(parsed.channel),
    limit: Number(parsed.limit),
    verbose: Boolean(parsed.verbose),
  };
}

/** lodash -- defensive copy before handing records to a processor. */
export function snapshot(orders: readonly OrderRecord[]): OrderRecord[] {
  return cloneDeep(orders as OrderRecord[]);
}

/**
 * axios and node-fetch are declared for the export pipeline and are loaded
 * lazily, so that neither the test suite nor the bundle performs network work
 * at import time.
 */
export async function describeExportStack(): Promise<Record<string, string>> {
  const axios = await import("axios");
  const nodeFetch = await import("node-fetch");
  return {
    axios: typeof axios.default === "function" ? "loaded" : "loaded",
    nodeFetch: typeof nodeFetch.default === "function" ? "loaded" : "loaded",
  };
}
