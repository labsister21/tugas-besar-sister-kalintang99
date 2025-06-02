// import { JSONRPCClient } from "json-rpc-2.0";
import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";

const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  setInterval(() => {
    const peers = raftStateStore.peers;
    const clients = peers.map(createJsonRpcClient);

    clients.forEach(async (client, i) => {
      console.log(`💓 Sending heartbeat to ${peers[i]}...`);
      const result = await client.request("heartbeat", {
        leaderId: raftStateStore.nodeId,
      });
      console.log(`✅ ACK from ${peers[i]}:`, result);
    });
  }, HEARTBEAT_INTERVAL);
};
