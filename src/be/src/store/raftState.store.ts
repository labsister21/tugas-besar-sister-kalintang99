type NodeType = "leader" | "follower" | "candidate";
type ElectionStatus = "noelection" | "notvoted" | "voted";

interface RaftState {
  address: string;
  type: NodeType;
  log: [];
  electionTerm: number;
  clusterAddrList: string[];
  cluterLeaderAddr: string;

  nodeId: number;
  lastHeartbeatTimestamp: number;
}

const raftStateStore: RaftState = {
  address: "",
  type: "follower",
  log: [],
  electionTerm: 0,
  clusterAddrList: [],
  cluterLeaderAddr: "",
  nodeId: 0,
  lastHeartbeatTimestamp: Date.now(),
};

export function initRaftState(args: any) {
  const nodeId = args.id || new Date().getTime() % 1000;
  const address = `http://backend${nodeId}:${args.port}`;
  const type = nodeId === 1 ? "leader" : "follower";

  raftStateStore.nodeId = nodeId;
  raftStateStore.address = address;
  raftStateStore.type = type;
  raftStateStore.clusterAddrList = args.peers
    ? args.peers.split(",").concat(address)
    : [address];

  raftStateStore.cluterLeaderAddr = `http://backend1:3001`;
}

export function printRaftState() {
  console.log({
    address: raftStateStore.address,
    type: raftStateStore.type,
    log: raftStateStore.log,
    electionTerm: raftStateStore.electionTerm,
    clusterAddrList: raftStateStore.clusterAddrList,
    cluterLeaderAddr: raftStateStore.cluterLeaderAddr,
    nodeId: raftStateStore.nodeId,
    lastHeartbeatTimestamp: raftStateStore.lastHeartbeatTimestamp,
  });
}

export default raftStateStore;
