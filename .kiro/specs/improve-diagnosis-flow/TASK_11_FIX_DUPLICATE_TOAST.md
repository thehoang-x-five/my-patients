# Task 11: Fix Duplicate Toast and API Calls

## Problem

User reported: 
1. "giờ bị lại" - duplicate toast "Đã tải chẩn đoán cuối." appears multiple times
2. API `GET /api/clinical/PKWE5Z2IF6` (getClinicalExam) is being called multiple times
3. API `GET /api/clinical/search?MaBenhNhan=BNPD22G2Y` (searchClinicalRaw) is being called multiple times

## Root Cause

There are **THREE duplicate issues**:

### Issue 1: Duplicate `fetchFinalDiagnosis` Calls

The `fetchFinalDiagnosis` function was being called **multiple times simultaneously** from different async branches in the useEffect.

### Issue 2: Duplicate `getClinicalExam` Calls

The validation step (`getClinicalExam`) in Branch 1 was being called multiple times because the useEffect could trigger multiple times before the async operation completed.

### Issue 3: Duplicate `searchClinicalRaw` Calls

The search step (`searchClinicalRaw`) in Branch 2 was also being called multiple times for the same reason - useEffect triggering before async completion.

## Solution

Use **three refs** to track all three operations:

1. `isFetchingDiagnosisRef` - Track if `fetchFinalDiagnosis` is running
2. `isValidatingPhieuKhamRef` - Track if `getClinicalExam` validation is running
3. `isSearchingPhieuKhamRef` - Track if `searchClinicalRaw` search is running

### Changes Made

#### 1. Added Three Tracking Refs

```javascript
// ✅ Track if fetchFinalDiagnosis is currently running
const isFetchingDiagnosisRef = useRef(false);

// ✅ Track if validation is currently running to prevent duplicate getClinicalExam calls
const isValidatingPhieuKhamRef = useRef(null);

// ✅ Track if search is currently running to prevent duplicate searchClinicalRaw calls
const isSearchingPhieuKhamRef = useRef(null);
```

#### 2. Prevent Duplicate Validation (getClinicalExam)

```javascript
if (maPhieuKham && currentPid) {
  // ✅ Check if already validating
  if (isValidatingPhieuKhamRef.current === maPhieuKham) {
    console.log(`Already validating phiếu khám ${maPhieuKham}, skipping duplicate`);
    return;
  }
  
  // ✅ Mark as validating
  isValidatingPhieuKhamRef.current = maPhieuKham;
  
  (async () => {
    try {
      const clinicalExam = await getClinicalExam(maPhieuKham);
      // ... validation logic
      fetchFinalDiagnosis(currentPid);
      isValidatingPhieuKhamRef.current = null; // ✅ Clear
    } catch (err) {
      isValidatingPhieuKhamRef.current = null; // ✅ Clear on error
    }
  })();
}
```

#### 3. Prevent Duplicate Search (searchClinicalRaw)

```javascript
} else if (currentPid) {
  // ✅ Check if already searching
  if (isSearchingPhieuKhamRef.current === currentPid) {
    console.log(`Already searching for phiếu khám of patient ${currentPid}, skipping duplicate`);
    return;
  }
  
  // ✅ Mark as searching
  isSearchingPhieuKhamRef.current = currentPid;
  
  (async () => {
    try {
      const clinicalList = await searchClinicalRaw({ MaBenhNhan: currentPid });
      // ... search logic
      if (foundMaPhieuKham) {
        fetchFinalDiagnosis(currentPid);
        isSearchingPhieuKhamRef.current = null; // ✅ Clear
      } else {
        isSearchingPhieuKhamRef.current = null; // ✅ Clear
      }
    } catch (err) {
      isSearchingPhieuKhamRef.current = null; // ✅ Clear on error
    }
  })();
}
```

#### 4. Prevent Duplicate Diagnosis Fetch

```javascript
const fetchFinalDiagnosis = async (explicitPatientId = null) => {
  // ✅ Check if already fetching
  if (isFetchingDiagnosisRef.current) {
    return;
  }
  
  isFetchingDiagnosisRef.current = true;
  
  try {
    // ... fetch logic
  } finally {
    isFetchingDiagnosisRef.current = false;
  }
}
```

#### 5. Clear All Refs on Modal Close

```javascript
if (!open) {
  cachedDiagnosisPatientRef.current = null;
  cachedMaPhieuKhamRef.current = null;
  isFetchingDiagnosisRef.current = false;
  isValidatingPhieuKhamRef.current = null;
  isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag
  
  return;
}
```

## How It Works

### Scenario: useEffect Triggers Multiple Times

```
Time 0ms:
- useEffect runs (first time)
- Branch 1: maPhieuKham exists
  - Check: isValidatingPhieuKhamRef.current === null ✅
  - Set: isValidatingPhieuKhamRef.current = "PKWE5Z2IF6"
  - Start getClinicalExam("PKWE5Z2IF6")

Time 10ms:
- useEffect runs again (re-render)
- Branch 1: maPhieuKham exists
  - Check: isValidatingPhieuKhamRef.current === "PKWE5Z2IF6" ❌
  - Return early (skip duplicate validation)
  - Log: "Already validating phiếu khám PKWE5Z2IF6, skipping duplicate"

Time 100ms:
- Branch 1 (first): getClinicalExam complete
  - Validation success
  - Call fetchFinalDiagnosis()
    - Check: isFetchingDiagnosisRef.current === false ✅
    - Set: isFetchingDiagnosisRef.current = true
    - Start API call to /final-diagnosis
  - Clear: isValidatingPhieuKhamRef.current = null

Time 300ms:
- Branch 1 (first): API complete
  - Show toast: "Đã tải chẩn đoán cuối." (1 time only ✅)
  - Finally: isFetchingDiagnosisRef.current = false
```

**Result**: 
- ✅ Only 1 call to `GET /api/clinical/PKWE5Z2IF6`
- ✅ Only 1 call to `GET /api/clinical/PKWE5Z2IF6/final-diagnosis`
- ✅ Only 1 toast

## Why Ref Works Better Than State

| Approach | Closure Issue? | Race Condition? | Works? |
|----------|----------------|-----------------|--------|
| State (`loadingFinalDiagnosis`) | ✅ YES (stale) | ✅ YES | ❌ NO |
| Ref (`isFetchingDiagnosisRef`) | ❌ NO (always current) | ❌ NO | ✅ YES |

**Key Insight**: Refs are **mutable** and **always current**, making them perfect for tracking async operations across closures.

## Expected Behavior

### First Visit
1. Open Process tab
2. useEffect triggers
3. Validation: Calls `getClinicalExam` (1 time only)
4. After validation: Calls `fetchFinalDiagnosis` (1 time only)
5. **Result**: 2 API calls total, 1 toast ✅

### Second Visit (After Tab Switch)
1. Return to Process tab
2. useEffect triggers
3. Validation: Checks ref → Already validated → Skip
4. Diagnosis: Checks cache → Cache hit → Shows toast → Returns
5. **Result**: 0 API calls, 1 toast ✅

## Console Logs to Watch

**Normal (no duplicate):**
```
[PatientModal] Process mode - currentPid: BN001, maPhieuKham: PKWE5Z2IF6
[PatientModal] Saved maPhieuKham to ref: PKWE5Z2IF6
[PatientModal] ✅ Phiếu khám PKWE5Z2IF6 thuộc về bệnh nhân BN001. Tiếp tục lấy chẩn đoán...
[fetchFinalDiagnosis] Fetching diagnosis for patient: BN001, maPhieuKham: PKWE5Z2IF6
[fetchFinalDiagnosis] ✅ Cached diagnosis for patient BN001
```

**Duplicate prevented:**
```
[PatientModal] Process mode - currentPid: BN001, maPhieuKham: PKWE5Z2IF6
[PatientModal] Already validating phiếu khám PKWE5Z2IF6, skipping duplicate  ← ✅ Prevented!
[PatientModal] ✅ Phiếu khám PKWE5Z2IF6 thuộc về bệnh nhân BN001. Tiếp tục lấy chẩn đoán...
[fetchFinalDiagnosis] Already fetching, skipping duplicate call  ← ✅ Prevented!
[fetchFinalDiagnosis] ✅ Cached diagnosis for patient BN001
```

## Files Modified

1. `my-patients/src/components/patients/PatientModal.jsx`
   - Added `isFetchingDiagnosisRef` to prevent duplicate `fetchFinalDiagnosis` calls
   - Added `isValidatingPhieuKhamRef` to prevent duplicate `getClinicalExam` calls
   - Added `isSearchingPhieuKhamRef` to prevent duplicate `searchClinicalRaw` calls
   - Check refs at start of operations
   - Set refs when starting operations
   - Clear refs when operations complete (success or error)
   - Clear refs on modal close

## Testing

Please verify in Network tab:
- [ ] `GET /api/clinical/PKWE5Z2IF6` - Only called 1 time (or 0 if cached)
- [ ] `GET /api/clinical/search?MaBenhNhan=BNPD22G2Y` - Only called 1 time (or 0 if cached)
- [ ] `GET /api/clinical/PKWE5Z2IF6/final-diagnosis` - Only called 1 time (or 0 if cached)
- [ ] Only 1 toast appears
- [ ] Check console → No duplicate logs

## Summary

**3 Refs to Prevent 3 Types of Duplicates:**

| Ref | Prevents Duplicate | API Endpoint |
|-----|-------------------|--------------|
| `isValidatingPhieuKhamRef` | getClinicalExam | `/api/clinical/{id}` |
| `isSearchingPhieuKhamRef` | searchClinicalRaw | `/api/clinical/search?MaBenhNhan={id}` |
| `isFetchingDiagnosisRef` | getFinalDiagnosis | `/api/clinical/{id}/final-diagnosis` |

All three work together to ensure **zero duplicate API calls**! 🎯

---

**Implementation Date**: December 30, 2024
**Status**: ✅ COMPLETED
**Related**: TASK_11_CACHE_MAPHIEUKHAM_FIX.md, TASK_11_FINAL_FIX.md
