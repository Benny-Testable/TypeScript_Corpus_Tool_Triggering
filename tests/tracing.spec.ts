import { describe, expect, it } from "vitest";
import { SpanStatusCode, trace } from "@opentelemetry/api";

import { withSpan, tracer } from "../src/platform/tracing";
import { run } from "../src/index";

/**
 * Tracing is exercised from the ordinary test suite: with no SDK registered the
 * OpenTelemetry API returns a no-op tracer, so every wrapper must reduce to a
 * plain function call and still propagate values and errors unchanged.
 */
describe("tracing", () => {
  it("exposes a tracer even with no SDK registered", () => {
    expect(tracer).toBeTypeOf("object");
    expect(trace.getTracer("probe")).toBeTypeOf("object");
  });

  it("returns the wrapped function's value", () => {
    const out = withSpan("probe.value", { "probe.kind": "sync" }, () => 42);
    expect(out).toBe(42);
  });

  it("passes attributes of every accepted primitive type", () => {
    const out = withSpan(
      "probe.attributes",
      { str: "a", num: 1, bool: true },
      (span) => {
        expect(span).toBeTypeOf("object");
        return "ok";
      },
    );
    expect(out).toBe("ok");
  });

  it("propagates a throw and still ends the span", () => {
    expect(() =>
      withSpan("probe.throw", { "probe.kind": "error" }, () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
  });

  it("propagates a non-Error throw", () => {
    expect(() =>
      withSpan("probe.throw.string", {}, () => {
        throw "not-an-error";
      }),
    ).toThrow();
  });

  it("run() still produces the same summary with instrumentation in place", () => {
    const summary = run();
    expect(summary.priced.length).toBeGreaterThan(0);
    expect(summary.retail.count + summary.wholesale.count).toBeGreaterThan(0);
    expect(summary.runtime).toBe(process.version);
  });
});

describe("withSpan with a recording tracer", () => {
  it("sets attributes, marks success and ends the span", async () => {
    const calls = { attributes: [] as unknown[], statuses: [] as unknown[], ended: 0 };
    const span = {
      setAttributes: (attributes: unknown) => void calls.attributes.push(attributes),
      setStatus: (status: unknown) => void calls.statuses.push(status),
      end: () => {
        calls.ended += 1;
      },
    };
    const fakeTracer = { startActiveSpan: (_name: string, fn: (s: typeof span) => unknown) => fn(span) };
    trace.setGlobalTracerProvider({ getTracer: () => fakeTracer } as never);

    expect(withSpan("probe.ok", { stage: "a" }, () => "fine")).toBe("fine");
    expect(calls.attributes).toEqual([{ stage: "a" }]);
    expect(calls.statuses).toEqual([{ code: SpanStatusCode.OK }]);
    expect(calls.ended).toBe(1);

    expect(() =>
      withSpan("probe.fail", {}, () => {
        throw new Error("broken");
      }),
    ).toThrow("broken");
    expect(calls.statuses[1]).toEqual({ code: SpanStatusCode.ERROR, message: "broken" });
    expect(calls.ended).toBe(2);

    expect(() =>
      withSpan("probe.text", {}, () => {
        throw "plain text";
      }),
    ).toThrow();
    expect(calls.statuses[2]).toEqual({ code: SpanStatusCode.ERROR, message: "plain text" });
    expect(calls.ended).toBe(3);
  });
});
