const { RSocketConnector } = require("rsocket-core");
const { WebsocketClientTransport } = require("rsocket-websocket-client");
const WebSocket = require("ws");
const { exit } = require("process");
const { setInterval } = require("timers/promises");

function makeConnector() {
  return new RSocketConnector({
    setup: {
      keepAlive: 1_000_000,
      lifetime: 100_000,
      dataMimeType: "application/json",
      metadataMimeType: "message/x.rsocket.routing.v0",
    },
    transport: new WebsocketClientTransport({
      url: "ws://localhost:7000",
      wsCreator: (url) => new WebSocket(url),
    }),
  });
}

function now() {
  return new Date().getTime();
}

async function main() {
  const connector = makeConnector();
  const rsocket = await connector.connect();

  await new Promise((resolve, reject) =>
    rsocket.requestResponse(
      {
        data: Buffer.from('{"origin":"Client-js","interaction":"Request"}'),
      },
      {
        onError: (e) => reject(e),
        onNext: (payload, isComplete) => {
          console.log(`payload[data: ${payload.data}; metadata: ${payload.metadata}]|${isComplete}`);
          resolve(payload);
        },
        onComplete: () => {
          resolve(null);
        },
        onExtension: () => {},
      }
    )
  );
}

Promise.resolve(main()).then(
  () => process.exit(0),
  (error) => {
    console.error(error.stack);
    process.exit(1);
  }
);
