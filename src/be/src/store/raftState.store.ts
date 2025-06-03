import {
  initializeAsLeader,
  requestMembership,
} from "@/services/membership.services";

type NodeType = "leader" | "follower" | "candidate";
// type ElectionStatus = "noelection" | "notvoted" | "voted";

interface RaftState {
  address: string;
  type: NodeType;
  log: [];
  electionTerm: number;
  clusterAddrList: string[];
  clusterLeaderAddr: string;
  nodeId: number;
  lastHeartbeatTimestamp: number;
  peers: string[];
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
    cluterLeaderAddr: raftStateStore.clusterLeaderAddr,
    nodeId: raftStateStore.nodeId,
    lastHeartbeatTimestamp: raftStateStore.lastHeartbeatTimestamp,
    peers: raftStateStore.peers,
  });
}

export default raftStateStore;
