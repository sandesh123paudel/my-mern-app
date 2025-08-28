import React, { useState } from "react";
import {
  Printer,
  X,
  Users,
  DollarSign,
  ChefHat,
  Search,
  FileDown,
  Clock,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import jsPDF from "jspdf";

const DayDetailModal = ({
  date,
  bookings,
  onClose,
  onStatusUpdate,
  onPaymentUpdate,
  onPrintBooking,
  onKitchenDocket,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "pending",
    depositAmount: "",
  });
  const [showKitchen, setShowKitchen] = useState(false);
  
  const firstBooking = bookings[0];

  // Sort bookings by delivery time (earliest first)
  const sortedBookings = [...bookings].sort((a, b) => {
    const timeA = new Date(a.deliveryDate);
    const timeB = new Date(b.deliveryDate);
    return timeA - timeB;
  });

  // Filter bookings based on search
  const filteredBookings = sortedBookings.filter(booking => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.customerDetails?.name?.toLowerCase().includes(searchLower) ||
      booking.customerDetails?.phone?.includes(searchTerm) ||
      booking.bookingReference?.toLowerCase().includes(searchLower)
    );
  });

  // Define a priority for booking statuses for sorting
  const statusPriority = {
    preparing: 1,
    ready: 2,
    confirmed: 3,
    pending: 4,
    completed: 5,
    cancelled: 6,
  };

  // Generate PDF export function
  const exportDayToPDF = () => {
    if (!date) {
      console.error("Date is required for PDF export");
      return;
    }

    const activeDayBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const doc = new jsPDF();

    // PDF Configuration
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with word wrap
    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      checkPageBreak(lines.length * lineHeight);

      lines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Header
    addText("MC Catering Services", 20, true);
    yPosition += 3;
    addText("DAY SUMMARY REPORT", 18, true);
    yPosition += 5;
    addText(
      `Date: ${
        date instanceof Date ? formatDate(date.toISOString()) : formatDate(date)
      }`,
      12
    );
    addText(`Generated: ${new Date().toLocaleString()}`, 10);
    yPosition += sectionSpacing;

    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += sectionSpacing;

    // Summary Statistics
    addText("SUMMARY STATISTICS", 14, true);
    addText(
      `Total Bookings: ${summary.totalBookings} (${summary.activeBookings} active)`
    );
    addText(`Total Guests: ${summary.totalPeople}`);
    addText(`Total Revenue: ${formatPrice(summary.totalRevenue)}`);
    addText(`Amount Paid: ${formatPrice(summary.totalPaid)}`);
    addText(
      `Balance Due: ${formatPrice(summary.totalRevenue - summary.totalPaid)}`
    );
    yPosition += sectionSpacing;

    // Save the PDF
    const safeDate = date
      ? (date instanceof Date
          ? formatDate(date.toISOString())
          : formatDate(date)
        ).replace(/\//g, "-")
      : "Unknown_Date";
    doc.save(`Day_Report_${safeDate}.pdf`);
  };

  // Aggregated items by name across all active bookings
  const getAggregatedItems = () => {
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const itemsMap = new Map();

    activeBookings.forEach((booking) => {
      if (booking.selectedItems && Array.isArray(booking.selectedItems)) {
        booking.selectedItems.forEach((item) => {
          const itemName = item.name?.toLowerCase().trim();
          if (!itemName) return;

          const isAddon = item.category === "addons" || item.type === "addon";
          const itemQuantity = item.quantity || 1;

          if (itemsMap.has(itemName)) {
            const existing = itemsMap.get(itemName);
            existing.totalQuantity += itemQuantity;
            existing.totalPeople += booking.peopleCount || 0;
            existing.bookings.push({
              bookingRef: booking.bookingReference,
              customerName: booking.customerDetails?.name,
              peopleCount: booking.peopleCount,
              quantity: itemQuantity,
              orderType:
                booking.orderSource?.sourceType === "customOrder"
                  ? "Custom"
                  : "Menu",
              isAddon: isAddon,
            });
            if (
              statusPriority[booking.status] <
              statusPriority[existing.highestPriorityStatus]
            ) {
              existing.highestPriorityStatus = booking.status;
            }
          } else {
            itemsMap.set(itemName, {
              name: item.name,
              category: item.category || "other",
              totalQuantity: itemQuantity,
              totalPeople: booking.peopleCount || 0,
              isVegetarian: item.isVegetarian || false,
              isVegan: item.isVegan || false,
              allergens: item.allergens || [],
              isAddon: isAddon,
              highestPriorityStatus: booking.status,
              bookings: [
                {
                  bookingRef: booking.bookingReference,
                  customerName: booking.customerDetails?.name,
                  peopleCount: booking.peopleCount,
                  quantity: itemQuantity,
                  orderType:
                    booking.orderSource?.sourceType === "customOrder"
                      ? "Custom"
                      : "Menu",
                  isAddon: isAddon,
                },
              ],
            });
          }
        });
      }
    });

    return Array.from(itemsMap.values()).sort((a, b) => {
      const statusCompare =
        statusPriority[a.highestPriorityStatus] -
        statusPriority[b.highestPriorityStatus];
      if (statusCompare !== 0) return statusCompare;
      return b.totalQuantity - a.totalQuantity;
    });
  };

  // Filter items based on search term
  const getFilteredItems = () => {
    const aggregatedItems = getAggregatedItems();
    if (!searchTerm.trim()) return aggregatedItems;

    return aggregatedItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calculate day summary
  const getDaySummary = () => {
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );

    const totalPeople = activeBookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );
    const totalPaid = activeBookings.reduce(
      (sum, booking) => sum + (booking.depositAmount || 0),
      0
    );

    const statusCounts = {};
    bookings.forEach((booking) => {
      const status = booking.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalPeople,
      totalRevenue,
      totalPaid,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      statusCounts,
    };
  };

  const summary = getDaySummary();
  const filteredItems = getFilteredItems();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "mains":
        return "bg-orange-100 text-orange-800";
      case "entree":
        return "bg-green-100 text-green-800";
      case "desserts":
        return "bg-pink-100 text-pink-800";
      case "sides":
        return "bg-blue-100 text-blue-800";
      case "addons":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePaymentUpdate = async (bookingId) => {
    try {
      const depositAmount = parseFloat(paymentData.depositAmount) || 0;
      await onPaymentUpdate(bookingId, {
        ...paymentData,
        depositAmount,
      });
      setShowPaymentForm(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const getDeliveryTime = (deliveryDate) => {
    const date = new Date(deliveryDate);
    return date.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format selected items for inline display
  const formatSelectedItems = (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) return "no items";
    
    const itemsByCategory = {};
    selectedItems.forEach((item) => {
      const category = item.category || "other";
      if (!itemsByCategory[category]) itemsByCategory[category] = [];
      
      const isAddon = item.category === "addons" || item.type === "addon";
      const quantity = item.quantity || 1;
      
      if (isAddon && quantity > 1) {
        itemsByCategory[category].push(`${item.name} (${quantity}x)`);
      } else {
        itemsByCategory[category].push(item.name);
      }
    });

    return Object.entries(itemsByCategory)
      .map(([category, items]) => `${category}: ${items.join(", ")}`)
      .join(" • ");
  };

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {date
                ? date instanceof Date
                  ? formatDate(date.toISOString())
                  : formatDate(date)
                : "Unknown Date"}
            </h2>
            <p className="text-green-100">
              {summary.totalBookings} events ({summary.activeBookings} active) • {summary.totalPeople} guests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportDayToPDF}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              title="Export day details to PDF"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button onClick={onClose} className="hover:bg-green-700 p-1 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Day Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                total guests
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalPeople}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                total revenue
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {formatPrice(summary.totalRevenue)}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">
                amount paid
              </h3>
              <p className="text-2xl font-bold text-orange-900">
                {formatPrice(summary.totalPaid)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-purple-800 mb-2">events</h3>
                <p className="text-2xl font-bold text-purple-900">
                  {summary.totalBookings}
                </p>
              </div>
              <div className="mt-2 text-sm text-purple-700 flex items-center gap-2">
                <input
                  id="show-kitchen"
                  type="checkbox"
                  checked={showKitchen}
                  onChange={(e) => setShowKitchen(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-purple-600 rounded"
                />
                <label htmlFor="show-kitchen" className="cursor-pointer">
                  show kitchen view
                </label>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">status overview</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    status
                  )}`}
                >
                  {status.replace("_", " ")}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Kitchen Requirements - Simplified */}
          {showKitchen && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  kitchen preparation requirements
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Generate kitchen-specific print
                      const kitchenDoc = new jsPDF();
                      kitchenDoc.setFontSize(20);
                      kitchenDoc.text("KITCHEN REQUIREMENTS", 20, 30);
                      kitchenDoc.setFontSize(14);
                      kitchenDoc.text(`Date: ${date instanceof Date ? formatDate(date.toISOString()) : formatDate(date)}`, 20, 45);
                      
                      let yPos = 60;
                      filteredItems.forEach((item, index) => {
                        if (yPos > 250) {
                          kitchenDoc.addPage();
                          yPos = 30;
                        }
                        kitchenDoc.setFontSize(12);
                        kitchenDoc.text(`${index + 1}. ${item.name}`, 20, yPos);
                        kitchenDoc.setFontSize(10);
                        kitchenDoc.text(`   ${item.isAddon ? `${item.totalQuantity} units` : `${item.totalQuantity} portions for ${item.totalPeople} people`}`, 20, yPos + 10);
                        kitchenDoc.text(`   Category: ${item.category || 'other'}`, 20, yPos + 20);
                        if (item.allergens && item.allergens.length > 0) {
                          kitchenDoc.text(`   ALLERGENS: ${item.allergens.join(', ')}`, 20, yPos + 30);
                          yPos += 10;
                        }
                        yPos += 40;
                      });
                      
                      const safeDate = date ? (date instanceof Date ? formatDate(date.toISOString()) : formatDate(date)).replace(/\//g, "-") : "Unknown_Date";
                      kitchenDoc.save(`Kitchen_Requirements_${safeDate}.pdf`);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    kitchen print
                  </button>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  {searchTerm ? "no items found matching your search." : "no items to prepare."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item, index) => (
                    <div key={index} className="bg-white border border-orange-200 rounded p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(item.category)}`}>
                              {item.category || "other"}
                            </span>
                            {item.isVegetarian && (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">veg</span>
                            )}
                            {item.isVegan && (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">vegan</span>
                            )}
                          </div>
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="mt-1 text-xs text-red-600">
                              <span className="font-medium">allergens:</span> {item.allergens.join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-900">
                            {item.isAddon ? `${item.totalQuantity} units` : `${item.totalQuantity} portions`}
                          </div>
                          <div className="text-sm text-orange-600">
                            {item.isAddon ? "addon items" : `${item.totalPeople} people`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                event schedule
              </h3>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {searchTerm ? "no bookings found matching your search." : "no bookings for this date."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        time
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">customer</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">contact</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <Users className="w-4 h-4 inline mr-1" />
                        guests
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">selected items</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">service</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        amount
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">status</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking, index) => (
                      <tr 
                        key={booking._id} 
                        className={`hover:bg-gray-50 ${
                          booking.status === 'cancelled' ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-3 py-3 font-mono text-blue-700 font-medium">
                          {getDeliveryTime(booking.deliveryDate)}
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.customerDetails?.name || "no name"}
                            </div>
                            <div className="text-xs text-gray-500">
                              #{booking.bookingReference}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {booking.customerDetails?.phone || "no phone"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {booking.customerDetails?.email?.substring(0, 15) + 
                               (booking.customerDetails?.email?.length > 15 ? "..." : "") || "no email"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-center">
                          {booking.peopleCount || 0}
                        </td>
                        <td className="px-3 py-3 max-w-xs">
                          <div className="text-xs text-gray-600 truncate" title={formatSelectedItems(booking.selectedItems)}>
                            {formatSelectedItems(booking.selectedItems)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs">
                            <div className="font-medium">
                              {booking.deliveryType || "not specified"}
                            </div>
                            {booking.venueSelection && (
                              <div className="text-gray-600">
                                {booking.venueSelection}
                              </div>
                            )}
                            <div className="text-gray-600">
                              {booking.orderSource?.sourceType === "customOrder" ? "custom" : "menu"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {booking.status !== "cancelled" ? (
                            <div className="text-xs">
                              <div className="font-medium text-green-700">
                                {formatPrice(booking.pricing?.total || 0)}
                              </div>
                              <div className="text-gray-600">
                                paid: {formatPrice(booking.depositAmount || 0)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-600 text-xs font-medium">cancelled</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              booking.status || "pending"
                            )}`}
                          >
                            {(booking.status || "pending").replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onKitchenDocket && onKitchenDocket(booking)}
                              className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 flex items-center gap-1"
                              title="kitchen print"
                            >
                              <ChefHat className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onPrintBooking && onPrintBooking(booking)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                              title="receipt print"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <select
                                value={booking.status || "pending"}
                                onChange={(e) => onStatusUpdate(booking._id, e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              >
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="preparing">preparing</option>
                                <option value="ready">ready</option>
                                <option value="completed">completed</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Update Form */}
          {showPaymentForm && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  update payment - {selectedBooking.customerDetails?.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      payment status
                    </label>
                    <select
                      value={paymentData.paymentStatus}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentStatus: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="pending">pending</option>
                      <option value="deposit_paid">deposit paid</option>
                      <option value="fully_paid">fully paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      amount paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedBooking.pricing?.total || 0}
                      value={paymentData.depositAmount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          depositAmount: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="enter amount"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      max: {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">total amount:</span>{" "}
                      {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">balance due:</span>{" "}
                      {formatPrice(
                        Math.max(
                          0,
                          (selectedBooking.pricing?.total || 0) -
                            (parseFloat(paymentData.depositAmount) || 0)
                        )
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentUpdate(selectedBooking._id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      update payment
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedBooking(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>
                total for{" "}
                {date
                  ? date instanceof Date
                    ? formatDate(date.toISOString())
                    : formatDate(date)
                  : "unknown date"}
                : {summary.totalBookings} events, {summary.totalPeople} guests,{" "}
                {formatPrice(summary.totalRevenue)} revenue
              </p>
              <p className="text-xs text-gray-500 mt-1">
                revenue excludes cancelled bookings
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;