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
  CalendarDays,
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
  const filteredBookings = sortedBookings.filter((booking) => {
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

  // Format selected items with sophisticated grouping logic including admin additions
  const formatSelectedItemsAsParagraphs = (
    selectedItems,
    isCustomOrder = false,
    adminAdditions = [],
    includeDetails = false
  ) => {
    if (!selectedItems || selectedItems.length === 0) {
      return adminAdditions && adminAdditions.length > 0
        ? `Admin Additions: ${adminAdditions
            .map((item) => `${item.name} (+${formatPrice(item.price)})`)
            .join(", ")}`
        : "No items";
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Group items and their choices
    const processedItems = [];
    const usedItems = new Set();

    selectedItems.forEach((item, index) => {
      if (usedItems.has(index)) return;

      // Check if this is a base item (like "Rice", "Curry", "Crackers")
      const relatedChoices = selectedItems.filter(
        (otherItem, otherIndex) =>
          otherIndex !== index &&
          otherItem.name.startsWith(item.name + " - ") &&
          !usedItems.has(otherIndex)
      );

      if (relatedChoices.length > 0) {
        // This item has choices - group them
        const choiceNames = relatedChoices.map((choice) =>
          choice.name.replace(item.name + " - ", "")
        );

        let description = `${item.name} (${choiceNames.join(", ")})`;

        if (item.quantity && item.quantity > 1) {
          description += ` (${item.quantity}x)`;
        }

        if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
          description += ` - ${formatCurrency(item.totalPrice)}`;
        }

        // Add admin additions for this item
        if (
          includeDetails &&
          item.adminAdditions &&
          item.adminAdditions.length > 0
        ) {
          const additions = item.adminAdditions
            .map((add) => `+${add.name} (${add.price})`)
            .join(", ");
          description += ` [Admin: ${additions}]`;
        }

        processedItems.push(description);

        // Mark related items as used
        relatedChoices.forEach((_, choiceIndex) => {
          const originalIndex = selectedItems.findIndex(
            (original) => original === relatedChoices[choiceIndex]
          );
          usedItems.add(originalIndex);
        });
        usedItems.add(index);
      } else if (!item.name.includes(" - ")) {
        // This is a standalone item (no choices)
        let description = item.name;

        if (item.quantity && item.quantity > 1) {
          description += ` (${item.quantity}x)`;
        }

        if (isCustomOrder && item.totalPrice && item.totalPrice > 0) {
          description += ` - ${formatCurrency(item.totalPrice)}`;
        }

        // Add admin additions for this item
        if (
          includeDetails &&
          item.adminAdditions &&
          item.adminAdditions.length > 0
        ) {
          const additions = item.adminAdditions
            .map((add) => `+${add.name} (${add.price})`)
            .join(", ");
          description += ` [Admin: ${additions}]`;
        }

        processedItems.push(description);
        usedItems.add(index);
      }
      // Skip items that are choices (contain " - ") and don't have a parent
    });

    // Add global admin additions
    if (includeDetails && adminAdditions && adminAdditions.length > 0) {
      const globalAdditions = adminAdditions.map((item) => `${item.name} `);
      processedItems.push(`${globalAdditions}`);
    }

    return processedItems.join(", ");
  };

  // Handle payment update with validation
  const handlePaymentUpdate = async (bookingId) => {
  try {
    const depositAmount = parseFloat(paymentData.depositAmount) || 0;
    const totalAmount = selectedBooking?.pricing?.total || 0;

    // Validate amount doesn't exceed total
    if (depositAmount > totalAmount) {
      alert(
        `Amount cannot exceed total amount of ${formatPrice(totalAmount)}`
      );
      return;
    }

    // Determine the correct payment status based on amount
    let finalPaymentStatus = paymentData.paymentStatus;
    let shouldUpdateBookingStatus = false;
    let newBookingStatus = selectedBooking?.status;

    if (depositAmount >= totalAmount && totalAmount > 0) {
      finalPaymentStatus = "fully_paid";
    } else if (depositAmount > 0 && depositAmount < totalAmount) {
      finalPaymentStatus = "deposit_paid";
      if (newBookingStatus === "pending") {
        shouldUpdateBookingStatus = true;
        newBookingStatus = "confirmed";
      }
    } else if (depositAmount === 0) {
      finalPaymentStatus = "pending";
    }

    // Update payment first
    await onPaymentUpdate(bookingId, {
      ...paymentData,
      depositAmount,
      paymentStatus: finalPaymentStatus,
    });

    // Update booking status if needed
    if (shouldUpdateBookingStatus && onStatusUpdate) {
      await onStatusUpdate(bookingId, newBookingStatus);
    }

    setShowPaymentForm(false);
    setSelectedBooking(null);
  } catch (error) {
    console.error("Error updating payment:", error);
  }
};


  // Handle amount change with validation
  const handleAmountChange = (value) => {
    const totalAmount = selectedBooking?.pricing?.total || 0;
    const numericValue = parseFloat(value) || 0;

    // Don't allow more than total amount
    if (numericValue > totalAmount) {
      setPaymentData({
        ...paymentData,
        depositAmount: totalAmount.toString(),
      });
    } else {
      setPaymentData({
        ...paymentData,
        depositAmount: value,
      });
    }
  };

  // Generate detailed PDF export for bookings table in tabular format
  const exportBookingsTableToPDF = () => {
    if (!date) {
      console.error("Date is required for PDF export");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation for better table fit
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPosition = margin;
    const lineHeight = 4;
    const sectionSpacing = 6;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        // Re-add table header on new page
        addTableHeader();
        return true;
      }
      return false;
    };

    // Helper function to add text
    const addText = (text, fontSize = 8, isBold = false, x = margin) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(text, x, yPosition);
      yPosition += lineHeight;
    };

    // Helper function to wrap text within column width
    const wrapText = (text, maxWidth) => {
      const lines = doc.splitTextToSize(text || "", maxWidth);
      return lines;
    };

    // Column definitions with optimized widths for landscape - larger columns for more details
    const columns = {
      time: { x: margin, width: 20, title: "Time" },
      customer: { x: margin + 20, width: 30, title: "Customer" },
      contact: { x: margin + 50, width: 35, title: "Contact" },
      guests: { x: margin + 85, width: 15, title: "Guests" },
      items: { x: margin + 100, width: 80, title: "Items & Notes" },
      service: { x: margin + 180, width: 25, title: "Service" },
      amount: { x: margin + 205, width: 25, title: "Amount" },
      status: { x: margin + 230, width: 20, title: "Status" },
      type: { x: margin + 250, width: 18, title: "Type" },
    };

    // Function to add table header
    const addTableHeader = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      // Header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 6, "F");

      // Header text
      Object.entries(columns).forEach(([key, col]) => {
        doc.text(col.title, col.x + 1, yPosition + 2);
      });

      yPosition += 6;

      // Header line
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 2;
    };

    // Function to add table row
    const addTableRow = (booking, isAlternate = false) => {
      const rowHeight = 25; // Increased row height for more content
      checkPageBreak(rowHeight + 5);

      const startY = yPosition;

      // Alternate row background
      if (isAlternate) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition - 1, pageWidth - 2 * margin, rowHeight, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6); // Even smaller font for more content

      // Time
      const deliveryTime = new Date(booking.deliveryDate).toLocaleTimeString(
        "en-AU",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );
      doc.text(deliveryTime, columns.time.x + 1, yPosition + 4);

      // Customer
      const customerText = `${booking.customerDetails?.name || "No name"}\n#${
        booking.bookingReference
      }`;
      const customerLines = wrapText(customerText, columns.customer.width - 2);
      customerLines.forEach((line, i) => {
        doc.text(line, columns.customer.x + 1, yPosition + 4 + i * 3);
      });

      // Contact
      const contactText = `${booking.customerDetails?.phone || "No phone"}\n${
        booking.customerDetails?.email?.substring(0, 25) +
          (booking.customerDetails?.email?.length > 25 ? "..." : "") ||
        "No email"
      }`;
      const contactLines = wrapText(contactText, columns.contact.width - 2);
      contactLines.forEach((line, i) => {
        doc.text(line, columns.contact.x + 1, yPosition + 4 + i * 3);
      });

      // Guests
      doc.text(
        `${booking.peopleCount || 0}`,
        columns.guests.x + 1,
        yPosition + 4
      );

      // Items & Notes - Enhanced section
      let itemsY = yPosition + 4;

      // Selected Items
      const itemsText = formatSelectedItemsAsParagraphs(
        booking.selectedItems,
        booking.orderSource?.sourceType === "customOrder",
        booking.adminAdditions,
        true
      );
      const itemsLines = wrapText(
        `Items: ${itemsText}`,
        columns.items.width - 2
      );
      itemsLines.slice(0, 4).forEach((line, i) => {
        doc.text(line, columns.items.x + 1, itemsY + i * 3);
      });
      itemsY += 12;

      // Admin Notes
      if (booking.adminNotes) {
        doc.setFont("helvetica", "bold");
        doc.text("Admin:", columns.items.x + 1, itemsY);
        doc.setFont("helvetica", "normal");
        const adminLines = wrapText(
          booking.adminNotes,
          columns.items.width - 15
        );
        adminLines.slice(0, 2).forEach((line, i) => {
          doc.text(line, columns.items.x + 15, itemsY + i * 3);
        });
        itemsY += 6;
      }

      // Special Instructions
      if (booking.specialInstructions) {
        doc.setFont("helvetica", "bold");
        doc.text("Special:", columns.items.x + 1, itemsY);
        doc.setFont("helvetica", "normal");
        const specialLines = wrapText(
          booking.specialInstructions,
          columns.items.width - 20
        );
        specialLines.slice(0, 1).forEach((line, i) => {
          doc.text(line, columns.items.x + 20, itemsY + i * 3);
        });
      }

      // Service
      // Service
      let serviceText = `${booking.deliveryType || "Not specified"}`;
      if (booking.venueSelection) {
        serviceText += `\n${booking.venueSelection.replace(/\b\w/g, (l) =>
          l.toUpperCase()
        )}`;
      }
      // Add delivery address for delivery orders
      if (booking.deliveryType === "Delivery" && booking.address) {
        const addressText = `${booking.address.street || ""} ${
          booking.address.suburb || ""
        } ${booking.address.state || ""} ${
          booking.address.postcode || ""
        }`.trim();
        if (addressText) {
          serviceText += `\nAddr: ${addressText}`;
        }
      }

      const serviceLines = wrapText(serviceText, columns.service.width - 2);
      serviceLines.forEach((line, i) => {
        doc.text(line, columns.service.x + 1, yPosition + 4 + i * 3);
      });

      // Amount
      if (booking.status !== "cancelled") {
        const amountText = `Total: ${formatPrice(
          booking.pricing?.total || 0
        )}\nPaid: ${formatPrice(
          booking.depositAmount || 0
        )}\nDue: ${formatPrice(
          (booking.pricing?.total || 0) - (booking.depositAmount || 0)
        )}`;
        const amountLines = wrapText(amountText, columns.amount.width - 2);
        amountLines.forEach((line, i) => {
          doc.text(line, columns.amount.x + 1, yPosition + 4 + i * 3);
        });
      } else {
        doc.text("Cancelled", columns.amount.x + 1, yPosition + 4);
      }

      // Status
      const status = (booking.status || "pending")
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      doc.text(status, columns.status.x + 1, yPosition + 4);

      // Type
      const orderType =
        booking.orderSource?.sourceType === "customOrder" ? "Custom" : "Menu";
      doc.text(orderType, columns.type.x + 1, yPosition + 4);

      // Row border
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(
        margin,
        yPosition + rowHeight,
        pageWidth - margin,
        yPosition + rowHeight
      );

      yPosition += rowHeight;
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MC Catering Services", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(14);
    doc.text("EVENT SCHEDULE TABLE", margin, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Date: ${
        date instanceof Date ? formatDate(date.toISOString()) : formatDate(date)
      }`,
      margin,
      yPosition
    );
    yPosition += 4;

    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += sectionSpacing;

    // Summary
    const summary = getDaySummary();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SUMMARY:", margin, yPosition);
    yPosition += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Events: ${summary.totalBookings} (${
        summary.activeBookings
      } active) | Guests: ${summary.totalPeople} | Revenue: ${formatPrice(
        summary.totalRevenue
      )} | Paid: ${formatPrice(summary.totalPaid)}`,
      margin,
      yPosition
    );
    yPosition += sectionSpacing;

    // Separator line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    // Table header
    addTableHeader();

    // Table rows
    sortedBookings.forEach((booking, index) => {
      addTableRow(booking, index % 2 === 1);
    });

    // Footer
    yPosition += sectionSpacing;
    checkPageBreak(15);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      `TOTALS: Revenue: ${formatPrice(
        summary.totalRevenue
      )} | Paid: ${formatPrice(summary.totalPaid)} | Balance: ${formatPrice(
        summary.totalRevenue - summary.totalPaid
      )}`,
      margin,
      yPosition
    );

    // Save the PDF
    const safeDate = date
      ? (date instanceof Date
          ? formatDate(date.toISOString())
          : formatDate(date)
        ).replace(/\//g, "-")
      : "Unknown_Date";
    doc.save(`Event_Schedule_Table_${safeDate}.pdf`);
  };

  // Aggregated items by name across all active bookings - UPDATED TO INCLUDE ADMIN ADDITIONS
  const getAggregatedItems = () => {
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const itemsMap = new Map();

    // Helper function to process items (both selected items and admin additions)
    const processItem = (item, booking, isAdminAddition = false) => {
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
          isAdminAddition: isAdminAddition,
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
          category:
            item.category || (isAdminAddition ? "admin-addition" : "other"),
          totalQuantity: itemQuantity,
          totalPeople: booking.peopleCount || 0,
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          allergens: item.allergens || [],
          isAddon: isAddon,
          isAdminAddition: isAdminAddition,
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
              isAdminAddition: isAdminAddition,
            },
          ],
        });
      }
    };

    activeBookings.forEach((booking) => {
      // Process regular selected items
      if (booking.selectedItems && Array.isArray(booking.selectedItems)) {
        booking.selectedItems.forEach((item) => {
          processItem(item, booking, false);

          // Process admin additions within selected items
          if (item.adminAdditions && Array.isArray(item.adminAdditions)) {
            item.adminAdditions.forEach((adminItem) => {
              processItem(adminItem, booking, true);
            });
          }
        });
      }

      // Process global admin additions
      if (booking.adminAdditions && Array.isArray(booking.adminAdditions)) {
        booking.adminAdditions.forEach((adminItem) => {
          processItem(adminItem, booking, true);
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
      case "admin-addition":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeliveryTime = (deliveryDate) => {
    const date = new Date(deliveryDate);
    return date.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
              {summary.totalBookings} events ({summary.activeBookings} active) •{" "}
              {summary.totalPeople} guests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="hover:bg-green-700 p-1 rounded"
            >
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
                Total guests
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalPeople}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total revenue
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {formatPrice(summary.totalRevenue)}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">
                Amount paid
              </h3>
              <p className="text-2xl font-bold text-orange-900">
                {formatPrice(summary.totalPaid)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-purple-800 mb-2">Events</h3>
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
                  Show kitchen view
                </label>
              </div>
            </div>
          </div>
          {/* Status Overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Status overview
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    status
                  )}`}
                >
                  {status
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  : {count}
                </span>
              ))}
            </div>
          </div>
          {/* Kitchen Requirements */}
          {showKitchen && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Kitchen preparation requirements
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Generate kitchen-specific print
                      const kitchenDoc = new jsPDF();
                      kitchenDoc.setFontSize(20);
                      kitchenDoc.text("KITCHEN REQUIREMENTS", 20, 30);
                      kitchenDoc.setFontSize(14);
                      kitchenDoc.text(
                        `Date: ${
                          date instanceof Date
                            ? formatDate(date.toISOString())
                            : formatDate(date)
                        }`,
                        20,
                        45
                      );

                      let yPos = 60;
                      filteredItems.forEach((item, index) => {
                        if (yPos > 250) {
                          kitchenDoc.addPage();
                          yPos = 30;
                        }
                        kitchenDoc.setFontSize(12);
                        kitchenDoc.text(`${index + 1}. ${item.name}`, 20, yPos);
                        kitchenDoc.setFontSize(10);
                        kitchenDoc.text(
                          `   ${
                            item.isAddon || item.isAdminAddition
                              ? `${item.totalQuantity} units for ${item.totalPeople} people`
                              : `${item.totalQuantity} portions for ${item.totalPeople} people`
                          }`,
                          20,
                          yPos + 10
                        );
                        kitchenDoc.text(
                          `   Category: ${
                            item.isAdminAddition
                              ? "Admin Addition"
                              : item.category || "Other"
                          }`,
                          20,
                          yPos + 20
                        );
                        if (item.allergens && item.allergens.length > 0) {
                          kitchenDoc.text(
                            `   ALLERGENS: ${item.allergens.join(", ")}`,
                            20,
                            yPos + 30
                          );
                          yPos += 10;
                        }
                        // Add booking breakdown for multiple events
                        if (item.bookings && item.bookings.length > 1) {
                          kitchenDoc.text(
                            `   Events (${
                              item.bookings.length
                            }): ${item.bookings
                              .map((b) => `#${b.bookingRef}(${b.quantity}x)`)
                              .join(", ")}`,
                            20,
                            yPos + 30
                          );
                          yPos += 10;
                        }
                        yPos += 40;
                      });

                      const safeDate = date
                        ? (date instanceof Date
                            ? formatDate(date.toISOString())
                            : formatDate(date)
                          ).replace(/\//g, "-")
                        : "Unknown_Date";
                      kitchenDoc.save(`Kitchen_Requirements_${safeDate}.pdf`);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Kitchen print
                  </button>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  {searchTerm
                    ? "No items found matching your search."
                    : "No items to prepare."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-orange-200 rounded p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs ${getCategoryColor(
                                item.category
                              )}`}
                            >
                              {item.isAdminAddition
                                ? "Admin Addition"
                                : item.category || "Other"}
                            </span>
                            {item.isVegetarian && (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Vegetarian
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Vegan
                              </span>
                            )}
                            {/* Show booking count if item appears in multiple bookings */}
                            {item.bookings && item.bookings.length > 1 && (
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                                {item.bookings.length} events
                              </span>
                            )}
                          </div>
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="mt-1 text-xs text-red-600">
                              <span className="font-medium">Allergens:</span>{" "}
                              {item.allergens.join(", ")}
                            </div>
                          )}
                          {/* Show breakdown by booking if multiple events */}
                          {item.bookings && item.bookings.length > 1 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">
                                Event breakdown:
                              </span>
                              <div className="ml-2 space-y-1">
                                {item.bookings.map((booking, bookingIndex) => (
                                  <div
                                    key={bookingIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-blue-600">
                                      #{booking.bookingRef}
                                    </span>
                                    <span>{booking.customerName}</span>
                                    <span className="text-gray-500">
                                      {booking.quantity}x ({booking.peopleCount}{" "}
                                      guests)
                                    </span>
                                    {booking.isAdminAddition && (
                                      <span className="px-1 py-0.5 rounded text-xs bg-red-100 text-red-700">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-900">
                            {item.isAddon || item.isAdminAddition
                              ? `${item.totalQuantity} units`
                              : `${item.totalQuantity} portions`}
                          </div>
                          <div className="text-sm text-orange-600">
                            {item.isAddon || item.isAdminAddition
                              ? `${item.totalPeople} people`
                              : `${item.totalPeople} people`}
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
                Event schedule
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportBookingsTableToPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  title="Export event schedule to PDF"
                >
                  <FileDown className="w-4 h-4" />
                  Export Schedule
                </button>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {searchTerm
                  ? "No bookings found matching your search."
                  : "No bookings for this date."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Time
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        Customer
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        Contact
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <Users className="w-4 h-4 inline mr-1" />
                        Guests
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700 w-80">
                        Selected items & Notes
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        Service
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Amount
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking, index) => (
                      <tr
                        key={booking._id}
                        className={`hover:bg-gray-50 ${
                          booking.status === "cancelled" ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-3 py-3 font-mono text-blue-700 font-medium">
                          {getDeliveryTime(booking.deliveryDate)}
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.customerDetails?.name || "No name"}
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
                              {booking.customerDetails?.phone || "No phone"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {booking.customerDetails?.email?.substring(
                                0,
                                15
                              ) +
                                (booking.customerDetails?.email?.length > 15
                                  ? "..."
                                  : "") || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-center">
                          {booking.peopleCount || 0}
                        </td>
                        <td className="px-3 py-3 max-w-md">
                          <div className="text-xs text-gray-600 max-h-24 overflow-y-auto">
                            <div className="mb-2">
                              <span className="font-medium text-gray-800">
                                Items:
                              </span>
                              <div className="mt-1">
                                {formatSelectedItemsAsParagraphs(
                                  booking.selectedItems,
                                  booking.orderSource?.sourceType ===
                                    "customOrder",
                                  booking.adminAdditions,
                                  true
                                )}
                              </div>
                            </div>

                            {/* Admin Notes */}
                            {booking.adminNotes && (
                              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <span className="font-medium text-yellow-800">
                                  Admin Notes:
                                </span>
                                <div className="text-yellow-700 mt-1">
                                  {booking.adminNotes}
                                </div>
                              </div>
                            )}

                            {/* Special Instructions */}
                            {booking.specialInstructions && (
                              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <span className="font-medium text-blue-800">
                                  Special Instructions:
                                </span>
                                <div className="text-blue-700 mt-1">
                                  {booking.specialInstructions}
                                </div>
                              </div>
                            )}

                            {/* Customer Notes */}
                            {booking.customerDetails?.notes && (
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                                <span className="font-medium text-gray-800">
                                  Customer Notes:
                                </span>
                                <div className="text-gray-700 mt-1">
                                  {booking.customerDetails.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs">
                            <div className="font-medium">
                              {booking.deliveryType || "Not specified"}
                            </div>
                            {booking.venueSelection && (
                              <div className="text-gray-600">
                                {booking.venueSelection.replace(/\b\w/g, (l) =>
                                  l.toUpperCase()
                                )}
                              </div>
                            )}
                            <div className="text-gray-600">
                              {booking.orderSource?.sourceType === "customOrder"
                                ? "Custom"
                                : "Menu"}
                            </div>
                            {/* Add delivery address if delivery type is Delivery */}
                            {booking.deliveryType === "Delivery" &&
                              booking.address && (
                                <div className="text-gray-500 text-xs mt-1">
                                  (
                                  {`${booking.address.street || ""} ${
                                    booking.address.suburb || ""
                                  } ${booking.address.state || ""} ${
                                    booking.address.postcode || ""
                                  }`.trim()}
                                  )
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {booking.status !== "cancelled" ? (
                            <div className="text-xs">
                              <div className="font-medium text-green-700">
                                {formatPrice(booking.pricing?.total || 0)}
                              </div>
                              <div className="text-gray-600">
                                Paid: {formatPrice(booking.depositAmount || 0)}
                              </div>
                              {/* Payment Update Option */}
                              {(booking.pricing?.total || 0) >
                                (booking.depositAmount || 0) &&
                                booking.status !== "cancelled" && (
                                  <button
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setPaymentData({
                                        paymentStatus:
                                          booking.paymentStatus || "pending",
                                        depositAmount: (
                                          booking.depositAmount || 0
                                        ).toString(),
                                      });
                                      setShowPaymentForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
                                  >
                                    Update payment
                                  </button>
                                )}
                            </div>
                          ) : (
                            <span className="text-red-600 text-xs font-medium">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              booking.status || "pending"
                            )}`}
                          >
                            {(booking.status || "pending")
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                onKitchenDocket && onKitchenDocket(booking)
                              }
                              className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 flex items-center gap-1"
                              title="Kitchen print"
                            >
                              <ChefHat className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                onPrintBooking && onPrintBooking(booking)
                              }
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                              title="Receipt print"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                            {booking.status !== "cancelled" &&
                              booking.status !== "completed" && (
                                <select
                                  value={booking.status || "pending"}
                                  onChange={(e) =>
                                    onStatusUpdate(booking._id, e.target.value)
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="ready">Ready</option>
                                  <option value="completed">Completed</option>
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
                  Update payment - {selectedBooking.customerDetails?.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment status
                    </label>
                    <select
                      value={paymentData.paymentStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value;

                        if (newStatus === "fully_paid") {
                          // always fill with total when switching to fully paid
                          const totalAmount =
                            selectedBooking?.pricing?.total || 0;
                          setPaymentData({
                            ...paymentData,
                            paymentStatus: newStatus,
                            depositAmount: totalAmount.toString(),
                          });
                        } else if (newStatus === "deposit_paid") {
                          // go back to whatever was already paid (or 0)
                          setPaymentData({
                            ...paymentData,
                            paymentStatus: newStatus,
                            depositAmount:
                              selectedBooking?.depositAmount?.toString() || "0",
                          });
                        } else {
                          // pending: zero amount
                          setPaymentData({
                            ...paymentData,
                            paymentStatus: newStatus,
                            depositAmount: "0",
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="pending">Pending</option>
                      <option value="deposit_paid">Deposit paid</option>
                      <option value="fully_paid">Fully paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedBooking.pricing?.total || 0}
                      value={paymentData.depositAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Max: {formatPrice(selectedBooking.pricing?.total)} |
                      Remaining:{" "}
                      {formatPrice(
                        Math.max(
                          0,
                          (selectedBooking.pricing?.total || 0) -
                            (selectedBooking.depositAmount || 0)
                        )
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total amount:</span>{" "}
                      {formatPrice(selectedBooking.pricing?.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Balance due:</span>{" "}
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
                      Update payment
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedBooking(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
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
                Total for{" "}
                {date
                  ? date instanceof Date
                    ? formatDate(date.toISOString())
                    : formatDate(date)
                  : "Unknown date"}
                : {summary.totalBookings} events, {summary.totalPeople} guests,{" "}
                {formatPrice(summary.totalRevenue)} revenue
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Revenue excludes cancelled bookings
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
