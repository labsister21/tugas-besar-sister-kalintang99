import raftStateStore from "@/store/raftState.store";

const TIMEOUT_THRESHOLD = 800;
const CHECK_INTERVAL = 100;

export const startFollowerTimeoutChecker = () => {
  if (raftStateStore.status !== "follower") return;

  setInterval(() => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - raftStateStore.lastHeartbeatTimestamp;

    if (timeSinceLastHeartbeat > TIMEOUT_THRESHOLD) {
      console.log("❗ Leader is dead or unresponsive.");
    }
  }, CHECK_INTERVAL);
};
