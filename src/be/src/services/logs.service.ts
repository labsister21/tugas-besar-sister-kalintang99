import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { applyToStateMachine } from "@/store/data.store";
import type { LogEntry } from "@/store/raftState.store";

export const appendAndBroadcastLogs = async (
  entry: Omit<LogEntry, "index">
) => {
  if (raftStateStore.type !== "leader") return;

  const lastLogIndex =
    raftStateStore.log.length > 0
      ? raftStateStore.log[raftStateStore.log.length - 1].index
      : -1;

  const indexedEntry: LogEntry = {
    ...entry,
    index: lastLogIndex + 1,
  };

  raftStateStore.log.push(indexedEntry);
  const newIndex = indexedEntry.index;

  const prevLogIndex = newIndex - 1;
  const prevLogTerm =
    prevLogIndex >= 0 ? raftStateStore.log[prevLogIndex].term : 0;

  const payload = {
    term: raftStateStore.electionTerm,
    leaderId: raftStateStore.nodeId,
    prevLogIndex: prevLogIndex,
    prevLogTerm: prevLogTerm,
    entries: [indexedEntry],
    leaderCommit: raftStateStore.commitIndex,
  };

  const clients = raftStateStore.peers.map(createJsonRpcClient);
  const majority = Math.floor((raftStateStore.peers.length + 1) / 2) + 1;
  let successCount = 1;

  const promises = clients.map(async (client) => {
    try {
      const result = await client.request("appendEntries", payload);
      return result.success;
    } catch {
      return false;
    }
  });

  await new Promise<void>((resolve) => {
    promises.forEach(async (p) => {
      const success = await p;
      if (success) {
        successCount++;
        if (successCount === majority) {
          console.log("Majority acknowledged new entry, committing...");
          raftStateStore.commitIndex = newIndex;
          applyCommittedEntries();
          resolve();
        }
      }
    });
  });
};

export const applyCommittedEntries = () => {
  while (raftStateStore.lastApplied < raftStateStore.commitIndex) {
    raftStateStore.lastApplied++;
    const entry = raftStateStore.log[raftStateStore.lastApplied];
    applyToStateMachine(entry);
  }
};
