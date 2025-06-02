import { JSONRPCClient } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";

const HEARTBEAT_INTERVAL = 200;

export const startHeartbeat = () => {
  if (raftStateStore.status !== "leader") return;

  const clients = raftStateStore.peers.map(
    (peer) =>
      new JSONRPCClient((jsonRPCRequest) =>
        fetch(`${peer}/rpc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonRPCRequest),
        }).then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            return Promise.reject(new Error(`Status ${response.status}`));
          }
        })
      )
  );

  setInterval(() => {
    clients.forEach(async (client, i) => {
      try {
        console.log(`💓 Sending heartbeat to ${raftStateStore.peers[i]}...`);
        const result = await client.request("heartbeat", {
          leaderId: raftStateStore.nodeId,
        });
        console.log(`✅ ACK from ${raftStateStore.peers[i]}:`, result);
      } catch (err) {
        if (err instanceof Error) {
          console.log(
            `❌ Heartbeat failed to ${raftStateStore.peers[i]}:`,
            err.message
          );
        } else {
          console.log(
            `❌ Heartbeat failed to ${raftStateStore.peers[i]}:`,
            err
          );
        }
      }
    });
  }, HEARTBEAT_INTERVAL);
};
