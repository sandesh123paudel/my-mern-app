import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const { backendUrl } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, admin, user, superadmin, active, inactive
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchUsers(), fetchAdmins()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/users");
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setUsers([]);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/admins");
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
      setAdmins([]);
    }
  };

  // Combine users and admins for display
  const getAllUsersAndAdmins = () => {
    const allUsers = [...users, ...admins];
    // Remove duplicates based on email (in case there are any)
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    );
    return uniqueUsers;
  };

  const updateUserRole = async (userId, role, currentRole) => {
    try {
      let endpoint;
      let payload;

      if (currentRole === "admin" || currentRole === "superadmin") {
        // If current user is admin/superadmin, use admin endpoint
        if (role === "user") {
          // Can't demote admin to user directly, need to delete and recreate
          toast.error("Cannot demote admin to user. Please delete and recreate as user.");
          return;
        }
        endpoint = `/api/auth/admins/${userId}`;
        payload = { role };
      } else {
        // If current user is regular user, use user endpoint
        endpoint = `/api/admin/users/${userId}/role`;
        payload = { role };
      }

      const { data } = await axios.put(backendUrl + endpoint, payload);
      if (data.success) {
        toast.success("User role updated successfully");
        fetchAllData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/admin/users/${userId}/status`,
        { isActive }
      );
      if (data.success) {
        toast.success(
          `User ${isActive ? "activated" : "deactivated"} successfully`
        );
        fetchAllData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId, userRole) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) return;

    try {
      let endpoint;
      if (userRole === "admin" || userRole === "superadmin") {
        endpoint = `/api/auth/admins/${userId}`;
      } else {
        endpoint = `/api/admin/users/${userId}`;
      }

      const { data } = await axios.delete(backendUrl + endpoint);
      if (data.success) {
        toast.success("User deleted successfully");
        fetchAllData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const createUser = async (e) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let endpoint;
      if (newUser.role === "admin") {
        endpoint = "/api/auth/admins";
      } else {
        endpoint = "/api/admin/users";
      }

      const { data } = await axios.post(backendUrl + endpoint, newUser);
      if (data.success) {
        toast.success(`${newUser.role} created successfully`);
        setNewUser({ name: "", email: "", password: "", role: "user" });
        setShowAddModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const promoteToAdmin = async (userId) => {
    if (!window.confirm("Are you sure you want to promote this user to admin?")) return;

    try {
      // First get user data
      const user = getAllUsersAndAdmins().find(u => u._id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }

      // Create admin with same details
      const { data } = await axios.post(backendUrl + "/api/auth/admins", {
        name: user.name,
        email: user.email,
        password: "TempPassword123", // They'll need to reset
      });

      if (data.success) {
        // Delete the regular user
        await axios.delete(backendUrl + `/api/admin/users/${userId}`);
        toast.success("User promoted to admin successfully. They will need to reset their password.");
        fetchAllData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("Failed to promote user to admin");
    }
  };

  const filteredUsers = getAllUsersAndAdmins().filter((user) => {
    const matchesFilter =
      filter === "all" ||
      filter === user.role ||
      (filter === "active" && user.isActive !== false) ||
      (filter === "inactive" && user.isActive === false);
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "admin":
        return "bg-green-100 text-green-800 border-green-200";
      case "user":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (isActive) => {
    return isActive !== false
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  if (loading) {
    return <InlineLoading message="Loading users..." size="large" />;
  }

  const totalUsers = getAllUsersAndAdmins().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-800">Users & Admins Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600">
            Total: {totalUsers} users ({users.length} regular, {admins.length} admins)
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add User/Admin
          </button>
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
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Users</option>
              <option value="superadmin">Super Admins</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800">
            All Users ({filteredUsers.length})
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-amber-600">
            <p className="text-lg">No users found</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Users will appear here when they register"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-amber-800">
                        {user.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          user.isActive
                        )}`}
                      >
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                      <p>
                        <span className="font-medium">Last Login:</span>{" "}
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Joined:{" "}
                      {new Date(user.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Manage User</h2>
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
                  <p className="text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Email
                  </label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Role
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                      selectedUser.role
                    )}`}
                  >
                    {selectedUser.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Status
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedUser.isActive
                    )}`}
                  >
                    {selectedUser.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Last Login
                  </label>
                  <p className="text-gray-900">
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700">
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedUser.createdAt || Date.now()
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedUser.role === "user" && (
                  <button
                    onClick={() => promoteToAdmin(selectedUser._id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Promote to Admin
                  </button>
                )}
                
                {selectedUser.role !== "superadmin" && selectedUser.isActive !== false ? (
                  <button
                    onClick={() => updateUserStatus(selectedUser._id, false)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Deactivate
                  </button>
                ) : selectedUser.role !== "superadmin" && selectedUser.isActive === false ? (
                  <button
                    onClick={() => updateUserStatus(selectedUser._id, true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Activate
                  </button>
                ) : null}
                
                {selectedUser.role !== "superadmin" && (
                  <button
                    onClick={() => deleteUser(selectedUser._id, selectedUser.role)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add New User/Admin</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={createUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create {newUser.role}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;