import express from "express";
import cors from "cors";
import routes from "@/routes/api.routes";
import raftStateStore from "@/store/raftState.store";
import { startHeartbeat } from "@/services/heartbeat.services";
import { startFollowerTimeoutChecker } from "@/services/followerTimeout.services";

const app = express();
const args = require("minimist")(process.argv.slice(2));

const nodeId = args.id || "unknown";
const peers = args.peers ? args.peers.split(",") : [];

raftStateStore.nodeId = nodeId;
raftStateStore.peers = peers;
raftStateStore.status = nodeId === 1 ? "leader" : "follower";

console.log(`Node ID: ${raftStateStore.nodeId}`);
console.log(`Peers: ${raftStateStore.peers.join(", ") || "None"}`);
console.log(`Status: ${raftStateStore.status}`);

app.use(express.json());
app.use(cors());
app.use("/", routes);

if (raftStateStore.status === "leader") {
  startHeartbeat();
} else {
  startFollowerTimeoutChecker();
}

export default app;
