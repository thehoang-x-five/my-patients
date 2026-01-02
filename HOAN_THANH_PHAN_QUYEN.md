# ✅ Hoàn thành phân quyền toàn diện cho hệ thống

## 🎯 Tổng quan

Đã hoàn thành việc triển khai phân quyền toàn diện cho cả Backend (4 controllers) và Frontend (7 files), đảm bảo:

- **Y tá hành chính**: Chỉ có quyền tiếp nhận (lịch hẹn, bệnh nhân, lập phiếu khám)
- **Bác sĩ / Y tá lâm sàng**: Quyền bằng nhau, toàn quyền khám bệnh, không có quyền tiếp nhận
- **Kỹ thuật viên / Y tá CLS**: Quyền bằng nhau, toàn quyền CLS, không có quyền tiếp nhận
- **Admin**: Toàn quyền tất cả

## ✅ Backend - Đã hoàn thành

### 0. RequireNurseTypeAttribute.cs ⚡ FIXED
**File**: `HealthCare/Attributes/RequireNurseTypeAttribute.cs`

**Vấn đề đã sửa:**
- Database lưu: `"hanhchinh"`, `"ls"`, `"cls"`
- Code kiểm tra: `"hanhchinh"`, `"phong_kham"`, `"can_lam_sang"`
- ❌ Mismatch → Y tá hành chính bị chặn khi tạo phiếu khám

**Giải pháp:**
- ✅ Thêm alias mapping để hỗ trợ cả tên cũ và tên mới
- ✅ Case-insensitive comparison
- ✅ Mapping:
  - `hanhchinh` → accepts: "hanhchinh", "hanh_chinh", "y_ta_hanh_chinh"
  - `phong_kham` → accepts: "phong_kham", "ls", "lam_sang", "y_ta_lam_sang"
  - `can_lam_sang` → accepts: "can_lam_sang", "cls", "y_ta_can_lam_sang"

### 0.1. RequireRoleAttribute.cs ⚡ FIXED
**File**: `HealthCare/Attributes/RequireRoleAttribute.cs`

**Vấn đề đã sửa:**
- Attribute đang check **ChucVu** thay vì **VaiTro**
- Y tá hành chính có: `VaiTro = "y_ta"`, `ChucVu = "y_ta_hanh_chinh"`
- Endpoint có: `[RequireRole("y_ta")]`
- ❌ Check ChucVu == "y_ta" → Fail (vì ChucVu = "y_ta_hanh_chinh")

**Giải pháp:**
- ✅ Đổi từ check `ChucVu` sang check `VaiTro`
- ✅ Admin vẫn check qua ChucVu (vì admin không có VaiTro riêng)
- ✅ Case-insensitive comparison
- ✅ Bây giờ: `[RequireRole("y_ta")]` → check `VaiTro == "y_ta"` → Pass ✅

### 1. AppointmentsController.cs
```csharp
// Đã thêm using HealthCare.Attributes;

[HttpPost] // Tạo lịch hẹn
[RequireRole("y_ta")]
[RequireNurseType("hanhchinh")]

[HttpPut("{maLichHen}")] // Cập nhật lịch hẹn
[RequireRole("y_ta")]
[RequireNurseType("hanhchinh")]

[HttpPut("{maLichHen}/status")] // Check-in
[RequireRole("y_ta")]
[RequireNurseType("hanhchinh")]
```

### 2. PatientsController.cs
```csharp
// Đã thêm using HealthCare.Attributes;

[HttpPost] // Tạo/cập nhật bệnh nhân
[RequireRole("y_ta")]
[RequireNurseType("hanhchinh")]

[HttpPut("{maBenhNhan}/status")] // Cập nhật trạng thái
[RequireRole("y_ta")]
[RequireNurseType("hanhchinh")]
```

### 3. ClsController.cs
```csharp
[HttpPost("orders")] // Tạo phiếu CLS (chỉ định)
[RequireRole("bac_si", "y_ta")]
[RequireNurseType("phong_kham")] // Bác sĩ + Y tá LS

[HttpPut("orders/{maPhieuKhamCls}/status")] // Cập nhật trạng thái
[RequireRole("ky_thuat_vien", "y_ta")]
[RequireNurseType("can_lam_sang")] // KTV + Y tá CLS

[HttpPost("results")] // Tạo kết quả
[RequireRole("ky_thuat_vien", "y_ta")]
[RequireNurseType("can_lam_sang")]

[HttpPost("summary/{maPhieuKhamCls}")] // Tạo tổng hợp
[RequireRole("ky_thuat_vien", "y_ta")]
[RequireNurseType("can_lam_sang")]

[HttpPut("summary/{maPhieuTongHop}")] // Cập nhật tổng hợp
[RequireRole("ky_thuat_vien", "y_ta")]
[RequireNurseType("can_lam_sang")]
```

### 4. ClinicalController.cs
```csharp
[HttpPost("final-diagnosis")] // Chẩn đoán
[RequireRole("bac_si", "y_ta")]
[RequireNurseType("phong_kham")] // Bác sĩ + Y tá LS có quyền bằng nhau

[HttpPost("{maPhieuKham}/complete")] // Hoàn tất khám
[RequireRole("bac_si", "y_ta")]
[RequireNurseType("phong_kham")] // Bác sĩ + Y tá LS có quyền bằng nhau
```

## ✅ Frontend - Đã hoàn thành

### 1. Tạo file permissions.js
**File**: `my-patients/src/utils/permissions.js`

Các hàm helper:
- `canManageReception(user)` - Kiểm tra quyền tiếp nhận
- `canManageClinical(user)` - Kiểm tra quyền khám lâm sàng
- `canManageCls(user)` - Kiểm tra quyền khám CLS
- `canCallPatient(user)` - Kiểm tra quyền gọi vào khám

### 2. Cập nhật Appointments.jsx
- ✅ Import `useAuthStore`, `canManageReception`
- ✅ Kiểm tra quyền: `const hasReceptionPermission = canManageReception(user);`
- ✅ Ẩn nút "+ Tạo lịch hẹn" với user không có quyền
- ✅ Ẩn nút "Check-in" với user không có quyền
- ✅ Ẩn nút "Sửa/Xóa" trong modal với user không có quyền

### 3. Cập nhật Patients.jsx
- ✅ Import `useAuthStore`, `canManageReception`
- ✅ Kiểm tra quyền: `const hasReceptionPermission = canManageReception(user);`
- ✅ Ẩn nút "+ Thêm" với user không có quyền
- ✅ Ẩn nút "✎ Sửa" trong table với user không có quyền

### 4. Cập nhật Examination.jsx
- ✅ Import `useAuthStore`, `canCallPatient`
- ✅ Kiểm tra quyền: `const canCall = canCallPatient(user);`
- ✅ Ẩn nút "Gọi vào" với Y tá hành chính (chỉ cho xem danh sách)

### 5. Cập nhật các Toolbar components
- ✅ `PatientsToolbar.jsx` - Chỉ hiện nút "+ Thêm" nếu có callback `onAdd`
- ✅ `ApptToolbar.jsx` - Chỉ hiện nút "+ Tạo lịch hẹn" nếu có callback `onOpenCreate`

### 6. Cập nhật PatientsTable.jsx
- ✅ Thêm prop `hasReceptionPermission`
- ✅ Thêm prop `canCreateExam` (quyền lập phiếu khám)
- ✅ Chỉ hiện nút "✎ Sửa" nếu có quyền
- ✅ Chỉ hiện nút "Lập phiếu khám" nếu có quyền
- ✅ Chỉ hiện nút "Xử lý & chẩn đoán" nếu có quyền (Y tá HC làm hậu cần)

### 7. PatientViewMode.jsx
- ✅ Đã có sẵn logic ẩn nút "Tạo lịch hẹn" nếu không có callback
- ✅ Không cần thay đổi

### 8. Cập nhật PatientModal.jsx
- ✅ Import `useAuthStore`, `canManageReception`
- ✅ Kiểm tra quyền: `const hasReceptionPermission = canManageReception(user);`
- ✅ Truyền `undefined` cho `handleCreateAppointmentFromView` nếu không có quyền

## 📋 Ma trận phân quyền chi tiết

### Y tá Hành chính:
| Chức năng | Quyền |
|-----------|-------|
| Tạo lịch hẹn | ✅ Có |
| Cập nhật lịch hẹn | ✅ Có |
| Check-in | ✅ Có |
| Tạo/sửa bệnh nhân | ✅ Có |
| Lập phiếu khám LS | ✅ Có |
| Cập nhật trạng thái phiếu khám | ✅ Có |
| Xem hàng chờ khám | ✅ Có |
| Gọi vào khám | ❌ Không |
| Chẩn đoán | ❌ Không |
| Chỉ định CLS | ❌ Không |
| Xử lý & chẩn đoán (hậu cần) | ✅ Có |

### Bác sĩ / Y tá Lâm sàng (quyền bằng nhau):
| Chức năng | Quyền |
|-----------|-------|
| Tạo lịch hẹn | ❌ Không |
| Tạo/sửa bệnh nhân | ❌ Không |
| Lập phiếu khám LS | ❌ Không |
| Xử lý & chẩn đoán (hậu cần) | ❌ Không |
| Gọi vào khám (trang Khám bệnh) | ✅ Có |
| Chẩn đoán (trong trang Khám bệnh) | ✅ Có |
| Hoàn tất khám | ✅ Có |
| Chỉ định CLS | ✅ Có |
| Xem tất cả trang | ✅ Có |

### Kỹ thuật viên / Y tá CLS (quyền bằng nhau):
| Chức năng | Quyền |
|-----------|-------|
| Tạo lịch hẹn | ❌ Không |
| Tạo/sửa bệnh nhân | ❌ Không |
| Gọi vào khám CLS | ✅ Có |
| Cập nhật kết quả CLS | ✅ Có |
| Tạo tổng hợp CLS | ✅ Có |
| Xem tất cả trang | ✅ Có |

### Admin:
| Chức năng | Quyền |
|-----------|-------|
| Tất cả | ✅ Có |

## 🔍 Cách kiểm tra

### Backend:
1. Đăng nhập với Y tá hành chính → Có thể tạo lịch hẹn, tạo bệnh nhân
2. Đăng nhập với Bác sĩ → Không thể tạo lịch hẹn (403 Forbidden)
3. Đăng nhập với Y tá lâm sàng → Có thể tạo chẩn đoán (bằng Bác sĩ)
4. Đăng nhập với Kỹ thuật viên → Có thể cập nhật kết quả CLS
5. Đăng nhập với Y tá CLS → Có thể cập nhật kết quả CLS (bằng KTV)
6. Đăng nhập với Admin → Có thể làm tất cả

### Frontend:
1. Đăng nhập với Y tá hành chính:
   - ✅ Thấy nút "+ Tạo lịch hẹn" ở trang Lịch hẹn
   - ✅ Thấy nút "+ Thêm" ở trang Bệnh nhân
   - ✅ Thấy nút "✎ Sửa" trong danh sách bệnh nhân
   - ✅ Thấy danh sách hàng chờ khám
   - ❌ KHÔNG thấy nút "Gọi vào" ở trang Khám bệnh

2. Đăng nhập với Bác sĩ / Y tá lâm sàng:
   - ❌ KHÔNG thấy nút "+ Tạo lịch hẹn"
   - ❌ KHÔNG thấy nút "+ Thêm" bệnh nhân
   - ❌ KHÔNG thấy nút "✎ Sửa" bệnh nhân
   - ❌ KHÔNG thấy nút "Tạo lịch hẹn" trong modal bệnh nhân
   - ❌ KHÔNG thấy nút "Lập phiếu khám" trong danh sách bệnh nhân
   - ❌ KHÔNG thấy nút "Xử lý & chẩn đoán" trong danh sách bệnh nhân
   - ✅ Thấy nút "Gọi vào" ở trang Khám bệnh
   - ✅ Có thể chẩn đoán và hoàn tất khám trong trang Khám bệnh

3. Đăng nhập với Kỹ thuật viên / Y tá CLS:
   - ❌ KHÔNG thấy nút "+ Tạo lịch hẹn"
   - ❌ KHÔNG thấy nút "+ Thêm" bệnh nhân
   - ✅ Thấy nút "Gọi vào" ở trang Khám bệnh (CLS)

4. Đăng nhập với Admin:
   - ✅ Thấy tất cả nút

## 📝 Lưu ý quan trọng

1. **Backend là nguồn chân lý**: Frontend chỉ ẩn/hiện UI để UX tốt hơn, nhưng backend mới là nơi kiểm tra quyền thực sự
2. **Admin bypass**: Admin tự động bypass tất cả kiểm tra quyền (đã implement trong `RequireRoleAttribute` và `RequireNurseTypeAttribute`)
3. **Backward compatibility**: Tất cả component đều có giá trị mặc định để tương thích ngược
4. **Data separation**: Dữ liệu LS và CLS đã được phân tách riêng ở trang Khám bệnh

## 🎉 Kết luận

Đã hoàn thành 100% yêu cầu phân quyền:
- ✅ 4 Backend controllers đã được cập nhật
- ✅ 8 Frontend files đã được cập nhật (thêm PatientModal.jsx)
- ✅ 1 Permission helper đã được tạo
- ✅ Không có lỗi compile/lint
- ✅ Tất cả logic đã được kiểm tra
- ✅ Bác sĩ KHÔNG có quyền tạo lịch hẹn
- ✅ Bác sĩ KHÔNG có quyền lập phiếu khám LS (chỉ có quyền chỉ định CLS)
- ✅ Bác sĩ KHÔNG có quyền "Xử lý & chẩn đoán" (hậu cần) - chỉ làm việc trong trang Khám bệnh
- ✅ **Tự động lọc data theo VaiTro + ChucVu** (Y tá LS chỉ thấy LS, Y tá CLS chỉ thấy CLS)
- ✅ **RequireNurseTypeAttribute hỗ trợ aliases** (hanhchinh, ls, cls) - FIX lỗi Y tá HC bị chặn

**Phân công rõ ràng:**
- **Y tá hành chính**: Tiếp nhận + Hậu cần (lập phiếu, xử lý & chẩn đoán để phát thuốc) + Xem cả LS và CLS
- **Bác sĩ / Y tá LS**: Chỉ làm việc trong trang Khám bệnh LS (gọi vào, chẩn đoán, chỉ định CLS)
- **KTV / Y tá CLS**: Chỉ làm việc trong trang Khám bệnh CLS

**Lọc data tự động:**
- Mỗi user chỉ thấy data liên quan đến công việc của mình
- Không cần chọn thủ công "Lâm sàng" hay "CLS"
- Dựa trên VaiTro + ChucVu để tự động filter

**Bug fixes:**
- ✅ Fixed: Y tá hành chính bị chặn khi tạo phiếu khám (do mismatch giữa database value "hanhchinh" và code check)
- ✅ Solution: Thêm alias mapping trong RequireNurseTypeAttribute để hỗ trợ cả tên cũ (ls, cls) và tên mới (phong_kham, can_lam_sang)

Hệ thống giờ đã có phân quyền toàn diện và lọc data chính xác theo vai trò!
