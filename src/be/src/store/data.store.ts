import type { LogEntry } from "@/store/raftState.store";
import raftStateStore from "@/store/raftState.store";

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
}

export default dataStore;
