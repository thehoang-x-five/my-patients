// src/utils/followupContext.js
// Utility functions for managing follow-up appointment context in localStorage

const CONTEXT_KEY = "followup-appointment-context";
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Save follow-up appointment context to localStorage
 * @param {Object} context - Context object
 * @param {string} context.patientId - Patient ID
 * @param {string} context.patientName - Patient name
 * @param {string} context.doctorCode - Doctor code
 * @param {string} context.doctorName - Doctor name
 * @param {string} context.examDate - Exam date (ISO string)
 */
export function saveFollowupContext(context) {
  try {
    const data = {
      ...context,
      timestamp: Date.now(),
      notified: false,  // ✅ NEW: Track if toast notification was shown
      createdAt: Date.now(),  // ✅ NEW: Track creation time for expiration
    };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(data));
    console.log("[FollowupContext] Saved:", data);
  } catch (err) {
    console.error("[FollowupContext] Failed to save:", err);
  }
}

/**
 * Get follow-up appointment context from localStorage
 * Returns null if context doesn't exist or has expired
 * @returns {Object|null} Context object or null
 */
export function getFollowupContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw);
    
    // ✅ Backward compatibility: Add missing fields with defaults
    if (data.notified === undefined) {
      data.notified = false;
    }
    if (data.createdAt === undefined) {
      data.createdAt = data.timestamp || Date.now();
    }
    
    const age = Date.now() - (data.createdAt || data.timestamp || 0);
    
    // Expire after 1 hour
    if (age > EXPIRY_MS) {
      console.log("[FollowupContext] Context expired, clearing");
      clearFollowupContext();
      return null;
    }
    
    console.log("[FollowupContext] Retrieved:", data);
    return data;
  } catch (err) {
    console.error("[FollowupContext] Failed to retrieve:", err);
    // ✅ Clear corrupted data
    clearFollowupContext();
    return null;
  }
}

/**
 * Mark follow-up context as notified (toast was shown)
 * Updates the notified flag in localStorage
 */
export function markFollowupNotified() {
  try {
    const context = getFollowupContext();
    if (context) {
      context.notified = true;
      localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
      console.log("[FollowupContext] Marked as notified");
    }
  } catch (err) {
    console.error("[FollowupContext] Failed to mark as notified:", err);
  }
}

/**
 * Clear follow-up appointment context from localStorage
 */
export function clearFollowupContext() {
  try {
    localStorage.removeItem(CONTEXT_KEY);
    console.log("[FollowupContext] Cleared");
  } catch (err) {
    console.error("[FollowupContext] Failed to clear:", err);
  }
}

/**
 * Check if follow-up context exists and is valid
 * @returns {boolean} True if valid context exists
 */
export function hasFollowupContext() {
  return getFollowupContext() !== null;
}
