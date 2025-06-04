import type { LogEntry, Snapshot } from "@/store/raftState.store";
import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";
import { saveSnapshotToFile } from "@/utils/snapshot";

const dataStore = new Map<string, string>();

export function applyToStateMachine(entry: LogEntry) {
  const { command } = entry;

  if (command.type === "set") {
    const { key, value } = command.params;
    dataStore.set(key, value);
    console.log(
      `[${raftStateStore.address}] State machine applied: set ${key} = ${value}`
    );
  } else if (command.type === "del") {
    const { key } = command.params;
    const value = dataStore.get(key);
    dataStore.delete(key);
    console.log(
      `[${raftStateStore.address}] State machine applied: del ${key} -> ${value}`
    );
  } else if (command.type === "append") {
    const { key, value } = command.params;
    const current = dataStore.get(key) || "";
    const newValue = current + value;
    dataStore.set(key, newValue);
    console.log(
      `[${raftStateStore.address}] State machine applied: append ${key} += ${value}`
    );
  } else {
    console.warn(
      `[${raftStateStore.address}] Unknown command/command is read-only: ${JSON.stringify(command)}`
    );
  }

  if (
    RaftConfig.logCompaction.enabled &&
    raftStateStore.log.length >= RaftConfig.logCompaction.threshold
  ) {
    saveSnapshot();
    if (raftStateStore.type === "leader") {
      saveSnapshotToFile(raftStateStore.snapshot!);
    }
  }
}

export function saveSnapshot() {
  raftStateStore.snapshot = {
    data: new Map(dataStore),
    timestamp: Date.now(),
    lastIncludedIndex: raftStateStore.lastIncludedIndex,
    lastIncludedTerm: raftStateStore.lastIncludedTerm,
  };

  raftStateStore.log = raftStateStore.log.filter(
    (entry) => entry.index > raftStateStore.commitIndex
  );
  raftStateStore.lastIncludedIndex = raftStateStore.commitIndex;
  raftStateStore.lastIncludedTerm =
    raftStateStore.log[raftStateStore.commitIndex]?.term || 0;

  raftStateStore.snapshot.lastIncludedIndex = raftStateStore.lastIncludedIndex;
  raftStateStore.snapshot.lastIncludedTerm = raftStateStore.lastIncludedTerm;

  console.log(
    `[${raftStateStore.address}] Snapshot updated: ${JSON.stringify({
      ...raftStateStore.snapshot,
      data: mapToObject(raftStateStore.snapshot.data),
    })}`
  );
}

export const applySnapshot = (snapshot: Snapshot) => {
  dataStore.clear();

  const mapData =
    snapshot.data instanceof Map
      ? snapshot.data
      : (new Map(Object.entries(snapshot.data)) as Map<string, string>);

  mapData.forEach((value, key) => {
    dataStore.set(key, value);
  });

  raftStateStore.snapshot = {
    ...snapshot,
    data: mapData,
  };
};

function mapToObject(map: Map<string, string>): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

export default dataStore;
