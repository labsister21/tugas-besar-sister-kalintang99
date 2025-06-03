import { Request, Response } from "express";
import dataStore from "@/store/data.store";
import { appendAndBroadcastLogs } from "@/services/logs.service";
import { LogEntry } from "@/store/raftState.store";
import raftStateStore from "@/store/raftState.store";

export const ping = async (_req: Request, res: Response) => {
  res.status(200).json({ message: "PONG" });

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "ping",
      params: {},
    },
  } as LogEntry);
};

export const get = async (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key);

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "get",
      params: { key },
    },
  } as LogEntry);

  res.status(200).json({ value });
};

export const set = async (req: Request, res: Response) => {
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
  } as LogEntry);

  res.status(200).json({ message: "OK" });
};

export const strln = async (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key) || "";

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "strln",
      params: { key },
    },
  } as LogEntry);

  res.status(200).json({ length: value.length });
};

export const del = async (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key);

  await appendAndBroadcastLogs({
    term: raftStateStore.electionTerm,
    command: {
      type: "del",
      params: { key, value: "" },
    },
  } as LogEntry);

  res.status(200).json({ value });
};

export const append = async (req: Request, res: Response) => {
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
  } as LogEntry);

  res.status(200).json({ message: "OK" });
};
