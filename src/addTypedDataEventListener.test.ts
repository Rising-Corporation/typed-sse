import { describe, it, expect, vi } from "vitest";
import { addTypedDataEventListener } from "./addTypedDataEventListener";

interface CustomEvent {
  id: string;
  message: { text: string };
  connected: { id: string };
}

class FakeEventSource {
  static CLOSED = 2;
  readyState = 1; // 1 = OPEN, 2 = CLOSED
  listeners: Record<string, ((ev: MessageEvent) => void)[]> = {};
  addEventListener(type: string, fn: (ev: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  removeEventListener(type: string, fn: (ev: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((f) => f !== fn);
    }
  }
  emit(type: string, data: any) {
    const event = new MessageEvent(type, { data });
    (this.listeners[type] || []).forEach((fn) => fn(event));
  }
}

// Assign FakeEventSource to global EventSource for tests
(globalThis as any).EventSource = FakeEventSource;

describe("addTypedDataEventListener", () => {
  it("should call handler with typed data for 'id' event", () => {
    const es = new FakeEventSource();
    let received: CustomEvent | undefined;
    const { stopListening } = addTypedDataEventListener<CustomEvent>(
      es as any,
      "customEvent",
      (data) => {
        received = data;
      }
    );
    es.emit("customEvent", {
      id: "abc123",
      message: { text: "hello" },
      connected: { id: "abc123" },
    });
    expect(received).toEqual({
      id: "abc123",
      message: { text: "hello" },
      connected: { id: "abc123" },
    });
    stopListening();
    received = undefined;
    es.emit("customEvent", { id: "shouldNotBeReceived" });
    expect(received).toBeUndefined();
  });

  it("should call handler with typed data for 'message' event", () => {
    const es = new FakeEventSource();
    let received: CustomEvent["message"] | undefined;
    const { stopListening } = addTypedDataEventListener<CustomEvent["message"]>(
      es as any,
      "message",
      (data) => {
        received = data;
      }
    );
    es.emit("message", { text: "Hello world!" });
    expect(received).toEqual({ text: "Hello world!" });
    stopListening();
    received = undefined;
    es.emit("message", { text: "shouldNotBeReceived" });
    expect(received).toBeUndefined();
  });

  it("should support multiple listeners for the same event", () => {
    const es = new FakeEventSource();
    let count = 0;
    const { stopListening: stop1 } = addTypedDataEventListener<
      CustomEvent["connected"]
    >(es as any, "connected", () => {
      count++;
    });
    const { stopListening: stop2 } = addTypedDataEventListener<
      CustomEvent["connected"]
    >(es as any, "connected", () => {
      count++;
    });
    es.emit("connected", { id: "multi" });
    expect(count).toBe(2);
    stop1();
    stop2();
  });
});
