import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";

const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  setInterval(async () => {
    const peers = raftStateStore.peers;
    const clients = peers.map(createJsonRpcClient);

    let total = peers.length;
    let acked = 0;

    await Promise.all(
      clients.map(async (client, i) => {
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
          const result = await client.request("appendEntries", payload);
          if (result.success) {
            acked++;
          }
        } catch (error) {
          console.error(`Failed to send heartbeat to ${peers[i]}:`, error);
        }
      })
    );

    console.log(`💓 Heartbeats: ${acked}/${total} ACKed`);
  }, HEARTBEAT_INTERVAL);
};
