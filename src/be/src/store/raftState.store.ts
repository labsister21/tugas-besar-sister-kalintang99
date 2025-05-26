type NodeStatus = "leader" | "follower" | "candidate";

interface RaftState {
  nodeId: string;
  status: NodeStatus;
  peers: string[];
}

const raftStateStore: RaftState = {
  nodeId: "unknown",
  status: "follower",
  peers: [],
};

export default raftStateStore;
