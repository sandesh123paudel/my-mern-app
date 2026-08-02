import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import { getBookingStats, getAllBookings } from "../../services/bookingService";
import { getInquiries } from "../../services/inquiryService";
import { getLocationById } from "../../services/locationServices";
import { getServiceById } from "../../services/serviceServices";
import axios from "axios";
import {
  Mail,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  ChefHat,
  Utensils,
} from "lucide-react";

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
          totalRevenue: bookingStats.totalRevenue || 0,
          totalPeople: bookingStats.totalPeople || 0,
          averageOrderValue: bookingStats.averageOrderValue || 0,
          customOrders: bookingStats.customOrders || 0,
          regularOrders: bookingStats.menuOrders || 0,
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

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-full sm:w-36 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Main Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
            <div className="ml-4 flex-1 space-y-2">
              <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
              <div className="h-7 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
            <div className="ml-4 flex-1 space-y-2">
              <div className="h-3.5 w-32 bg-gray-200 rounded"></div>
              <div className="h-7 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Overview Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="h-5 w-44 bg-gray-200 rounded"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                <div className="h-5 w-16 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-7 w-10 bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings & Inquiries Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((col) => (
          <div key={col} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
              <div className="h-5 w-36 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-lg border border-gray-100">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-28 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-3.5 w-44 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 border border-gray-200 rounded-xl flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-4 w-28 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-primary-brown rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-brown w-full sm:w-auto"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <div className="text-sm text-gray-600">
            Welcome back! Here's what's happening with MC Catering.
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Inquiries</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{stats.totalInquiries}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Bookings</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">People Served</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{stats.totalPeople}</p>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Average Order Value</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{formatCurrency(stats.averageOrderValue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-green rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Custom Orders</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{stats.customOrders}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">Regular: {stats.regularOrders}</p>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      {Object.keys(stats.statusCounts).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
            <h2 className="text-base font-semibold text-slate-800">
              Order Status Overview
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                      status
                    )}`}
                  >
                    {status}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                Recent Bookings
              </h2>
              <button
                onClick={() => navigate("/admin/calender")}
                className="text-xs text-primary-green hover:opacity-80 font-semibold"
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
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {activity.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.customerName} • {activity.reference}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary-green">
                        {formatCurrency(activity.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                <p className="text-base font-medium">No recent bookings to display</p>
                <p className="text-xs mt-1 text-gray-400">
                  Activity will appear here once you start receiving bookings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                Recent Inquiries
              </h2>
              <button
                onClick={() => navigate("/admin/inquiries")}
                className="text-xs text-primary-green hover:opacity-80 font-semibold"
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
                    className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getInquiryStatusColor(
                            inquiry.status
                          )}`}
                        >
                          {inquiry.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {inquiry.serviceType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {inquiry.customerName} • {inquiry.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        Event:{" "}
                        {inquiry.eventDate
                          ? new Date(inquiry.eventDate).toLocaleDateString(
                              "en-AU"
                            )
                          : "Not specified"}{" "}
                        • {inquiry.numberOfPeople || 0} people
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(inquiry.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-700">
                        {inquiry.venue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                <p className="text-base font-medium">No recent inquiries to display</p>
                <p className="text-xs mt-1 text-gray-400">
                  Inquiries will appear here once customers start contacting you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/inquiries")}
              className="p-5 border border-gray-200 rounded-xl hover:border-primary-green hover:bg-green-50/40 transition-all shadow-sm group text-left flex flex-col items-center"
            >
              <div className="p-3 bg-green-50 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-primary-green" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-green">
                View All Inquiries
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalInquiries} total
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/calender")}
              className="p-5 border border-gray-200 rounded-xl hover:border-primary-green hover:bg-green-50/40 transition-all shadow-sm group text-left flex flex-col items-center"
            >
              <div className="p-3 bg-green-50 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-primary-green" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-green">
                Manage Bookings
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalBookings} total
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/bookings?orderType=custom")}
              className="p-5 border border-gray-200 rounded-xl hover:border-primary-green hover:bg-green-50/40 transition-all shadow-sm group text-left flex flex-col items-center"
            >
              <div className="p-3 bg-green-50 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6 text-primary-green" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-green">
                Custom Orders
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {stats.customOrders} custom
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/menu")}
              className="p-5 border border-gray-200 rounded-xl hover:border-primary-green hover:bg-green-50/40 transition-all shadow-sm group text-left flex flex-col items-center"
            >
              <div className="p-3 bg-green-50 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6 text-primary-green" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-green">
                Manage Menus
              </span>
              <div className="text-xs text-gray-500 mt-1">View & Edit</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
