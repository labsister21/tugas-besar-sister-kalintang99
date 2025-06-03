import { Request, Response } from "express";
import { JSONRPCServer } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";
import {
  updateClusterMembers,
  broadcastNewMember,
} from "@/services/membership.services";

const jsonRpcServer = new JSONRPCServer();

jsonRpcServer.addMethod(
  "appendEntries",
  (params: {
    term: number;
    leaderId: string;
    prevLogIndex: number;
    prevLogTerm: number;
    entries: any[];
    leaderCommit: number;
  }) => {
    if (params.term < raftStateStore.electionTerm) {
      return { success: false, term: raftStateStore.electionTerm };
    }

    raftStateStore.electionTerm = params.term;
    raftStateStore.clusterLeaderAddr = params.leaderId;
    raftStateStore.lastHeartbeatTimestamp = Date.now();

    if (params.prevLogIndex >= 0) {
      const prevLog = raftStateStore.log[params.prevLogIndex];
      if (!prevLog || prevLog.term !== params.prevLogTerm) {
        return { success: false, term: raftStateStore.electionTerm };
      }
    }

    for (let i = 0; i < params.entries.length; i++) {
      const index = params.prevLogIndex + 1 + i;
      const newEntry = params.entries[i];
      if (
        raftStateStore.log[index] &&
        raftStateStore.log[index].term !== newEntry.term
      ) {
        raftStateStore.log = raftStateStore.log.slice(0, index);
      }

      if (!raftStateStore.log[index]) {
        raftStateStore.log[index] = newEntry;
      }
    }

    if (params.leaderCommit > raftStateStore.commitIndex) {
      raftStateStore.commitIndex = Math.min(
        params.leaderCommit,
        raftStateStore.log.length - 1
      );
    }

    return {
      success: true,
      term: raftStateStore.electionTerm,
    };
  }
);

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
