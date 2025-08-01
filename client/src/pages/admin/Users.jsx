import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { InlineLoading } from "../../components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const { backendUrl } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, admin, user, active, inactive
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
    fetchUsers();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/admin/users/${userId}/role`,
        {
          role,
        }
      );
      if (data.success) {
        toast.success("User role updated successfully");
        fetchUsers();
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
        {
          isActive,
        }
      );
      if (data.success) {
        toast.success(
          `User ${isActive ? "activated" : "deactivated"} successfully`
        );
        fetchUsers();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      const { data } = await axios.delete(
        backendUrl + `/api/admin/users/${userId}`
      );
      if (data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
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
      const { data } = await axios.post(
        backendUrl + "/api/admin/users",
        newUser
      );
      if (data.success) {
        toast.success("User created successfully");
        setNewUser({ name: "", email: "", password: "", role: "user" });
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const filteredUsers = users.filter((user) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-800">Users Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-amber-600">
            Total: {users.length} users
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👑</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Admins</p>
              <p className="text-2xl font-bold text-green-800">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👤</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-600">Users</p>
              <p className="text-2xl font-bold text-amber-800">
                {users.filter((u) => u.role === "user").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Active</p>
              <p className="text-2xl font-bold text-blue-800">
                {users.filter((u) => u.isActive !== false).length}
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
              <p className="text-sm font-medium text-red-600">Inactive</p>
              <p className="text-2xl font-bold text-red-800">
                {users.filter((u) => u.isActive === false).length}
              </p>
            </div>
          </div>
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
            Users ({filteredUsers.length})
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
                {selectedUser.role !== "admin" && (
                  <button
                    onClick={() => updateUserRole(selectedUser._id, "admin")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Make Admin
                  </button>
                )}
                {selectedUser.role !== "user" && (
                  <button
                    onClick={() => updateUserRole(selectedUser._id, "user")}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Make User
                  </button>
                )}
                {selectedUser.isActive !== false ? (
                  <button
                    onClick={() => updateUserStatus(selectedUser._id, false)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => updateUserStatus(selectedUser._id, true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => deleteUser(selectedUser._id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Delete User
                </button>
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
                <h2 className="text-xl font-bold">Add New User</h2>
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
                  Create User
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
