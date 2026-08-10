import { describe, expect, it } from "vitest";
import {
  InvalidTransitionError,
  OrderStatus,
  advance,
  canTransition,
  isTerminal,
  nextStatuses,
} from "../src/models/order-status";

describe("order status", () => {
  it("walks the happy path from pending to delivered", () => {
    let status = OrderStatus.Pending;
    for (const next of [OrderStatus.Confirmed, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered]) {
      status = advance(status, next);
    }
    expect(status).toBe(OrderStatus.Delivered);
  });

  it("rejects skipping a step", () => {
    expect(canTransition(OrderStatus.Pending, OrderStatus.Shipped)).toBe(false);
    expect(() => advance(OrderStatus.Pending, OrderStatus.Shipped)).toThrow(InvalidTransitionError);
  });

  it("allows cancelling before the order is packed", () => {
    expect(canTransition(OrderStatus.Pending, OrderStatus.Cancelled)).toBe(true);
    expect(canTransition(OrderStatus.Confirmed, OrderStatus.Cancelled)).toBe(true);
  });

  it("lists the follow-up states", () => {
    expect(nextStatuses(OrderStatus.Confirmed)).toEqual([OrderStatus.Packed, OrderStatus.Cancelled]);
  });

  it("marks delivered and cancelled as terminal", () => {
    expect(isTerminal(OrderStatus.Delivered)).toBe(true);
    expect(isTerminal(OrderStatus.Cancelled)).toBe(true);
    expect(isTerminal(OrderStatus.Packed)).toBe(false);
  });

  it("reports both states in the error", () => {
    try {
      advance(OrderStatus.Delivered, OrderStatus.Pending);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      expect((error as InvalidTransitionError).message).toBe("cannot move an order from delivered to pending");
    }
  });
});
