# Lọc dữ liệu theo Vai trò và Chức vụ

## ❓ Vấn đề

Hiện tại hệ thống dùng **VaiTro** (role) để phân quyền, nhưng với Y tá cần thêm **ChucVu** (nurse type) để phân biệt:
- Y tá hành chính (hanhchinh)
- Y tá lâm sàng (phong_kham)
- Y tá CLS (can_lam_sang)

Nếu chỉ dùng VaiTro = "y_ta" để lọc data → tất cả Y tá sẽ thấy chung data (không phân biệt được).

## ✅ Giải pháp

**KHÔNG đổi hết sang ChucVu** vì:
1. Backend đã đúng: dùng **VaiTro + ChucVu** kết hợp
2. Frontend đã đúng: `permissions.js` check cả 2 field
3. Chỉ cần **tự động lọc data theo user**

## 🔧 Đã thực hiện

### 1. Trang Khám bệnh (Examination.jsx)

**Trước đây**: User phải chọn thủ công "Lâm sàng" hoặc "CLS"

**Bây giờ**: Tự động lọc theo vai trò:

```javascript
// ✅ Auto-detect queue type based on user role
const defaultKind = useMemo(() => {
  // Bác sĩ → chỉ LS
  if (userRole === 'bac_si') return 'clinical';
  
  // Kỹ thuật viên → chỉ CLS
  if (userRole === 'ky_thuat_vien') return 'cls';
  
  // Y tá → phụ thuộc vào loại
  if (userRole === 'y_ta') {
    if (nurseType === 'phong_kham') return 'clinical'; // Y tá LS
    if (nurseType === 'can_lam_sang') return 'cls'; // Y tá CLS
    if (nurseType === 'hanhchinh') return 'all'; // Y tá HC xem cả 2
  }
  
  // Admin → xem tất cả
  if (userRole === 'admin') return 'all';
  
  return 'all';
}, [userRole, nurseType]);
```

## 📋 Kết quả

| Vai trò | Chức vụ | Thấy hàng đợi |
|---------|---------|---------------|
| Bác sĩ | - | Chỉ LS |
| Y tá | Lâm sàng (phong_kham) | Chỉ LS |
| Y tá | CLS (can_lam_sang) | Chỉ CLS |
| Y tá | Hành chính (hanhchinh) | Cả LS và CLS (để xem) |
| Kỹ thuật viên | - | Chỉ CLS |
| Admin | - | Tất cả |

## 🎯 Lợi ích

1. **Tự động**: User không cần chọn thủ công
2. **Chính xác**: Mỗi user chỉ thấy data liên quan đến công việc
3. **Bảo mật**: Không thể xem data của phòng khác
4. **UX tốt**: Giảm confusion, tập trung vào công việc

## 📝 Lưu ý

### Backend đã đúng:
- ✅ Dùng `[RequireRole("y_ta")]` + `[RequireNurseType("phong_kham")]`
- ✅ Admin tự động bypass
- ✅ Phân quyền chính xác

### Frontend đã đúng:
- ✅ `permissions.js` check cả VaiTro và ChucVu
- ✅ Ẩn/hiện UI theo quyền
- ✅ Tự động lọc data theo user

### Không cần thay đổi:
- ❌ KHÔNG cần đổi VaiTro thành ChucVu
- ❌ KHÔNG cần sửa backend
- ✅ Chỉ cần tự động lọc data ở frontend

## 🔍 Các nơi khác cần kiểm tra

Nếu có các trang khác cũng hiển thị data theo user, cần áp dụng logic tương tự:

1. **Dashboard** - Thống kê theo phòng ban
2. **Reports** - Báo cáo theo vai trò
3. **History** - Lịch sử khám theo loại

Nguyên tắc: **Dùng VaiTro + ChucVu để tự động lọc, không để user chọn thủ công**
