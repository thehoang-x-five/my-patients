# Flow Analysis: Click "Xử lý chẩn đoán"

## Current Flow

### 1. User clicks "Xử lý chẩn đoán" button in Patients.jsx

**Patients.jsx (dòng ~450-490):**
```javascript
if (type === "process") {
  // Tìm phiếu khám đang hoạt động
  const clinicalList = await searchClinicalRaw({ MaBenhNhan: pid });
  const activeClinical = clinicalList.find(/* filter active */);
  const maPhieuKham = activeClinical?.MaPhieuKham;
  
  // ✅ Lưu maPhieuKham vào patient object
  patientWithExam = {
    ...p,
    MaPhieuKham: maPhieuKham,
    maPhieuKham: maPhieuKham,
  };
  
  // ✅ Mở modal với mode="process"
  setModal({ open: true, mode: "process", patient: patientWithExam });
}
```

### 2. PatientModal receives props and renders

**PatientModal.jsx:**

**Step 2.1: maPhieuKhamCurrent calculation (dòng ~77-92)**
```javascript
const maPhieuKhamCurrent = useMemo(() => {
  return (
    patient?.MaPhieuKham ||  // ✅ Có giá trị từ Patients.jsx
    patient?.maPhieuKham ||
    // ... other sources
  );
}, [patient, form]);
```
✅ **Result:** `maPhieuKhamCurrent` có giá trị hợp lệ

**Step 2.2: isWaitingProcess calculation (dòng ~708-710)**
```javascript
const isWaitingProcess =
  (patientForView?.status || "") === STATUSES.WAIT_PROC ||
  (patientForView?.status || "") === STATUSES.WAIT_PROC_SVC;
```
❌ **Problem:** Bệnh nhân có thể có status khác (ví dụ: `WAIT_EXAM`, `IN_EXAM`, etc.)
❌ **Result:** `isWaitingProcess = false`

**Step 2.3: useEffect check conditions (dòng ~596)**
```javascript
if (patient && mode === "process") {
  const maPhieuKham = patient?.MaPhieuKham || ...;
  
  if (isWaitingProcess && maPhieuKham) {  // ❌ isWaitingProcess = false
    fetchFinalDiagnosis();  // ❌ KHÔNG được gọi
  }
}
```
❌ **Result:** `fetchFinalDiagnosis()` KHÔNG được gọi vì `isWaitingProcess = false`

## Root Cause

**Điều kiện `if (isWaitingProcess && maPhieuKham)` quá strict!**

- Logic hiện tại: Chỉ fetch khi status = `WAIT_PROC` hoặc `WAIT_PROC_SVC`
- Thực tế: Bệnh nhân có thể có nhiều status khác nhau khi vào tab "Xử lý chẩn đoán"
- Kết quả: API không được gọi cho hầu hết các trường hợp

## Solution

**Option 1: Remove isWaitingProcess check (Recommended)**
```javascript
if (patient && mode === "process") {
  const maPhieuKham = patient?.MaPhieuKham || ...;
  
  if (maPhieuKham) {  // ✅ Chỉ cần có maPhieuKham
    fetchFinalDiagnosis();
  }
}
```

**Option 2: Expand isWaitingProcess to include more statuses**
```javascript
const isWaitingProcess =
  mode === "process" ||  // ✅ Nếu đang ở mode process thì cho phép fetch
  (patientForView?.status || "") === STATUSES.WAIT_PROC ||
  (patientForView?.status || "") === STATUSES.WAIT_PROC_SVC;
```

**Option 3: Check mode instead of status**
```javascript
if (patient && mode === "process") {
  const maPhieuKham = patient?.MaPhieuKham || ...;
  
  if (mode === "process" && maPhieuKham) {  // ✅ Check mode thay vì status
    fetchFinalDiagnosis();
  }
}
```

## Recommendation

**Use Option 1** - Remove `isWaitingProcess` check entirely. Lý do:
1. Nếu user đã vào tab "Xử lý chẩn đoán" (mode="process"), nghĩa là họ muốn xem/xử lý chẩn đoán
2. Status của bệnh nhân không quan trọng - quan trọng là có maPhieuKham để fetch
3. Đơn giản hóa logic, dễ maintain

