# typed-sse

![npm](https://img.shields.io/npm/v/typed-sse?logo=npm&color=orange)
![npm dependencies](https://img.shields.io/librariesio/release/npm/typed-sse?logo=npm)
![npm downloads](https://img.shields.io/npm/dw/typed-sse?logo=npm)

![GitHub](https://img.shields.io/github/stars/Rising-Corporation/typed-sse?style=social&logo=github)
![GitHub forks](https://img.shields.io/github/forks/Rising-Corporation/typed-sse?style=social&logo=github)
![GitHub issues](https://img.shields.io/github/issues/Rising-Corporation/typed-sse?logo=github)

![status](https://img.shields.io/badge/status-beta-orange)
![license](https://img.shields.io/github/license/Rising-Corporation/typed-sse?logo=open-source-initiative&logoColor=white)

<!-- [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg?logo=conventionalcommits)](https://www.conventionalcommits.org/en/v1.0.0/) -->

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
