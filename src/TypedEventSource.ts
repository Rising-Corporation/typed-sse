import {
  parseEvent,
  type EventSourceConstructor,
  type CreateOptions,
  type TypedHandler,
  type TypedEventMap,
} from "./types";

function getDefaultConstructor(): EventSourceConstructor | undefined {
  // DOM: present in browsers; Node: often undefined
  return globalThis.EventSource as EventSourceConstructor | undefined;
}

class TypedEventSource<Events extends TypedEventMap = TypedEventMap> {
  private es: EventSource | null = null;
  private closed = false;
  private attempt = 0;
  private readonly retryCfg: { base?: number; max?: number } | null;
  private readonly listeners = new Map<
    string,
    Set<(e: MessageEvent) => void>
  >();

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

  private addListener(type: string, fn: (e: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    this.es?.addEventListener(type, fn as EventListener);
  }

  private removeListener(type: string, fn: (e: MessageEvent) => void) {
    this.listeners.get(type)?.delete(fn);
    this.es?.removeEventListener(type, fn as EventListener);
  }

  private attachAll() {
    for (const [type, set] of this.listeners.entries()) {
      for (const fn of set)
        this.es?.addEventListener(type, fn as EventListener);
    }
  }

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

  close() {
    this.closed = true;
    this.es?.close();
    this.es = null;
  }

  get current(): EventSource | null {
    return this.es;
  }
}

export { TypedEventSource };
