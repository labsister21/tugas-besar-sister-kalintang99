import {
  initializeAsLeader,
  requestMembership,
  initializeAsClusterMemberStart,
} from "@/services/membership.services";
import { startFollowerTimeoutChecker } from "@/services/followerTimeout.services";

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
  lastIncludedIndex: number;
  lastIncludedTerm: number;
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
  lastIncludedIndex: -1,
  lastIncludedTerm: 0,
  snapshot: null,
  votedFor: null,
};

export async function initRaftState(args: any) {
  const nodeId = args.id || new Date().getTime() % 1000;

  if (!process.env.MY_ADDR) {
    throw new Error("MY_ADDR environment variable is not set");
  }
  const address = process.env.MY_ADDR;

  raftStateStore.nodeId = nodeId;
  raftStateStore.address = address;
  raftStateStore.clusterLeaderAddr = args.contactAddress;

  if (!process.env.CLUSTER_ADDRS) {
    console.log("Server initialized as standalone node.");

    if (args.contactAddress) {
      requestMembership();
    } else {
      initializeAsLeader();
    }
  } else {
    console.log(
      "Server intialized with cluster addresses:",
      process.env.CLUSTER_ADDRS
    );

    await initializeAsClusterMemberStart();
    const clusterAddrList = process.env.CLUSTER_ADDRS.split(",").map((s) =>
      s.trim()
    );
    raftStateStore.clusterAddrList = clusterAddrList;
    raftStateStore.peers = clusterAddrList.filter((addr) => addr !== address);
    raftStateStore.clusterLeaderAddr = "";
    raftStateStore.type = "follower";

    startFollowerTimeoutChecker();
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
    lastIncludedIndex: raftStateStore.lastIncludedIndex,
    lastIncludedTerm: raftStateStore.lastIncludedTerm,
  });
}

export default raftStateStore;
