type NodeStatus = "leader" | "follower" | "candidate";

interface RaftState {
  nodeId: string;
  status: NodeStatus;
  peers: string[];
  lastHeartbeatTimestamp: number;
}

const raftStateStore: RaftState = {
  nodeId: "unknown",
  status: "follower",
  peers: [],
  lastHeartbeatTimestamp: Date.now(),
};

export default raftStateStore;
