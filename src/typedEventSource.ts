import {
  parseEvent,
  type EventSourceCtor,
  type CreateOptions,
  type TypedHandler,
  type TypedEventMap,
} from "./types";

function getDefaultCtor(): EventSourceCtor | undefined {
  // DOM: présent en navigateur; Node: souvent undefined
  return (globalThis as any).EventSource as EventSourceCtor | undefined;
}

export function typedEventSource<
  Events extends TypedEventMap = TypedEventMap
>(
  url: string,
  opts: CreateOptions = {},
  ES: EventSourceCtor | undefined = getDefaultCtor()
) {
  /**
   * Creates a typed EventSource with auto-reconnect and typed event listeners.
   * Supports environments without native EventSource by allowing a custom constructor.
   *
   * @param url - The SSE endpoint URL.
   * @param opts - Options for retry and credentials.
   * @param ES - Optional EventSource constructor (for polyfills).
   * @throws If EventSource is not available in the environment.
   */
  if (!ES) {
    throw new Error(
      "EventSource is not available in this environment. " +
        "Provide a constructor (e.g., from the 'eventsource' polyfill) as the 3rd argument."
    );
  }

  let es: EventSource | null = null;
  let closed = false;
  let attempt = 0;
  // Use defaults only when retry is undefined; allow null to disable retries
  const retryCfg =
    opts.retry === undefined ? { base: 500, max: 30_000 } : opts.retry;
  const listeners = new Map<string, Set<(e: MessageEvent) => void>>();

  const addRaw = (type: string, fn: (e: MessageEvent) => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(fn);
    es?.addEventListener(type, fn as EventListener);
  };

  const removeRaw = (type: string, fn: (e: MessageEvent) => void) => {
    listeners.get(type)?.delete(fn);
    es?.removeEventListener(type, fn as EventListener);
  };

  const attachAll = () => {
    for (const [type, set] of listeners.entries()) {
      for (const fn of set) es?.addEventListener(type, fn as EventListener);
    }
  };

  const connect = () => {
    if (closed) return;
    es = new ES!(url, opts); // <- plus d’erreur de signature

    attempt = 0;

    es.onopen = () => {
      attempt = 0;
    };

    es.onerror = () => {
      es?.close();
      es = null;
      if (closed || !retryCfg) return;
      attempt++;
      const backoff = Math.min(
        (retryCfg.base ?? 500) * Math.pow(2, attempt - 1),
        retryCfg.max ?? 30_000
      );
      setTimeout(connect, backoff);
    };

    attachAll();
  };

  connect();

  return {
    on<K extends keyof Events>(
      type: K,
      handler: TypedHandler<Events[K]>
    ): { stopListening: () => void } {
      const wrapped = (ev: MessageEvent) => {
        const data = parseEvent<Events[K]>(ev);
        if (data != null) handler(data);
      };
      addRaw(type as string, wrapped);
      return {
        stopListening: () => removeRaw(type as string, wrapped),
      };
    },
    close() {
      closed = true;
      es?.close();
      es = null;
    },
    get current(): EventSource | null {
      return es;
    },
  };
}
