import React, { useState, useEffect } from "react";
import { ChefHat, Users, DollarSign, Clock, TrendingUp, MapPin, Briefcase } from "lucide-react";
import bookingService from "../../../services/bookingService";

const BookingCalendar = ({
  currentDate,
  calendarBookings,
  onDayClick,
  onMonthNavigate,
  formatPrice,
  selectedLocation,
  selectedService,
}) => {
  const [dailyDishesData, setDailyDishesData] = useState({});
  const [loadingDishes, setLoadingDishes] = useState({});
  const [monthStats, setMonthStats] = useState(null);

  const today = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const dateRange = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dateRange.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    weeks.push(dateRange.slice(i, i + 7));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Load unique dishes data for dates with bookings (filtered by location/service)
  useEffect(() => {
    const loadUniqueDishesForMonth = async () => {
      if (!selectedLocation) return;

      const datesWithBookings = Object.keys(calendarBookings);
      
      for (const dateString of datesWithBookings) {
        const date = new Date(dateString);
        const dateKey = date.toISOString().split('T')[0];
        
        if (dailyDishesData[dateKey]) continue;
        
        setLoadingDishes(prev => ({ ...prev, [dateKey]: true }));
        
        try {
          const params = {
            date: dateKey,
            locationId: selectedLocation
          };

          if (selectedService) {
            params.serviceId = selectedService;
          }

          const result = await bookingService.getUniqueDishesCount(params);
          
          if (result.success) {
            setDailyDishesData(prev => ({
              ...prev,
              [dateKey]: result.data
            }));
          }
        } catch (error) {
          console.error(`Error loading dishes for ${dateKey}:`, error);
        } finally {
          setLoadingDishes(prev => ({ ...prev, [dateKey]: false }));
        }
      }
    };

    if (Object.keys(calendarBookings).length > 0) {
      loadUniqueDishesForMonth();
    }
  }, [calendarBookings, selectedLocation, selectedService]);

  // Load month statistics
  useEffect(() => {
    const loadMonthStats = async () => {
      if (!selectedLocation) return;

      try {
        const params = {
          locationId: selectedLocation,
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString()
        };

        if (selectedService) {
          params.serviceId = selectedService;
        }

        const result = await bookingService.getBookingStats(params);
        
        if (result.success) {
          setMonthStats(result.data);
        }
      } catch (error) {
        console.error("Error loading month stats:", error);
      }
    };

    loadMonthStats();
  }, [currentDate, selectedLocation, selectedService]);

  const getDayBookings = (date) => {
    return calendarBookings[date.toDateString()] || [];
  };

  const getDaySummary = (bookings) => {
    if (bookings.length === 0) return null;

    const activeBookings = bookings.filter(booking => booking.status !== "cancelled");
    
    const totalPeople = activeBookings.reduce(
      (sum, booking) => sum + (booking.peopleCount || 0),
      0
    );
    const totalRevenue = activeBookings.reduce(
      (sum, booking) => sum + (booking.pricing?.total || 0),
      0
    );

    const customerNames = bookings
      .map((booking) => booking.customerDetails?.name || "Unknown Customer")
      .slice(0, 2);

    const statusCounts = bookings.reduce((acc, booking) => {
      const status = booking.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const now = new Date();
    const upcomingBookings = bookings.filter(booking => {
      const deliveryDate = new Date(booking.deliveryDate);
      return deliveryDate >= now && booking.status !== 'cancelled';
    });

    return {
      totalPeople,
      totalRevenue,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      customerNames,
      statusCounts,
      upcomingBookings: upcomingBookings.length,
    };
  };

  const getUniqueDishesForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return dailyDishesData[dateKey];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 border-amber-300";
      case "confirmed":
        return "bg-green-100 border-green-300";
      case "preparing":
        return "bg-blue-100 border-blue-300";
      case "ready":
        return "bg-purple-100 border-purple-300";
      case "completed":
        return "bg-emerald-100 border-emerald-300";
      case "cancelled":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDayClick = async (date) => {
    const dateKey = formatDateKey(date);
    
    if (!dailyDishesData[dateKey] && !loadingDishes[dateKey]) {
      setLoadingDishes(prev => ({ ...prev, [dateKey]: true }));
      
      try {
        const params = {
          date: dateKey,
          locationId: selectedLocation
        };

        if (selectedService) {
          params.serviceId = selectedService;
        }

        const result = await bookingService.getUniqueDishesCount(params);
        
        if (result.success) {
          setDailyDishesData(prev => ({
            ...prev,
            [dateKey]: result.data
          }));
        }
      } catch (error) {
        console.error(`Error loading dishes for ${dateKey}:`, error);
      } finally {
        setLoadingDishes(prev => ({ ...prev, [dateKey]: false }));
      }
    }
    
    onDayClick(date);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  // Calculate month overview stats
  const getMonthOverview = () => {
    const activeDays = Object.keys(calendarBookings).length;
    const totalEvents = Object.values(calendarBookings).reduce((sum, bookings) => sum + bookings.length, 0);
    const totalGuests = Object.values(calendarBookings).reduce((sum, bookings) => 
      sum + bookings.filter(b => b.status !== 'cancelled').reduce((peopleSum, b) => peopleSum + (b.peopleCount || 0), 0), 0
    );
    const daysWithMenuData = Object.keys(dailyDishesData).length;

    return { activeDays, totalEvents, totalGuests, daysWithMenuData };
  };

  const monthOverview = getMonthOverview();

  return (
    <div className="p-6">
      {/* Enhanced Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onMonthNavigate(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Previous Month"
          >
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            {/* Location/Service Context */}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Location filtered</span>
              </div>
              {selectedService && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  <span>Service filtered</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => onMonthNavigate(1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Next Month"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-200 rounded border border-amber-300"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded border border-green-300"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 rounded border border-blue-300"></div>
              <span>Preparing</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-3 h-3 text-orange-600" />
              <span>Kitchen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-3 text-center font-semibold text-gray-700 bg-gray-50 border border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const dayBookings = getDayBookings(date);
            const daySummary = getDaySummary(dayBookings);
            const dishesData = getUniqueDishesForDate(date);
            const dateKey = formatDateKey(date);
            const isLoadingDishes = loadingDishes[dateKey];
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const hasBookings = dayBookings.length > 0;
            const isPast = isPastDate(date);
            const isFuture = isFutureDate(date);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => handleDayClick(date)}
                className={`
                  min-h-[150px] p-2 border border-gray-200 transition-all duration-200
                  ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"}
                  ${isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${isPast && hasBookings ? "bg-green-50" : ""}
                  ${isFuture && hasBookings ? "bg-yellow-50" : ""}
                  ${isCurrentMonth ? "cursor-pointer hover:bg-gray-50 hover:shadow-md" : ""}
                `}
              >
                {/* Date Number with Status */}
                <div
                  className={`
                  text-sm font-medium mb-2 flex justify-between items-center
                  ${
                    isToday
                      ? "text-blue-700"
                      : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }
                `}
                >
                  <span>{date.getDate()}</span>
                  <div className="flex items-center gap-1">
                    {hasBookings && (
                      <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {dayBookings.length}
                      </span>
                    )}
                    {dishesData && dishesData.uniqueDishesCount > 0 && (
                      <span 
                        className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" 
                        title={`${dishesData.uniqueDishesCount} unique dishes`}
                      >
                        {dishesData.uniqueDishesCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Enhanced Booking Summary */}
                {daySummary && (
                  <div className="space-y-1">
                    {/* People & Revenue Summary */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-600">
                            {daySummary.totalPeople}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {formatPrice(daySummary.totalRevenue).replace('$', '')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kitchen Preparation Summary */}
                    {dishesData && dishesData.dishes && dishesData.dishes.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-1 mb-1">
                        <div className="text-xs text-orange-800 font-medium mb-1 flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          Kitchen Prep:
                        </div>
                        {dishesData.dishes.slice(0, 2).map((dish, index) => (
                          <div key={index} className="text-xs text-orange-700 truncate">
                            • {dish.dishName}: {dish.totalQuantity} portions
                          </div>
                        ))}
                        {dishesData.dishes.length > 2 && (
                          <div className="text-xs text-orange-600">
                            +{dishesData.dishes.length - 2} more dishes
                          </div>
                        )}
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          Total: {dishesData.totalQuantity} portions
                        </div>
                      </div>
                    )}

                    {/* Loading indicator for dishes */}
                    {isLoadingDishes && (
                      <div className="text-center py-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-600 border-t-transparent mx-auto"></div>
                        <div className="text-xs text-orange-600 mt-1">Loading kitchen data...</div>
                      </div>
                    )}

                    {/* Customer Names (Condensed) */}
                    {daySummary.customerNames.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {daySummary.customerNames.slice(0, 1).map((name, index) => (
                          <div key={index} className="truncate">
                            👤 {name}
                          </div>
                        ))}
                        {daySummary.totalBookings > 1 && (
                          <div className="text-gray-500 text-xs">
                            +{daySummary.totalBookings - 1} more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enhanced Status Indicators */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(daySummary.statusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className={`w-2 h-2 rounded-full border ${getStatusColor(status)}`}
                          title={`${count} ${status} booking${count > 1 ? 's' : ''}`}
                        ></div>
                      ))}
                    </div>

                    {/* Time-based indicators */}
                    {isPast && daySummary.activeBookings > 0 && (
                      <div className="text-xs text-emerald-600 bg-emerald-50 rounded px-1">
                        ✓ Completed Event
                      </div>
                    )}
                    
                    {isFuture && daySummary.upcomingBookings > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 rounded px-1 flex items-center gap-1">
                        <Clock className="w-2 h-2" />
                        Upcoming
                      </div>
                    )}

                    {isToday && hasBookings && (
                      <div className="text-xs text-blue-700 bg-blue-100 border border-blue-300 rounded px-1 text-center">
                        📅 TODAY
                      </div>
                    )}
                  </div>
                )}

                {/* No Bookings State - Still Clickable */}
                {!hasBookings && isCurrentMonth && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <span className="text-gray-300 text-xs">No events</span>
                      <div className="text-gray-400 text-xs mt-1">Click to view</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Enhanced Calendar Legend */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
          📅 Calendar Guide
          {selectedService && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Service Filtered
            </span>
          )}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700">
          <div className="space-y-1">
            <p>• <strong>Click any date</strong> to view bookings and kitchen requirements</p>
            <p>• <strong>Orange circles:</strong> Number of unique dishes to prepare</p>
            <p>• <strong>Yellow circles:</strong> Number of bookings for the day</p>
          </div>
          <div className="space-y-1">
            <p>• <strong>Kitchen Prep:</strong> Shows top dishes with portion counts</p>
            <p>• <strong>Colored dots:</strong> Booking status indicators</p>
            <p>• <strong>Today:</strong> Highlighted with blue border</p>
          </div>
        </div>
        
        {/* Enhanced Monthly Overview */}
        <div className="mt-4 p-4 bg-white border border-amber-300 rounded">
          <h5 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
            📊 Month Overview
            <span className="text-sm text-gray-600">
              ({monthNames[currentDate.getMonth()]} {currentDate.getFullYear()})
            </span>
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-800 text-lg">
                {monthOverview.activeDays}
              </div>
              <div className="text-gray-600">Active Days</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800 text-lg">
                {monthOverview.totalEvents}
              </div>
              <div className="text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800 text-lg">
                {monthOverview.totalGuests}
              </div>
              <div className="text-gray-600">Total Guests</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800 text-lg">
                {monthOverview.daysWithMenuData}
              </div>
              <div className="text-gray-600">Days w/ Kitchen Data</div>
            </div>
          </div>

          {/* Monthly Stats from API */}
          {monthStats && (
            <div className="mt-4 pt-3 border-t border-amber-200">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-blue-800">
                    {formatPrice(monthStats.overview?.totalRevenue || 0)}
                  </div>
                  <div className="text-blue-600">Monthly Revenue</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-800">
                    {formatPrice(monthStats.overview?.averageOrderValue || 0)}
                  </div>
                  <div className="text-green-600">Avg Order Value</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-800">
                    {monthStats.popularItems?.[0]?.name || "N/A"}
                  </div>
                  <div className="text-purple-600">Top Dish</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;