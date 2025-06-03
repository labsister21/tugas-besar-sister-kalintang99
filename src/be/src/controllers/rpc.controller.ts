import { Request, Response } from "express";
import { JSONRPCServer } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";
import {
  updateClusterMembers,
  broadcastNewMember,
} from "@/services/membership.services";

const jsonRpcServer = new JSONRPCServer();

jsonRpcServer.addMethod("heartbeat", (params: { leaderId: string }) => {
  console.log(`💓 Received heartbeat from leader ${params.leaderId}`);
  raftStateStore.lastHeartbeatTimestamp = Date.now();
  return "OK";
});

jsonRpcServer.addMethod(
  "requestMembership",
  (params: { nodeId: number; address: string }) => {
    if (raftStateStore.type !== "leader") {
      return {
        success: false,
        clusterLeaderAddr: raftStateStore.clusterLeaderAddr,
        error: `Not a leader node, please contact the leader at ${raftStateStore.clusterLeaderAddr}`,
      };
    }

    console.log(`📝 New node requesting membership: ${params.address}`);

    updateClusterMembers(params.address);
    broadcastNewMember(params.address);

    return {
      success: true,
      log: raftStateStore.log,
      electionTerm: raftStateStore.electionTerm,
      clusterAddrList: raftStateStore.clusterAddrList,
      clusterLeaderAddr: raftStateStore.clusterLeaderAddr,
    };
  }
);

jsonRpcServer.addMethod(
  "updateClusterMembers",
  (params: { newMemberAddress: string }) => {
    console.log(
      `📝 Updating cluster members with new member: ${params.newMemberAddress}`
    );
    updateClusterMembers(params.newMemberAddress);
    return { success: true };
  }
);

export const handleRpc = async (req: Request, res: Response) => {
  const jsonRPCRequest = req.body;
  const jsonRPCResponse = await jsonRpcServer.receive(jsonRPCRequest);

  if (jsonRPCResponse) {
    res.json(jsonRPCResponse);
  } else {
    res.sendStatus(204);
  }
};
