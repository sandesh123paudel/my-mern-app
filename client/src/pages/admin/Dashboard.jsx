import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import { getBookingStats, getAllBookings } from "../../services/bookingService";
import { getInquiries } from "../../services/inquiryService";
import { getLocationById } from "../../services/locationServices";
import { getServiceById } from "../../services/serviceServices";
import axios from "axios";

const AdminDashboard = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInquiries: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalPeople: 0,
    averageOrderValue: 0,
    customOrders: 0,
    regularOrders: 0,
    statusCounts: {},
    recentActivity: [],
    recentInquiries: [],
    popularItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month"); // week, month, year, all

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  // Helper function to resolve venue/service names
  const resolveInquiryNames = async (inquiries) => {
    try {
      const resolvedInquiries = await Promise.all(
        inquiries.map(async (inquiry) => {
          let venueName = "Unknown Venue";
          let serviceName = "Unknown Service";

          try {
            // Handle venue - check if already populated or needs fetching
            if (inquiry.venue) {
              if (typeof inquiry.venue === "object" && inquiry.venue.name) {
                venueName = inquiry.venue.name;
              } else {
                const venueResult = await getLocationById(inquiry.venue);
                if (venueResult.success && venueResult.data) {
                  venueName = venueResult.data.name;
                }
              }
            }

            // Handle service - check if already populated or needs fetching
            if (inquiry.serviceType) {
              if (
                typeof inquiry.serviceType === "object" &&
                inquiry.serviceType.name
              ) {
                serviceName = inquiry.serviceType.name;
              } else {
                const serviceResult = await getServiceById(inquiry.serviceType);
                if (serviceResult.success && serviceResult.data) {
                  serviceName = serviceResult.data.name;
                }
              }
            }
          } catch (error) {
            console.error(
              "Error resolving names for inquiry:",
              inquiry._id,
              error
            );
          }

          return {
            ...inquiry,
            venueName,
            serviceName,
          };
        })
      );

      return resolvedInquiries;
    } catch (error) {
      console.error("Error resolving inquiry names:", error);
      return inquiries.map((inquiry) => ({
        ...inquiry,
        venueName: "Unknown Venue",
        serviceName: "Unknown Service",
      }));
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get date range based on timeframe
      const getDateRange = () => {
        const now = new Date();
        const ranges = {
          week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          all: null,
        };
        return ranges[timeframe];
      };

      const startDate = getDateRange();
      const statsParams = startDate
        ? {
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
          }
        : {};

      // Fetch booking statistics
      const bookingStatsResult = await getBookingStats(statsParams);

      // Fetch recent bookings for activity
      const recentBookingsResult = await getAllBookings({
        limit: 10,
        sortBy: "orderDate",
        sortOrder: "desc",
      });

      // Fetch recent inquiries
      const recentInquiriesResult = await getInquiries({
        limit: 5,
        page: 1,
      });

      // Fetch other counts
      const [usersRes] = await Promise.all([
        axios
          .get(backendUrl + "/api/admin/users/count")
          .catch(() => ({ data: { count: 0 } })),
      ]);

      if (bookingStatsResult.success) {
        const bookingStats = bookingStatsResult.data.overview;
        const popularItems = bookingStatsResult.data.popularItems || [];

        // Format recent activity from recent bookings
        const recentActivity = recentBookingsResult.success
          ? recentBookingsResult.data.slice(0, 5).map((booking) => ({
              id: booking._id,
              type: booking.isCustomOrder ? "Custom Order" : "Regular Booking",
              customerName: booking.customerDetails?.name || "Unknown",
              amount: booking.pricing?.total || 0,
              date: booking.orderDate,
              status: booking.status,
              reference: booking.bookingReference,
            }))
          : [];

        // Process recent inquiries with name resolution
        let recentInquiries = [];
        if (
          recentInquiriesResult.success &&
          recentInquiriesResult.data.length > 0
        ) {
          const rawInquiries = recentInquiriesResult.data.slice(0, 5);
          const resolvedInquiries = await resolveInquiryNames(rawInquiries);

          recentInquiries = resolvedInquiries.map((inquiry) => ({
            id: inquiry._id,
            customerName: inquiry.name || "Unknown",
            email: inquiry.email,
            eventDate: inquiry.eventDate,
            numberOfPeople: inquiry.numberOfPeople,
            venue: inquiry.venueName, // Use resolved name
            serviceType: inquiry.serviceName, // Use resolved name
            status: inquiry.status || "pending",
            date: inquiry.createdAt,
          }));
        }

        setStats({
          totalInquiries: recentInquiriesResult.success
            ? recentInquiriesResult.pagination?.total ||
              recentInquiriesResult.data.length
            : 0,
          totalBookings: bookingStats.totalBookings || 0,
          totalUsers: usersRes.data.count || 0,
          totalRevenue: bookingStats.totalRevenue || 0,
          totalPeople: bookingStats.totalPeople || 0,
          averageOrderValue: bookingStats.averageOrderValue || 0,
          customOrders: bookingStats.customOrders || 0,
          regularOrders: bookingStats.regularOrders || 0,
          statusCounts: bookingStats.statusCounts || {},
          recentActivity,
          recentInquiries,
          popularItems,
        });
      } else {
        // Fallback to basic data if booking stats fail
        const recentInquiriesResult = await getInquiries({
          limit: 5,
          page: 1,
        });

        let recentInquiries = [];
        if (
          recentInquiriesResult.success &&
          recentInquiriesResult.data.length > 0
        ) {
          const rawInquiries = recentInquiriesResult.data.slice(0, 5);
          const resolvedInquiries = await resolveInquiryNames(rawInquiries);

          recentInquiries = resolvedInquiries.map((inquiry) => ({
            id: inquiry._id,
            customerName: inquiry.name || "Unknown",
            email: inquiry.email,
            eventDate: inquiry.eventDate,
            numberOfPeople: inquiry.numberOfPeople,
            venue: inquiry.venueName, // Use resolved name
            serviceType: inquiry.serviceName, // Use resolved name
            status: inquiry.status || "pending",
            date: inquiry.createdAt,
          }));
        }

        setStats((prev) => ({
          ...prev,
          totalInquiries: recentInquiriesResult.success
            ? recentInquiriesResult.pagination?.total ||
              recentInquiriesResult.data.length
            : 0,
          totalUsers: usersRes.data.count || 0,
          recentActivity: [],
          recentInquiries,
          popularItems: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats({
        totalInquiries: 0,
        totalBookings: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalPeople: 0,
        averageOrderValue: 0,
        customOrders: 0,
        regularOrders: 0,
        statusCounts: {},
        recentActivity: [],
        recentInquiries: [],
        popularItems: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      confirmed: "text-blue-600 bg-blue-100",
      preparing: "text-orange-600 bg-orange-100",
      ready: "text-purple-600 bg-purple-100",
      completed: "text-green-600 bg-green-100",
      cancelled: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const getInquiryStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      reviewed: "text-blue-600 bg-blue-100",
      responded: "text-green-600 bg-green-100",
      archived: "text-gray-600 bg-gray-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  if (loading) {
    return <InlineLoading message="Loading dashboard data..." size="large" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold ">Dashboard</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-primary-brown rounded-lg  bg-white focus:outline-none focus:ring-2 focus:ring-primary-brown"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <div className="text-sm">
            Welcome back! Here's what's happening with MC Catering.
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📧</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Total Inquiries
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {stats.totalInquiries}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📅</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Total Bookings
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {stats.totalBookings}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Total Revenue
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {formatCurrency(stats.totalRevenue)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  People Served
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {stats.totalPeople}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Average Order Value
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {formatCurrency(stats.averageOrderValue)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Custom Orders
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {stats.customOrders}
                </dd>
                <dd className="text-xs text-amber-500">
                  Regular: {stats.regularOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👤</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Total Users
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  {stats.totalUsers}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      {Object.keys(stats.statusCounts).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
            <h2 className="text-lg font-semibold text-amber-800">
              Order Status Overview
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      status
                    )}`}
                  >
                    {status}
                  </div>
                  <div className="text-2xl font-bold text-amber-800 mt-2">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-green-800">
                Recent Bookings
              </h2>
              <button
                onClick={() => navigate("/admin/bookings")}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                        <span className="text-sm font-medium text-amber-800">
                          {activity.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.customerName} • {activity.reference}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(activity.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-amber-600">
                <p className="text-lg">No recent bookings to display</p>
                <p className="text-sm mt-2">
                  Activity will appear here once you start receiving bookings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-800">
                Recent Inquiries
              </h2>
              <button
                onClick={() => navigate("/admin/inquiries")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats.recentInquiries.length > 0 ? (
              <div className="space-y-4">
                {stats.recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getInquiryStatusColor(
                            inquiry.status
                          )}`}
                        >
                          {inquiry.status}
                        </span>
                        <span className="text-sm font-medium text-blue-800">
                          {inquiry.serviceType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {inquiry.customerName} • {inquiry.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        Event:{" "}
                        {inquiry.eventDate
                          ? new Date(inquiry.eventDate).toLocaleDateString(
                              "en-AU"
                            )
                          : "Not specified"}{" "}
                        • {inquiry.numberOfPeople || 0} people
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(inquiry.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        {inquiry.venue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-blue-600">
                <p className="text-lg">No recent inquiries to display</p>
                <p className="text-sm mt-2">
                  Inquiries will appear here once customers start contacting
                  you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
          <h2 className="text-lg font-semibold text-amber-800">
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/inquiries")}
              className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  📧
                </span>
                <span className="text-sm font-semibold text-green-700">
                  View All Inquiries
                </span>
                <div className="text-xs text-green-600 mt-1">
                  {stats.totalInquiries} total
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/bookings")}
              className="p-6 border-2 border-dashed border-amber-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors group"
            >
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  📅
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  Manage Bookings
                </span>
                <div className="text-xs text-amber-600 mt-1">
                  {stats.totalBookings} total
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/bookings?orderType=custom")}
              className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  🎯
                </span>
                <span className="text-sm font-semibold text-blue-700">
                  Custom Orders
                </span>
                <div className="text-xs text-blue-600 mt-1">
                  {stats.customOrders} custom
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/menu")}
              className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  🍽️
                </span>
                <span className="text-sm font-semibold text-green-700">
                  Manage Menus
                </span>
                <div className="text-xs text-green-600 mt-1">View & Edit</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
