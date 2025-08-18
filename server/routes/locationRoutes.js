const express = require("express");
const {
  createLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  updateLocation,
} = require("../controllers/locationController.js");
const userAuth = require("../middlewares/auth.js");
const locationRouter = express.Router();

locationRouter.get("/", getLocations); // Get all locations
locationRouter.get("/:id", getLocationById); // GET single location with services
locationRouter.post("/", userAuth, createLocation); // POST create location
locationRouter.put("/:id", userAuth, updateLocation); // PUT update location
locationRouter.delete("/:id", userAuth, deleteLocation); // DELETE location (soft delete - set isActive to false)

module.exports = locationRouter;
