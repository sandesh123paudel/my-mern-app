import React, { useRef } from "react";
import { X, Printer } from "lucide-react";

const KitchenDocketModal = ({ booking, onClose, formatDateTime , formatPrice }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kitchen Docket - ${booking.bookingReference}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 15px;
              background: white;
              color: black;
              line-height: 1.2;
            }
            .docket {
              width: 80mm;
              max-width: 220px;
              margin: 0 auto;
              padding: 8px;
              border: 2px solid #000;
              background: white;
            }
            .docket-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 2px solid #000;
              text-transform: uppercase;
            }
            .section {
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 1px dashed #999;
            }
            .section:last-child {
              border-bottom: none;
            }
            .section-title {
              font-weight: bold;
              font-size: 10px;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .line-item {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              margin-bottom: 1px;
              font-weight: 600;
            }
            .item-line {
              font-size: 9px;
              margin-bottom: 1px;
              font-weight: 500;
              padding-left: 5px;
            }
            .order-ref {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 6px;
              background: #f0f0f0;
              padding: 4px;
            }
            .delivery-info {
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 6px;
              background: #e8f4fd;
              padding: 4px;
            }
            .urgent {
              background: #ffebee !important;
              color: #c62828 !important;
            }
            .people-count {
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 6px;
              background: #f5f5f5;
              padding: 3px;
            }
            .dietary-alert {
              background: #fff3cd;
              color: #856404;
              padding: 3px;
              font-size: 8px;
              font-weight: bold;
              margin-bottom: 4px;
              text-align: center;
            }
            .special-notes {
              background: #e8f5e8;
              padding: 4px;
              font-size: 8px;
              margin-bottom: 4px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .docket { border: 2px solid #000; }
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

  // Check if delivery is urgent (within 24 hours)
  const isUrgent = () => {
    const now = new Date();
    const delivery = new Date(booking.deliveryDate);
    const hoursDiff = (delivery - now) / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff > 0;
  };

  const calculateTotals = () => {
    const total = booking.pricing?.total || 0;
    const paid = booking.depositAmount || 0;
    const balance = total - paid;
    return { total, paid, balance };
  };

  return (
    <div className="fixed inset-0 top-[-50px] bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Kitchen Docket
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
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
              <div className="docket">
                {/* Title */}
                <div className="docket-title">Kitchen Docket</div>

                {/* Order Reference */}
                <div className="order-ref">{booking.bookingReference}</div>

                {/* Delivery Info */}
                <div className={`delivery-info ${isUrgent() ? "urgent" : ""}`}>
                  {booking.deliveryType}: {formatDateTime(booking.deliveryDate)}
                  {isUrgent() && <div>⚠ URGENT - WITHIN 24 HRS</div>}
                </div>

                {/* People Count */}
                <div className="people-count">
                  FOR {booking.peopleCount} PEOPLE
                </div>

                {/* Customer Info */}
                <div className="section">
                  <div className="section-title">Customer</div>
                  <div className="line-item">
                    <span>Name:</span>
                    <span>{booking.customerDetails?.name}</span>
                  </div>
                  <div className="line-item">
                    <span>Phone:</span>
                    <span>{booking.customerDetails?.phone}</span>
                  </div>
                  {booking.deliveryType === "Delivery" && booking.address && (
                    <div style={{ fontSize: "8px", marginTop: "2px" }}>
                      <strong>Address:</strong>
                      <br />
                      {booking.address.street}
                      <br />
                      {booking.address.suburb}, {booking.address.state}
                      <br />
                      {booking.address.postcode}
                    </div>
                  )}
                </div>

                {/* Dietary Alerts */}
                {(booking.customerDetails?.dietaryRequirements?.length > 0 ||
                  (booking.customerDetails?.spiceLevel &&
                    booking.customerDetails.spiceLevel !== "medium")) && (
                  <div className="dietary-alert">
                    {booking.customerDetails.dietaryRequirements?.length >
                      0 && (
                      <div>
                        DIETARY:{" "}
                        {booking.customerDetails.dietaryRequirements
                          .join(", ")
                          .toUpperCase()}
                      </div>
                    )}
                    {booking.customerDetails.spiceLevel &&
                      booking.customerDetails.spiceLevel !== "medium" && (
                        <div>
                          SPICE:{" "}
                          {booking.customerDetails.spiceLevel.toUpperCase()}
                        </div>
                      )}
                  </div>
                )}

                {/* Items to Prepare */}
                <div className="section">
                  <div className="section-title">Items to Prepare</div>
                  {(() => {
                    const processedItems = [];
                    const usedItems = new Set();

                    booking.selectedItems?.forEach((item, index) => {
                      if (usedItems.has(index)) return;

                      // Check if this is a base item with choices
                      const relatedChoices = booking.selectedItems.filter(
                        (otherItem, otherIndex) =>
                          otherIndex !== index &&
                          otherItem.name.startsWith(item.name + " - ") &&
                          !usedItems.has(otherIndex)
                      );

                      if (relatedChoices.length > 0) {
                        // Group choices with base item
                        const choiceNames = relatedChoices.map((choice) =>
                          choice.name.replace(item.name + " - ", "")
                        );

                        processedItems.push({
                          name: `${item.name} (${choiceNames.join(", ")})`,
                          quantity: item.quantity,
                        });

                        // Mark related items as used
                        relatedChoices.forEach((_, choiceIndex) => {
                          const originalIndex = booking.selectedItems.findIndex(
                            (original) =>
                              original === relatedChoices[choiceIndex]
                          );
                          usedItems.add(originalIndex);
                        });
                        usedItems.add(index);
                      } else if (!item.name.includes(" - ")) {
                        // Standalone item
                        processedItems.push({
                          name: item.name,
                          quantity: item.quantity,
                        });
                        usedItems.add(index);
                      }
                    });

                    booking.adminAdditions?.forEach((item, index) => {
                      processedItems.push({
                        name: item.name,
                      });
                    });

                    return processedItems.map((item, index) => (
                      <div key={index} className="item-line">
                        • {item.name}
                        {item.quantity &&
                          item.quantity > 1 &&
                          ` (${item.quantity}x)`}
                      </div>
                    ));
                  })()}
                </div>

                {/* Special Instructions */}
                {booking.customerDetails?.specialInstructions && (
                  <div className="special-notes">
                    <strong>SPECIAL INSTRUCTIONS:</strong>
                    <br />
                    {booking.customerDetails.specialInstructions}
                  </div>
                )}

                {/* Admin Notes */}
                {booking.adminNotes && (
                  <div className="special-notes">
                    <strong>KITCHEN NOTES:</strong>
                    <br />
                    {booking.adminNotes}
                  </div>
                )}

                {calculateTotals().balance > 0 && (
                  <div className="line-item">
                    <span>Balance Due:</span>
                    <span>{formatPrice(calculateTotals().balance)}</span>
                  </div>
                )}

                {/* Venue Info for Functions */}
                {booking.venueSelection && (
                  <div className="section">
                    <div className="section-title">Venue Setup</div>
                    <div className="line-item">
                      <span>Area:</span>
                      <span>{booking.venueSelection.toUpperCase()}</span>
                    </div>
                  </div>
                )}

                {/* Print Time */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "7px",
                    marginTop: "10px",
                    borderTop: "1px solid #000",
                    paddingTop: "4px",
                  }}
                >
                  Printed: {formatDateTime(new Date())}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDocketModal;
