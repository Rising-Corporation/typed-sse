# typed-sse

![npm](https://img.shields.io/npm/v/typed-sse?logo=npm&color=orange)
![npm dependencies](https://img.shields.io/librariesio/release/npm/typed-sse?logo=npm)
![npm downloads](https://img.shields.io/npm/dw/typed-sse?logo=npm)

![GitHub](https://img.shields.io/github/stars/Rising-Corporation/typed-sse?style=social&logo=github)
![GitHub forks](https://img.shields.io/github/forks/Rising-Corporation/typed-sse?style=social&logo=github)
![GitHub issues](https://img.shields.io/github/issues/Rising-Corporation/typed-sse?logo=github)
![CI](https://github.com/Rising-Corporation/typed-sse/actions/workflows/ci.yml/badge.svg)

![status](https://img.shields.io/badge/status-beta-orange)
![license](https://img.shields.io/github/license/Rising-Corporation/typed-sse?logo=open-source-initiative&logoColor=white)

<!-- [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg?logo=conventionalcommits)](https://www.conventionalcommits.org/en/v1.0.0/) -->

`typed-sse` is a TypeScript wrapper for the native `EventSource` API, designed to simplify working with server-sent events (SSE). It allows you to read event data directly with automatic type checking, ensuring that the payloads match your expected types. This helps catch errors at compile time and makes your SSE code safer and easier to maintain.

## Two Ways to Use

You can use `typed-sse` in two ways:

1. With the classic `EventSource` API for minimal changes to your existing code.
2. With the custom `typedEventSource` for a more streamlined and type-safe experience.

### Method 1: Classic EventSource

Use the standard `EventSource` and enhance it with type-safe event listeners using `addTypedDataEventListener`.

- This implementation offers a type-safe approach to handling EventSource events. If you prefer to keep using the standard EventSource class for clearer code readability, you can use the `addTypedDataEventListener` function. It takes a regular EventSource instance and allows you to access event payloads in a type-safe way.

```ts
import { addTypedDataEventListener } from "typed-sse";

interface Events {
  connected: { connection_id: string };
}

const es = new EventSource("/api/events/stream");

const connected = addTypedDataEventListener<Events>(es, "connected", (data) => {
  console.log("id:", data.connection_id);
});

connected.stopListening();
es.close();
```

### Method 2: typedEventSource

- Use the `typedEventSource` function for a more streamlined and type-safe experience. This approach provides a convenient API for subscribing to events with automatic type checking.

```ts
import { typedEventSource } from "typed-sse";

interface ConnectionData {
  custom_data_id: string;
  custom_data_number: number;
  custom_data_status: boolean;
}
interface MessageEventPayload {
  /* ... */
}

interface Events {
  custom: ConnectionData;
  message: MessageEventPayload;
}

const tes = typedEventSource<Events>("/api/events/stream", {
  withCredentials: true,
  retry: { base: 500, max: 30000 },
});

const customEvent = tes.on("custom", (data) => {
  console.log("Received 'custom' event with parsed and typed data:", data);
  console.log(
    `You can directly access typed payload properties: data.connection_id: ${data.custom_data_id} , custom_data_number : ${data.custom_data_number}, etc ... `
  );
});

const messageEvent = tes.on("message", (data) => {
  // ...
});

// cleanup
customEvent.stopListening();
messageEvent.stopListening();
tes.close();
```

## 👨‍💻 Author

MrRise@RisingCorporation  
Made with ❤️ and Bun 🐇
