import raftStateStore from "@/store/raftState.store";
import { createJsonRpcClient } from "@/utils/utils";

export const startElection = async () => {
  raftStateStore.type = "candidate";
  raftStateStore.electionTerm += 1;
  raftStateStore.votedFor = raftStateStore.nodeId.toString(); // Self Vote

  const votes = new Set([raftStateStore.nodeId.toString()]);
  const majority = Math.floor((raftStateStore.peers.length + 1) / 2) + 1;

  const lastLogIndex = raftStateStore.log.length - 1;
  const lastLogTerm = lastLogIndex >= 0 ? raftStateStore.log[lastLogIndex].term : 0;

  await Promise.allSettled(
    raftStateStore.peers.map(async (peer) => {
      const client = createJsonRpcClient(peer);
      try {
        const result = await client.request("requestVote", {
          term: raftStateStore.electionTerm,
          candidateId: raftStateStore.nodeId.toString(),
          lastLogIndex,
          lastLogTerm,
        });
        if (result.success) {
          votes.add(peer);
        }
      } catch (e) {
        console.error(`❌ Election to ${peer} failed:`, e);
      }
    })
  );

  if (votes.size >= majority) {
    raftStateStore.type = "leader";
    console.log("Elected as leader for term", raftStateStore.electionTerm);
  } else {
    raftStateStore.type = "follower";
  }
};