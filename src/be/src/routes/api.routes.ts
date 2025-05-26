import express from "express";
import commandRoutes from "@/routes/command.routes";
import storeRoutes from "@/routes/store.routes";

const routes = express.Router();

// Health check route
routes.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Terminal command routes
routes.use("/commands", commandRoutes);

// Store data routes
routes.use("/store", storeRoutes);

// Catch-all route for undefined endpoints
routes.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default routes;
