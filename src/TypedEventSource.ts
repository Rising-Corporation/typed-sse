import {
  parseEvent,
  type EventSourceConstructor,
  type CreateOptions,
  type TypedHandler,
} from "./types";

/**
 * Returns the default EventSource constructor for the current environment.
 * In browsers, this is the native EventSource. In Node, you may need a polyfill.
 */
function getDefaultConstructor(): EventSourceConstructor | undefined {
  return globalThis.EventSource as EventSourceConstructor | undefined;
}

/**
 * TypedEventSource
 *
 * A strongly-typed wrapper for the EventSource API, enabling type-safe handling of server-sent events (SSE).
 * This class provides methods to listen to specific event types with typed payloads and manage the connection lifecycle.
 *
 * @template Events - An interface mapping event names to their payload types.
 *
 * @example
 * ```typescript
 * interface CustomData {
 *   text: string;
 *   foo: { title: string, description: string, id: number };
 *   bar: { list: [], id: number, name: string };
 * }
 *
 * interface MyEvents {
 *   connected: { id: string };
 *   message: { text: string };
 *   custom: CustomData;
 * }
 *
 * const sse = new TypedEventSource<MyEvents>("/api/stream");
 *
 * sse.on("connected", (data) => {
 *   console.log("Connection id:", data.id);
 * });
 *
 * sse.on("message", (data) => {
 *   console.log("Message text:", data.text);
 * });
 *
 * sse.on("custom", (data) => {
 *   console.log("Custom data.bar array:", data.bar.list);
 * });
 *
 * // To stop listening:
 * const connectedListener = sse.on("connected", handler);
 * connectedListener.stopListening();
 *
 * // To close the connection:
 * sse.close();
 * ```
 */
class TypedEventSource<Events> {
  private es: EventSource | null = null;
  private closed = false;
  private attempt = 0;
  private readonly retryCfg: { base?: number; max?: number } | null;
  private readonly listeners = new Map<
    string,
    Set<(e: MessageEvent) => void>
  >();

  /**
   * Creates a new TypedEventSource instance.
   *
   * @param url - The URL of the SSE endpoint.
   * @param opts - Optional configuration for retry, credentials, and other settings.
   * @param ES - Optional EventSource constructor (defaults to the global EventSource or a polyfill).
   * @throws Error - If EventSource is not available and no valid constructor is provided.
   *
   * @example
   * ```typescript
   * interface CustomData {
   *   text: string;
   *   foo: { title: string, description: string, id: number };
   *   bar: { list: [], id: number, name: string };
   * }
   *
   * interface MyEvents {
   *   connected: { id: string };
   *   message: { text: string };
   *   custom: CustomData;
   * }
   *
   * const sse = new TypedEventSource<MyEvents>("/api/stream");
   *
   * sse.on("connected", (data) => {
   *   console.log("Connection id:", data.id);
   * });
   *
   * sse.on("message", (data) => {
   *   console.log("Message text:", data.text);
   * });
   *
   * sse.on("custom", (data) => {
   *   console.log("Custom data.bar array:", data.bar.list);
   * });
   *
   * // To stop listening:
   * const connectedListener = sse.on("connected", handler);
   * connectedListener.stopListening();
   *
   * // To close the connection:
   * sse.close();
   * ```
   */
  constructor(
    private url: string,
    private opts: CreateOptions = {},
    ES: EventSourceConstructor | undefined = getDefaultConstructor()
  ) {
    if (!ES) {
      throw new Error(
        "EventSource is not available in this environment. " +
          "Provide a constructor (e.g., from the 'eventsource' polyfill) as the 3rd argument."
      );
    }

    this.ES = ES;
    this.retryCfg =
      opts.retry === undefined ? { base: 500, max: 30_000 } : opts.retry;

    this.connect();
  }

  private ES: EventSourceConstructor;

  /**
   * Adds a raw event listener for a given event type.
   * Used internally by the class.
   */
  private addListener(type: string, fn: (e: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    this.es?.addEventListener(type, fn as EventListener);
  }

  /**
   * Removes a raw event listener for a given event type.
   * Used internally by the class.
   */
  private removeListener(type: string, fn: (e: MessageEvent) => void) {
    this.listeners.get(type)?.delete(fn);
    this.es?.removeEventListener(type, fn as EventListener);
  }

  /**
   * Attaches all registered listeners to the current EventSource instance.
   */
  private attachAll() {
    for (const [type, set] of this.listeners.entries()) {
      for (const fn of set)
        this.es?.addEventListener(type, fn as EventListener);
    }
  }

  /**
   * Connects to the SSE endpoint and sets up automatic retry logic.
   */
  private connect() {
    if (this.closed) return;
    this.es = new this.ES(this.url, this.opts);

    this.attempt = 0;

    this.es.onopen = () => {
      this.attempt = 0;
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (this.closed || !this.retryCfg) return;
      this.attempt++;
      const backoff = Math.min(
        (this.retryCfg.base ?? 500) * Math.pow(2, this.attempt - 1),
        this.retryCfg.max ?? 30_000
      );
      setTimeout(() => this.connect(), backoff);
    };

    this.attachAll();
  }

  /**
   * Adds a typed event listener for a specific event type.
   * The handler receives the parsed and typed payload.
   *
   * @param type - The event name to listen for.
   * @param handler - The callback to handle the event payload.
   * @returns An object with a stopListening method to remove the listener.
   *
   * Example:
   *   sse.on("connected", (data) => { return data.id }); // or whatever you need
   */
  on<K extends keyof Events>(
    type: K,
    handler: TypedHandler<Events[K]>
  ): { stopListening: () => void } {
    const wrapped = (ev: MessageEvent) => {
      const data = parseEvent<Events[K]>(ev);
      if (data != null) handler(data);
    };
    this.addListener(type as string, wrapped);
    return {
      stopListening: () => this.removeListener(type as string, wrapped),
    };
  }

  /**
   * Closes the EventSource connection and prevents further reconnects.
   */
  close() {
    this.closed = true;
    this.es?.close();
    this.es = null;
  }

  /**
   * Returns the current EventSource instance, or null if not connected.
   */
  get current(): EventSource | null {
    return this.es;
  }
}

export { TypedEventSource };
