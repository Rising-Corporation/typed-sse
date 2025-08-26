import { parseEvent, type TypedHandler } from "./types";

/**
 * Adds a type-safe event listener to an existing EventSource instance.
 * The listener parses the event data as JSON using `parseEvent` and passes the typed data to the provided handler.
 * Returns an object with a method to remove the listener.
 *
 * @template TypedData - The expected type of the parsed event data.
 * @param eventSource - The EventSource instance to attach the listener to.
 * @param eventName - The name of the event to listen for (e.g., "message", "connected").
 * @param handler - The callback function to handle the parsed data of type `TypedData`.
 * @param errorHandler - Optional callback function to handle errors that occur during event processing.
 * @returns An object containing a `stopListening` method to remove the event listener.
 * @throws Error - If the event data cannot be parsed as JSON, the error is logged to the console, and the handler is not called.
 *
 * @example
 * ```typescript
 * interface MyEventData {
 *   id: string;
 *   message: string;
 * }
 *
 * const es = new EventSource("/api/stream");
 * const listener = addTypedDataEventListener<MyEventData>(
 *   es,
 *   "message",
 *   (data) => {
 *     console.log("Received:", data.message); // Type-safe access to data.message
 *   }
 * );
 *
 * // To stop listening:
 * listener.stopListening();
 * ```
 */
export function addTypedDataEventListener<TypedData>(
  eventSource: EventSource,
  eventName: string,
  handler: TypedHandler<TypedData>,
  errorHandler?: (err: unknown, eventName?: string) => void
): { stopListening: () => void } {
  if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
    if (errorHandler) {
      errorHandler(new Error("EventSource is invalid or closed"), eventName);
    } else {
      throw new Error("EventSource is invalid or closed");
    }
  }

  const wrapped = (event: MessageEvent) => {
    try {
      const data = parseEvent<TypedData>(event);
      if (data != null) {
        handler(data);
      }
    } catch (err) {
      errorHandler?.(err, eventName);
      console.error(`Error parsing event "${eventName}":`, err);
    }
  };
  eventSource.addEventListener(eventName, wrapped);

  return {
    stopListening: () => eventSource.removeEventListener(eventName, wrapped),
  };
}
