import { Request, Response } from "express";
import dataStore from "@/store/data.store";

export const getAllData = (_req: Request, res: Response) => {
  const data = {
    numberOfKeys: dataStore.size,
    data: Object.fromEntries(dataStore),
  };
  res.status(200).json(data);
};
