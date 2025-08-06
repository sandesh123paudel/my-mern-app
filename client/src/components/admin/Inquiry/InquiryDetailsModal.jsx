import React from "react";
import toast from "react-hot-toast";
import {
  updateInquiryStatus,
  deleteInquiry,
} from "../../../services/inquiryService";

const InquiryDetailsModal = ({ isOpen, inquiry, onClose, onUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "responded":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const result = await updateInquiryStatus(inquiry._id, status);
      if (result.success) {
        toast.success("Status updated successfully");
        onUpdate();
        onClose();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this inquiry?"))
      return;

    try {
      const result = await deleteInquiry(inquiry._id);
      if (result.success) {
        toast.success("Inquiry deleted successfully");
        onUpdate();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete inquiry");
      }
    } catch (error) {
      toast.error("Failed to delete inquiry");
    }
  };

  if (!isOpen || !inquiry) return null;

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Inquiry Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Name
              </label>
              <p className="text-gray-900">{inquiry.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Email
              </label>
              <p className="text-gray-900">{inquiry.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Contact
              </label>
              <p className="text-gray-900">
                {inquiry.contact || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Event Date
              </label>
              <p className="text-gray-900">
                {inquiry.eventDate
                  ? new Date(inquiry.eventDate).toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Guest Count
              </label>
              <p className="text-gray-900">
                {inquiry.numberOfPeople || "Not specified"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Venue
              </label>
              <p className="text-gray-900">
                {inquiry.venue || "Not specified"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Service Type
              </label>
              <p className="text-gray-900">
                {inquiry.serviceType || "Not specified"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Status
              </label>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  inquiry.status || "pending"
                )}`}
              >
                {inquiry.status || "pending"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Message
            </label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">
                {inquiry.message || "No message provided"}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Received:{" "}
              {new Date(inquiry.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleStatusUpdate("responded")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark as Responded
            </button>
            <button
              onClick={() => handleStatusUpdate("pending")}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Mark as Pending
            </button>
            <button
              onClick={() => handleStatusUpdate("archived")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetailsModal;
