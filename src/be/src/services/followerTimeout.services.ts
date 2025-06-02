import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";

const TIMEOUT_THRESHOLD = RaftConfig.heartBeat.timeout;
const CHECK_INTERVAL = RaftConfig.heartBeat.checkInterval;

let timeoutIntervalId: NodeJS.Timeout | null = null;

export const startFollowerTimeoutChecker = () => {
  if (raftStateStore.type !== "follower") return;

  if (timeoutIntervalId) {
    clearInterval(timeoutIntervalId);
  }

  timeoutIntervalId = setInterval(() => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - raftStateStore.lastHeartbeatTimestamp;

    if (timeSinceLastHeartbeat > TIMEOUT_THRESHOLD) {
      console.log("❗ Leader is dead or unresponsive. Starting election...");
      clearInterval(timeoutIntervalId!);
    }
  }, CHECK_INTERVAL);
};
