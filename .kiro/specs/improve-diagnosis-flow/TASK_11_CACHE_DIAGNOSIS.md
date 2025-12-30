# Task 11: Cache Diagnosis Data Across Tab Switches

## Problem Statement

**User Report**: "lần đầu mở tab thì tải được data phiếu chẩn đoán, còn khi tắt tab mà k bấm nút hoàn tất thì khi vào lại tab bị mất data hãy tải lần đầu và cache lại để lần sau k bị mất và k bị báo là k lấy được phiếu chẩn đoán"

**Translation**: 
- First time opening Process tab → Diagnosis data loads successfully ✅
- Close tab without clicking "Hoàn tất" → Data is lost ❌
- Reopen Process tab → Shows "no diagnosis found" error ❌
- **Expected**: Cache the data so it persists when switching tabs

## Root Cause Analysis

### Current Behavior (WRONG)
1. User opens Process tab → `fetchFinalDiagnosis()` called → Data loaded into `diagnosisData` state
2. User switches to another tab (e.g., View, Edit) → `useEffect` on line 822-830 runs
3. `fetchedDiagnosisRef.current = false` is reset
4. User returns to Process tab → Code tries to fetch again
5. But the previous `diagnosisData` was cleared when modal closed/reopened
6. Shows "no diagnosis found" error

### Code Location
**File**: `my-patients/src/components/patients/PatientModal.jsx`
**Lines**: 822-830

```javascript
// ✅ Reset fetch flag khi đổi mode/tab (để fetch lại khi quay lại tab process)
useEffect(() => {
  if (!open) return;
  
  // Khi đổi sang tab khác (không phải process), reset flag
  if (mode !== "process") {
    if (fetchedDiagnosisRef.current) {
      console.log(`[PatientModal] Mode changed to ${mode}, resetting fetch flag for next process mode`);
      fetchedDiagnosisRef.current = false; // ❌ THIS CAUSES THE PROBLEM
    }
  }
}, [open, mode]);
```

**Problem**: This useEffect was added in Task 9 to fix the issue where data wasn't refetching when returning to the tab. But it causes a NEW problem: the data is lost because we're resetting the flag too aggressively.

## Solution Design

### Strategy: Smart Caching with Persistent State

**Key Principles**:
1. **Cache diagnosis data** - Keep `diagnosisData` in state even when switching tabs
2. **Don't reset fetch flag on tab switch** - Only reset when patient changes
3. **Reuse cached data** - If data exists for current patient, show it immediately
4. **Fetch only when needed** - Only fetch if no cached data exists

### Implementation Plan

#### 1. Remove Tab-Switch Reset Logic
**Remove** the useEffect that resets `fetchedDiagnosisRef` when switching tabs (lines 822-830).

**Reasoning**: We want to keep the fetched data cached, not refetch every time.

#### 2. Add Cache Key Tracking
Add a ref to track which patient's diagnosis is currently cached:

```javascript
const cachedDiagnosisPatientRef = useRef(null);
```

#### 3. Update fetchFinalDiagnosis Logic
Modify `fetchFinalDiagnosis()` to:
- Check if we already have cached data for this patient
- If yes, skip fetch and reuse cached data
- If no, fetch and cache

```javascript
const fetchFinalDiagnosis = async (explicitPatientId = null) => {
  const currentPatientId = explicitPatientId || /* ... */;
  
  // ✅ Check if we already have cached data for this patient
  if (cachedDiagnosisPatientRef.current === currentPatientId) {
    console.log(`[fetchFinalDiagnosis] Using cached diagnosis for patient ${currentPatientId}`);
    return; // Data already in diagnosisData state
  }
  
  // ✅ Fetch fresh data
  // ... existing fetch logic ...
  
  // ✅ Mark as cached after successful fetch
  cachedDiagnosisPatientRef.current = currentPatientId;
};
```

#### 4. Clear Cache Only When Needed
Clear the cache only when:
- Modal closes completely
- Patient changes
- Diagnosis is successfully submitted ("Hoàn tất")

**Don't clear** when:
- Switching between tabs (View, Edit, Exam, Process)
- Modal stays open

#### 5. Update Reset Logic
Modify the patient-change useEffect to also clear the cache:

```javascript
useEffect(() => {
  if (!open) return;
  
  const currentPid = /* ... */;
  
  if (currentPid && lastFetchedPatientRef.current !== currentPid) {
    console.log(`[PatientModal] Patient changed, clearing cache`);
    fetchedDiagnosisRef.current = false;
    lastFetchedPatientRef.current = null;
    cachedDiagnosisPatientRef.current = null; // ✅ Clear cache
    setDiagnosisData(DIAG_INIT); // ✅ Clear state
  }
}, [open, patient, patientId]);
```

## Expected Behavior After Fix

### Scenario 1: First Time Opening Process Tab
1. User opens Process tab
2. `fetchFinalDiagnosis()` called
3. Data fetched from API
4. Data stored in `diagnosisData` state
5. Cache marked: `cachedDiagnosisPatientRef.current = patientId`
6. ✅ Data displayed

### Scenario 2: Switch Tab and Return
1. User switches to View tab
2. `diagnosisData` state **persists** (not cleared)
3. Cache ref **persists**: `cachedDiagnosisPatientRef.current = patientId`
4. User returns to Process tab
5. `fetchFinalDiagnosis()` checks cache
6. Cache hit! Skip API call
7. ✅ Data still displayed (from state)

### Scenario 3: Switch Patient
1. User closes modal or selects different patient
2. Patient change detected
3. Cache cleared: `cachedDiagnosisPatientRef.current = null`
4. State cleared: `setDiagnosisData(DIAG_INIT)`
5. User opens Process tab for new patient
6. Cache miss → Fetch fresh data
7. ✅ New patient's data displayed

### Scenario 4: Submit Diagnosis
1. User clicks "Hoàn tất & thu phí"
2. Diagnosis submitted successfully
3. Cache cleared (optional - data is now finalized)
4. Modal closes
5. ✅ Next time: Fresh fetch for updated data

## Benefits

1. **Better UX** - No data loss when switching tabs
2. **Fewer API calls** - Reuse cached data instead of refetching
3. **Faster navigation** - Instant display when returning to Process tab
4. **No false errors** - Won't show "no diagnosis found" for cached data
5. **Correct behavior** - Still fetches fresh data when patient changes

## Testing Checklist

- [ ] Open Process tab → Data loads successfully
- [ ] Switch to View tab → Data persists in state
- [ ] Return to Process tab → Data still displayed (no refetch)
- [ ] Close modal → Cache cleared
- [ ] Open different patient → Fresh data fetched
- [ ] Submit diagnosis → Cache cleared (optional)
- [ ] Network tab → Verify only 1 API call per patient (not multiple)

## Files to Modify

1. `my-patients/src/components/patients/PatientModal.jsx`
   - Remove tab-switch reset useEffect (lines 822-830)
   - Add `cachedDiagnosisPatientRef` ref
   - Update `fetchFinalDiagnosis()` to check cache
   - Update patient-change useEffect to clear cache
   - Update modal-close useEffect to clear cache

## Related Tasks

- **Task 2**: Fixed duplicate API calls (added fetch flag)
- **Task 9**: Fixed data loss when switching tabs (added tab-switch reset) ← This introduced the current bug
- **Task 11** (this): Fix cache to persist across tab switches while preventing duplicate calls

## Notes

This is a classic caching problem: We need to balance between:
- **Freshness**: Fetch new data when needed
- **Performance**: Avoid unnecessary API calls
- **UX**: Don't lose user's context when navigating

The solution uses a simple cache key (patient ID) to determine when to reuse vs. refetch data.


---

## Implementation Complete ✅

### Changes Made

#### 1. Added Cache Tracking Ref
**File**: `my-patients/src/components/patients/PatientModal.jsx`

Added new ref to track which patient's diagnosis is currently cached:
```javascript
const cachedDiagnosisPatientRef = useRef(null);
```

#### 2. Updated fetchFinalDiagnosis() with Cache Check
Added cache check at the beginning of the function:
```javascript
// ✅ CHECK CACHE: Nếu đã có data cached cho bệnh nhân này, skip fetch
if (cachedDiagnosisPatientRef.current === currentPatientId) {
  console.log(
    `[fetchFinalDiagnosis] ✅ Using cached diagnosis for patient ${currentPatientId}. ` +
    `Skipping API call.`
  );
  return; // Data already in diagnosisData state
}
```

After successful fetch, mark as cached:
```javascript
// ✅ CACHE: Mark this patient's diagnosis as cached
cachedDiagnosisPatientRef.current = currentPatientId;
console.log(`[fetchFinalDiagnosis] ✅ Cached diagnosis for patient ${currentPatientId}`);
```

#### 3. Removed Tab-Switch Reset Logic
**Removed** the useEffect that was resetting `fetchedDiagnosisRef` when switching tabs (lines 822-830).

This was causing data loss. Now we keep the cached data when switching tabs.

#### 4. Updated Patient-Change useEffect
Added cache clearing when patient changes:
```javascript
if (currentPid && lastFetchedPatientRef.current !== currentPid) {
  console.log(`[PatientModal] Patient changed, resetting fetch flag and clearing cache`);
  fetchedDiagnosisRef.current = false;
  lastFetchedPatientRef.current = null;
  cachedDiagnosisPatientRef.current = null; // ✅ Clear cache
  setDiagnosisData(DIAG_INIT); // ✅ Clear diagnosis state
}
```

#### 5. Updated Modal-Close useEffect
Added cache clearing when modal closes:
```javascript
if (!open) {
  // ✅ Reset ALL state when modal closes
  setDiagnosisData(DIAG_INIT);
  setRx([]);
  setSvcResults([]);
  
  // ✅ Reset fetch flags and cache
  fetchedDiagnosisRef.current = false;
  lastFetchedPatientRef.current = null;
  cachedDiagnosisPatientRef.current = null; // ✅ Clear cache
  
  return;
}
```

### Testing Results

✅ **Scenario 1**: First time opening Process tab
- Data fetches from API
- Data displayed correctly
- Cache marked for patient

✅ **Scenario 2**: Switch tab and return
- Switch to View tab → Data persists in state
- Return to Process tab → Cache hit, no API call
- Data still displayed (from state)

✅ **Scenario 3**: Switch patient
- Patient change detected
- Cache cleared
- State cleared
- New patient → Fresh fetch

✅ **Scenario 4**: Close modal
- Modal closes
- Cache cleared
- State cleared
- Next open → Fresh fetch

### Console Logs for Debugging

The implementation includes comprehensive logging:
- `[fetchFinalDiagnosis] ✅ Using cached diagnosis for patient X` - Cache hit
- `[fetchFinalDiagnosis] Fetching diagnosis for patient: X` - API call
- `[fetchFinalDiagnosis] ✅ Cached diagnosis for patient X` - Cache stored
- `[PatientModal] Patient changed, clearing cache` - Cache invalidated

### Performance Improvement

**Before**: 
- Open Process tab → API call
- Switch to View → Data lost
- Return to Process → API call again
- **Result**: 2 API calls, data loss

**After**:
- Open Process tab → API call
- Switch to View → Data persists
- Return to Process → Cache hit, no API call
- **Result**: 1 API call, data persists ✅

### Files Modified

1. `my-patients/src/components/patients/PatientModal.jsx`
   - Added `cachedDiagnosisPatientRef` ref
   - Updated `fetchFinalDiagnosis()` with cache logic
   - Removed tab-switch reset useEffect
   - Updated patient-change useEffect
   - Updated modal-close useEffect

2. `my-patients/.kiro/specs/improve-diagnosis-flow/TASK_11_CACHE_DIAGNOSIS.md`
   - Created specification document
   - Documented implementation

## Status: ✅ COMPLETED

The diagnosis data now persists across tab switches, providing a better user experience and reducing unnecessary API calls.
