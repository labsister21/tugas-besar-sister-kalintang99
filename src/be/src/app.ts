import express from "express";
import cors from "cors";
import routes from "@/routes/api.routes";
import { initRaftState } from "@/store/raftState.store";

const app = express();
const args = require("minimist")(process.argv.slice(2));

initRaftState(args);

app.use(express.json());
app.use(cors());
app.use("/", routes);

export default app;
