import { Request, Response } from "express";
import dataStore from "@/store/data.store";

export const ping = (_req: Request, res: Response) => {
  res.status(200).json({ message: "PONG" });
};

export const get = (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key);
  res.status(200).json({ value });
};

export const set = (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (typeof key !== "string" || typeof value !== "string") {
    res.status(400).json({ error: "Invalid key or value" });
    return;
  }
  dataStore.set(key, value);
  res.status(200).json({ message: "OK" });
};

export const strln = (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key) || "";
  res.status(200).json({ length: value.length });
};

export const del = (req: Request, res: Response) => {
  const key = req.params.key;
  const value = dataStore.get(key);
  dataStore.delete(key);
  res.status(200).json({ value });
};

export const append = (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (typeof key !== "string" || typeof value !== "string") {
    res.status(400).json({ error: "Invalid key or value" });
    return;
  }
  const existing = dataStore.get(key) || "";
  dataStore.set(key, existing + value);
  res.status(200).json({ message: "OK" });
};
