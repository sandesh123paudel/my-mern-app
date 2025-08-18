import React, { useState } from "react";
import { Save, X, CreditCard, Eye, EyeOff } from "lucide-react";

const LocationFormModal = ({ 
  isOpen, 
  onClose, 
  locationForm, 
  setLocationForm, 
  onSave, 
  editingLocation,
  loading 
}) => {
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [activeSection, setActiveSection] = useState("basic"); // "basic" or "bank"

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  const validateBSB = (bsb) => {
    return /^\d{6}$/.test(bsb);
  };

  const validateAccountNumber = (accountNumber) => {
    return /^\d{6,10}$/.test(accountNumber);
  };

  const formatBSB = (value) => {
    // Remove non-digits and limit to 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    // Format as XXX-XXX
    if (digits.length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const handleBSBChange = (e) => {
    const formatted = formatBSB(e.target.value);
    setLocationForm(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        bsb: formatted.replace('-', '') // Store without dash
      }
    }));
  };

  const toggleBankDetailsSection = () => {
    if (!locationForm.bankDetails) {
      setLocationForm(prev => ({
        ...prev,
        bankDetails: {
          bankName: "",
          accountName: "",
          bsb: "",
          accountNumber: "",
          reference: "",
          isActive: true
        }
      }));
    }
    setShowBankDetails(!showBankDetails);
  };

  const isBankDetailsValid = () => {
    if (!locationForm.bankDetails) return true; // Optional section
    const { bankName, accountName, bsb, accountNumber } = locationForm.bankDetails;
    
    if (!bankName && !accountName && !bsb && !accountNumber) {
      return true; // All empty is fine
    }
    
    // If any field is filled, all required fields must be filled
    return bankName && accountName && validateBSB(bsb) && validateAccountNumber(accountNumber);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {editingLocation ? "Edit Location" : "Add New Location"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveSection("basic")}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === "basic"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("bank")}
            className={`px-4 py-2 font-medium text-sm border-b-2 flex items-center gap-2 ${
              activeSection === "bank"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CreditCard size={16} />
            Bank Details
            {locationForm.bankDetails?.bankName && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                Configured
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          {activeSection === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={locationForm.name}
                    onChange={(e) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., MC Catering Sydney"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Sydney"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={locationForm.address}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Full address including street, city, postal code"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={locationForm.contactInfo.phone}
                    onChange={(e) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          phone: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+61 2 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={locationForm.contactInfo.email}
                    onChange={(e) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          email: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="location@mccatering.com.au"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={locationForm.isActive}
                    onChange={(e) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Active Location</span>
                </label>
              </div>
            </div>
          )}

          {/* Bank Details Section */}
          {activeSection === "bank" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="text-blue-600" size={20} />
                  <h3 className="font-medium text-blue-800">Payment Information</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Configure bank details for this location. These details will be included in booking confirmation emails sent to customers.
                </p>
              </div>

              {!locationForm.bankDetails && (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 mb-4">No bank details configured</p>
                  <button
                    type="button"
                    onClick={toggleBankDetailsSection}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Add Bank Details
                  </button>
                </div>
              )}

              {locationForm.bankDetails && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-800">Bank Account Information</h4>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={locationForm.bankDetails.isActive}
                          onChange={(e) =>
                            setLocationForm((prev) => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails,
                                isActive: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={locationForm.bankDetails.bankName}
                        onChange={(e) =>
                          setLocationForm((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              bankName: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Commonwealth Bank"
                        required={locationForm.bankDetails.accountName || locationForm.bankDetails.bsb || locationForm.bankDetails.accountNumber}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name *
                      </label>
                      <input
                        type="text"
                        value={locationForm.bankDetails.accountName}
                        onChange={(e) =>
                          setLocationForm((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              accountName: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., MC Catering Services Pty Ltd"
                        required={locationForm.bankDetails.bankName || locationForm.bankDetails.bsb || locationForm.bankDetails.accountNumber}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BSB *
                      </label>
                      <input
                        type="text"
                        value={locationForm.bankDetails.bsb ? formatBSB(locationForm.bankDetails.bsb) : ''}
                        onChange={handleBSBChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          locationForm.bankDetails.bsb && !validateBSB(locationForm.bankDetails.bsb)
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="123-456"
                        maxLength="7"
                        required={locationForm.bankDetails.bankName || locationForm.bankDetails.accountName || locationForm.bankDetails.accountNumber}
                      />
                      {locationForm.bankDetails.bsb && !validateBSB(locationForm.bankDetails.bsb) && (
                        <p className="text-red-500 text-xs mt-1">BSB must be exactly 6 digits</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={locationForm.bankDetails.accountNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setLocationForm((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              accountNumber: value,
                            },
                          }));
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          locationForm.bankDetails.accountNumber && !validateAccountNumber(locationForm.bankDetails.accountNumber)
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="123456789"
                        maxLength="10"
                        required={locationForm.bankDetails.bankName || locationForm.bankDetails.accountName || locationForm.bankDetails.bsb}
                      />
                      {locationForm.bankDetails.accountNumber && !validateAccountNumber(locationForm.bankDetails.accountNumber) && (
                        <p className="text-red-500 text-xs mt-1">Account number must be 6-10 digits</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={locationForm.bankDetails.reference}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          bankDetails: {
                            ...prev.bankDetails,
                            reference: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`e.g., ${locationForm.city || 'LOCATION'}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional reference for payments. If left blank, the location name will be used.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> These bank details will be included in booking confirmation emails sent to customers for payments.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationForm(prev => ({
                        ...prev,
                        bankDetails: null
                      }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Remove Bank Details
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!locationForm.name || !locationForm.city || !isBankDetailsValid() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              <Save size={20} />
              {loading ? "Saving..." : editingLocation ? "Update Location" : "Create Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationFormModal;