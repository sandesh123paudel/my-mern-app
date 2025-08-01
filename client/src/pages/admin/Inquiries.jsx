import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const AdminInquiries = () => {
  const { backendUrl } = useContext(AppContext);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, responded, archived
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/inquiries");
      if (data.success) {
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to load inquiries");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/admin/inquiries/${inquiryId}/status`,
        {
          status,
        }
      );
      if (data.success) {
        toast.success("Status updated successfully");
        fetchInquiries();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      toast.error("Failed to update status");
    }
  };

  const deleteInquiry = async (inquiryId) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?"))
      return;

    try {
      const { data } = await axios.delete(
        backendUrl + `/api/admin/inquiries/${inquiryId}`
      );
      if (data.success) {
        toast.success("Inquiry deleted successfully");
        fetchInquiries();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry");
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesFilter = filter === "all" || inquiry.status === filter;
    const matchesSearch =
      inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.phone?.includes(searchTerm) ||
      inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  if (loading) {
    return <InlineLoading message="Loading inquiries..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-800">
          Inquiries Management
        </h1>
        <div className="text-sm text-amber-600">
          Total: {inquiries.length} inquiries
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800">
            {filter === "all"
              ? "All Inquiries"
              : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Inquiries`}
            ({filteredInquiries.length})
          </h2>
        </div>

        {filteredInquiries.length === 0 ? (
          <div className="p-8 text-center text-amber-600">
            <p className="text-lg">No inquiries found</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Inquiries will appear here when customers contact you"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-amber-800">
                        {inquiry.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          inquiry.status || "pending"
                        )}`}
                      >
                        {inquiry.status || "pending"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {inquiry.email}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {inquiry.phone || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium">Event Date:</span>{" "}
                        {inquiry.eventDate
                          ? new Date(inquiry.eventDate).toLocaleDateString()
                          : "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Guests:</span>{" "}
                        {inquiry.guestCount || "Not specified"}
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Message:</span>{" "}
                        {inquiry.message?.substring(0, 150)}
                        {inquiry.message?.length > 150 && "..."}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Received:{" "}
                      {new Date(
                        inquiry.createdAt || Date.now()
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setShowModal(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Inquiry Details */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Inquiry Details</h2>
                <button
                  onClick={() => setShowModal(false)}
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
                  <p className="text-gray-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Email
                  </label>
                  <p className="text-gray-900">{selectedInquiry.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {selectedInquiry.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Event Date
                  </label>
                  <p className="text-gray-900">
                    {selectedInquiry.eventDate
                      ? new Date(selectedInquiry.eventDate).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Guest Count
                  </label>
                  <p className="text-gray-900">
                    {selectedInquiry.guestCount || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Status
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedInquiry.status || "pending"
                    )}`}
                  >
                    {selectedInquiry.status || "pending"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Message
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>
                  Received:{" "}
                  {new Date(
                    selectedInquiry.createdAt || Date.now()
                  ).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    updateInquiryStatus(selectedInquiry._id, "responded")
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Responded
                </button>
                <button
                  onClick={() =>
                    updateInquiryStatus(selectedInquiry._id, "pending")
                  }
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Mark as Pending
                </button>
                <button
                  onClick={() =>
                    updateInquiryStatus(selectedInquiry._id, "archived")
                  }
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={() => deleteInquiry(selectedInquiry._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
