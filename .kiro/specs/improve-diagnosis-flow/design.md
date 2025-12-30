# Design Document - Cải thiện Flow Chẩn đoán và Tái khám

## Overview

Thiết kế kỹ thuật để cải thiện trải nghiệm người dùng trong flow chẩn đoán và tái khám, bao gồm tự động tải dữ liệu, validation, đồng bộ state, và flow tái khám tự động với localStorage.

## Architecture

### Component Structure

```
PatientModal (parent)
├── ExamDetail (Tab Khám)
│   ├── Diagnosis form (dx state)
│   ├── Treatment direction checkboxes (dx.flags)
│   └── Medication list (rx state)
└── PatientProcessMode (Tab Xử lý chẩn đoán)
    ├── Auto-load diagnosis on mount
    ├── Display treatment directions as checkboxes
    ├── Validation before complete
    └── Follow-up flow handler
```

### Data Flow

```
1. ExamDetail: User selects treatment directions
   ↓
2. State synced to PatientProcessMode via props
   ↓
3. PatientProcessMode: Auto-load diagnosis on mount
   ↓
4. User clicks "Hoàn tất"
   ↓
5. Validation: Check at least one direction selected
   ↓
6. If "Tái khám" selected:
   - Save context to localStorage
   - Process medication payment (if any)
   - Navigate to /appointments
   ↓
7. Appointments page:
   - Detect context in localStorage
   - Highlight "Tạo lịch hẹn" button
   - Prefill form on first click
```

## Components and Interfaces

### 1. PatientModal State Management

**Current State:**
```jsx
const [diagnosisData, setDiagnosisData] = useState({
  dxPrimary: "",
  icd10: "",
  dxSecondary: "",
  summary: "",
  orders: "",
  advice: "",
  followup: "Cho thuốc về",  // ❌ Text field
  followupDate: "",
  followupTime: "",
});
```

**New State:**
```jsx
const [diagnosisData, setDiagnosisData] = useState({
  dxPrimary: "",
  icd10: "",
  dxSecondary: "",
  summary: "",
  orders: "",
  advice: "",
  followupFlags: {           // ✅ Checkbox flags
    choVe: false,
    choThuocVe: false,
    taiKham: false,
  },
  followupDate: "",
  followupTime: "",
});
```

### 2. Auto-load Diagnosis in PatientProcessMode

**Implementation:**
```jsx
// PatientProcessMode.jsx
useEffect(() => {
  if (!open || mode !== "process") return;
  if (!maPhieuKham) return;
  
  // Auto-fetch final diagnosis
  fetchFinalDiagnosis();
}, [open, mode, maPhieuKham]);

async function fetchFinalDiagnosis() {
  if (loadingFinalDx) return;
  setLoadingFinalDx(true);
  
  try {
    const dxRes = await getFinalDiagnosis(maPhieuKham);
    
    // Parse followup flags from HuongXuTri field
    const huongXuTri = dxRes.HuongXuTri || "";
    const flags = {
      choVe: huongXuTri.includes("cho_ve") || huongXuTri.includes("Cho về"),
      choThuocVe: huongXuTri.includes("cho_thuoc_ve") || huongXuTri.includes("Cho thuốc về"),
      taiKham: huongXuTri.includes("tai_kham") || huongXuTri.includes("Tái khám"),
    };
    
    setDiagnosisData({
      dxPrimary: dxRes.ChanDoanChinh || "",
      icd10: dxRes.MaICD10 || "",
      dxSecondary: dxRes.ChanDoanCuoi || "",
      summary: dxRes.NoiDungKham || "",
      orders: dxRes.PhatDoDieuTri || "",
      advice: dxRes.LoiKhuyen || "",
      followupFlags: flags,
      followupDate: "",
      followupTime: "",
    });
    
    toast.success("Đã tải chẩn đoán cuối.");
  } catch (err) {
    toast.error("Không thể tải chẩn đoán cuối.");
  } finally {
    setLoadingFinalDx(false);
  }
}
```

### 3. Treatment Direction Validation

**Implementation:**
```jsx
// PatientProcessMode.jsx
function validateTreatmentDirection() {
  const flags = diagnosisData.followupFlags || {};
  const hasSelection = flags.choVe || flags.choThuocVe || flags.taiKham;
  
  if (!hasSelection) {
    toast.error("Vui lòng chọn ít nhất một hướng xử trí");
    return false;
  }
  
  return true;
}

async function handleComplete() {
  // Validate before proceeding
  if (!validateTreatmentDirection()) {
    return;
  }
  
  // Continue with completion logic...
}
```

### 4. Follow-up Context Storage

**LocalStorage Schema:**
```typescript
interface FollowupContext {
  patientId: string;
  patientName: string;
  doctorCode: string;
  doctorName: string;
  examDate: string;
  timestamp: number;  // For expiry check
}
```

**Storage Functions:**
```jsx
// utils/followupContext.js
const CONTEXT_KEY = "followup-appointment-context";
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function saveFollowupContext(context) {
  const data = {
    ...context,
    timestamp: Date.now(),
  };
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(data));
}

export function getFollowupContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw);
    const age = Date.now() - (data.timestamp || 0);
    
    // Expire after 1 hour
    if (age > EXPIRY_MS) {
      clearFollowupContext();
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

export function clearFollowupContext() {
  localStorage.removeItem(CONTEXT_KEY);
}
```

### 5. Follow-up Flow Handler

**Implementation:**
```jsx
// PatientProcessMode.jsx
async function handleComplete() {
  if (!validateTreatmentDirection()) return;
  
  const flags = diagnosisData.followupFlags || {};
  
  // If "Tái khám" is selected
  if (flags.taiKham) {
    // Save context for appointment creation
    saveFollowupContext({
      patientId: patient.id,
      patientName: patient.name,
      doctorCode: currentUser.code,
      doctorName: currentUser.name,
      examDate: new Date().toISOString(),
    });
    
    // Process medication payment if needed
    if (rx.length > 0 && totalDrugAmount > 0) {
      try {
        await processMedicationPayment();
        toast.success("Đã thu phí thuốc");
      } catch (err) {
        toast.error("Lỗi thu phí thuốc");
        return;
      }
    }
    
    // Complete diagnosis
    await completeDiagnosis();
    
    // Navigate to appointments page
    navigate("/appointments");
    toast.info("Vui lòng tạo lịch hẹn tái khám cho bệnh nhân");
    
    return;
  }
  
  // Normal completion flow
  await completeDiagnosis();
  onClose();
}
```

### 6. Appointments Page Integration

**Highlight Button:**
```jsx
// Appointments.jsx
const [hasFollowupContext, setHasFollowupContext] = useState(false);

useEffect(() => {
  const context = getFollowupContext();
  setHasFollowupContext(!!context);
}, []);

return (
  <div>
    <button
      onClick={handleCreateAppointment}
      className={`
        px-4 py-2 rounded-lg
        ${hasFollowupContext 
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse ring-4 ring-emerald-300' 
          : 'bg-emerald-500'
        }
      `}
    >
      Tạo lịch hẹn
    </button>
  </div>
);
```

**Prefill Form:**
```jsx
// AppointmentModal.jsx
const [prefilled, setPrefilled] = useState(false);

useEffect(() => {
  if (open && !prefilled) {
    const context = getFollowupContext();
    
    if (context) {
      setForm({
        patientId: context.patientId,
        patientName: context.patientName,
        doctorCode: context.doctorCode,
        doctorName: context.doctorName,
        appointmentType: "tai_kham",
        // Time slots based on doctor's schedule
      });
      
      setPrefilled(true);
      clearFollowupContext(); // Clear after first use
    }
  }
}, [open, prefilled]);
```

## Data Models

### DiagnosisData (Updated)

```typescript
interface DiagnosisData {
  dxPrimary: string;           // Chẩn đoán chính
  icd10: string;               // Mã ICD-10
  dxSecondary: string;         // Chẩn đoán phụ
  summary: string;             // Tóm tắt
  orders: string;              // Phát đồ điều trị
  advice: string;              // Lời khuyên
  followupFlags: {             // ✅ Changed from text to flags
    choVe: boolean;
    choThuocVe: boolean;
    taiKham: boolean;
  };
  followupDate: string;
  followupTime: string;
}
```

### FollowupContext

```typescript
interface FollowupContext {
  patientId: string;
  patientName: string;
  doctorCode: string;
  doctorName: string;
  examDate: string;
  timestamp: number;
}
```

## API Endpoints

No new API endpoints required. Using existing:
- `GET /api/clinical/{maPhieuKham}/final-diagnosis` - Load diagnosis
- `POST /api/clinical/final-diagnosis` - Save diagnosis
- `PUT /api/clinical/{maPhieuKham}/status` - Complete exam

## Error Handling

### Validation Errors
1. **No treatment direction selected**
   - Message: "Vui lòng chọn ít nhất một hướng xử trí"
   - Action: Prevent form submission

2. **Failed to load diagnosis**
   - Message: "Không thể tải chẩn đoán cuối"
   - Action: Show error toast, allow manual retry

3. **Failed to save context**
   - Message: "Lỗi lưu thông tin tái khám"
   - Action: Log error, continue with normal flow

### Network Errors
- Auto-retry diagnosis fetch once
- Show error message if both attempts fail
- Allow manual refresh

## Security Considerations

- LocalStorage data is client-side only
- Context expires after 1 hour
- No sensitive medical data in localStorage (only IDs and names)
- Clear context after use

## Performance Considerations

- Auto-load diagnosis only when tab is active
- Debounce checkbox changes to avoid excessive re-renders
- Use React.memo for checkbox components
- LocalStorage operations are synchronous but fast

## Testing Strategy

### Unit Tests
1. Test `validateTreatmentDirection()` with various flag combinations
2. Test `saveFollowupContext()` and `getFollowupContext()`
3. Test context expiry logic
4. Test checkbox sync between tabs

### Integration Tests
1. Test auto-load diagnosis on tab switch
2. Test validation prevents completion without selection
3. Test follow-up flow: save → navigate → prefill
4. Test context clearing after appointment creation

### Manual Testing
1. Open "Xử lý chẩn đoán" tab → verify auto-load
2. Try to complete without selecting direction → verify error
3. Select "Tái khám" → complete → verify navigation and highlight
4. Create appointment → verify prefill and context clear

## Rollback Plan

If issues arise:
1. **Auto-load**: Add flag to disable auto-load, require manual button click
2. **Validation**: Make validation optional with warning instead of error
3. **Follow-up flow**: Revert to manual appointment creation
4. **LocalStorage**: Clear all contexts if corruption detected

---

**Created**: 2024-12-30
**Status**: Ready for Implementation
**Dependencies**: None
