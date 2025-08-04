import express from "express";
import {
  createLocation,
  getLocationById,
  getLocations,
  updateLocation,
} from "../controllers/locationController";
const locationRouter = express.Router();

locationRouter.get("/", getLocations); // Get all locations
locationRouter.get("/location/:id", getLocationById); // GET single location with services
locationRouter.post("/", createLocation); // POST create location
locationRouter.put("/location:id", updateLocation); // PUT update location
locationRouter.delete("/location:id", updateLocation); // DELETE location (soft delete - set isActive to false)

export default locationRouter;
