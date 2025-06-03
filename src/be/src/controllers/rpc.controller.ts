import { Request, Response } from "express";
import { JSONRPCServer } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";
import {
  updateClusterMembers,
  broadcastNewMember,
} from "@/services/membership.services";
import { applyToStateMachine } from "@/store/data.store";
import { applyCommittedEntries } from "@/services/logs.service";
import type { LogEntry } from "@/store/raftState.store";

const jsonRpcServer = new JSONRPCServer();

jsonRpcServer.addMethod(
  "appendEntries",
  (params: {
    term: number;
    leaderId: string;
    prevLogIndex: number;
    prevLogTerm: number;
    entries: LogEntry[];
    leaderCommit: number;
  }) => {
    if (params.term < raftStateStore.electionTerm) {
      return { success: false, term: raftStateStore.electionTerm };
    }

    // update heartbeat timout
    raftStateStore.electionTerm = params.term;
    raftStateStore.clusterLeaderAddr = params.leaderId;
    raftStateStore.lastHeartbeatTimestamp = Date.now();

    if (params.prevLogIndex >= 0) {
      const prevLog = raftStateStore.log[params.prevLogIndex];
      if (!prevLog || prevLog.term !== params.prevLogTerm) {
        return { success: false, term: raftStateStore.electionTerm };
      }
    }

    // rpc add log entry
    if (params.entries.length > 0) {
      const index = params.prevLogIndex + 1;
      const newEntry = params.entries[0];

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

    // commit entries kalau leaderCommit lebih besar dari commitIndex
    if (
      params.entries.length === 0 &&
      params.leaderCommit > raftStateStore.commitIndex
    ) {
      raftStateStore.commitIndex = Math.min(
        params.leaderCommit,
        raftStateStore.log.length - 1
      );
      applyCommittedEntries();
    }

    return { success: true, term: raftStateStore.electionTerm };
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
