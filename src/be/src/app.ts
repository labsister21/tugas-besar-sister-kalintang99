import express from "express";
import cors from "cors";
import routes from "@/routes/api.routes";
import raftStateStore from "@/store/raftState.store";

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

export default app;
