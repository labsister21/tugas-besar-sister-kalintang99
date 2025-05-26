import { Request, Response } from "express";
import raftStateStore from "@/store/raftState.store";

export const handleRpc = (req: Request, res: Response) => {
  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== "2.0") {
    return res.status(400).json({ error: "Invalid JSON-RPC version" });
  }

  if (method === "heartbeat") {
    console.log(`💓 Received heartbeat from ${params.leaderId}`);
    return res.json({ jsonrpc: "2.0", result: "ACK", id });
  }

  return res.status(400).json({ error: `Unknown method ${method}` });
};
