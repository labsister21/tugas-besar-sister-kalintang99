import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";
import { startFollowerTimeoutChecker } from "./followerTimeout.services";

const HEARTBEAT_INTERVAL = RaftConfig.heartBeat.sendInterval;
const HEARTBEAT_TIMEOUT = RaftConfig.heartBeat.sendTimeout;

let heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const startHeartbeat = () => {
  if (raftStateStore.type !== "leader") return;

  const sendHeartbeat = () => {
    if (raftStateStore.type !== "leader") {
      if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = null;
        startFollowerTimeoutChecker();
      }
      console.log("⛔ Stopping heartbeat: not the leader anymore.");
      return;
    }

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
      prevLogIndex,
      prevLogTerm,
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

        return result?.success === true;
      } catch {
        // console.log(`Heartbeat to ${address} failed or timed out.`);
        return false;
      }
    });

    heartbeatTimeoutId = setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL);

    Promise.allSettled(heartbeatPromises).then((results) => {
      const acked = results.filter(
        (r) => r.status === "fulfilled" && r.value === true
      ).length;
      console.log(`💓 Heartbeats: ${acked}/${peers.length} ACKed`);
    });
  };

  sendHeartbeat();
};
