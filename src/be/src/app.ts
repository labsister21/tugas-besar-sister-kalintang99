import express from "express";
import cors from "cors";
import routes from "@/routes/api.routes";
import raftStateStore, {
  initRaftState,
  printRaftState,
} from "@/store/raftState.store";
import { startHeartbeat } from "@/services/heartbeat.services";
import { startFollowerTimeoutChecker } from "@/services/followerTimeout.services";

const app = express();
const args = require("minimist")(process.argv.slice(2));

initRaftState(args);
printRaftState();

app.use(express.json());
app.use(cors());
app.use("/", routes);

if (raftStateStore.type === "leader") {
  startHeartbeat();
} else {
  startFollowerTimeoutChecker();
}

export default app;
