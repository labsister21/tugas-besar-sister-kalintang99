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
  } else {
    console.warn(`⚠️ Unknown command type: ${command}`);
  }
}

export default dataStore;
