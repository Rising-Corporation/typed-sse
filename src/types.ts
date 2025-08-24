/**
 * Type for a handler function that receives parsed data of type T.
 */
export type TypedHandler<T> = (data: T) => void;

/**
 * Mapping between SSE event names and their expected payload types.
 *
 * @example
 * interface Events {
 *   connected: { id: string };
 *   message: { text: string };
 * }
 */
export type TypedEventMap = Record<string, unknown>;

/**
 * Options for creating a typed EventSource, including retry configuration.
 */
export interface CreateOptions extends EventSourceInit {
  /** Auto-retry with exponential backoff (ms): [base, max]. Pass null to disable. */
  retry?: { base?: number; max?: number } | null;
}

/** Constructeur compatible EventSource */
/**
 * Constructor type compatible with EventSource and polyfills.
 */
export interface EventSourceCtor {
  new (url: string, init?: EventSourceInit): EventSource;
}

/**
 * Parses a MessageEvent's data as JSON, or returns the data as-is if not a string.
 * Returns null if parsing fails.
 */
export function parseEvent<T>(event: MessageEvent): T | null {
  try {
    return typeof event.data === "string"
      ? (JSON.parse(event.data) as T)
      : (event.data as T);
  } catch {
    return null;
  }
}
