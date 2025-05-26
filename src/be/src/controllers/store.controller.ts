import { Request, Response } from "express";
import store from "@/store/store";

export const getAllData = (_req: Request, res: Response) => {
  const data = {
    numberOfKeys: store.size,
    data: Object.fromEntries(store),
  };
  res.status(200).json(data);
};
