import { Request, Response } from "express";
import dataStore from "@/store/data.store";
import { appendAndBroadcastLogs } from "@/services/logs.service";
import { LogEntry } from "@/store/raftState.store";
import raftStateStore from "@/store/raftState.store";

export const ping = async (_req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }

  res.status(200).json({ message: "PONG" });
};

export const get = async (req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }
  const key = req.params.key;
  const value = dataStore.get(key);

  res.status(200).json({ value });
};

export const set = async (req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }
  const { key, value } = req.body;
  if (typeof key !== "string" || typeof value !== "string") {
    res.status(400).json({ error: "Invalid key or value" });
    return;
  }

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "set",
      params: { key, value },
    },
  } as Omit<LogEntry, "index">);

  res.status(200).json({ message: "OK" });
};

export const strln = async (req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }
  const key = req.params.key;
  const value = dataStore.get(key) || "";

  res.status(200).json({ length: value.length });
};

export const del = async (req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }
  const key = req.params.key;
  const value = dataStore.get(key);

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "del",
      params: { key, value: "" },
    },
  } as Omit<LogEntry, "index">);

  res.status(200).json({ value });
};

export const append = async (req: Request, res: Response) => {
  if (raftStateStore.type !== "leader") {
    return res.status(403).json({
      error: "This node is not the leader.",
      leader: raftStateStore.clusterLeaderAddr,
    });
  }
  const { key, value } = req.body;
  if (typeof key !== "string" || typeof value !== "string") {
    res.status(400).json({ error: "Invalid key or value" });
    return;
  }

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "append",
      params: { key, value },
    },
  } as Omit<LogEntry, "index">);

  res.status(200).json({ message: "OK" });
};

// NOTE: Buat ini biar bisa cuman dari leader kalau pas kumpul nanti
export const requestLog = async (_req: Request, res: Response) => {
  const logs = raftStateStore.log.map((log) => ({
    index: log.index,
    term: log.term,
    command: log.command,
  }));

  res.status(200).send(logs);
};

export const requestStoredData = async (_req: Request, res: Response) => {
  const storedData = Array.from(dataStore.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  res.status(200).send(storedData);
};
