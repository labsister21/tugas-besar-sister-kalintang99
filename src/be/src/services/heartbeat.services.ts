import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";

const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;
const HEARTBEAT_TIMEOUT = RaftConfig.heartBeat.sendTimeout;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  const sendHeartbeat = () => {
    const peers = raftStateStore.peers;
    const prevLog = raftStateStore.log[raftStateStore.log.length - 1];
    const prevLogIndex = prevLog
      ? prevLog.index
      : raftStateStore.lastIncludedIndex;
    const prevLogTerm = prevLog
      ? prevLog.term
      : raftStateStore.lastIncludedTerm;

    const payload = {
      term: raftStateStore.electionTerm,
      leaderId: raftStateStore.nodeId,
      prevLogIndex: prevLogIndex,
      prevLogTerm: prevLogTerm,
      entries: [],
      leaderCommit: raftStateStore.commitIndex,
      leaderAddress: raftStateStore.address,
    };

    const heartbeatPromises = peers.map(async (address) => {
      const client = createJsonRpcClient(address);

      try {
        const result = await Promise.race([
          client.request("appendEntries", payload),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), HEARTBEAT_TIMEOUT)
          ),
        ]);

        if (result?.success) {
          return true;
        }
      } catch {
        console.log(`Heartbeat to ${address} failed or timed out.`);
      }

      return false;
    });

    setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL);

    Promise.allSettled(heartbeatPromises).then((results) => {
      const acked = results.filter(
        (r) => r.status === "fulfilled" && r.value === true
      ).length;
      console.log(`💓 Heartbeats: ${acked}/${peers.length} ACKed`);
    });
  };

  sendHeartbeat();
};
