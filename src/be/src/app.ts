import express from "express";
import cors from "cors";
import routes from "@/routes/api.routes";

const app = express();

const args = require("minimist")(process.argv.slice(2));

const nodeId = args.id || "unknown";
const peers = args.peers ? args.peers.split(",") : [];

console.log(`🆔 Node ID: ${nodeId}`);
console.log(`🔗 Peers: ${peers.join(", ") || "None"}`);

app.use(express.json());
app.use(cors());

app.use("/", routes);

app.locals.nodeId = nodeId;
app.locals.peers = peers;

export default app;
