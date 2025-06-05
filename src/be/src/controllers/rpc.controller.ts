import { Request, Response } from "express";
import { JSONRPCServer } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";
import {
  updateClusterMembers,
  broadcastNewMember,
  isAlreadyMember,
} from "@/services/membership.services";
import { applyCommittedEntries } from "@/services/logs.service";
import type { LogEntry } from "@/store/raftState.store";
import { snapshot } from "node:test";

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
    leaderAddress: string;
  }) => {
    if (params.term < raftStateStore.electionTerm) {
      return { success: false, term: raftStateStore.electionTerm };
    }

    // update heartbeat timout
    const now = Date.now();

    raftStateStore.electionTerm = params.term;
    raftStateStore.clusterLeaderAddr = params.leaderId;
    raftStateStore.lastHeartbeatTimestamp = now;

    const timeSinceLastHeartbeat = now - raftStateStore.lastHeartbeatTimestamp;

    // console.log(
    //   `[${raftStateStore.address}] Time since last heartbeat: ${timeSinceLastHeartbeat}ms`
    // );

    // refrest state saat new leader elected
    raftStateStore.clusterLeaderAddr = params.leaderAddress;
    raftStateStore.votedFor = null;

    if (params.prevLogIndex - (raftStateStore.lastIncludedIndex + 1) >= 0) {
      const prevLog =
        raftStateStore.log[
          params.prevLogIndex - (raftStateStore.lastIncludedIndex + 1)
        ];
      if (!prevLog || prevLog.term !== params.prevLogTerm) {
        // console.log(
        //   `❌ Log mismatch at index ${params.prevLogIndex}, expected term ${params.prevLogTerm}, got ${prevLog?.term}`
        // );
        // console.log(raftStateStore.log);
        return { success: false, term: raftStateStore.electionTerm };
      }
    }

    // rpc add log entry
    if (params.entries.length > 0) {
      const index = params.prevLogIndex + 1;
      const newEntry = params.entries[0];

      if (
        raftStateStore.log[index - (raftStateStore.lastIncludedIndex + 1)] &&
        raftStateStore.log[index - (raftStateStore.lastIncludedIndex + 1)]
          .term !== newEntry.term
      ) {
        raftStateStore.log = raftStateStore.log.slice(
          0,
          index - (raftStateStore.lastIncludedIndex + 1)
        );
      }

      if (!raftStateStore.log[index - (raftStateStore.lastIncludedIndex + 1)]) {
        // console.log("📝 Adding new log entry:", newEntry);
        raftStateStore.log[index - (raftStateStore.lastIncludedIndex + 1)] =
          newEntry;
      }
    }

    // commit entries kalau leaderCommit lebih besar dari commitIndex
    // console.log("leaderCommit:", params.leaderCommit);
    // console.log("my commitIndex:", raftStateStore.commitIndex);
    if (
      params.entries.length === 0 &&
      params.leaderCommit > raftStateStore.commitIndex
    ) {
      // console.log(
      //   `📝 Committing entries up to index ${params.leaderCommit} from index ${raftStateStore.commitIndex}`
      // );
      raftStateStore.commitIndex = Math.min(
        params.leaderCommit,
        raftStateStore.log[raftStateStore.log.length - 1].index
      );
      applyCommittedEntries();
    }

    // setTimeout(() => {
    //   if (raftStateStore.lastHeartbeatTimestamp !== now) {
    //     console.log(
    //       `🚨 TIMESTAMP OVERWRITTEN! Was ${now}, now ${raftStateStore.lastHeartbeatTimestamp}`
    //     );
    //     console.trace("Overwrite detected at:");
    //   }
    // }, 10);

    return { success: true, term: raftStateStore.electionTerm };
  }
);

jsonRpcServer.addMethod(
  "requestVote",
  (params: {
    term: number;
    candidateId: string;
    lastLogIndex: number;
    lastLogTerm: number;
  }) => {
    if (params.term < raftStateStore.electionTerm) {
      console.log(
        `❌ Vote request from ${params.candidateId} for term ${params.term} is outdated. Current term is ${raftStateStore.electionTerm}.`
      );
      return { success: false, term: raftStateStore.electionTerm };
    }

    if (params.term > raftStateStore.electionTerm) {
      raftStateStore.electionTerm = params.term;
      raftStateStore.votedFor = null;
    }

    const localLastLog = raftStateStore.log[raftStateStore.log.length - 1];

    const localLastLogIndex = localLastLog ? localLastLog.index : -1;
    const localLastLogTerm = localLastLog ? localLastLog.term : 0;

    const candidateLogUpToDate =
      params.lastLogTerm > localLastLogTerm ||
      (params.lastLogTerm === localLastLogTerm &&
        params.lastLogIndex >= localLastLogIndex);

    if (
      (raftStateStore.votedFor === null ||
        raftStateStore.votedFor === params.candidateId) &&
      candidateLogUpToDate
    ) {
      raftStateStore.votedFor = params.candidateId;
      return { success: true, term: raftStateStore.electionTerm };
    }

    console.log(
      `❌ Vote request from ${params.candidateId} denied. Current votedFor: ${raftStateStore.votedFor}, candidateLogUpToDate: ${candidateLogUpToDate}`
    );
    return { success: false, term: raftStateStore.electionTerm };
  }
);

jsonRpcServer.addMethod(
  "requestMembership",
  async (params: { nodeId: number; address: string }) => {
    if (raftStateStore.type !== "leader") {
      return {
        success: false,
        clusterLeaderAddr: raftStateStore.clusterLeaderAddr,
        error: `Not a leader node, please contact the leader at ${raftStateStore.clusterLeaderAddr}`,
      };
    }

    console.log(`📝 New node requesting membership: ${params.address}`);

    if (!isAlreadyMember(params.address)) {
      await broadcastNewMember(params.address);
      updateClusterMembers(params.address);
    } else {
      console.log(`Node ${params.address} is already a member.`);
    }

    return {
      success: true,
      log: raftStateStore.log,
      electionTerm: raftStateStore.electionTerm,
      clusterAddrList: raftStateStore.clusterAddrList,
      clusterLeaderAddr: raftStateStore.address,
      snapshot: {
        data: Object.fromEntries(raftStateStore.snapshot?.data ?? new Map()),
        timestamp: raftStateStore.snapshot?.timestamp ?? Date.now(),
      },
      lastIncludedIndex: raftStateStore.lastIncludedIndex,
      lastIncludedTerm: raftStateStore.lastIncludedTerm,
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
