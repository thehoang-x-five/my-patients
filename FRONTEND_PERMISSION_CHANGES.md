# Thay đổi phân quyền Frontend - Summary

## 1. Tạo Permission Helper

File: `my-patients/src/utils/permissions.js`

```javascript
// Vai trò
export const ROLES = {
  ADMIN: 'admin',
  BAC_SI: 'bac_si',
  Y_TA: 'y_ta',
  KY_THUAT_VIEN: 'ky_thuat_vien',
};

// Loại Y tá
export const NURSE_TYPES = {
  HANH_CHINH: 'hanhchinh',
  PHONG_KHAM: 'phong_kham',
  CAN_LAM_SANG: 'can_lam_sang',
};

// Lấy thông tin user từ store
export const getUserRole = (user) => {
  return user?.ChucVu || user?.chucVu || user?.role || null;
};

export const getNurseType = (user) => {
  return user?.LoaiYTa || user?.loaiYTa || user?.nurseType || null;
};

// Kiểm tra quyền
export const isAdmin = (user) => {
  return getUserRole(user) === ROLES.ADMIN;
};

export const isDoctor = (user) => {
  return getUserRole(user) === ROLES.BAC_SI;
};

export const isNurse = (user) => {
  return getUserRole(user) === ROLES.Y_TA;
};

export const isReceptionNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.HANH_CHINH;
};

export const isClinicalNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.PHONG_KHAM;
};

export const isClsNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.CAN_LAM_SANG;
};

export const isTechnician = (user) => {
  return getUserRole(user) === ROLES.KY_THUAT_VIEN;
};

// Quyền tiếp nhận (Lịch hẹn + Bệnh nhân)
export const canManageReception = (user) => {
  return isAdmin(user) || isReceptionNurse(user);
};

// Quyền khám lâm sàng
export const canManageClinical = (user) => {
  return isAdmin(user) || isDoctor(user) || isClinicalNurse(user);
};

// Quyền khám CLS
export const canManageCls = (user) => {
  return isAdmin(user) || isTechnician(user) || isClsNurse(user);
};

// Quyền gọi vào khám
export const canCallPatient = (user) => {
  return canManageClinical(user) || canManageCls(user);
};
```

---

## 2. Cập nhật Components

### 2.1. Appointments.jsx

```javascript
import { canManageReception } from '../utils/permissions';
import { useAuthStore } from '../components/stores/appStore';

// Trong component:
const user = useAuthStore((s) => s.user);
const hasReceptionPermission = canManageReception(user);

// Ẩn nút "+ Tạo lịch hẹn"
{hasReceptionPermission && (
  <button onClick={onOpenCreate}>+ Tạo lịch hẹn</button>
)}

// Ẩn nút "Check-in" trong list/modal
{hasReceptionPermission && (
  <button onClick={() => handleCheckIn(appt)}>Check-in</button>
)}

// Ẩn nút "Sửa/Xóa" trong modal
{hasReceptionPermission && (
  <>
    <button onClick={onUpdate}>Cập nhật</button>
    <button onClick={onDelete}>Xóa</button>
  </>
)}
```

---

### 2.2. Patients.jsx

```javascript
import { canManageReception } from '../utils/permissions';
import { useAuthStore } from '../components/stores/appStore';

// Trong component:
const user = useAuthStore((s) => s.user);
const hasReceptionPermission = canManageReception(user);

// Ẩn nút "+ Thêm"
<PatientsToolbar
  onAdd={hasReceptionPermission ? () => setModal(...) : undefined}
  // ...
/>

// Trong PatientsToolbar.jsx:
{onAdd && (
  <button onClick={onAdd}>+ Thêm</button>
)}

// Ẩn nút "✎ Sửa" trong table
{hasReceptionPermission && (
  <Button onClick={() => onAction?.("edit", p)}>✎</Button>
)}
```

---

### 2.3. PatientModal.jsx

```javascript
import { canManageReception } from '../utils/permissions';
import { useAuthStore } from '../components/stores/appStore';

// Trong component:
const user = useAuthStore((s) => s.user);
const hasReceptionPermission = canManageReception(user);

// Ẩn nút "Tạo lịch hẹn" trong PatientViewMode
<PatientViewMode
  handleCreateAppointmentFromView={
    hasReceptionPermission ? handleCreateAppointmentFromView : undefined
  }
/>

// Trong PatientViewMode.jsx:
{handleCreateAppointmentFromView && (
  <button onClick={handleCreateAppointmentFromView}>
    Tạo lịch hẹn
  </button>
)}

// Disable form edit trong PatientFormMode
<PatientFormMode
  mode={hasReceptionPermission ? mode : "view"}
  readOnly={!hasReceptionPermission}
/>
```

---

### 2.4. Examination.jsx

```javascript
import { canCallPatient } from '../utils/permissions';
import { useAuthStore } from '../components/stores/appStore';

// Trong component:
const user = useAuthStore((s) => s.user);
const canCall = canCallPatient(user);

// Ẩn nút "Gọi vào" với Y tá HC
{canCall && (
  <button onClick={() => handleCallPatient(patient)}>
    Gọi vào
  </button>
)}

// Y tá HC vẫn xem được danh sách hàng chờ (không ẩn table)
```

---

## 3. Cập nhật PatientsToolbar.jsx

```javascript
export default function PatientsToolbar({
  onAdd,  // Truyền undefined nếu không có quyền
  // ...
}) {
  return (
    <div className="flex items-center gap-3">
      {/* ... */}
      
      {/* Chỉ hiện nút nếu có onAdd */}
      {onAdd && (
        <button onClick={onAdd}>+ Thêm</button>
      )}
    </div>
  );
}
```

---

## 4. Cập nhật ApptToolbar.jsx

```javascript
export default function ApptToolbar({
  onOpenCreate,  // Truyền undefined nếu không có quyền
  // ...
}) {
  return (
    <div className="flex items-center gap-3">
      {/* ... */}
      
      {/* Chỉ hiện nút nếu có onOpenCreate */}
      {onOpenCreate && (
        <button onClick={onOpenCreate}>+ Tạo lịch hẹn</button>
      )}
    </div>
  );
}
```

---

## 5. Cập nhật PatientViewMode.jsx

```javascript
export default function PatientViewMode({
  handleCreateAppointmentFromView,  // Truyền undefined nếu không có quyền
  // ...
}) {
  return (
    <div>
      {/* ... */}
      
      {/* Chỉ hiện nút nếu có callback */}
      {handleCreateAppointmentFromView && (
        <button onClick={handleCreateAppointmentFromView}>
          Tạo lịch hẹn
        </button>
      )}
    </div>
  );
}
```

---

## Tóm tắt thay đổi:

1. ✅ Tạo `permissions.js` helper
2. ✅ Import helper vào các component
3. ✅ Lấy user từ `useAuthStore`
4. ✅ Check quyền và ẩn/hiện UI
5. ✅ Truyền `undefined` cho callback nếu không có quyền
6. ✅ Component con check callback trước khi render nút

**Lưu ý:** Frontend chỉ để UX tốt hơn, backend mới là nguồn chân lý về quyền hạn!
