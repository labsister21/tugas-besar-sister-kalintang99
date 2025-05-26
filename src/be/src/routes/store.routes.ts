import express from "express";
import { getAllData } from "@/controllers/store.controller";

const router = express.Router();

router.get("/", getAllData);

export default router;
