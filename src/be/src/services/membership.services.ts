import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore, { printRaftState } from "@/store/raftState.store";
import { startFollowerTimeoutChecker } from "./followerTimeout.services";
import { startHeartbeat } from "./heartbeat.services";
import { delay } from "@/utils/utils";

export const requestMembership = async () => {
  if (raftStateStore.type !== "follower") return;

  const client = createJsonRpcClient(raftStateStore.clusterLeaderAddr);

  try {
    console.log("Requesting membership from leader...");
    const result = await client.request("requestMembership", {
      nodeId: raftStateStore.nodeId,
      address: raftStateStore.address,
    });

    if (result.success) {
      console.log("Successfully joined the cluster!");
      initializeAsFollower(result);
    } else {
      console.error("Failed to join the cluster:", result.error);
      raftStateStore.clusterLeaderAddr = result.clusterLeaderAddr;
      await delay(1000);
      requestMembership();
    }
  } catch (error) {
    console.error("Unexpected error while requesting membership:", error);
    await delay(1000);
    requestMembership();
  }
};

export const updateClusterMembers = (newMemberAddress: string) => {
  if (!raftStateStore.clusterAddrList.includes(newMemberAddress)) {
    raftStateStore.clusterAddrList.push(newMemberAddress);
    raftStateStore.peers.push(newMemberAddress);
    console.log("Updated cluster members:", raftStateStore.clusterAddrList);
  }
};

export const broadcastNewMember = async (newMemberAddress: string) => {
  if (raftStateStore.type !== "leader") return;

  const peers = raftStateStore.peers;
  const clients = peers.map(createJsonRpcClient);

  clients.forEach(async (client, i) => {
    try {
      console.log(`Broadcasting new member to ${peers[i]}...`);
      await client.request("updateClusterMembers", {
        newMemberAddress,
      });
    } catch (error) {
      console.error(`Failed to broadcast to ${peers[i]}:`, error);
    }
  });
};

export const initializeAsLeader = () => {
  raftStateStore.type = "leader";
  raftStateStore.clusterAddrList = [raftStateStore.address];
  raftStateStore.peers = [];
  raftStateStore.clusterLeaderAddr = raftStateStore.address;

  console.log("Initialized as leader with address:", raftStateStore.address);

  printRaftState();
  startHeartbeat();
};

export const initializeAsFollower = (data: {
  log: [];
  electionTerm: number;
  clusterAddrList: string[];
  clusterLeaderAddr: string;
}) => {
  raftStateStore.type = "follower";
  raftStateStore.log = data.log;
  raftStateStore.electionTerm = data.electionTerm;
  raftStateStore.clusterAddrList = data.clusterAddrList;
  raftStateStore.clusterLeaderAddr = data.clusterLeaderAddr;
  raftStateStore.peers = data.clusterAddrList.filter(
    (addr) => addr !== raftStateStore.address
  );

  console.log("Initialized as follower with address:", raftStateStore.address);

  printRaftState();
  startFollowerTimeoutChecker();
};
