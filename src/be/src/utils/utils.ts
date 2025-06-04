import { JSONRPCClient } from "json-rpc-2.0";
import { LogEntry } from "@/store/raftState.store";

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
        // console.error("JSON-RPC request error:", err);
        throw new Error(`JSON-RPC request failed: ${err.message}`);
      })
  );
  return client;
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
