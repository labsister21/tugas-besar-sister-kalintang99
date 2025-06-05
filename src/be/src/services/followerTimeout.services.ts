import raftStateStore from "@/store/raftState.store";
import { RaftConfig } from "@/config/config";
import { randomInt } from "crypto";
import { startElection } from "./election.services";

const CHECK_INTERVAL = RaftConfig.heartBeat.checkInterval;

let timeoutIntervalId: NodeJS.Timeout | null = null;

export const startFollowerTimeoutChecker = () => {
  if (raftStateStore.type !== "follower") return;

  if (timeoutIntervalId) {
    clearInterval(timeoutIntervalId);
  }

  const TIMEOUT_THRESHOLD = randomInt(
    RaftConfig.heartBeat.min_timeout,
    RaftConfig.heartBeat.max_timeout
  );

  timeoutIntervalId = setInterval(() => {
    if (raftStateStore.type !== "follower") {
      console.log(
        "Follower timeout checker stopped because node is no longer a follower."
      );
      clearInterval(timeoutIntervalId!);
      return;
    }

    const now = Date.now();
    const timeSinceLastHeartbeat = now - raftStateStore.lastHeartbeatTimestamp;

    if (timeSinceLastHeartbeat > TIMEOUT_THRESHOLD) {
      console.log(
        `⏰ Follower timeout detected! Last heartbeat was ${timeSinceLastHeartbeat}ms ago, exceeding threshold of ${TIMEOUT_THRESHOLD}ms.`
      );
      console.log("❗ Leader is dead or unresponsive. Starting election...");
      if (!raftStateStore.votedFor) {
        console.log(
          `[${raftStateStore.address}] Starting election due to follower timeout.`
        );
        startElection();
      }
      //clearInterval(timeoutIntervalId!);
    }
  }, CHECK_INTERVAL);
};
