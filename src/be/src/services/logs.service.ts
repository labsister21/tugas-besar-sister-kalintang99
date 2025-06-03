import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { applyToStateMachine } from "@/store/data.store";
import type { LogEntry } from "@/store/raftState.store";

export const appendAndBroadcastLogs = async (entry: LogEntry) => {
  if (raftStateStore.type !== "leader") return;

  raftStateStore.log.push(entry);
  const newIndex = raftStateStore.log.length - 1;

  const prevLogIndex = newIndex - 1;
  const prevLogTerm =
    prevLogIndex >= 0 ? raftStateStore.log[prevLogIndex].term : 0;

  const payload = {
    term: raftStateStore.electionTerm,
    leaderId: raftStateStore.nodeId,
    prevLogIndex,
    prevLogTerm,
    entries: [entry],
    leaderCommit: raftStateStore.commitIndex,
  };

  const clients = raftStateStore.peers.map(createJsonRpcClient);
  const majority = Math.floor((raftStateStore.peers.length + 1) / 2) + 1;
  let successCount = 1;

  for (let i = 0; i < clients.length; i++) {
    try {
      const result = await clients[i].request("appendEntries", payload);
      if (result.success) {
        successCount++;
      }
    } catch {}
  }

  if (successCount >= majority) {
    console.log("Majority acknowledged new entry, committing...");

    raftStateStore.commitIndex = newIndex;
    applyCommittedEntries();
  }
};

export const applyCommittedEntries = () => {
  while (raftStateStore.lastApplied < raftStateStore.commitIndex) {
    raftStateStore.lastApplied++;
    const entry = raftStateStore.log[raftStateStore.lastApplied];
    applyToStateMachine(entry);
  }
};
