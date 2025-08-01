import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import axios from "axios";

const AdminDashboard = () => {
  const { backendUrl } = useContext(AppContext);
  const [stats, setStats] = useState({
    totalInquiries: 0,
    totalBookings: 0,
    totalUsers: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // You'll need to implement these endpoints in your backend
      const [inquiriesRes, bookingsRes, usersRes] = await Promise.all([
        axios.get(backendUrl + "/api/admin/inquiries/count"),
        axios.get(backendUrl + "/api/admin/bookings/count"),
        axios.get(backendUrl + "/api/admin/users/count"),
      ]);

      setStats({
        totalInquiries: inquiriesRes.data.count || 0,
        totalBookings: bookingsRes.data.count || 0,
        totalUsers: usersRes.data.count || 0,
        recentActivity: [], // You can fetch recent activity here
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values on error
      setStats({
        totalInquiries: 0,
        totalBookings: 0,
        totalUsers: 0,
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <InlineLoading message="Loading dashboard data..." size="large" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-800">Dashboard</h1>
        <div className="text-sm text-amber-600">
          Welcome back! Here's what's happening with MC Catering.
        </div>
      </div>

      {/* Stats Cards */}
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
                <span className="text-white text-lg">👥</span>
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

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🍽️</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-amber-600 truncate">
                  Menu Items
                </dt>
                <dd className="text-2xl font-bold text-amber-800">
                  Coming Soon
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center text-amber-600">
            <p className="text-lg">No recent activity to display</p>
            <p className="text-sm mt-2">
              Activity will appear here once you start receiving inquiries and
              bookings.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  📧
                </span>
                <span className="text-sm font-semibold text-green-700">
                  View All Inquiries
                </span>
              </div>
            </button>

            <button className="p-6 border-2 border-dashed border-amber-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors group">
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  📅
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  Manage Bookings
                </span>
              </div>
            </button>

            <button className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
              <div className="text-center">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                  🍽️
                </span>
                <span className="text-sm font-semibold text-green-700">
                  Update Menu
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
