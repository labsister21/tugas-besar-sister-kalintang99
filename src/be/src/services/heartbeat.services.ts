import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";

const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;
const HEARTBEAT_TIMEOUT = RaftConfig.heartBeat.sendTimeout;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  const sendHeartbeat = async () => {
    const peers = raftStateStore.peers;
    const lastLogIndex =
      raftStateStore.log[raftStateStore.log.length - 1]?.index || -1;
    const prevLogTerm =
      lastLogIndex >= 0 ? raftStateStore.log[lastLogIndex].term : 0;

    const payload = {
      term: raftStateStore.electionTerm,
      leaderId: raftStateStore.nodeId,
      prevLogIndex: lastLogIndex,
      prevLogTerm: prevLogTerm,
      entries: [],
      leaderCommit: raftStateStore.commitIndex,
    };

    let acked = 0;

    await Promise.allSettled(
      peers.map(async (address) => {
        const client = createJsonRpcClient(address);

        // console.log(`💓 Sending heartbeat to ${address}...`);

        try {
          const result = await Promise.race([
            client.request("appendEntries", payload),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), HEARTBEAT_TIMEOUT)
            ),
          ]);

          if (result.success) {
            acked++;
          }
        } catch (error) {
          // console.error(`❌ Heartbeat to ${address} failed:`, error);
        }
      })
    );

    console.log(`💓 Heartbeats: ${acked}/${peers.length} ACKed`);

    setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL);
  };

  sendHeartbeat();
};
