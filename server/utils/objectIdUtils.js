/**
 * Utility functions for handling MongoDB ObjectId objects
 */

/**
 * Extracts string ID from various ObjectId formats
 * @param {*} id - Can be string, ObjectId object, or null/undefined
 * @returns {string|null} - Clean string ID or null if invalid
 */
export const extractObjectIdString = (id) => {
  if (!id) return null;

  // If it's already a string, return it cleaned
  if (typeof id === 'string') {
    return id.trim();
  }

  // If it's an object (ObjectId), try different properties
  if (typeof id === 'object' && id !== null) {
    // Try common ObjectId properties
    if (id._id) return String(id._id).trim();
    if (id.$oid) return String(id.$oid).trim();
    if (id.toString && typeof id.toString === 'function') {
      const stringified = id.toString();
      // Make sure toString() didn't return "[object Object]"
      if (stringified !== '[object Object]') {
        return stringified.trim();
      }
    }
    // Try id property
    if (id.id) return String(id.id).trim();
  }

  // If all else fails, try String() conversion
  const stringified = String(id);
  if (stringified !== '[object Object]' && stringified !== 'undefined' && stringified !== 'null') {
    return stringified.trim();
  }

  return null;
};

/**
 * Validates if a string is a valid MongoDB ObjectId format
 * @param {string} id - String to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const cleanId = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(cleanId);
};

/**
 * Safely extracts and validates ObjectId string
 * @param {*} id - ObjectId in any format
 * @returns {string|null} - Valid ObjectId string or null
 */
export const safeExtractObjectId = (id) => {
  const extracted = extractObjectIdString(id);
  return extracted && isValidObjectId(extracted) ? extracted : null;
};

/**
 * Debug function to log ObjectId information
 * @param {*} id - ObjectId to debug
 * @param {string} label - Label for logging
 */
export const debugObjectId = (id, label = 'ObjectId') => {
  console.group(`🔍 Debug ${label}`);
  console.log('Original value:', id);
  console.log('Type:', typeof id);
  console.log('Is null/undefined:', id == null);
  
  if (id && typeof id === 'object') {
    console.log('Object keys:', Object.keys(id));
    console.log('Has _id:', '_id' in id, id._id);
    console.log('Has $oid:', '$oid' in id, id.$oid);
    console.log('Has toString:', typeof id.toString === 'function');
    if (typeof id.toString === 'function') {
      console.log('toString() result:', id.toString());
    }
  }
  
  const extracted = extractObjectIdString(id);
  console.log('Extracted string:', extracted);
  console.log('Is valid ObjectId:', extracted ? isValidObjectId(extracted) : false);
  console.groupEnd();
  
  return extracted;
};