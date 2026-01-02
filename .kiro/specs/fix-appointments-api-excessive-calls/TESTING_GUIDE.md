# Testing Guide - Fix Appointments API Excessive Calls

## Overview

This guide provides instructions for testing and verifying that the fix for excessive `/api/appointments/search` API calls is working correctly.

## Prerequisites

1. Start the development server: `npm run dev`
2. Open browser DevTools (F12)
3. Open Console tab to see API logs

## Test Scenarios

### Test 1: Appointments Page Load

**Expected Result**: At most 2 API calls when page loads

**Steps**:
1. Navigate to `/appointments` page
2. Check console for API logs
3. Count calls to `/appointments/search`

**Success Criteria**:
- ✅ 1 call from `useAppointmentsByDate` (today's appointments)
- ✅ 0 calls from `useAppointmentsRange` (only when switching to calendar view)
- ❌ No duplicate calls

**Verification**:
```javascript
// In browser console
apiLogger.getStats()
// Should show 1 network call for /appointments/search
```

### Test 2: Switch to Calendar View

**Expected Result**: 1 additional API call for month range

**Steps**:
1. On Appointments page, click "Calendar" view
2. Check console for new API logs

**Success Criteria**:
- ✅ 1 call from `useAppointmentsRange` (month range)
- ❌ No refetch of today's appointments
- ❌ No duplicate calls

### Test 3: Switch Back to List View

**Expected Result**: 0 additional API calls (use cached data)

**Steps**:
1. Click "List" view
2. Check console for new API logs

**Success Criteria**:
- ✅ 0 new API calls
- ✅ Data loaded from cache
- ❌ No refetch

### Test 4: Create New Appointment

**Expected Result**: 0 immediate refetch after creation

**Steps**:
1. Click "+ Tạo lịch hẹn"
2. Fill form and submit
3. Check console for API logs after success

**Success Criteria**:
- ✅ 1 POST call to create appointment
- ✅ Cache invalidated (marked stale)
- ❌ No immediate refetch of appointments list
- ✅ Data will refetch on next user interaction or after staleTime expires

### Test 5: Check-in Flow

**Expected Result**: 1 API call per check-in flow

**Steps**:
1. On Appointments page, check-in an appointment
2. Navigate to Patients page
3. Check console for API logs

**Success Criteria**:
- ✅ 1 call from check-in mutation
- ✅ 1 call from `Patients.highlightPid.useEffect` OR `Patients.flashAddAt.useEffect`
- ❌ No duplicate calls from same source
- ✅ Deduplication working if multiple calls with same params

### Test 6: Window Focus

**Expected Result**: 0 refetch when window regains focus

**Steps**:
1. On Appointments page with data loaded
2. Switch to another tab/window
3. Switch back to the app
4. Check console for API logs

**Success Criteria**:
- ❌ No refetch on window focus
- ✅ Cached data still displayed

### Test 7: Component Remount

**Expected Result**: Use cached data if still valid (< 5 minutes)

**Steps**:
1. Load Appointments page
2. Navigate to another page (e.g., Patients)
3. Navigate back to Appointments within 5 minutes
4. Check console for API logs

**Success Criteria**:
- ✅ 0 new API calls if cache is fresh
- ✅ Data loaded from cache
- ✅ 1 call if cache expired (> 5 minutes)

### Test 8: Simultaneous Calls Deduplication

**Expected Result**: Multiple simultaneous calls with same params deduplicated to 1

**Steps**:
1. Open browser console
2. Manually trigger multiple simultaneous calls:
```javascript
// In console
Promise.all([
  searchAppointmentsRaw({ MaBenhNhan: 'BN001', TrangThai: 'da_checkin' }),
  searchAppointmentsRaw({ MaBenhNhan: 'BN001', TrangThai: 'da_checkin' }),
  searchAppointmentsRaw({ MaBenhNhan: 'BN001', TrangThai: 'da_checkin' })
])
```
3. Check console for deduplication logs

**Success Criteria**:
- ✅ Only 1 actual HTTP request
- ✅ Console shows "[Dedup] Reusing in-flight request" for 2nd and 3rd calls
- ✅ All 3 promises resolve with same data

## Viewing Statistics

### Check API Call Stats

```javascript
// In browser console
apiLogger.printStats()
```

This will show:
- Total calls
- Calls from cache vs network
- Breakdown by endpoint
- Breakdown by source component

### Check Deduplication Stats

```javascript
// In browser console
deduplicationManager.getStats()
```

This will show:
- Current cache size
- Active deduplicated requests

### Clear Logs

```javascript
// In browser console
apiLogger.clear()
```

## Expected Baseline

After all optimizations, typical usage should show:

**Appointments Page Load**:
- 1-2 API calls total (1 for today, 1 for month if calendar view)

**Check-in Flow**:
- 2-3 API calls total (1 for check-in, 1-2 for fetching related data)

**Normal Usage (5 minutes)**:
- 3-5 API calls total (mostly from user actions, not automatic refetches)

## Troubleshooting

### Still Seeing Many Calls?

1. Check if `refetchOnMount` is being overridden somewhere
2. Check if component is re-mounting unnecessarily
3. Check if query keys are stable (not changing on every render)
4. Check React DevTools for component re-renders

### Deduplication Not Working?

1. Check console for "[Dedup]" logs
2. Verify `withDeduplication` is wrapping the function
3. Check if calls have identical parameters

### Cache Not Being Used?

1. Check if `staleTime` is set correctly (5 minutes)
2. Check if cache is being invalidated unnecessarily
3. Check if `refetchOnWindowFocus` is false

## Disabling Logging for Production

Logging is automatically disabled in production builds. To manually disable:

```javascript
// In browser console
apiLogger.disable()
```

To re-enable:

```javascript
apiLogger.enable()
```
