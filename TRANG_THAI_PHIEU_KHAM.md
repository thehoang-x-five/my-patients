# Trạng Thái Phiếu Khám - Healthcare System

## 1. Phiếu Khám Lâm Sàng (LS)

| Trạng thái | Mô tả | Khi nào xảy ra |
|------------|-------|----------------|
| `da_lap` | Đã lập | Khi tạo phiếu khám mới (bệnh nhân vào khám) |
| `dang_thuc_hien` | Đang thực hiện | ✅ Khi bác sĩ click "Gọi vào" (HistoryService tự động set) |
| `da_lap_chan_doan` | Đã lập chẩn đoán | Khi bác sĩ xuất phiếu chẩn đoán (nhưng chưa hoàn tất) |
| `da_hoan_tat` | Đã hoàn tất | Khi hoàn tất toàn bộ quy trình khám |
| `da_huy` | Đã hủy | Khi hủy phiếu khám |

### Flow Phiếu Khám LS:
```
1. Tạo phiếu → da_lap (Đã lập)
2. Gọi vào khám → dang_thuc_hien (Đang thực hiện) ✅
3. Xuất chẩn đoán → da_lap_chan_doan (Đã lập chẩn đoán)
4. Hoàn tất → da_hoan_tat (Đã hoàn tất)
```

### Flow khi có chỉ định CLS:
```
1. Tạo phiếu → da_lap
2. Gọi vào → dang_thuc_hien
3. Chỉ định CLS (xuất phiếu khám) → dang_thuc_hien (giữ nguyên, chờ kết quả)
4. CLS xong, BN quay lại → dang_thuc_hien (tiếp tục khám)
5. Xuất chẩn đoán → da_lap_chan_doan
6. Hoàn tất → da_hoan_tat
```

### ✅ Đã fix:
- **Thống nhất tên:** Tất cả đều dùng `dang_thuc_hien` (giống CLS)
- **HistoryService** (line 415): Set `dang_thuc_hien` ✅
- **DashboardService** (line 201): Đếm `dang_thuc_hien` ✅
- **Entity comment**: Cập nhật `dang_thuc_hien` ✅
- **DataSeed**: Seed với `dang_thuc_hien` ✅
- **LuotKhamBenh entity**: Default `dang_thuc_hien` ✅

---

## 2. Phiếu Khám Cận Lâm Sàng (CLS)

| Trạng thái | Mô tả | Khi nào xảy ra |
|------------|-------|----------------|
| `da_lap` | Đã lập | Khi bác sĩ chỉ định CLS (tạo phiếu CLS) |
| `dang_thuc_hien` | Đang thực hiện | Khi y tá tiếp nhận và bắt đầu thực hiện |
| `da_hoan_tat` | Đã hoàn tất | Khi y tá hoàn tất và nhập kết quả |
| `da_huy` | Đã hủy | Khi hủy phiếu CLS |

### Flow Phiếu CLS:
```
1. Bác sĩ chỉ định → da_lap
2. Y tá thực hiện → dang_thuc_hien
3. Y tá hoàn tất → da_hoan_tat
```

**✅ Đã xóa:** Trạng thái `cho_thuc_hien` (không được sử dụng trong flow thực tế)

---

## 3. So Sánh LS vs CLS

| Đặc điểm | Phiếu LS | Phiếu CLS |
|----------|----------|-----------|
| Người tạo | Lễ tân / Bác sĩ | Bác sĩ (chỉ định) |
| Người thực hiện | Bác sĩ | Y tá CLS |
| Trạng thái "đang làm" | ✅ `dang_thuc_hien` | ✅ `dang_thuc_hien` |
| Trạng thái trung gian | `da_lap_chan_doan` | Không có |

**✅ Thống nhất:** Cả LS và CLS đều dùng `dang_thuc_hien` khi đang thực hiện!

---

## 4. Trạng Thái Liên Quan Khác

### Hàng Đợi (Queue):
- `cho_goi` - Chờ gọi
- `dang_thuc_hien` - Đang thực hiện (thống nhất với phiếu khám)
- `da_phuc_vu` - Đã phục vụ

### Lượt Khám (Visit):
- `dang_thuc_hien` - Đang thực hiện (thống nhất)
- `hoan_tat` - Hoàn tất

### Bệnh Nhân (Patient Status):
- `cho_kham` - Chờ khám
- `dang_thuc_hien` - Đang khám (LS) ← **Đã thống nhất**
- `cho_tiep_nhan_dv` - Chờ tiếp nhận dịch vụ
- `dang_kham_dv` - Đang khám dịch vụ (CLS)
- `cho_xu_ly` - Chờ xử lý
- `null` - Đã hoàn tất (không còn trạng thái)

---

**Ngày cập nhật:** 2024-12-30
**Nguồn:** 
- `HealthCare/Entities/PhieuKhamLamSang.cs` ✅ Fixed
- `HealthCare/Entities/LuotKhamBenh.cs` ✅ Fixed
- `HealthCare/Services/OutpatientCare/ClinicalService.cs`
- `HealthCare/Services/OutpatientCare/ClsService.cs`
- `HealthCare/Services/OutpatientCare/HistoryService.cs` ✅ Fixed
- `HealthCare/Services/Report/DashboardService.cs` ✅ Fixed
- `HealthCare/Datas/DataSeed.cs` ✅ Fixed
- `my-patients/src/routes/Examination.jsx`
