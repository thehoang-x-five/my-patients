# Phân tích Flow "Lập phiếu khám CLS" (Update CLS Status)

## ⚠️ VẤN ĐỀ PHÁT HIỆN: Trạng thái bệnh nhân không đổi

### Nguyên nhân có thể:

#### 1. ❌ **Validation thất bại trong `CapNhatTrangThaiBenhNhanAsync`**

Backend có check validation (PatientService.cs line 408-413):

```csharp
// Chỉ cho phép cập nhật khi tài khoản đang hoạt động
if (!string.Equals(entity.TrangThaiTaiKhoan, "hoat_dong", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Tài khoản bệnh nhân chưa được kích hoạt hoặc đã bị khóa, không thể cập nhật trạng thái trong ngày.");
}
```

**Kiểm tra:**
- Xem trong DB, bảng `BenhNhans`, cột `TrangThaiTaiKhoan` của bệnh nhân đó có phải `"hoat_dong"` không?
- Nếu là `null`, `""`, `"tam_dung"`, `"da_xoa"` → sẽ throw exception

#### 2. ❌ **Transaction rollback do lỗi ở bước sau**

Trong `ClsService.CapNhatTrangThaiPhieuClsAsync`, tất cả nằm trong transaction:

```csharp
using var transaction = await _db.Database.BeginTransactionAsync();
try
{
    // ... các bước
    await _patients.CapNhatTrangThaiBenhNhanAsync(...); // Line 391
    // ... các bước sau
    await transaction.CommitAsync(); // Line 419
}
catch (Exception)
{
    await transaction.RollbackAsync(); // ❌ Nếu có lỗi → rollback tất cả
    throw;
}
```

**Nếu có lỗi ở bất kỳ bước nào sau khi update trạng thái BN → toàn bộ transaction bị rollback!**

Các bước có thể gây lỗi:
- **Bước 5**: `CapNhatTrangThaiChiTietDVAsync` - update chi tiết DV
- **Bước 6**: `ThemVaoHangDoiAsync` - tạo hàng đợi (có thể duplicate key, validation fail...)
- **Bước 7**: `BroadcastClsOrderStatusUpdatedAsync` - realtime broadcast

#### 3. ❌ **Frontend không refresh data**

Sau khi update thành công, frontend có thể không invalidate query để refresh data.

---

## 🔍 CÁCH DEBUG

### Bước 1: Check log backend
Xem console backend khi click "Tiếp nhận", có exception nào không?

### Bước 2: Check database
```sql
-- Kiểm tra trạng thái tài khoản
SELECT MaBenhNhan, HoTen, TrangThaiTaiKhoan, TrangThaiHomNay, NgayTrangThai
FROM BenhNhans
WHERE MaBenhNhan = '<ma_benh_nhan>';

-- Kiểm tra phiếu CLS
SELECT MaPhieuKhamCls, TrangThai, MaPhieuKhamLs
FROM PhieuKhamCanLamSangs
WHERE MaPhieuKhamCls = '<ma_phieu_cls>';
```

### Bước 3: Check network tab
- Xem response của API `PUT /api/cls/orders/{id}/status`
- Status code 200 OK?
- Response body có data không?
- Có error message nào không?

### Bước 4: Add logging
Thêm log vào backend để trace:

```csharp
// Trong ClsService.CapNhatTrangThaiPhieuClsAsync
Console.WriteLine($"[DEBUG] Updating patient status for: {maBenhNhan2}");

await _patients.CapNhatTrangThaiBenhNhanAsync(
    maBenhNhan2,
    new PatientStatusUpdateRequest { TrangThaiHomNay = "cho_kham_dv" });

Console.WriteLine($"[DEBUG] Patient status updated successfully");
```

---

## Flow hiện tại khi Y tá click "Tiếp nhận" CLS

### Frontend (PatientModal.jsx line 1394)
```javascript
await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
```

### Backend (ClsService.cs - CapNhatTrangThaiPhieuClsAsync)

Khi nhận request `PUT /api/cls/orders/{maPhieuKhamCls}/status` với body `"dang_thuc_hien"`:

#### **Bước 1: Load phiếu CLS** (line 335-342)
```csharp
var phieu = await _db.PhieuKhamCanLamSangs
    .Include(p => p.PhieuKhamLamSang)
        .ThenInclude(ls => ls.BenhNhan)
    .Include(p => p.ChiTietDichVus)
        .ThenInclude(ct => ct.DichVuYTe)
    .FirstOrDefaultAsync(p => p.MaPhieuKhamCls == maPhieuKhamCls);
```

#### **Bước 2: Auto-billing - Tạo hóa đơn** (line 345-380)
```csharp
if (trangThai == "dang_thuc_hien")
{
    // Kiểm tra đã có hóa đơn chưa
    var daCoHoaDon = await _db.HoaDonThanhToans
        .AnyAsync(hd => hd.MaPhieuKhamCls == phieu.MaPhieuKhamCls);
    
    if (!daCoHoaDon)
    {
        // Tính tổng tiền từ tất cả dịch vụ
        var tongTien = phieu.ChiTietDichVus.Sum(ct => ct.DichVuYTe?.DonGia ?? 0m);
        
        // Lấy thu ngân (y tá hành chính)
        var thuNgan = await _db.NhanVienYTes
            .FirstOrDefaultAsync(nv => nv.VaiTro == "y_ta" && nv.LoaiYTa == "hanhchinh");
        
        // Tạo hóa đơn
        await _billing.TaoHoaDonAsync(new InvoiceCreateRequest
        {
            MaBenhNhan = maBenhNhan,
            MaNhanSuThu = thuNgan.MaNhanVien,
            LoaiDotThu = "can_lam_sang",
            SoTien = tongTien,
            MaPhieuKhamCls = phieu.MaPhieuKhamCls,
            PhuongThucThanhToan = "tien_mat",
            NoiDung = $"Thu phí cận lâm sàng - Phiếu {phieu.MaPhieuKhamCls}"
        });
    }
}
```

#### **Bước 3: Cập nhật trạng thái phiếu CLS** (line 382-383)
```csharp
phieu.TrangThai = trangThai; // "dang_thuc_hien"
await _db.SaveChangesAsync();
```

#### **Bước 4: ✅ Cập nhật trạng thái bệnh nhân** (line 385-392)
```csharp
var maBenhNhan2 = phieu.PhieuKhamLamSang?.MaBenhNhan;

if (!string.IsNullOrWhiteSpace(maBenhNhan2))
{
    await _patients.CapNhatTrangThaiBenhNhanAsync(
        maBenhNhan2,
        new PatientStatusUpdateRequest { TrangThaiHomNay = "cho_kham_dv" });
}
```

**⚠️ Có thể fail tại đây nếu:**
- `TrangThaiTaiKhoan != "hoat_dong"`
- `maBenhNhan2` null hoặc empty

#### **Bước 5: Cập nhật trạng thái chi tiết DV đầu tiên** (line 394-397)
```csharp
var firstCt = phieu.ChiTietDichVus.FirstOrDefault();

if (firstCt is not null)
{
    await CapNhatTrangThaiChiTietDVAsync(firstCt.MaChiTietDv, trangThai);
}
```

#### **Bước 6: Tạo hàng đợi cho DV đầu tiên** (line 399-417)
```csharp
if (firstCt is not null && !string.IsNullOrWhiteSpace(maBenhNhan2))
{
    var daCoHangDoi = await _db.HangDois.AnyAsync(h => h.MaChiTietDv == firstCt.MaChiTietDv);
    if (!daCoHangDoi)
    {
        var phongDv = firstCt.DichVuYTe?.MaPhongThucHien ?? "CLS_XN_01";
        await _queue.ThemVaoHangDoiAsync(new QueueEnqueueRequest
        {
            MaBenhNhan = maBenhNhan2!,
            MaPhong = phongDv,
            LoaiHangDoi = "can_lam_sang",
            MaChiTietDv = firstCt.MaChiTietDv,
            MaPhieuKham = null,
            Nguon = null,
            Nhan = null,
            ThoiGianLichHen = null
        });
    }
}
```

**⚠️ Có thể fail tại đây nếu:**
- Duplicate key trong HangDois
- Validation fail trong QueueService

#### **Bước 7: Broadcast realtime** (line 419-428)
```csharp
await transaction.CommitAsync();

var dto = await BuildClsOrderDtoAsync(maPhieuKhamCls);

if (dto is not null)
{
    await _realtime.BroadcastClsOrderStatusUpdatedAsync(dto);
    var dashboard = await _dashboard.LayDashboardHomNayAsync();
    await _realtime.BroadcastDashboardTodayAsync(dashboard);
}
```

---

## 🎯 KHUYẾN NGHỊ FIX

### Fix 1: Thêm logging để debug
```csharp
// Line 391 trong ClsService.cs
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

### Fix 2: Đảm bảo TrangThaiTaiKhoan = "hoat_dong"
Khi tạo bệnh nhân mới, luôn set:
```csharp
TrangThaiTaiKhoan = "hoat_dong"
```

### Fix 3: Frontend invalidate query sau khi update
```javascript
// Sau khi updateClsOrderStatus thành công
await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
// Invalidate để refresh data
queryClient.invalidateQueries({ queryKey: ["patients"] });
queryClient.invalidateQueries({ queryKey: ["queue"] });
```

---

**Ngày phân tích:** 2024-12-30
**Kết luận:** Cần debug để xác định nguyên nhân chính xác - có thể là validation fail hoặc transaction rollback.

