# Design: Fix Duplicate Follow-up Toast Notifications

## Overview

This design addresses the duplicate toast notification issue when navigating to the Appointments page after completing an exam with follow-up. The solution focuses on centralizing toast notifications, adding duplicate prevention mechanisms, and improving context lifecycle management.

## Architecture

### Current Flow (Problematic)

```
PatientModal (handleFinishDoctor)
  ├─> Save followup context to localStorage
  ├─> Show toast.info("Vui lòng tạo lịch hẹn...")  ❌ Toast #1
  ├─> Call uiStore.flashApptCreate()
  └─> Navigate to /appointments
       │
       └─> Appointments.jsx (useEffect on mount)
            ├─> Read followup context from localStorage
            ├─> Show toast.info("Vui lòng tạo lịch hẹn...")  ❌ Toast #2 (DUPLICATE!)
            └─> Call uiStore.flashApptCreate()
```

### Proposed Flow (Fixed)

```
PatientModal (handleFinishDoctor)
  ├─> Save followup context to localStorage (with notified: false)
  ├─> Call uiStore.flashApptCreate()
  └─> Navigate to /appointments
       │
       └─> Appointments.jsx (useEffect on mount - runs once with ref guard)
            ├─> Read followup context from localStorage
            ├─> Check if context.notified === false
            ├─> Show toast.info("Vui lòng tạo lịch hẹn...")  ✅ Toast (ONLY ONCE)
            ├─> Mark context as notified: true
            ├─> Call uiStore.flashApptCreate()
            └─> Save updated context back to localStorage
```

## Components and Interfaces

### 1. Follow-up Context Structure (Enhanced)

```typescript
interface FollowupContext {
  patientId: string;
  patientName: string;
  doctorCode: string;
  doctorName: string;
  examDate: string;  // ISO timestamp
  notified: boolean;  // ✅ NEW: Track if toast was shown
  createdAt: number;  // ✅ NEW: Timestamp for expiration check
}
```

### 2. followupContext.js Utilities (Enhanced)

```javascript
// Save context with default values
export function saveFollowupContext(data) {
  const context = {
    ...data,
    notified: false,  // ✅ Default: not notified yet
    createdAt: Date.now(),  // ✅ Track creation time
  };
  localStorage.setItem(FOLLOWUP_CONTEXT_KEY, JSON.stringify(context));
}

// Get context with expiration check
export function getFollowupContext() {
  const raw = localStorage.getItem(FOLLOWUP_CONTEXT_KEY);
  if (!raw) return null;
  
  const context = JSON.parse(raw);
  
  // ✅ Check expiration (1 hour)
  const ONE_HOUR = 60 * 60 * 1000;
  if (Date.now() - context.createdAt > ONE_HOUR) {
    clearFollowupContext();
    return null;
  }
  
  return context;
}

// Mark context as notified
export function markFollowupNotified() {
  const context = getFollowupContext();
  if (context) {
    context.notified = true;
    localStorage.setItem(FOLLOWUP_CONTEXT_KEY, JSON.stringify(context));
  }
}

// Clear context
export function clearFollowupContext() {
  localStorage.removeItem(FOLLOWUP_CONTEXT_KEY);
}
```

### 3. PatientModal.jsx Changes

**Remove toast notification, only save context:**

```javascript
// ✅ 3.5 Navigate to Appointments page with flash animation
// ❌ REMOVED: toast.info("Vui lòng tạo lịch hẹn tái khám cho bệnh nhân");
onClose?.();

// ✅ Sử dụng UIStore để flash nút "Tạo lịch hẹn"
const uiStore = useUIStore.getState();
uiStore.flashApptCreate();

// Navigate after a short delay
setTimeout(() => {
  navigate("/appointments");
}, 300);
```

### 4. Appointments.jsx Changes

**Add duplicate prevention with ref and notified flag:**

```javascript
// ✅ Ref to prevent duplicate useEffect execution
const hasProcessedFollowupRef = useRef(false);

// Check for follow-up context on mount
useEffect(() => {
  // ✅ Guard: Prevent duplicate execution
  if (hasProcessedFollowupRef.current) {
    console.log("[Appointments] Follow-up already processed, skipping");
    return;
  }
  
  const context = getFollowupContext();
  if (context) {
    // ✅ Check if already notified
    if (context.notified) {
      console.log("[Appointments] Follow-up context already notified, skipping toast");
      setHasFollowupContext(true);
      setFollowupContextData(context);
      
      // Still trigger flash animation
      const uiStore = useUIStore.getState();
      uiStore.flashApptCreate();
      
      hasProcessedFollowupRef.current = true;
      return;
    }
    
    // ✅ First time showing notification
    setHasFollowupContext(true);
    setFollowupContextData(context);
    console.log("[Appointments] Follow-up context detected:", context);
    
    // Show toast ONCE
    toast.info(`Vui lòng tạo lịch hẹn tái khám cho bệnh nhân: ${context.patientName}`);
    
    // Mark as notified
    markFollowupNotified();
    
    // Trigger flash animation
    const uiStore = useUIStore.getState();
    uiStore.flashApptCreate();
    
    // Mark as processed
    hasProcessedFollowupRef.current = true;
  }
}, []); // ✅ Empty deps - run only once on mount
```

## Data Models

### LocalStorage Schema

```javascript
// Key: "followup-context"
{
  "patientId": "BN001",
  "patientName": "Nguyễn Văn A",
  "doctorCode": "BS001",
  "doctorName": "Dr. Nguyễn Văn B",
  "examDate": "2024-01-15T10:30:00.000Z",
  "notified": false,  // ✅ NEW
  "createdAt": 1705315800000  // ✅ NEW
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Single Toast Per Navigation

*For any* follow-up navigation flow, the system should show exactly ONE toast notification about creating follow-up appointment, regardless of component re-renders.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Notified Flag Persistence

*For any* follow-up context that has been notified, subsequent reads of the context should have `notified: true`, preventing duplicate toast displays.

**Validates: Requirements 2.2, 2.4**

### Property 3: Context Expiration

*For any* follow-up context older than 1 hour, the system should automatically clear the context and return null when accessed.

**Validates: Requirements 4.4**

### Property 4: Flash Animation Independence

*For any* follow-up navigation, the flash animation should trigger regardless of whether the toast was shown, ensuring visual feedback is always provided.

**Validates: Requirements 3.1, 3.2**

## Error Handling

### Scenario 1: localStorage Unavailable

```javascript
try {
  saveFollowupContext(data);
} catch (err) {
  console.error("[Follow-up] Failed to save context:", err);
  toast.warn("Không thể lưu thông tin tái khám");
  // Continue with flow - don't block user
}
```

### Scenario 2: Corrupted Context Data

```javascript
try {
  const context = JSON.parse(raw);
  // Validate required fields
  if (!context.patientId || !context.patientName) {
    throw new Error("Invalid context structure");
  }
  return context;
} catch (err) {
  console.error("[Follow-up] Corrupted context, clearing:", err);
  clearFollowupContext();
  return null;
}
```

### Scenario 3: Multiple Rapid Navigations

```javascript
// Use ref to prevent race conditions
const hasProcessedFollowupRef = useRef(false);

useEffect(() => {
  if (hasProcessedFollowupRef.current) return;
  // ... process context
  hasProcessedFollowupRef.current = true;
}, []);
```

## Testing Strategy

### Unit Tests

1. **Test followupContext.js utilities**
   - `saveFollowupContext()` sets default values correctly
   - `getFollowupContext()` returns null for expired contexts
   - `markFollowupNotified()` updates notified flag
   - `clearFollowupContext()` removes data from localStorage

2. **Test PatientModal handleFinishDoctor**
   - Verify toast is NOT called when taiKham is true
   - Verify context is saved with notified: false
   - Verify navigation occurs after context save

3. **Test Appointments useEffect**
   - Verify toast is shown only once per mount
   - Verify notified flag prevents duplicate toast
   - Verify ref prevents duplicate execution
   - Verify flash animation triggers correctly

### Integration Tests

1. **Complete follow-up flow**
   - Complete exam with taiKham → Navigate to Appointments
   - Verify exactly ONE toast appears
   - Verify flash animation triggers
   - Verify context is marked as notified

2. **Re-navigation scenario**
   - Navigate to Appointments with existing notified context
   - Verify NO toast appears
   - Verify flash animation still triggers

3. **Context expiration**
   - Create context with old timestamp
   - Navigate to Appointments
   - Verify context is cleared and no toast appears

## Implementation Notes

### Migration Strategy

1. Update `followupContext.js` utilities first
2. Update `PatientModal.jsx` to remove toast
3. Update `Appointments.jsx` with ref guard and notified check
4. Test thoroughly in development
5. Deploy to production

### Backward Compatibility

Existing contexts in localStorage without `notified` or `createdAt` fields will be handled gracefully:

```javascript
const context = JSON.parse(raw);

// Add missing fields with defaults
if (context.notified === undefined) {
  context.notified = false;
}
if (context.createdAt === undefined) {
  context.createdAt = Date.now();
}
```

### Performance Considerations

- localStorage operations are synchronous but fast
- Ref checks are O(1) operations
- No performance impact expected

## Security Considerations

- Follow-up context contains patient PII (name, ID)
- Data is stored in localStorage (client-side only)
- Context expires after 1 hour to minimize exposure
- No sensitive medical data is stored in context
