import React, { useState } from "react";
import { Download, FileText, Calendar, Filter } from "lucide-react";
import bookingService from "../../../services/bookingService";
import toast from "react-hot-toast";

const BookingExport = ({ 
  filters, 
  allBookings, 
  filteredBookings,
  formatPrice,
  formatDate,
  formatDateTime 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: "filtered", // "filtered" or "all"
    includeCustomOrders: true,
    includeRegularOrders: true,
    dateRange: "current", // "current", "custom", "all"
    customStartDate: "",
    customEndDate: "",
    fields: {
      basicInfo: true,
      customerDetails: true,
      pricingDetails: true,
      deliveryInfo: true,
      menuDetails: true,
      selectedItems: true,
      statusInfo: true,
    }
  });

  // Convert booking data to CSV format
  const convertToCSV = (bookings) => {
    if (!bookings || bookings.length === 0) {
      return "No data to export";
    }

    const headers = [];
    const { fields } = exportOptions;

    // Define headers based on selected fields
    if (fields.basicInfo) {
      headers.push("Booking Reference", "Order Date", "Order Type");
    }
    if (fields.customerDetails) {
      headers.push("Customer Name", "Customer Email", "Customer Phone", "People Count");
    }
    if (fields.deliveryInfo) {
      headers.push("Delivery Type", "Delivery Date", "Delivery Address");
    }
    if (fields.menuDetails) {
      headers.push("Menu/Package Name", "Service Name", "Location Name");
    }
    if (fields.selectedItems) {
      headers.push("Selected Items", "Items Count");
    }
    if (fields.pricingDetails) {
      headers.push("Base Price", "Addons Price", "Total Price", "Deposit Paid", "Balance Due");
    }
    if (fields.statusInfo) {
      headers.push("Status", "Payment Status", "Admin Notes");
    }

    // Create CSV content
    let csvContent = headers.join(",") + "\n";

    bookings.forEach(booking => {
      const row = [];

      if (fields.basicInfo) {
        row.push(
          `"${booking.bookingReference || ''}"`,
          `"${formatDate(booking.orderDate)}"`,
          `"${booking.isCustomOrder ? 'Custom Order' : 'Regular Order'}"`
        );
      }

      if (fields.customerDetails) {
        row.push(
          `"${booking.customerDetails?.name || ''}"`,
          `"${booking.customerDetails?.email || ''}"`,
          `"${booking.customerDetails?.phone || ''}"`,
          `"${booking.peopleCount || 0}"`
        );
      }

      if (fields.deliveryInfo) {
        const address = booking.address ? 
          `${booking.address.street}, ${booking.address.suburb}, ${booking.address.state} ${booking.address.postcode}` : 
          '';
        row.push(
          `"${booking.deliveryType || ''}"`,
          `"${formatDateTime(booking.deliveryDate)}"`,
          `"${address}"`
        );
      }

      if (fields.menuDetails) {
        row.push(
          `"${booking.menu?.name || ''}"`,
          `"${booking.menu?.serviceName || ''}"`,
          `"${booking.menu?.locationName || ''}"`
        );
      }

      if (fields.selectedItems) {
        const items = booking.selectedItems?.map(item => item.name).join('; ') || '';
        const itemCount = booking.selectedItems?.length || 0;
        row.push(
          `"${items}"`,
          `"${itemCount}"`
        );
      }

      if (fields.pricingDetails) {
        const total = booking.pricing?.total || 0;
        const paid = booking.depositAmount || 0;
        const balance = total - paid;
        
        row.push(
          `"${booking.pricing?.basePrice || 0}"`,
          `"${booking.pricing?.addonsPrice || 0}"`,
          `"${total}"`,
          `"${paid}"`,
          `"${balance}"`
        );
      }

      if (fields.statusInfo) {
        row.push(
          `"${booking.status || ''}"`,
          `"${booking.paymentStatus || 'Pending'}"`,
          `"${booking.adminNotes || ''}"`
        );
      }

      csvContent += row.join(",") + "\n";
    });

    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);

      let bookingsToExport = [];
      
      // Determine which bookings to export
      if (exportOptions.exportType === "filtered") {
        bookingsToExport = filteredBookings;
      } else {
        // Use API to get all bookings with date range
        const params = {};
        
        if (exportOptions.dateRange === "custom") {
          if (exportOptions.customStartDate) {
            params.startDate = new Date(exportOptions.customStartDate).toISOString();
          }
          if (exportOptions.customEndDate) {
            params.endDate = new Date(exportOptions.customEndDate).toISOString();
          }
        }
        
        params.limit = 10000; // Large limit to get all bookings
        
        const result = await bookingService.getAllBookings(params);
        if (result.success) {
          bookingsToExport = result.data;
        } else {
          throw new Error(result.error);
        }
      }

      // Filter by order type
      if (!exportOptions.includeCustomOrders) {
        bookingsToExport = bookingsToExport.filter(booking => !booking.isCustomOrder);
      }
      if (!exportOptions.includeRegularOrders) {
        bookingsToExport = bookingsToExport.filter(booking => booking.isCustomOrder);
      }

      if (bookingsToExport.length === 0) {
        toast.error("No bookings match the export criteria");
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(bookingsToExport);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const exportTypeText = exportOptions.exportType === "filtered" ? "filtered" : "all";
      const filename = `bookings_${exportTypeText}_${timestamp}.csv`;
      
      // Download file
      downloadCSV(csvContent, filename);
      
      toast.success(`Successfully exported ${bookingsToExport.length} bookings`);
      
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export bookings");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Export Bookings</h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Export Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="filtered"
                checked={exportOptions.exportType === "filtered"}
                onChange={(e) => setExportOptions(prev => ({ ...prev, exportType: e.target.value }))}
                className="mr-2"
              />
              <span className="text-sm">Current Filtered Results ({filteredBookings.length} bookings)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportOptions.exportType === "all"}
                onChange={(e) => setExportOptions(prev => ({ ...prev, exportType: e.target.value }))}
                className="mr-2"
              />
              <span className="text-sm">All Bookings</span>
            </label>
          </div>
        </div>

        {/* Date Range (for "all" export type) */}
        {exportOptions.exportType === "all" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateRange"
                  value="all"
                  checked={exportOptions.dateRange === "all"}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="mr-2"
                />
                <span className="text-sm">All Time</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateRange"
                  value="custom"
                  checked={exportOptions.dateRange === "custom"}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="mr-2"
                />
                <span className="text-sm">Custom Date Range</span>
              </label>
              {exportOptions.dateRange === "custom" && (
                <div className="ml-6 flex gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.customStartDate}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.customEndDate}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Type Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Types to Include
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeRegularOrders}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeRegularOrders: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Regular Orders</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeCustomOrders}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeCustomOrders: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Custom Orders</span>
            </label>
          </div>
        </div>

        {/* Field Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fields to Include
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              basicInfo: "Basic Info (Reference, Date, Type)",
              customerDetails: "Customer Details",
              deliveryInfo: "Delivery Information",
              menuDetails: "Menu/Package Details",
              selectedItems: "Selected Items",
              pricingDetails: "Pricing Information",
              statusInfo: "Status & Notes"
            }).map(([key, label]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.fields[key]}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    fields: { ...prev.fields, [key]: e.target.checked }
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {exportOptions.exportType === "filtered" 
              ? `${filteredBookings.length} bookings will be exported`
              : "All matching bookings will be exported"
            }
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingExport;