import React, { useRef } from "react";
import { X, Printer } from "lucide-react";

const BookingPrintModal = ({
  booking,
  onClose,
  formatPrice,
  formatDate,
  formatDateTime,
}) => {
  const printRef = useRef();

  // Get location details based on booking location
  const getLocationDetails = () => {
    const locationName = booking.orderSource?.locationName?.toLowerCase() || "";

    if (locationName.includes("sydney") || locationName.includes("campsie")) {
      return {
        name: "MC Catering Services Sydney",
        address: "66 Evaline St, Campsie NSW 2194, Australia",
        phone: "+61297873769 / 0452453028 / 0449 557 777",
        email: "anu_np43@hotmail.com",
        city: "Sydney",
      };
    } else if (
      locationName.includes("canberra") ||
      locationName.includes("mawson")
    ) {
      return {
        name: "MC Catering Services Canberra",
        address: "4/118 Mawson Pl, Mawson ACT 2607, Australia",
        phone: "+61297188773 / 0452453028 / 0449 557 777",
        email: "anu_np43@hotmail.com",
        city: "Canberra",
      };
    } else {
      // Default location
      return {
        name: "MC Catering Services",
        address: "66 Evaline St, Campsie NSW 2194, Australia",
        phone: "+61297873769 / 0452453028 / 0449 557 777",
        email: "anu_np43@hotmail.com",
        city: "Sydney",
      };
    }
  };

  const locationDetails = getLocationDetails();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Receipt - ${booking.bookingReference}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
              line-height: 1.4;
            }
            .receipt {
              width: 80mm;
              max-width: 220px;
              margin: 0 auto;
              padding: 10px;
              border: 1px solid #ddd;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .company-info {
              font-size: 9px;
              margin-bottom: 1px;
            }
            .website {
              font-size: 8px;
              margin-top: 3px;
              font-style: italic;
            }
            .section {
              margin-bottom: 15px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .section:last-child {
              border-bottom: none;
            }
            .section-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .line-item {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-bottom: 3px;
            }
            .item-line {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              margin-bottom: 2px;
              margin-left: 5px;
            }
            .total-line {
              font-weight: bold;
              font-size: 12px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #FEF3C7; color: #92400E; }
            .status-confirmed { background: #D1FAE5; color: #065F46; }
            .status-preparing { background: #DBEAFE; color: #1E40AF; }
            .status-ready { background: #E9D5FF; color: #6B21A8; }
            .status-completed { background: #A7F3D0; color: #047857; }
            .status-cancelled { background: #FEE2E2; color: #991B1B; }
            .footer {
              text-align: center;
              font-size: 9px;
              margin-top: 15px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .order-type-badge {
              background: #E5E7EB;
              color: #374151;
              padding: 1px 4px;
              border-radius: 2px;
              font-size: 8px;
              font-weight: bold;
            }
            .custom-order-badge {
              background: #DDD6FE;
              color: #6B21A8;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const calculateTotals = () => {
    const total = booking.pricing?.total || 0;
    const paid = booking.depositAmount || 0;
    const balance = total - paid;
    return { total, paid, balance };
  };

  const { total, paid, balance } = calculateTotals();
  const isCustomOrder = booking.orderSource?.sourceType === "customOrder";

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Print Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="p-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div ref={printRef}>
              <div className="receipt">
                {/* Header */}
                <div className="header">
                  <div className="company-name">{locationDetails.name}</div>
                  <div className="company-info">{locationDetails.address}</div>
                  <div className="company-info">
                    Ph: {locationDetails.phone}
                  </div>
                  <div className="company-info">{locationDetails.email}</div>
                  <div className="website">https://mccatering.com.au/</div>
                </div>

                {/* Booking Details */}
                <div className="section">
                  <div className="section-title">Booking Details</div>
                  <div className="line-item">
                    <span>Reference:</span>
                    <span>{booking.bookingReference}</span>
                  </div>
                  <div className="line-item">
                    <span>Date:</span>
                    <span>{formatDate(booking.orderDate)}</span>
                  </div>
                  <div className="line-item">
                    <span>Delivery:</span>
                    <span>{formatDateTime(booking.deliveryDate)}</span>
                  </div>
                  <div className="line-item">
                    <span>Type:</span>
                    <span>{booking.deliveryType}</span>
                  </div>
                  {booking.venueSelection && (
                    <div className="line-item">
                      <span>Venue:</span>
                      <span>{booking.venueSelection.toUpperCase()}</span>
                    </div>
                  )}
                  {booking.venueCharge > 0 && (
                    <div className="line-item">
                      <span>Venue Charge:</span>
                      <span>{formatPrice(booking.venueCharge)}</span>
                    </div>
                  )}

                  <div className="line-item">
                    <span>Order:</span>
                    <span
                      className={
                        isCustomOrder
                          ? "custom-order-badge order-type-badge"
                          : "order-type-badge"
                      }
                    >
                      {isCustomOrder ? "CUSTOM" : "MENU"}
                    </span>
                  </div>
                  <div className="line-item">
                    <span>Status:</span>
                    <span className={getStatusClass(booking.status)}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="section">
                  <div className="section-title">Customer</div>
                  <div className="line-item">
                    <span>Name:</span>
                    <span>{booking.customerDetails?.name}</span>
                  </div>
                  <div className="line-item">
                    <span>Email:</span>
                    <span>{booking.customerDetails?.email}</span>
                  </div>
                  <div className="line-item">
                    <span>Phone:</span>
                    <span>{booking.customerDetails?.phone}</span>
                  </div>
                  <div className="line-item">
                    <span>People:</span>
                    <span>{booking.peopleCount}</span>
                  </div>

                  {/* Dietary Requirements */}
                  {booking.customerDetails?.dietaryRequirements?.length > 0 && (
                    <div className="line-item">
                      <span>Dietary:</span>
                      <span>
                        {booking.customerDetails.dietaryRequirements.join(", ")}
                      </span>
                    </div>
                  )}

                  {booking.customerDetails?.spiceLevel &&
                    booking.customerDetails.spiceLevel !== "medium" && (
                      <div className="line-item">
                        <span>Spice:</span>
                        <span>{booking.customerDetails.spiceLevel}</span>
                      </div>
                    )}
                </div>

                {/* Address (if delivery) */}
                {booking.deliveryType === "Delivery" && booking.address && (
                  <div className="section">
                    <div className="section-title">Delivery Address</div>
                    <div style={{ fontSize: "10px" }}>
                      {booking.address.street}
                      <br />
                      {booking.address.suburb}, {booking.address.state}
                      <br />
                      {booking.address.postcode}
                    </div>
                  </div>
                )}

                {/* Service Details */}
                <div className="section">
                  <div className="section-title">Service Details</div>
                  <div className="line-item">
                    <span>Service:</span>
                    <span>{booking.orderSource?.sourceName || "N/A"}</span>
                  </div>
                  <div className="line-item">
                    <span>Type:</span>
                    <span>{booking.orderSource?.serviceName || "N/A"}</span>
                  </div>
                  <div className="line-item">
                    <span>Location:</span>
                    <span>{booking.orderSource?.locationName || "N/A"}</span>
                  </div>
                </div>

                {/* Selected Items */}
                {booking.selectedItems?.length > 0 && (
                  <div className="section">
                    <div className="section-title">Selected Items</div>
                    {booking.selectedItems.map((item, index) => {
                      const isAddon =
                        item.category === "addons" || item.type === "addon";
                      const showQuantity =
                        isAddon && item.quantity && item.quantity > 1;

                      return (
                        <div key={index}>
                          <div className="item-line">
                            <span>• {item.name}</span>
                            <span>
                              {showQuantity
                                ? `${item.quantity}x`
                                : "per person"}
                            </span>
                          </div>
                          {isCustomOrder && item.totalPrice && (
                            <div
                              className="item-line"
                              style={{
                                marginLeft: "10px",
                                fontSize: "8px",
                                color: "#666",
                              }}
                            >
                              <span>Price:</span>
                              <span>{formatPrice(item.totalPrice)}</span>
                            </div>
                          )}
                          {item.category && (
                            <div
                              className="item-line"
                              style={{
                                marginLeft: "10px",
                                fontSize: "8px",
                                color: "#666",
                              }}
                            >
                              <span>Category:</span>
                              <span>{item.category}</span>
                            </div>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <div
                              className="item-line"
                              style={{
                                marginLeft: "10px",
                                fontSize: "8px",
                                color: "#d97706",
                              }}
                            >
                              <span>Allergens:</span>
                              <span>{item.allergens.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Items Summary */}
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "9px",
                        color: "#666",
                        borderTop: "1px solid #ddd",
                        paddingTop: "5px",
                      }}
                    >
                      <div className="line-item">
                        <span>Total Items:</span>
                        <span>{booking.selectedItems.length}</span>
                      </div>
                      <div className="line-item">
                        <span>Total Quantity:</span>
                        <span>
                          {booking.selectedItems.reduce(
                            (sum, item) => sum + (item.quantity || 1),
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="section">
                  <div className="section-title">Pricing</div>
                  {!isCustomOrder && (
                    <>
                      <div className="line-item">
                        <span>Base Price:</span>
                        <span>
                          {formatPrice(booking.pricing?.basePrice || 0)}
                        </span>
                      </div>
                      {booking.pricing?.addonsPrice > 0 && (
                        <div className="line-item">
                          <span>Add-ons:</span>
                          <span>
                            {formatPrice(booking.pricing?.addonsPrice || 0)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* For custom orders, show item-based pricing if available */}
                  {isCustomOrder &&
                    booking.selectedItems?.some((item) => item.totalPrice) && (
                      <div style={{ fontSize: "9px", marginBottom: "5px" }}>
                        <div>Items Total:</div>
                        {booking.selectedItems
                          .filter((item) => item.totalPrice)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="line-item"
                              style={{ marginLeft: "5px" }}
                            >
                              <span>{item.name}:</span>
                              <span>{formatPrice(item.totalPrice)}</span>
                            </div>
                          ))}
                      </div>
                    )}

                  {booking.venueCharge > 0 && (
                    <div className="line-item">
                      <span>Venue Charge:</span>
                      <span>{formatPrice(booking.venueCharge)}</span>
                    </div>
                  )}
                  <div className="line-item total-line">
                    <span>TOTAL:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {paid > 0 && (
                    <div className="line-item">
                      <span>Paid:</span>
                      <span>{formatPrice(paid)}</span>
                    </div>
                  )}
                  {balance > 0 && (
                    <div className="line-item">
                      <span>Balance:</span>
                      <span>{formatPrice(balance)}</span>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                {booking.customerDetails?.specialInstructions && (
                  <div className="section">
                    <div className="section-title">Special Instructions</div>
                    <div style={{ fontSize: "9px" }}>
                      {booking.customerDetails.specialInstructions}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {booking.adminNotes && (
                  <div className="section">
                    <div className="section-title">Admin Notes</div>
                    <div style={{ fontSize: "9px" }}>{booking.adminNotes}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="footer">
                  <div>Thank you for choosing MC Catering Services!</div>
                  <div>
                    For tracking & updates call:{" "}
                    {locationDetails.phone.split(" / ")[0]}
                  </div>
                  <div>Website: https://mccatering.com.au//</div>
                  <div>Printed: {formatDateTime(new Date())}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPrintModal;
