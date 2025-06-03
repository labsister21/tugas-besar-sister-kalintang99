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
      const peerAddress = peers[i];
      const lastLogIndex = raftStateStore.log.length - 1;
      const prevLogIndex = lastLogIndex;
      const prevLogTerm =
        lastLogIndex >= 0 ? raftStateStore.log[lastLogIndex].term : 0;

      const payload = {
        term: raftStateStore.electionTerm,
        leaderId: raftStateStore.nodeId,
        prevLogIndex,
        prevLogTerm,
        entries: [],
        leaderCommit: raftStateStore.commitIndex,
      };

      try {
        console.log(`💓 Sending heartbeat to ${peerAddress}...`);
        const result = await client.request("appendEntries", payload);
        console.log(`✅ ACK from ${peerAddress}:`, result);
      } catch (err) {
        console.error(`❌ Failed to send heartbeat to ${peerAddress}:`, err);
      }
    });
  }, HEARTBEAT_INTERVAL);
};
