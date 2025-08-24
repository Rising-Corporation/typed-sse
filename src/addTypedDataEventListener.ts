import { parseEvent } from "./types";
import type { TypedHandler, TypedEventMap } from "./types";

export function addTypedDataEventListener<
  Events extends TypedEventMap,
  K extends keyof Events
>(
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
  type: K,
  handler: TypedHandler<Events[K]>
): { stopListening: () => void } {
  const wrapped = (event: Event) => {
    const data = parseEvent<Events[K]>(event as MessageEvent);
    if (data != null) handler(data);
  };
  es.addEventListener(type as string, wrapped);

  return {
    stopListening: () => es.removeEventListener(type as string, wrapped),
  };
}
