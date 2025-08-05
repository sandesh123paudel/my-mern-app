import express from "express";
import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  getServicesByLocation,
  updateService,
} from "../controllers/serviceController.js";
import userAuth from "../middlewares/auth.js";

// You would import your authentication middleware here
// import { protect, admin } from "../middleware/authMiddleware.js";

const serviceRouter = express.Router();

// --- PUBLIC ROUTES ---

// GET /api/services -> Get all active services
serviceRouter.get("/", getServices);

// GET /api/services/location/:locationId -> Get active services for a specific location
serviceRouter.get("/location/:locationId", getServicesByLocation);

// GET /api/services/:id -> Get a single service by its ID
serviceRouter.get("/:id", getServiceById);

// --- PROTECTED/ADMIN ROUTES ---
// POST /api/services -> Create a new service
serviceRouter.post("/", userAuth, createService);

// PUT /api/services/:id -> Update a service
serviceRouter.put("/:id", userAuth, updateService);

// DELETE /api/services/:id -> Deactivate a service (soft delete)
serviceRouter.delete("/:id", userAuth, deleteService);

export default serviceRouter;
