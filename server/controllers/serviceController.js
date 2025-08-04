import Service from "../models/ServiceModel";

export const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .populate("locationId", "name city")
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServicesByLocation = async (req, res) => {
  const { locationId } = req.params.id;
  if (!locationId) {
    return res.json({ success: false, message: "Location ID Not Found" });
  }
};
