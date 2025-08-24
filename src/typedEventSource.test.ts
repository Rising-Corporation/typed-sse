import { describe, it, expect, vi } from "vitest";
import { typedEventSource } from "./typedEventSource";

// Minimal fake EventSource implementation for testing
type EventHandler = ((ev: Event) => void) | null;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: EventHandler = null;
  onerror: EventHandler = null;
  constructor(public url: string, public opts?: EventSourceInit) {
    FakeEventSource.instances.push(this);
  }
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

describe("typedEventSource retry option", () => {
  it("does not reconnect when retry is null", () => {
    vi.useFakeTimers();

    const sse = typedEventSource(
      "http://example.com",
      { retry: null },
      FakeEventSource as unknown as {
        new (url: string, init?: EventSourceInit): EventSource;
      }
    );

    // Trigger an error on the first instance
    const first = FakeEventSource.instances[0]!;
    first.onerror?.(new Event("error"));

    // Advance timers to flush potential reconnects
    vi.runAllTimers();

    // No new instances should be created
    expect(FakeEventSource.instances.length).toBe(1);

    sse.close();
    vi.useRealTimers();
  });
});
