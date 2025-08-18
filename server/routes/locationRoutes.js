const express = require("express");
const {
  createLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  updateLocation,
  updateLocationBankDetails,
  getLocationBankDetails,
  getLocationsWithBankDetailsStatus,
} = require("../controllers/locationController.js");
const userAuth = require("../middlewares/auth.js");
const locationRouter = express.Router();

// Public routes
locationRouter.get("/", getLocations); // Get all locations
locationRouter.get("/:id", getLocationById); // GET single location with services

// Admin routes for location management
locationRouter.post("/", userAuth, createLocation); // POST create location
locationRouter.put("/:id", userAuth, updateLocation); // PUT update location
locationRouter.delete("/:id", userAuth, deleteLocation); // DELETE location (soft delete - set isActive to false)

// Bank details specific routes
locationRouter.get(
  "/admin/with-bank-status",
  userAuth,
  getLocationsWithBankDetailsStatus
); // GET all locations with bank details status
locationRouter.get("/:id/bank-details", userAuth, getLocationBankDetails); // GET bank details for specific location
locationRouter.patch("/:id/bank-details", userAuth, updateLocationBankDetails); // PATCH update bank details only

module.exports = locationRouter;
