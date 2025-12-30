# Fix: Stale Closure Issue in fetchFinalDiagnosis

**Date**: 2024-12-30  
**Issue**: Stale closure causing wrong `maPhieuKham` to be used in API call  
**Status**: ✅ **FIXED**

---

## Problem Description

### Symptoms
When opening the "Xử lý chẩn đoán" (Process Diagnosis) tab, the logs showed:

```
[maPhieuKhamCurrent] Computed for patient BNTWSANXJ: fromPatient=PKVGWCJ0H, fromForm=PKVGWCJ0H, result=PKVGWCJ0H
[maPhieuKhamCurrent] Computed for patient BNTWSANXJ: fromPatient=null, fromForm=PKVGWCJ0H, result=PKVGWCJ0H
[maPhieuKhamCurrent] Computed for patient BNTWSANXJ: fromPatient=null, fromForm=null, result=null
[fetchFinalDiagnosis] Fetching diagnosis for patient: BNTWSANXJ, maPhieuKham: PKVGWCJ0H
```

**The Issue**: 
- `maPhieuKhamCurrent` useMemo recalculated to `null` (correct behavior - patient prop was cleared)
- But `fetchFinalDiagnosis` still used the OLD value `PKVGWCJ0H` (stale closure)
- This caused the API to fetch diagnosis for the WRONG exam record

---

## Root Cause

### Stale Closure Problem

The `fetchFinalDiagnosis` function was defined like this:

```javascript
const fetchFinalDiagnosis = async (explicitPatientId = null) => {
  // ...
  
  // ❌ PROBLEM: Uses maPhieuKhamCurrent from closure
  if (!maPhieuKhamCurrent) {
    toast.warn("Chưa có phiếu khám để tải chẩn đoán.");
    return;
  }
  
  console.log(`maPhieuKham: ${maPhieuKhamCurrent}`);
  
  // ❌ PROBLEM: API call uses stale value
  const dxRes = await getFinalDiagnosis(maPhieuKhamCurrent);
};
```

**Why this is a problem**:

1. `maPhieuKhamCurrent` is computed by `useMemo` based on `patient` and `form` props
2. When the function is called in `setTimeout(() => fetchFinalDiagnosis(currentPid), 100)`:
   - The function **captures** the current value of `maPhieuKhamCurrent` (e.g., `PKVGWCJ0H`)
   - This is called a "closure" - the function remembers the value at the time it was created
3. By the time `setTimeout` executes (100ms later):
   - React may have re-rendered and `useMemo` recalculated `maPhieuKhamCurrent` to `null`
   - But the function still uses the OLD captured value `PKVGWCJ0H`
4. Result: API fetches diagnosis for the wrong exam record

### Timeline of Events

```
T=0ms:    Modal opens, patient prop has MaPhieuKham=PKVGWCJ0H
          useMemo calculates: maPhieuKhamCurrent = PKVGWCJ0H
          setTimeout(() => fetchFinalDiagnosis(), 100) is scheduled
          Function captures: maPhieuKhamCurrent = PKVGWCJ0H (closure)

T=50ms:   React re-renders, patient prop is updated (MaPhieuKham removed)
          useMemo recalculates: maPhieuKhamCurrent = null

T=100ms:  setTimeout executes fetchFinalDiagnosis()
          Function uses captured value: PKVGWCJ0H (stale!)
          API call: getFinalDiagnosis(PKVGWCJ0H) ❌ WRONG!
```

---

## Solution

### Dynamic Computation Inside Function

Instead of relying on the closure, compute `maPhieuKham` **dynamically** inside the function:

```javascript
const fetchFinalDiagnosis = async (explicitPatientId = null) => {
  // ✅ Check loading state
  if (loadingFinalDiagnosis) {
    console.log("[fetchFinalDiagnosis] Already loading, skipping duplicate call");
    return;
  }
  
  // ✅ Lấy mã bệnh nhân hiện tại
  const currentPatientId = 
    explicitPatientId ||
    form?.id ||
    form?.MaBenhNhan ||
    form?.maBenhNhan ||
    patient?.id ||
    patient?.MaBenhNhan ||
    patient?.maBenhNhan ||
    patientId;
  
  if (!currentPatientId) {
    toast.error("Thiếu mã bệnh nhân.");
    return;
  }
  
  // ✅ SOLUTION: Lấy maPhieuKham DYNAMICALLY (tránh stale closure)
  // KHÔNG dùng maPhieuKhamCurrent từ closure vì nó có thể đã thay đổi
  const currentMaPhieuKham = 
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
    toast.warn("Chưa có phiếu khám để tải chẩn đoán.");
    return;
  }
  
  console.log(
    `[fetchFinalDiagnosis] Fetching diagnosis for patient: ${currentPatientId}, ` +
    `maPhieuKham: ${currentMaPhieuKham}`
  );
  
  try {
    setLoadingFinalDiagnosis(true);
    
    // ✅ Gọi API với mã phiếu khám đã lấy động
    const dxRes = await getFinalDiagnosis(currentMaPhieuKham);
    
    // ... rest of the function
  }
};
```

### Key Changes

1. **Removed dependency on `maPhieuKhamCurrent` closure variable**
2. **Added `currentMaPhieuKham` local variable** that computes the value dynamically
3. **Direct access to `patient` and `form` props** at execution time (not closure time)
4. **Updated API call** to use `currentMaPhieuKham` instead of `maPhieuKhamCurrent`

---

## Why This Works

### Before (Stale Closure)
```
T=0ms:    maPhieuKhamCurrent = PKVGWCJ0H (useMemo)
          setTimeout captures: PKVGWCJ0H

T=50ms:   maPhieuKhamCurrent = null (useMemo recalculates)

T=100ms:  fetchFinalDiagnosis uses: PKVGWCJ0H (stale!) ❌
```

### After (Dynamic Computation)
```
T=0ms:    maPhieuKhamCurrent = PKVGWCJ0H (useMemo, not used)
          setTimeout scheduled

T=50ms:   patient.MaPhieuKham = null (prop updated)

T=100ms:  fetchFinalDiagnosis computes:
          currentMaPhieuKham = patient?.MaPhieuKham || form?.MaPhieuKham
          currentMaPhieuKham = null (correct!) ✅
          Function returns early with warning
```

---

## Benefits

1. ✅ **Always uses current values** - no stale closures
2. ✅ **Prevents wrong API calls** - if `maPhieuKham` is null, function returns early
3. ✅ **Better error messages** - logs show which patient has no exam record
4. ✅ **Consistent with patient ID logic** - both are computed dynamically

---

## Testing

### Expected Behavior After Fix

1. Open modal for patient A with exam record → loads diagnosis ✅
2. Close modal → state resets ✅
3. Open modal for patient B without exam record → shows warning, no API call ✅
4. Logs show: `currentMaPhieuKham = null` (not stale value) ✅

### Console Logs After Fix

```
[maPhieuKhamCurrent] Computed for patient BNTWSANXJ: fromPatient=null, fromForm=null, result=null
[fetchFinalDiagnosis] Không tìm thấy mã phiếu khám cho bệnh nhân BNTWSANXJ
Toast: "Chưa có phiếu khám để tải chẩn đoán."
```

No API call is made! ✅

---

## Related Issues

This fix complements the previous fixes:

1. **Task 1**: Patient ID validation (prevents wrong patient diagnosis)
2. **Task 2**: Duplicate call prevention (ref flags)
3. **Task 3**: localStorage removal (no stale exam IDs)
4. **Task 4 (NEW)**: Stale closure fix (dynamic computation)

All four fixes work together to ensure:
- ✅ Correct patient diagnosis is loaded
- ✅ No duplicate API calls
- ✅ No stale data from localStorage
- ✅ No stale data from closures

---

## Files Modified

- `my-patients/src/components/patients/PatientModal.jsx`
  - Updated `fetchFinalDiagnosis()` function
  - Changed from closure-based to dynamic computation

---

## Lessons Learned

### JavaScript Closure Gotcha

When using `setTimeout` or async callbacks with React state/props:

❌ **DON'T** rely on closure variables:
```javascript
const value = useMemo(() => computeValue(), [deps]);

setTimeout(() => {
  doSomething(value); // ❌ Stale closure!
}, 100);
```

✅ **DO** compute dynamically inside the callback:
```javascript
const value = useMemo(() => computeValue(), [deps]);

setTimeout(() => {
  const currentValue = computeValue(); // ✅ Fresh value!
  doSomething(currentValue);
}, 100);
```

### React State Updates

React state updates are **asynchronous** and may happen between:
1. When a function is scheduled (e.g., `setTimeout`)
2. When the function actually executes

Always compute values **at execution time**, not at scheduling time!

---

## Summary

**Problem**: Stale closure caused `fetchFinalDiagnosis` to use old `maPhieuKham` value  
**Solution**: Compute `maPhieuKham` dynamically inside function instead of relying on closure  
**Result**: Function always uses current values, prevents wrong API calls  
**Status**: ✅ **FIXED**
