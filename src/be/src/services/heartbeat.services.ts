import raftStateStore from "@/store/raftState.store";

const HEARTBEAT_INTERVAL = 10000; // 10 seconds

export const startHeartbeat = () => {
  if (raftStateStore.status !== "leader") return;

  setInterval(() => {
    raftStateStore.peers.forEach(async (peer) => {
      try {
        console.log(`💓 Sending heartbeat to ${peer}...`);
        const res = await fetch(`${peer}/rpc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "heartbeat",
            params: {
              leaderId: raftStateStore.nodeId,
            },
            id: Date.now(),
          }),
        });

        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }

        const data = await res.json();
        console.log(`✅ ACK from ${peer}:`, data);
      } catch (err) {
        if (err instanceof Error) {
          console.log(`❌ Heartbeat failed to ${peer}:`, err.message);
        } else {
          console.log(`❌ Heartbeat failed to ${peer}:`, err);
        }
      }
    });
  }, HEARTBEAT_INTERVAL);
};
