import { JSONRPCClient } from "json-rpc-2.0";

export const createJsonRpcClient = (url: string) => {
  const client = new JSONRPCClient((jsonRPCRequest) =>
    fetch(`${url}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonRPCRequest),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        client.receive(responseJson);
      })
      .catch((err) => {
        console.error("JSON-RPC request error:", err);
      })
  );
  return client;
};
