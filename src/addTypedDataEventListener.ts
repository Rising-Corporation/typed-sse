import { parseEvent } from "./types";
import type { TypedHandler } from "./types";

export function addTypedDataEventListener<T>(
  /**
   * Adds a typed event listener to an EventSource instance.
   * The handler receives parsed JSON data of type T.
   * Returns an object with a stopListening method to remove the listener.
   *
   * @param es - The EventSource instance.
   * @param type - The event type to listen for.
   * @param handler - The callback to handle parsed data.
   */
  es: EventSource,
  type: string,
  handler: TypedHandler<T>
): { stopListening: () => void } {
  const wrapped = (event: Event) => {
    const data = parseEvent<T>(event as MessageEvent);
    if (data != null) handler(data);
  };
  es.addEventListener(type, wrapped);

  return { stopListening: () => es.removeEventListener(type, wrapped) };
}
