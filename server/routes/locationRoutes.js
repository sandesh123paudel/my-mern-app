import express from "express";
import {
  createLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  updateLocation,
} from "../controllers/locationController.js";
const locationRouter = express.Router();

locationRouter.get("/", getLocations); // Get all locations
locationRouter.get("/:id", getLocationById); // GET single location with services
locationRouter.post("/", createLocation); // POST create location
locationRouter.put("/:id", updateLocation); // PUT update location
locationRouter.delete("/:id", deleteLocation); // DELETE location (soft delete - set isActive to false)

export default locationRouter;
