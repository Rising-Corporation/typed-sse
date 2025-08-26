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

> ⚠️ **Warning:**  
> The naming convention for this library is not yet finalized and may change between versions. **Do not use it in production environments until the first LTS release!**
>
> 🚧 The beta version is under active development.

`typed-sse` is a TypeScript library that provides a robust, type-safe wrapper for the native `EventSource` API. It enables you to handle server-sent events (SSE) with strict type checking, ensuring that event payloads match your expected types. This helps catch errors at compile time and makes your SSE code safer, more maintainable, and easier to refactor.

## Features

- **Type-safe event handling**: Define your event map interface and get compile-time safety for all event payloads.
- **Flexible event mapping**: Supports custom event types and payloads, including nested objects and arrays.
- **Automatic JSON parsing**: Event data is parsed and validated before reaching your handler.
- **Retry logic**: TypedEventSource supports configurable automatic reconnection with exponential backoff.
- **Works in browser and Node.js**: Use the native EventSource or provide a polyfill for Node environments.

## Two Ways to Use

You can use `typed-sse` in two ways:

1. **With the classic EventSource API** for minimal changes to your existing code, using `addTypedDataEventListener` for type-safe listeners.
2. **With the custom TypedEventSource class** for a streamlined, type-safe experience and advanced features.

### Method 1: Classic EventSource (with type-safe listeners)

Use the standard `EventSource` and add type-safe event listeners with `addTypedDataEventListener`. This lets you keep your existing code style while gaining type safety for event payloads.

```typescript
import { addTypedDataEventListener } from "typed-sse";

interface ConnectedData {
  id: number;
  text: string;
}

const eventSource = new EventSource("/api/stream");

// using a simple data structure as type
const connectedListener = addTypedDataEventListener<ConnectedData>(
  eventSource,
  "connected",
  (data) => {
    console.log("Connection text:", data.text);
  }
);

// To stop listening:
connectedListener.stopListening();
eventSource.close();
```

### Method 2: TypedEventSource (recommended)

Use the `TypedEventSource` class for a fully type-safe, ergonomic SSE experience. It supports automatic JSON parsing, retry logic, and easy listener management.

```typescript
import { TypedEventSource } from "typed-sse";

interface CustomData {
  text: string;
  foo: { title: string; description: string; id: number };
  bar: { list: number[]; id: number; name: string };
}

interface MyEvents {
  connected: { id: string };
  message: { text: string };
  custom: CustomData;
}

//simple :
const typedEventSource = new TypedEventSource<MyEvents>("/path/to/stream"});


const connectedListener = typedEventSource.on("connected", (data) => {
  console.log("Connection id:", data.id);
});

const customListener = typedEventSource.on("custom", (data) => {
  console.log("Custom bar list:", data.bar.list);
});

// To stop listening:
connectedListener.stopListening();
customListener.stopListening();
typedEventSource.close();



//or with options... :
/*

const sse = new TypedEventSource<MyEvents>("/path/to/stream", {
  withCredentials: true,
  retry: { base: 1000, max: 30000 },
});

*/
```

## API Reference

### TypedEventSource

- `constructor(url: string, opts?: CreateOptions, ES?: EventSourceConstructor)`
- `.on(eventName, handler)` — Add a type-safe listener for an event.
- `.close()` — Close the connection and stop all listeners.
- `.current` — Get the current EventSource instance (or null).

### addTypedDataEventListener

- `addTypedDataEventListener<T>(eventSource, eventName, handler, errorHandler?)` — Add a type-safe listener to an existing EventSource.

## 👨‍💻 Author

MrRise@RisingCorporation  
Made with ❤️ and Bun 🐇
