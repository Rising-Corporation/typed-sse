# typed-sse

`typed-sse` is a TypeScript wrapper for the native `EventSource` API, designed to simplify working with server-sent events (SSE). It allows you to read event data directly with automatic type checking, ensuring that the payloads match your expected types. This helps catch errors at compile time and makes your SSE code safer and easier to maintain.

```ts
import { typedEventSource } from "typed-sse";

interface ConnectionData {
  connection_id: string;
}
interface MessageEventPayload {
  /* ... */
}

const sse = typedEventSource("/api/events/stream", {
  withCredentials: true,
  retry: { base: 500, max: 30000 },
});

const connectedEvent = sse.on<ConnectionData>("connected", (d) => {
  console.log("connected:", d.connection_id);
});

const messageEvent = sse.on<MessageEventPayload>("message", (d) => {
  // ...
});

// cleanup
connectedEvent.stopListening();
messageEvent.stopListening();
sse.close();
```

```ts
import { addTypedEventListener } from "typed-sse";

interface ConnectionData {
  connection_id: string;
}

const es = new EventSource("/api/events/stream");

const myEvent = addTypedEventListener<ConnectionData>(
  es,
  "connected",
  (data) => {
    console.log("id:", data.connection_id);
  }
);

myEvent.stopListening();
es.close();
```
