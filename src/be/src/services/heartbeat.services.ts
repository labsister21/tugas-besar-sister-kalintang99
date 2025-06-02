import { JSONRPCClient } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";
const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  const peers = raftStateStore.clusterAddrList.filter(
    (peer) => peer !== raftStateStore.address
  );

  const clients = peers.map((peer, i) => {
    const client = new JSONRPCClient((jsonRPCRequest) =>
      fetch(`${peer}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonRPCRequest),
      })
        .then((response) => response.json())
        .then((responseJson) => {
          client.receive(responseJson);
        })
        .catch((err) => {})
    );
    return client;
  });

  setInterval(() => {
    clients.forEach(async (client, i) => {
      console.log(`💓 Sending heartbeat to ${peers[i]}...`);
      const result = await client.request("heartbeat", {
        leaderId: raftStateStore.nodeId,
      });
      console.log(`✅ ACK from ${peers[i]}:`, result);
    });
  }, HEARTBEAT_INTERVAL);
};
