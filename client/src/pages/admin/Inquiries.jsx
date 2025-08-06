import { useState, useEffect, useCallback } from "react";
import { InlineLoading } from "../../components/Loading";
import toast from "react-hot-toast";
import { getInquiries } from "../../services/inquiryService";
import InquiryCard from "../../components/admin/Inquiry/InquiryCard";
import Pagination from "../../components/common/Pagination";
import InquiryFormModal from "../../components/admin/Inquiry/InquiryFormModal";
import InquiryDetailsModal from "../../components/admin/Inquiry/InquiryDetailsModal";

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filter,
        search: debouncedSearchTerm.trim(),
      };

      const result = await getInquiries(params);

      if (result.success) {
        setInquiries(result.data || []);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 0);
      } else {
        toast.error(result.error || "Failed to load inquiries");
        setInquiries([]);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to load inquiries");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filter, debouncedSearchTerm]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleViewDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleModalUpdate = () => {
    fetchInquiries();
  };

  if (loading && inquiries.length === 0) {
    return <InlineLoading message="Loading inquiries..." size="large" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold ">Inquiries Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm ">Total: {totalItems} inquiries</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add Inquiry
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
              placeholder="Search by name, email, contact, or message..."
              value={searchTerm.toString()}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-800">
              {filter === "all"
                ? "All Inquiries"
                : `${
                    filter.charAt(0).toUpperCase() + filter.slice(1)
                  } Inquiries`}
              ({totalItems})
            </h2>
            {loading && (
              <div className="text-sm text-green-600">Loading...</div>
            )}
          </div>
        </div>
        {inquiries.length === 0 && !loading ? (
          <div className="p-8 text-center text-amber-600">
            <p className="text-lg">No inquiries found</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Inquiries will appear here when customers contact you"}
            </p>
          </div>
        ) : (
          <div>
            {inquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry._id}
                inquiry={inquiry}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Add Inquiry Modal */}
      <InquiryFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleModalUpdate}
      />

      {/* Inquiry Details Modal */}
      <InquiryDetailsModal
        isOpen={showDetailsModal}
        inquiry={selectedInquiry}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
};

export default AdminInquiries;
