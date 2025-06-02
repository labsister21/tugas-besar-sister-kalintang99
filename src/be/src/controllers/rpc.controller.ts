import { Request, Response } from "express";
import { JSONRPCServer } from "json-rpc-2.0";
import raftStateStore from "@/store/raftState.store";

const jsonRpcServer = new JSONRPCServer();

jsonRpcServer.addMethod("heartbeat", (params: { leaderId: string }) => {
  console.log(`💓 Received heartbeat from leader ${params.leaderId}`);
  raftStateStore.lastHeartbeatTimestamp = Date.now();
  return "OK";
});

export const handleRpc = async (req: Request, res: Response) => {
  const jsonRpcResponse = await jsonRpcServer.receive(req.body);
  if (jsonRpcResponse) {
    res.json(jsonRpcResponse);
  } else {
    res.sendStatus(204);
  }
};
