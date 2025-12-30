# Implementation Summary - Fix CLS Room Display and Patient Status Update

## Date: 2024-12-30

## Changes Made

### 1. Frontend: CLS Room Display Fix ✅

**File**: `my-patients/src/components/patients/PatientExamMode.jsx`

**Change**: Replaced `<select>` dropdown with read-only `<div>` for room display

**Before** (lines 422-440):
```jsx
<select
  value={serviceRooms[idx] || ""}
  onChange={(e) => setServiceRooms(...)}
  className="w-full rounded-lg px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
  disabled={!serviceItems.length}
>
  <option value="">Chọn phòng</option>
  {SERVICE_ROOMS.map((r) => (
    <option key={r} value={r}>{r}</option>
  ))}
</select>
```

**After**:
```jsx
<div className="w-full rounded-lg px-2 py-1.5 ring-1 ring-slate-200 bg-slate-50 text-sm text-slate-700 min-h-[34px] flex items-center">
  {serviceRooms[idx] || "—"}
</div>
```

**Rationale**: Each CLS service has only ONE fixed room assigned in seed data (`MaPhongThucHien`), so dropdown selection is unnecessary. The room is prefilled from backend data and should be displayed as read-only text.

---

### 2. Backend: Add Logging for Patient Status Update ✅

**File**: `HealthCare/Services/OutpatientCare/ClsService.cs`

**Change**: Added try-catch with console logging around patient status update (line 391)

**Before**:
```csharp
if (!string.IsNullOrWhiteSpace(maBenhNhan2))
{
    await _patients.CapNhatTrangThaiBenhNhanAsync(
        maBenhNhan2,
        new PatientStatusUpdateRequest { TrangThaiHomNay = "cho_kham_dv" });
}
```

**After**:
```csharp
if (!string.IsNullOrWhiteSpace(maBenhNhan2))
{
    Console.WriteLine($"[CLS] Updating patient {maBenhNhan2} status to cho_kham_dv");
    try
    {
        await _patients.CapNhatTrangThaiBenhNhanAsync(
            maBenhNhan2,
            new PatientStatusUpdateRequest { TrangThaiHomNay = "cho_kham_dv" });
        Console.WriteLine($"[CLS] Patient status updated successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[CLS] Failed to update patient status: {ex.Message}");
        throw;
    }
}
```

**Rationale**: Helps debug why patient status might not be updating. Logs will show:
- When update is attempted
- Success confirmation
- Error message if validation fails (e.g., `TrangThaiTaiKhoan != "hoat_dong"`)

---

### 3. Frontend: Add Query Refetch After CLS Update ✅

**File**: `my-patients/src/components/patients/PatientModal.jsx`

**Change 1**: Added `refetch` to usePatientDetail hook (line 100)

**Before**:
```jsx
const {
  data: patientDetail,
  isFetching: loadingPatientDetail,
  isError: errorPatientDetail,
} = usePatientDetail(patientId, {
  enabled: open && !!patientId && mode !== "add",
});
```

**After**:
```jsx
const {
  data: patientDetail,
  isFetching: loadingPatientDetail,
  isError: errorPatientDetail,
  refetch: refetchPatientDetail,
} = usePatientDetail(patientId, {
  enabled: open && !!patientId && mode !== "add",
});
```

**Change 2**: Added refetch call after successful CLS update (line 1396)

**Before**:
```jsx
try {
  await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
  toast.success("Cập nhật phiếu CLS thành công.");
  setClsSummaryPrint(null);
  openPrint({...});
} catch (err) {
  console.error("Cập nhật trạng thái CLS thất bại:", err);
  toast.error("Không thể cập nhật trạng thái CLS. Vui lòng thử lại.");
}
```

**After**:
```jsx
try {
  await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
  toast.success("Cập nhật phiếu CLS thành công.");
  
  // Refetch patient detail to get updated status
  if (refetchPatientDetail) {
    await refetchPatientDetail();
  }
  
  setClsSummaryPrint(null);
  openPrint({...});
} catch (err) {
  console.error("Cập nhật trạng thái CLS thất bại:", err);
  toast.error("Không thể cập nhật trạng thái CLS. Vui lòng thử lại.");
}
```

**Rationale**: Ensures frontend immediately fetches updated patient data after successful CLS update, so the patient status change is reflected in the UI.

---

## Testing Instructions

### Test 1: CLS Room Display
1. Open PatientModal in service intake mode (`cho_tiep_nhan_dv` status)
2. Verify that CLS services are listed with rooms
3. **Expected**: Room is displayed as read-only text (gray background), not a dropdown
4. **Expected**: Room matches the `MaPhongThucHien` from seed data

### Test 2: Patient Status Update - Success Case
1. Create a patient with `TrangThaiTaiKhoan = "hoat_dong"`
2. Doctor creates CLS order → Patient status: `cho_tiep_nhan_dv`
3. Y tá clicks "Tiếp nhận" (accept CLS order)
4. **Expected Backend Logs**:
   ```
   [CLS] Updating patient <MaBenhNhan> status to cho_kham_dv
   [CLS] Patient status updated successfully
   ```
5. **Expected Frontend**: Patient status changes to `"Chờ khám (dịch vụ)"` immediately
6. **Expected Database**: 
   ```sql
   SELECT TrangThaiHomNay FROM BenhNhans WHERE MaBenhNhan = '<id>';
   -- Result: "cho_kham_dv"
   ```

### Test 3: Patient Status Update - Validation Failure
1. Create a patient with `TrangThaiTaiKhoan = "tam_dung"` or `NULL`
2. Doctor creates CLS order
3. Y tá clicks "Tiếp nhận"
4. **Expected Backend Logs**:
   ```
   [CLS] Updating patient <MaBenhNhan> status to cho_kham_dv
   [CLS] Failed to update patient status: Tài khoản bệnh nhân chưa được kích hoạt hoặc đã bị khóa
   ```
5. **Expected Frontend**: Error toast displayed
6. **Fix**: Update patient record:
   ```sql
   UPDATE BenhNhans 
   SET TrangThaiTaiKhoan = 'hoat_dong' 
   WHERE MaBenhNhan = '<id>';
   ```

### Test 4: Multiple Services
1. Create CLS order with multiple services (e.g., X-quang + Xét nghiệm máu)
2. Y tá accepts CLS order
3. **Expected**: Each service displays its correct room:
   - X-quang → "Phòng X-quang"
   - Xét nghiệm máu → "Phòng Xét nghiệm"
4. **Expected**: All rooms shown as read-only text

---

## Debug Checklist

If patient status still doesn't update after these changes:

### ✅ Check Backend Logs
- Look for `[CLS] Updating patient...` messages
- If you see "Failed to update patient status", check the error message
- Common error: "Tài khoản bệnh nhân chưa được kích hoạt"

### ✅ Check Database
```sql
-- Verify patient account status
SELECT MaBenhNhan, HoTen, TrangThaiTaiKhoan, TrangThaiHomNay, NgayTrangThai
FROM BenhNhans
WHERE MaBenhNhan = '<ma_benh_nhan>';

-- Expected: TrangThaiTaiKhoan = 'hoat_dong'
-- After CLS update: TrangThaiHomNay = 'cho_kham_dv'
```

### ✅ Check Network Tab
- Open browser DevTools → Network tab
- Click "Tiếp nhận" button
- Find `PUT /api/cls/orders/{id}/status` request
- Check response:
  - Status 200 OK? ✅
  - Response body has data? ✅
  - Any error messages? ❌

### ✅ Check Transaction Rollback
If logs show "Patient status updated successfully" but database doesn't change:
- Transaction might be rolling back due to error in subsequent steps
- Check logs for errors after patient status update
- Common causes:
  - Queue creation fails (duplicate key)
  - Realtime broadcast fails
  - Database constraint violation

---

## Files Modified

1. `my-patients/src/components/patients/PatientExamMode.jsx` - CLS room display
2. `HealthCare/Services/OutpatientCare/ClsService.cs` - Backend logging
3. `my-patients/src/components/patients/PatientModal.jsx` - Frontend refetch

## Files Created

1. `my-patients/.kiro/specs/fix-cls-room-and-status/requirements.md` - EARS requirements
2. `my-patients/.kiro/specs/fix-cls-room-and-status/ANALYSIS.md` - Flow analysis
3. `my-patients/.kiro/specs/fix-cls-room-and-status/design.md` - Technical design
4. `my-patients/.kiro/specs/fix-cls-room-and-status/IMPLEMENTATION_SUMMARY.md` - This file

---

## Next Steps

1. **Test the changes**: Follow testing instructions above
2. **Monitor backend logs**: Watch for `[CLS]` log messages when testing
3. **Verify database**: Check patient status changes in database
4. **If issues persist**: Use debug checklist to identify root cause
5. **Remove logging**: Once issue is resolved, can remove console logs from production code

---

## Known Issues & Limitations

1. **Logging is temporary**: Console.WriteLine logs should be removed or replaced with proper logging framework in production
2. **No query invalidation for parent list**: If patient list is visible in parent component, it won't auto-refresh. User may need to manually refresh the page to see status change in the list view.
3. **Transaction rollback**: If any step after patient status update fails, entire transaction rolls back. Need to identify and fix root cause of any failures.

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Next**: User testing and validation
