# Design Document - Fix CLS Room Display and Patient Status Update

## Overview

This document outlines the technical design for fixing two issues in the CLS (Cận lâm sàng) workflow:
1. **CLS Room Display**: Change from combobox to read-only text since each service has a fixed room
2. **Patient Status Update**: Debug and ensure patient status correctly updates when y tá accepts CLS order

## Technical Architecture

### 1. CLS Room Display Fix

#### Current Implementation
- **File**: `my-patients/src/components/patients/PatientExamMode.jsx` (lines 422-440)
- **Issue**: Displays a `<select>` dropdown for room selection
- **Problem**: Each CLS service has only ONE fixed room assigned in seed data, so dropdown is unnecessary

#### Proposed Solution
Replace the `<select>` dropdown with read-only text display:

```jsx
// BEFORE (lines 422-440):
<select
  value={serviceRooms[idx] || ""}
  onChange={(e) => setServiceRooms(...)}
  className="..."
  disabled={!serviceItems.length}
>
  <option value="">Chọn phòng</option>
  {SERVICE_ROOMS.map((r) => (
    <option key={r} value={r}>{r}</option>
  ))}
</select>

// AFTER:
<div className="w-full rounded-lg px-2 py-1.5 ring-1 ring-slate-200 bg-slate-50 text-sm text-slate-700">
  {serviceRooms[idx] || "—"}
</div>
```

#### Data Flow
1. Backend returns `MaPhongThucHien` for each service in `ChiTietDichVu`
2. Frontend prefills `serviceRoomPrefill` from CLS order data (PatientModal.jsx line 748)
3. `serviceRooms` state is initialized from `serviceRoomPrefill` (PatientModal.jsx line 855)
4. PatientExamMode displays the prefilled room as read-only text

### 2. Patient Status Update Debug

#### Current Backend Flow
**File**: `HealthCare/Services/OutpatientCare/ClsService.cs`
**Method**: `CapNhatTrangThaiPhieuClsAsync` (lines 325-450)

**Transaction Steps**:
1. Load phiếu CLS with includes (line 335-342)
2. Auto-billing: Create invoice if not exists (line 345-380)
3. Update phiếu CLS status to `"dang_thuc_hien"` (line 382-383)
4. **Update patient status to `"cho_kham_dv"`** (line 385-392) ✅
5. Update first service detail status (line 394-397)
6. Create queue for first service (line 399-417)
7. Broadcast realtime updates (line 419-428)

#### Potential Failure Points

**A. Validation Failure in PatientService**
- **File**: `HealthCare/Services/PatientManagement/PatientService.cs` (line 408-413)
- **Check**: `TrangThaiTaiKhoan` must be `"hoat_dong"`
- **Fix**: Ensure all patients have `TrangThaiTaiKhoan = "hoat_dong"` in database

```csharp
// PatientService.cs line 408-413
if (!string.Equals(entity.TrangThaiTaiKhoan, "hoat_dong", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Tài khoản bệnh nhân chưa được kích hoạt hoặc đã bị khóa, không thể cập nhật trạng thái trong ngày.");
}
```

**B. Transaction Rollback**
- If any step after line 391 fails, entire transaction rolls back
- Possible causes:
  - Queue creation fails (duplicate key, validation)
  - Realtime broadcast fails
  - Database constraint violation

**C. Frontend Not Refreshing**
- **File**: `my-patients/src/components/patients/PatientModal.jsx` (line 1394)
- After `updateClsOrderStatus` succeeds, frontend may not invalidate queries
- **Fix**: Add query invalidation after successful update

#### Debug Strategy

**Step 1: Add Backend Logging**
```csharp
// ClsService.cs line 391
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

**Step 2: Database Verification**
```sql
-- Check patient account status
SELECT MaBenhNhan, HoTen, TrangThaiTaiKhoan, TrangThaiHomNay, NgayTrangThai
FROM BenhNhans
WHERE MaBenhNhan = '<ma_benh_nhan>';

-- Check CLS order status
SELECT MaPhieuKhamCls, TrangThai, MaPhieuKhamLs
FROM PhieuKhamCanLamSangs
WHERE MaPhieuKhamCls = '<ma_phieu_cls>';
```

**Step 3: Frontend Query Invalidation**
```javascript
// PatientModal.jsx after line 1394
await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
toast.success("Cập nhật phiếu CLS thành công.");

// Add query invalidation
queryClient.invalidateQueries({ queryKey: ["patients"] });
queryClient.invalidateQueries({ queryKey: ["queue"] });
queryClient.invalidateQueries({ queryKey: ["patientDetail", pid] });
```

## Implementation Plan

### Phase 1: CLS Room Display Fix (Frontend)
1. Modify `PatientExamMode.jsx` (lines 422-440)
2. Replace `<select>` with read-only `<div>` displaying `serviceRooms[idx]`
3. Keep styling consistent with form inputs but use read-only appearance
4. Test with existing CLS orders to verify room display

### Phase 2: Patient Status Debug (Backend + Frontend)
1. Add logging to `ClsService.cs` (line 391)
2. Verify database: Check `TrangThaiTaiKhoan` for test patients
3. Test CLS order update flow and monitor backend console
4. If validation fails, update patient records to `TrangThaiTaiKhoan = "hoat_dong"`
5. If transaction rolls back, identify failing step from logs
6. Add frontend query invalidation after successful update

### Phase 3: Testing
1. **Test Case 1**: Y tá tiếp nhận CLS order
   - Expected: Patient status changes to `"cho_kham_dv"`
   - Verify: Backend logs, database, frontend display
2. **Test Case 2**: CLS room display
   - Expected: Room shown as read-only text, not dropdown
   - Verify: UI displays correct room from seed data
3. **Test Case 3**: Multiple services
   - Expected: Each service shows its assigned room
   - Verify: All rooms display correctly

## Data Models

### ChiTietDichVu (Service Detail)
```csharp
{
    MaChiTietDv: string,
    MaPhieuKhamCls: string,
    MaDichVu: string,
    TrangThai: string, // "chua_co_ket_qua" | "dang_thuc_hien" | "da_co_ket_qua"
    GhiChu: string?,
    DichVuYTe: {
        MaDichVu: string,
        TenDichVu: string,
        LoaiDichVu: string,
        DonGia: decimal,
        MaPhongThucHien: string, // ✅ Fixed room for each service
        PhongThucHien: {
            MaPhong: string,
            TenPhong: string
        }
    }
}
```

### BenhNhan (Patient)
```csharp
{
    MaBenhNhan: string,
    HoTen: string,
    TrangThaiTaiKhoan: string, // ✅ Must be "hoat_dong" to update status
    TrangThaiHomNay: string?, // "cho_kham_dv" | "dang_kham_dv" | ...
    NgayTrangThai: DateTime
}
```

## API Endpoints

### Update CLS Order Status
```
PUT /api/cls/orders/{maPhieuKhamCls}/status
Body: "dang_thuc_hien"

Response: ClsOrderDto {
    MaPhieuKhamCls: string,
    TrangThai: string,
    ListItemDV: ClsItemDto[]
}
```

### Update Patient Status
```
PUT /api/patients/{maBenhNhan}/status
Body: {
    TrangThaiHomNay: "cho_kham_dv"
}

Response: PatientDetailDto {
    MaBenhNhan: string,
    TrangThaiTaiKhoan: string,
    TrangThaiHomNay: string,
    NgayTrangThai: DateTime
}
```

## Error Handling

### Backend Errors
1. **InvalidOperationException**: Account not active
   - Message: "Tài khoản bệnh nhân chưa được kích hoạt hoặc đã bị khóa"
   - Solution: Update `TrangThaiTaiKhoan` to `"hoat_dong"`

2. **DbUpdateException**: Database constraint violation
   - Check for duplicate keys in HangDois table
   - Verify foreign key relationships

3. **Transaction Rollback**: Any step fails
   - Add logging to identify failing step
   - Fix root cause (validation, constraint, etc.)

### Frontend Errors
1. **Network Error**: API call fails
   - Display toast error with message
   - Don't open print modal

2. **Data Not Refreshing**: Query cache stale
   - Add query invalidation after successful update
   - Force refetch patient list and queue

## Security Considerations

- No changes to authentication/authorization
- Existing role-based access control remains
- Transaction ensures data consistency
- Logging doesn't expose sensitive patient data

## Performance Considerations

- Room display: No performance impact (just UI change)
- Patient status update: Already in transaction, no additional queries
- Query invalidation: Minimal impact, only refetches visible data

## Rollback Plan

If issues arise:
1. **CLS Room Display**: Revert PatientExamMode.jsx to previous version
2. **Patient Status**: Remove logging, investigate root cause
3. **Database**: No schema changes, safe to rollback code only

---

**Created**: 2024-12-30
**Status**: Ready for Implementation
**Dependencies**: None
