import { describe, it, expect } from "vitest";
import { addTypedDataEventListener } from "./addTypedDataEventListener";

interface CustomEvent {
  id: string;
  message: { text: string };
  connected: { id: string };
}

class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  readyState = 1; // 1 = OPEN, 2 = CLOSED
  listeners: Record<string, ((ev: MessageEvent) => void)[]> = {};
  // EventSource interface properties
  url = "";
  withCredentials = false;
  onopen: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
  addEventListener(type: string, fn: (ev: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  removeEventListener(type: string, fn: (ev: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((f) => f !== fn);
    }
  }
  emit<T>(type: string, data: T) {
    const event = new MessageEvent(type, { data });
    (this.listeners[type] || []).forEach((fn) => fn(event));
    // Call onmessage for 'message' events
    if (type === "message" && typeof this.onmessage === "function") {
      this.onmessage(event);
    }
    // Call onopen for 'open' events
    if (type === "open" && typeof this.onopen === "function") {
      this.onopen(new Event("open"));
    }
    // Call onerror for 'error' events
    if (type === "error" && typeof this.onerror === "function") {
      this.onerror(new Event("error"));
    }
  }
  dispatchEvent(): boolean {
    // Not used in tests, but required for EventSource interface
    return true;
  }
}

// Assign FakeEventSource to global EventSource for tests
(globalThis as unknown as { EventSource: typeof EventSource }).EventSource =
  FakeEventSource as unknown as typeof EventSource;

describe("addTypedDataEventListener", () => {
  it("should call handler with typed data for 'id' event", () => {
    const es = new FakeEventSource();
    let received: CustomEvent | undefined;
    const { stopListening } = addTypedDataEventListener<CustomEvent>(
      es as unknown as EventSource,
      "customEvent",
      (data) => {
        received = data;
      }
    );
    es.emit<CustomEvent>("customEvent", {
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
    es.emit<CustomEvent>("customEvent", {
      id: "shouldNotBeReceived",
    } as CustomEvent);
    expect(received).toBeUndefined();
  });

  it("should call handler with typed data for 'message' event", () => {
    const es = new FakeEventSource();
    let received: CustomEvent["message"] | undefined;
    const { stopListening } = addTypedDataEventListener<CustomEvent["message"]>(
      es as unknown as EventSource,
      "message",
      (data) => {
        received = data;
      }
    );
    es.emit<CustomEvent["message"]>("message", { text: "Hello world!" });
    expect(received).toEqual({ text: "Hello world!" });
    stopListening();
    received = undefined;
    es.emit<CustomEvent["message"]>("message", {
      text: "shouldNotBeReceived",
    } as CustomEvent["message"]);
    expect(received).toBeUndefined();
  });

  it("should support multiple listeners for the same event", () => {
    const es = new FakeEventSource();
    let count = 0;
    const { stopListening: stop1 } = addTypedDataEventListener<
      CustomEvent["connected"]
    >(es as unknown as EventSource, "connected", () => {
      count++;
    });
    const { stopListening: stop2 } = addTypedDataEventListener<
      CustomEvent["connected"]
    >(es as unknown as EventSource, "connected", () => {
      count++;
    });
    es.emit<CustomEvent["connected"]>("connected", { id: "multi" });
    expect(count).toBe(2);
    stop1();
    stop2();
  });
});
