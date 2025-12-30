# Task 11: Cache maPhieuKham Fix

## Problem

User reported: "lần 2 vào sau khi đóng tab vẫn chưa được nó vẫn báo k có mã phiếu để tìm"

Even after implementing the diagnosis caching system, on the second visit to the Process tab, the system showed "Chưa có phiếu khám để tải chẩn đoán" error.

## Root Cause

When switching tabs, the `patient` prop and `form` state may not contain `MaPhieuKham` anymore. The `fetchFinalDiagnosis` function tries to get `maPhieuKham` from:

```javascript
const currentMaPhieuKham = 
  patient?.MaPhieuKham ||
  patient?.maPhieuKham ||
  patient?.MaPhieuKhamLs ||
  patient?.maPhieuKhamLs ||
  form?.MaPhieuKham ||
  form?.maPhieuKham ||
  null;
```

**Problem**: On tab switch, these values may be `null` or `undefined`, causing the function to return early with "Chưa có phiếu khám" error, even though we have cached diagnosis data.

## Solution

**Cache `maPhieuKham` in a ref** so it persists across tab switches, similar to how we cache the patient ID.

### Changes Made

#### 1. Added `cachedMaPhieuKhamRef`

```javascript
// ✅ Cache key để track bệnh nhân nào đang có data cached
const cachedDiagnosisPatientRef = useRef(null);

// ✅ Cache maPhieuKham để tránh mất khi switch tab
const cachedMaPhieuKhamRef = useRef(null);
```

#### 2. Updated `fetchFinalDiagnosis` to Use Cached Value

```javascript
// ✅ Lấy maPhieuKham DYNAMICALLY (tránh stale closure)
// Ưu tiên lấy từ cache ref nếu có, nếu không thì lấy từ patient/form
const currentMaPhieuKham = 
  cachedMaPhieuKhamRef.current ||  // ✅ PRIORITY: Use cached value
  patient?.MaPhieuKham ||
  patient?.maPhieuKham ||
  patient?.MaPhieuKhamLs ||
  patient?.maPhieuKhamLs ||
  form?.MaPhieuKham ||
  form?.maPhieuKham ||
  null;

if (!currentMaPhieuKham) {
  console.warn(
    `[fetchFinalDiagnosis] Không tìm thấy mã phiếu khám cho bệnh nhân ${currentPatientId}`
  );
  console.warn(
    `[fetchFinalDiagnosis] Debug: ` +
    `cachedMaPhieuKhamRef=${cachedMaPhieuKhamRef.current}, ` +
    `patient.MaPhieuKham=${patient?.MaPhieuKham}, ` +
    `form.MaPhieuKham=${form?.MaPhieuKham}`
  );
  toast.warn("Chưa có phiếu khám để tải chẩn đoán.");
  return;
}

// ✅ Lưu maPhieuKham vào ref để dùng cho lần sau
if (currentMaPhieuKham && !cachedMaPhieuKhamRef.current) {
  cachedMaPhieuKhamRef.current = currentMaPhieuKham;
  console.log(`[fetchFinalDiagnosis] Cached maPhieuKham: ${currentMaPhieuKham}`);
}
```

#### 3. Save `maPhieuKham` to Ref When Found in useEffect

**When found directly from patient prop:**
```javascript
if (maPhieuKham && currentPid) {
  // ✅ Lưu maPhieuKham vào ref để dùng cho lần sau (khi switch tab)
  cachedMaPhieuKhamRef.current = maPhieuKham;
  console.log(`[PatientModal] Saved maPhieuKham to ref: ${maPhieuKham}`);
  
  // ... validate and fetch diagnosis
}
```

**When found from search:**
```javascript
if (foundMaPhieuKham) {
  // ✅ Lưu maPhieuKham vào ref để dùng cho lần sau
  cachedMaPhieuKhamRef.current = foundMaPhieuKham;
  console.log(`[PatientModal] Saved found maPhieuKham to ref: ${foundMaPhieuKham}`);
  
  // ... save to form and fetch diagnosis
}
```

#### 4. Clear Cache on Modal Close and Patient Change

**Modal close:**
```javascript
if (!open) {
  // ✅ Reset cache
  cachedDiagnosisPatientRef.current = null;
  cachedMaPhieuKhamRef.current = null; // ✅ Clear maPhieuKham cache
  
  return;
}
```

**Patient change:**
```javascript
if (currentPid && cachedDiagnosisPatientRef.current !== null && 
    cachedDiagnosisPatientRef.current !== currentPid) {
  cachedDiagnosisPatientRef.current = null;
  cachedMaPhieuKhamRef.current = null; // ✅ Clear maPhieuKham cache
  setDiagnosisData(DIAG_INIT);
}
```

## Flow Diagram

### Before Fix (WRONG)

```
Lần 1:
- Open Process tab
- maPhieuKham found in patient prop → "PK001"
- Call fetchFinalDiagnosis()
- Get maPhieuKham from patient prop → "PK001" ✅
- Fetch API → Success
- Cache: cachedDiagnosisPatientRef = "BN001"

Switch to another tab, then back to Process tab:
- Open Process tab again
- patient prop may not have MaPhieuKham anymore
- Call fetchFinalDiagnosis()
- Get maPhieuKham from patient prop → null ❌
- Return early with error: "Chưa có phiếu khám để tải chẩn đoán" ❌
- Diagnosis data is in state but never displayed
```

### After Fix (CORRECT)

```
Lần 1:
- Open Process tab
- maPhieuKham found in patient prop → "PK001"
- Save to ref: cachedMaPhieuKhamRef = "PK001" ✅
- Call fetchFinalDiagnosis()
- Get maPhieuKham from ref → "PK001" ✅
- Fetch API → Success
- Cache: cachedDiagnosisPatientRef = "BN001"

Switch to another tab, then back to Process tab:
- Open Process tab again
- patient prop may not have MaPhieuKham anymore
- Call fetchFinalDiagnosis()
- Get maPhieuKham from ref → "PK001" ✅ (from cache)
- Check diagnosis cache → Hit ✅
- Skip API call
- Toast: "Đã tải chẩn đoán cuối."
- Data displayed ✅
```

## Expected Behavior

### Scenario 1: First Visit
1. Open Process tab
2. `maPhieuKham` found from patient prop
3. Save to `cachedMaPhieuKhamRef`
4. Fetch diagnosis from API
5. Save to `cachedDiagnosisPatientRef`
6. Display data
7. Toast: "Đã tải chẩn đoán cuối."

### Scenario 2: Second Visit (After Tab Switch)
1. Return to Process tab
2. `patient.MaPhieuKham` may be null
3. Get `maPhieuKham` from `cachedMaPhieuKhamRef` ✅
4. Check diagnosis cache → Hit
5. Skip API call
6. Display data (already in state)
7. Toast: "Đã tải chẩn đoán cuối."
8. **No error message** ✅

### Scenario 3: Different Patient
1. Select different patient
2. Cache cleared (both refs)
3. Fresh fetch with new patient's data

## Console Logs to Watch

**First visit:**
```
[PatientModal] Process mode - currentPid: BN001, maPhieuKham: PK001
[PatientModal] Saved maPhieuKham to ref: PK001
[fetchFinalDiagnosis] Fetching diagnosis for patient: BN001, maPhieuKham: PK001
[fetchFinalDiagnosis] Cached maPhieuKham: PK001
[fetchFinalDiagnosis] ✅ Cached diagnosis for patient BN001
```

**Second visit (cache hit):**
```
[PatientModal] Process mode - currentPid: BN001, maPhieuKham: null
[fetchFinalDiagnosis] Using cached maPhieuKham: PK001
[fetchFinalDiagnosis] ✅ Using cached diagnosis for patient BN001. Skipping API call.
```

## Files Modified

1. `my-patients/src/components/patients/PatientModal.jsx`
   - Added `cachedMaPhieuKhamRef`
   - Updated `fetchFinalDiagnosis` to prioritize cached `maPhieuKham`
   - Save `maPhieuKham` to ref when found
   - Clear ref on modal close and patient change

## Testing

Please test again:
1. Open patient modal → Process tab
2. Verify data loads (first visit)
3. Switch to another tab
4. Return to Process tab
5. **Expected**: Data displayed, NO error message ✅

---

**Implementation Date**: December 30, 2024
**Status**: ✅ COMPLETED
**Related**: TASK_11_FINAL_FIX.md
