import express from "express";
import {
  ping,
  get,
  set,
  strln,
  del,
  append,
} from "@/controllers/command.controller";

const router = express.Router();

router.get("/ping", ping);
router.get("/get/:key", get);
router.post("/set", set);
router.get("/strln/:key", strln);
router.delete("/del/:key", del);
router.post("/append", append);

export default router;
