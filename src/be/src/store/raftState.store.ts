import {
  initializeAsLeader,
  requestMembership,
} from "@/services/membership.services";

type NodeType = "leader" | "follower" | "candidate";

export interface LogEntry {
  index: number;
  term: number;
  command: {
    type: string;
    params: { key: string; value: string };
  };
}

export interface Snapshot {
  data: Map<string, string>;
  timestamp: number;
}

interface RaftState {
  votedFor: string | null;
  address: string;
  type: NodeType;
  log: LogEntry[];
  electionTerm: number;
  clusterAddrList: string[];
  clusterLeaderAddr: string;
  nodeId: number;
  lastHeartbeatTimestamp: number;
  peers: string[];
  commitIndex: number;
  lastApplied: number;

  // log compaction semoga tidak error
  lastIncludedIndex: number;
  lastIncludedTerm: number;
  snapshot: Snapshot | null;
}

const raftStateStore: RaftState = {
  address: "",
  type: "follower",
  log: [],
  electionTerm: 0,
  clusterAddrList: [],
  clusterLeaderAddr: "",
  nodeId: 0,
  lastHeartbeatTimestamp: Date.now(),
  peers: [],
  commitIndex: -1,
  lastApplied: -1,

  // log compaction
  lastIncludedIndex: -1,
  lastIncludedTerm: 0,
  snapshot: null,
  votedFor: null,
};

export function initRaftState(args: any) {
  const nodeId = args.id || new Date().getTime() % 1000;
  const address = `http://backend${nodeId}:${args.port}`;

  raftStateStore.nodeId = nodeId;
  raftStateStore.address = address;

  const contactAddress = args.contactAddress;
  raftStateStore.clusterLeaderAddr = contactAddress;

  if (args.contactAddress) {
    requestMembership();
  } else {
    initializeAsLeader();
  }
}

export function printRaftState() {
  console.log({
    address: raftStateStore.address,
    type: raftStateStore.type,
    log: raftStateStore.log,
    electionTerm: raftStateStore.electionTerm,
    clusterAddrList: raftStateStore.clusterAddrList,
    clusterLeaderAddr: raftStateStore.clusterLeaderAddr,
    nodeId: raftStateStore.nodeId,
    lastHeartbeatTimestamp: raftStateStore.lastHeartbeatTimestamp,
    peers: raftStateStore.peers,
    commitIndex: raftStateStore.commitIndex,
    lastApplied: raftStateStore.lastApplied,
  });
}

export default raftStateStore;
