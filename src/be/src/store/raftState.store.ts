type NodeType = "leader" | "follower" | "candidate";
type ElectionStatus = "noelection" | "notvoted" | "voted";

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

  if (args.isDynamic === "false") {
    const type = nodeId === 1 ? "leader" : "follower";

    raftStateStore.type = type;

    const peerList = args.peers ? args.peers.split(",") : [];
    raftStateStore.peers = peerList;
    raftStateStore.clusterAddrList = [...peerList, address];

    console.log("peers:", raftStateStore.peers);
    console.log("clusterAddrList:", raftStateStore.clusterAddrList);

    raftStateStore.clusterLeaderAddr = `http://backend1:3001`;
  } else {
    const leaderId = args.leader;
    const clusterLeaderAddr = `http://backend${leaderId}:300${leaderId}`;
    raftStateStore.clusterLeaderAddr = clusterLeaderAddr;
    raftStateStore.type = "follower";

    console.log(
      "Requesting membership with leader address:",
      clusterLeaderAddr
    );

    import("@/services/membership.services").then(({ requestMembership }) => {
      requestMembership();
    });
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
