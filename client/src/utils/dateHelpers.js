// FRONTEND dateHelpers.js - FINAL SIMPLE VERSION

import { format, addHours, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const SYDNEY_TIMEZONE = "Australia/Sydney";

/**
 * Convert datetime-local input directly as Sydney time to UTC
 * User enters time -> treat as Sydney time -> convert to UTC for database
 */
export const convertSydneyInputToUTC = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return null;

  try {
    // Parse the datetime-local input (format: "2024-12-25T15:30")
    const inputDate = parseISO(datetimeLocalValue);

    // Convert this time FROM Sydney timezone TO UTC for storage
    const utcDate = fromZonedTime(inputDate, SYDNEY_TIMEZONE);

    return utcDate.toISOString();
  } catch (error) {
    console.error("Date conversion error:", error);
    return null;
  }
};

/**
 * Validate that the input time is between 11 AM and 8 PM (Sydney time)
 */
export const validateSydneyBusinessHours = (datetimeLocalValue) => {
  if (!datetimeLocalValue) {
    return {
      isValid: false,
      error: "Please select a date and time",
    };
  }

  try {
    const inputDate = parseISO(datetimeLocalValue);
    const hours = inputDate.getHours();

    // Direct validation - treat input as Sydney time
    if (hours < 11 || hours >= 20) {
      return {
        isValid: false,
        error: `Please select a time between 11:00 AM and 8:00 PM Sydney time. You selected ${format(
          inputDate,
          "h:mm a"
        )}.`,
      };
    }

    // Check if it's in the future
    const now = new Date();
    if (inputDate <= now) {
      return {
        isValid: false,
        error: "Please select a future date and time",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid date format",
    };
  }
};

/**
 * Get minimum booking time (current time + 2 hours)
 */
export const getMinimumBookingTime = () => {
  const now = new Date();
  const minTime = addHours(now, 2);

  // Adjust to business hours if needed
  if (minTime.getHours() < 11) {
    minTime.setHours(11, 0, 0, 0);
  } else if (minTime.getHours() >= 20) {
    minTime.setDate(minTime.getDate() + 1);
    minTime.setHours(11, 0, 0, 0);
  }

  return format(minTime, "yyyy-MM-dd'T'HH:mm");
};

/**
 * Format for display
 */
export const formatSydneyTime = (utcDateString) => {
  if (!utcDateString) return "";

  try {
    const date = new Date(utcDateString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a '(Sydney time)'");
  } catch (error) {
    return "";
  }
};
