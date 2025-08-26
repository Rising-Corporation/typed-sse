import { describe, it, expect, vi } from "vitest";
import { TypedEventSource } from "./TypedEventSource";
import type { EventSourceConstructor } from "./types";

interface CustomData {
  text: string;
  foo: { title: string; description: string; id: number };
  bar: { list: []; id: number; name: string };
}

interface Test {
  connected: { id: string };
  message: { text: string };
  custom: CustomData;
}

// Minimal fake EventSource implementation for testing
type EventHandler = ((ev: Event) => void) | null;

// Helper to emit a "connected" event for testing
function emitConnected(instance: FakeEventSource, id: string) {
  const messageEvent = new MessageEvent("connected", {
    data: { id },
  });
  const listeners = instance._listeners["connected"] || [];
  listeners.forEach((listener) => listener(messageEvent));
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: EventHandler = null;
  onerror: EventHandler = null;
  _listeners: Record<string, Array<(ev: MessageEvent) => void>> = {};
  constructor(public url: string, public opts?: EventSourceInit) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (ev: MessageEvent) => void) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
  }
  removeEventListener(type: string, listener: (ev: MessageEvent) => void) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter(
        (l) => l !== listener
      );
    }
  }
  close() {}
}

describe("TypedEventSource", () => {
  it("does not reconnect when retry is null", () => {
    vi.useFakeTimers();

    const sse = new TypedEventSource<Test>(
      "http://example.com",
      { retry: null },
      FakeEventSource as unknown as EventSourceConstructor
    );

    let receivedId: string | undefined;
    sse.on("connected", (data) => {
      receivedId = data.id;
    });

    // Simulate sending the 'connected' event with id '1234'
    const first = FakeEventSource.instances[0]!;
    emitConnected(first, "1234");

    expect(receivedId).toBe("1234");

    // Trigger an error on the first instance
    first.onerror?.(new Event("error"));

    // Advance timers to flush potential reconnects
    vi.runAllTimers();

    // No new instances should be created
    expect(FakeEventSource.instances.length).toBe(1);

    sse.close();
    vi.useRealTimers();
  });

  it("should receive custom data for bar.list", () => {
    const sse = new TypedEventSource<Test>(
      "http://example.com",
      { retry: null },
      FakeEventSource as unknown as EventSourceConstructor
    );

    let receivedBar: CustomData["bar"] | undefined;
    sse.on("custom", (data) => {
      receivedBar = data.bar;
    });

    // Simulate sending the 'custom' event with bar.list
    const first =
      FakeEventSource.instances[FakeEventSource.instances.length - 1]!;
    const messageEvent = new MessageEvent("custom", {
      data: {
        bar: { list: [1, 2, 3], id: 42, name: "test" },
        foo: { title: "t", description: "d", id: 1 },
        text: "hello",
      },
    });
    const listeners = first._listeners["custom"] || [];
    listeners.forEach((listener) => listener(messageEvent));

    expect(receivedBar).toEqual({ list: [1, 2, 3], id: 42, name: "test" });
    sse.close();
  });
});
