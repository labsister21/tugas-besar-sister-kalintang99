import express from "express";
import { handleRpc } from "@/controllers/rpc.controller";

const router = express.Router();

router.post("/", handleRpc);

export default router;
