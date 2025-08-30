import { useState } from "react";
import { Edit2, Trash2, Calendar, Users, MapPin, Briefcase, Percent, MoreHorizontal } from "lucide-react";

const CouponCard = ({ coupon, locations, services, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getLocationName = (locationId) => {
    // Handle both string IDs and populated objects
    const id = typeof locationId === 'object' ? locationId._id : locationId;
    const location = locations.find(loc => loc._id === id || loc._id === locationId);
    return location ? `${location.name} - ${location.city}` : "Unknown Location";
  };

  const getServiceName = (serviceId) => {
    // Handle both string IDs and populated objects
    const id = typeof serviceId === 'object' ? serviceId._id : serviceId;
    const service = services.find(srv => srv._id === id || srv._id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
      !coupon.isValid ? 'opacity-75' : ''
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">
                {coupon.code}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${coupon.statusDisplay.bgColor}`}>
                {coupon.statusDisplay.text}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{coupon.name}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Percent size={14} />
                <span>{coupon.discountPercentage}% OFF</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Expires {formatDate(coupon.expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showDetails && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    onEdit(coupon);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <Edit2 size={14} />
                  Edit Coupon
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    onDelete(coupon._id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Coupon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Usage</span>
          <span className="text-sm text-gray-600">
            {coupon.usedCount} / {coupon.usageLimit}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              coupon.usagePercentage >= 90 ? 'bg-red-500' :
              coupon.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${coupon.usagePercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{coupon.remainingUses} remaining</span>
          <span>{coupon.usagePercentage}% used</span>
        </div>
      </div>

      {/* Restrictions */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Restrictions</h4>
        
        {/* Location Restrictions */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <MapPin size={12} />
            <span className="font-medium">Locations</span>
          </div>
          {coupon.applicableLocations && coupon.applicableLocations.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {coupon.applicableLocations.slice(0, 2).map((locationId) => (
                <span 
                  key={locationId} 
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {getLocationName(locationId)}
                </span>
              ))}
              {coupon.applicableLocations.length > 2 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  +{coupon.applicableLocations.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              All Locations
            </span>
          )}
        </div>

        {/* Service Restrictions */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <Briefcase size={12} />
            <span className="font-medium">Services</span>
          </div>
          {coupon.applicableServices && coupon.applicableServices.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {coupon.applicableServices.slice(0, 2).map((serviceId) => (
                <span 
                  key={serviceId} 
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded"
                >
                  {getServiceName(serviceId)}
                </span>
              ))}
              {coupon.applicableServices.length > 2 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  +{coupon.applicableServices.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              All Services
            </span>
          )}
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {coupon.daysUntilExpiry > 0 ? 
              `${coupon.daysUntilExpiry} days left` : 
              coupon.isExpired ? 'Expired' : 'Expires today'
            }
          </span>
          <span>
            Created {formatDate(coupon.createdAt)}
          </span>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowDetails(false)}
        ></div>
      )}
    </div>
  );
};

export default CouponCard;