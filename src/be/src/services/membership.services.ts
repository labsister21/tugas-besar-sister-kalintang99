import { createJsonRpcClient } from "@/utils/utils";
import raftStateStore from "@/store/raftState.store";
import { startFollowerTimeoutChecker } from "./followerTimeout.services";
import { printRaftState } from "@/store/raftState.store";

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

      raftStateStore.log = result.log;
      raftStateStore.electionTerm = result.electionTerm;
      raftStateStore.clusterAddrList = result.clusterAddrList;
      raftStateStore.clusterLeaderAddr = result.clusterLeaderAddr;
      raftStateStore.peers = raftStateStore.clusterAddrList.filter(
        (addr) => addr !== raftStateStore.address
      );

      printRaftState();
      startFollowerTimeoutChecker();
    }
  } catch (error) {
    console.error("Failed to request membership:", error);
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
