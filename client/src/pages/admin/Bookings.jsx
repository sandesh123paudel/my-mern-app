import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const AdminBookings = () => {
  const { backendUrl } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, confirmed, pending, cancelled, completed
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/bookings");
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/admin/bookings/${bookingId}/status`,
        {
          status,
        }
      );
      if (data.success) {
        toast.success("Booking status updated successfully");
        fetchBookings();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;

    try {
      const { data } = await axios.delete(
        backendUrl + `/api/admin/bookings/${bookingId}`
      );
      if (data.success) {
        toast.success("Booking deleted successfully");
        fetchBookings();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const getFilteredBookings = () => {
    let filtered = bookings.filter((booking) => {
      const matchesStatus = filter === "all" || booking.status === filter;
      const matchesSearch =
        booking.customerName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.customerEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.customerPhone?.includes(searchTerm) ||
        booking.eventType?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (dateFilter !== "all" && booking.eventDate) {
        const eventDate = new Date(booking.eventDate);
        const today = new Date();
        const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const oneMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        switch (dateFilter) {
          case "today":
            matchesDate = eventDate.toDateString() === today.toDateString();
            break;
          case "week":
            matchesDate = eventDate >= today && eventDate <= oneWeek;
            break;
          case "month":
            matchesDate = eventDate >= today && eventDate <= oneMonth;
            break;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });

    return filtered.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return <InlineLoading message="Loading bookings..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-800">
          Bookings Management
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600">
            Total: {bookings.length} bookings
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add Booking
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-600">Pending</p>
              <p className="text-2xl font-bold text-amber-800">
                {bookings.filter((b) => b.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-800">
                {bookings.filter((b) => b.status === "confirmed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎉</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Completed</p>
              <p className="text-2xl font-bold text-blue-800">
                {bookings.filter((b) => b.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">❌</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-800">
                {bookings.filter((b) => b.status === "cancelled").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone, or event type..."
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800">
            Bookings ({filteredBookings.length})
          </h2>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-amber-600">
            <p className="text-lg">No bookings found</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Bookings will appear here when customers make reservations"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-amber-800">
                        {booking.customerName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          booking.status || "pending"
                        )}`}
                      >
                        {booking.status || "pending"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {booking.customerEmail}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{" "}
                          {booking.customerPhone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p>
                          <span className="font-medium">Event:</span>{" "}
                          {booking.eventType || "Not specified"}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {booking.eventDate
                            ? new Date(booking.eventDate).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p>
                          <span className="font-medium">Guests:</span>{" "}
                          {booking.guestCount || "Not specified"}
                        </p>
                        <p>
                          <span className="font-medium">Amount:</span> $
                          {booking.totalAmount || "0"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Booked:{" "}
                      {new Date(
                        booking.createdAt || Date.now()
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
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

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-4">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Name
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.customerName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.customerEmail}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Phone
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.customerPhone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Status
                    </label>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        selectedBooking.status || "pending"
                      )}`}
                    >
                      {selectedBooking.status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-4">
                  Event Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Event Type
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.eventType || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Event Date
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.eventDate
                        ? new Date(
                            selectedBooking.eventDate
                          ).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Event Time
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.eventTime || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Number of Guests
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.guestCount || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Location
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.location || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Setup Time
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.setupTime || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-4">
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Catering
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.catering || "Not included"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Photography
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.photography || "Not included"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Decorations
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.decorations || "Not included"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Entertainment
                    </label>
                    <p className="text-gray-900">
                      {selectedBooking.entertainment || "Not included"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-4">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Base Price
                    </label>
                    <p className="text-gray-900">
                      ${selectedBooking.basePrice || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Service Charges
                    </label>
                    <p className="text-gray-900">
                      ${selectedBooking.serviceCharges || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Taxes
                    </label>
                    <p className="text-gray-900">
                      ${selectedBooking.taxes || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 font-bold">
                      Total Amount
                    </label>
                    <p className="text-2xl font-bold text-green-700">
                      ${selectedBooking.totalAmount || "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Additional Notes
                </label>
                <p className="text-gray-900 bg-gray-100 p-4 rounded-lg border border-gray-200">
                  {selectedBooking.additionalNotes ||
                    "No additional notes provided."}
                </p>
              </div>

              {/* Admin Actions */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => deleteBooking(selectedBooking._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
                {selectedBooking.status !== "confirmed" && (
                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking._id, "confirmed")
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Confirm Booking
                  </button>
                )}
                {selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking._id, "cancelled")
                    }
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    Cancel Booking
                  </button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking._id, "completed")
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal (Placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-amber-800">
                Add New Booking
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-center text-gray-600">
              <p>This is a placeholder for the "Add Booking" functionality.</p>
              <p>
                You would implement a form here to create a new booking
                manually.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
