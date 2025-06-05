import raftStateStore from "@/store/raftState.store";
import { createJsonRpcClient } from "@/utils/utils";
import { startHeartbeat } from "./heartbeat.services";

export const startElection = async () => {
  raftStateStore.type = "candidate";
  raftStateStore.electionTerm += 1;
  raftStateStore.votedFor = raftStateStore.address.toString();

  const votes = new Set([raftStateStore.address.toString()]);
  const majority = Math.floor((raftStateStore.peers.length + 1) / 2) + 1;

  const lastLog = raftStateStore.log[raftStateStore.log.length - 1];

  const lastLogIndex = lastLog ? lastLog.index : -1;
  const lastLogTerm = lastLog ? lastLog.term : 0;

  await Promise.allSettled(
    raftStateStore.peers.map(async (peer) => {
      const client = createJsonRpcClient(peer);
      try {
        const result = await client.request("requestVote", {
          term: raftStateStore.electionTerm,
          candidateId: raftStateStore.address.toString(),
          lastLogIndex,
          lastLogTerm,
        });
        if (result.success) {
          votes.add(peer);
        }
      } catch (e) {
        // console.error(`❌ Election to ${peer} failed:`, e);
      }
    })
  );

  if (votes.size >= majority) {
    raftStateStore.type = "leader";
    console.log("Elected as leader for term", raftStateStore.electionTerm);
    startHeartbeat();
  } else {
    raftStateStore.type = "follower";
  }
};
