import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getInquiries } from "../../services/inquiryService";
import InquiryCard from "../../components/admin/Inquiry/InquiryCard";
import Pagination from "../../components/common/Pagination";
import InquiryFormModal from "../../components/admin/Inquiry/InquiryFormModal";
import InquiryDetailsModal from "../../components/admin/Inquiry/InquiryDetailsModal";
import InquiryCalendar from "../../components/admin/Inquiry/InquiryCalender";
import InquiryFilters from "../../components/admin/Inquiry/InquiryFilters";

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [allInquiries, setAllInquiries] = useState([]); // For calendar
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    venue: "all",
    service: "all",
    search: "",
    selectedDate: null,
  });

  // Modals
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.search);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch inquiries for list view (paginated)
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filters.status !== "all" ? filters.status : undefined,
        venue: filters.venue !== "all" ? filters.venue : undefined,
        serviceType: filters.service !== "all" ? filters.service : undefined,
        search: debouncedSearchTerm.trim() || undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );


      const result = await getInquiries(params);

      if (result.success) {
        setInquiries(result.data || []);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 0);
      } else {
        toast.error(result.error || "Failed to load inquiries");
        setInquiries([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to load inquiries");
      setInquiries([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    filters.status,
    filters.venue,
    filters.service,
    debouncedSearchTerm,
  ]);

  // Fetch all inquiries for calendar (respecting current filters)
  const fetchAllInquiries = useCallback(async () => {
    try {
      const params = {
        limit: 1000, // Get many inquiries for calendar
        status: filters.status !== "all" ? filters.status : undefined,
        venue: filters.venue !== "all" ? filters.venue : undefined,
        serviceType: filters.service !== "all" ? filters.service : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const result = await getInquiries(params);
      if (result.success) {
        setAllInquiries(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching all inquiries for calendar:", error);
    }
  }, [filters.status, filters.venue, filters.service]);

  // Update calendar when filters change
  useEffect(() => {
    fetchAllInquiries();
  }, [fetchAllInquiries]);

  // Fetch inquiries when filters or pagination change
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Reset page when filters change (except search which has debounced handling)
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.venue, filters.service]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle calendar date selection
  const handleDateSelect = (date) => {
    setFilters((prev) => ({ ...prev, selectedDate: date }));
  };

  // Filter inquiries by selected date (client-side filtering)
  const getFilteredInquiries = () => {
    if (!filters.selectedDate) return inquiries;

    return inquiries.filter((inquiry) => {
      if (!inquiry.eventDate) return false;
      const eventDate = new Date(inquiry.eventDate);
      return (
        eventDate.getDate() === filters.selectedDate.getDate() &&
        eventDate.getMonth() === filters.selectedDate.getMonth() &&
        eventDate.getFullYear() === filters.selectedDate.getFullYear()
      );
    });
  };

  const displayedInquiries = getFilteredInquiries();
  const displayedTotal = filters.selectedDate
    ? displayedInquiries.length
    : totalItems;

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
    fetchAllInquiries();
  };

  const handleRefresh = () => {
    fetchInquiries();
    fetchAllInquiries();
  };

const InquiriesSkeleton = () => (
  <div className="space-y-6 animate-pulse p-1">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="h-8 w-56 bg-gray-200 rounded-lg"></div>
      <div className="h-10 w-full sm:w-28 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
          <div className="h-3.5 w-20 bg-gray-200 rounded"></div>
          <div className="h-7 w-12 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-gray-50 rounded-xl border border-gray-100"></div>
        ))}
      </div>
    </div>
  </div>
);

  if (loading && inquiries.length === 0) {
    return <InquiriesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Inquiries Management</h1>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="text-sm order-3 sm:order-none w-full sm:w-auto">
            {filters.status !== "all" ||
            filters.venue !== "all" ||
            filters.service !== "all" ||
            filters.search.trim() ? (
              <>
                <span>Filtered: {displayedTotal} inquiries</span>
                <span className="text-gray-500 ml-2">
                  (Total: {totalItems})
                </span>
              </>
            ) : (
              <span>Total: {totalItems} inquiries</span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            title="Refresh inquiries"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Inquiry
          </button>
        </div>
      </div>

      {/* Filters Component */}
      <InquiryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalItems={displayedTotal}
        loading={loading}
      />

      {/* Calendar + Inquiries List - equal halves, matched height on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        <div className="lg:h-[560px]">
          <InquiryCalendar
            inquiries={allInquiries}
            onDateSelect={handleDateSelect}
            selectedDate={filters.selectedDate}
          />
        </div>

        <div className="lg:h-[560px] bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-green-50 rounded-t-lg flex-shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-green-800">
                {filters.selectedDate
                  ? `Inquiries for ${filters.selectedDate.toLocaleDateString()}`
                  : filters.status === "all"
                  ? "All Inquiries"
                  : `${
                      filters.status.charAt(0).toUpperCase() +
                      filters.status.slice(1)
                    } Inquiries`}{" "}
                ({displayedTotal})
              </h2>
              {loading && (
                <div className="text-xs text-green-600">Loading...</div>
              )}
            </div>
          </div>

          {displayedInquiries.length === 0 && !loading ? (
            <div className="p-6 text-center text-amber-600">
              <p className="text-base font-medium">No inquiries found</p>
              <p className="text-sm mt-2">
                {filters.selectedDate
                  ? "No inquiries found for the selected date"
                  : filters.search.trim() ||
                    filters.status !== "all" ||
                    filters.venue !== "all" ||
                    filters.service !== "all"
                  ? "Try adjusting your search terms or filters"
                  : "Inquiries will appear here when customers contact you"}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {displayedInquiries.map((inquiry) => (
                <InquiryCard
                  key={inquiry._id}
                  inquiry={inquiry}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}

          {/* Pagination - only show if not filtering by date; latest 5 show first, page for more */}
          {!filters.selectedDate && totalPages > 1 && (
            <div className="flex-shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
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
