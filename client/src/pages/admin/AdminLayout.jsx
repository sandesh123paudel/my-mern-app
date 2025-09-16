import { useState, useContext } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData, setIsLoggedIn, setUserData, backendUrl } =
    useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        toast.success("Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const menuItems = [
    { path: "/admin/dashboard", name: "Dashboard", icon: "📊" },
    {
      path: "/admin/location-services",
      name: "Location / Services",
      icon: "📍",
    },
    { path: "/admin/calender", name: "Calendar Overview", icon: "📅" },
    { path: "/admin/bookings", name: "Bookings", icon: "📲" },
    { path: "/admin/inquiries", name: "Inquiries", icon: "📧" },
    { path: "/admin/custom-menu", name: "Custom Menu", icon: "🍕" },
    { path: "/admin/menu", name: "Menu Management", icon: "🍽️" },
    { path: "/admin/coupons", name: "Coupons", icon: "💸" },
    { path: "/admin/users", name: "Users", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-center h-14 bg-green-600">
          <h1 className="text-white text-lg font-bold">MC Catering Admin</h1>
        </div>

        {/* Make it scrollable */}
        <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors ${
                    location.pathname === item.path
                      ? "bg-green-100 text-green-600 border-r-2 border-green-600"
                      : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-2 text-base">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-1 left-3 right-3">
          <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200 text-xs">
            <p className="text-amber-700">Logged in as:</p>
            <p className="font-medium text-amber-800">
              {userData?.name || "Admin"}
            </p>
            <p className="text-amber-600">{userData?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-amber-700 text-white py-2 px-3 rounded-lg hover:bg-amber-800 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1  text-sm flex flex-col overflow-hidden lg:ml-0">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 h-16">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-800 lg:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-green-600 hover:text-green-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
