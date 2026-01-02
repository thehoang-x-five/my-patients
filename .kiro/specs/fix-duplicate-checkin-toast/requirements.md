# Requirements: Fix Duplicate Check-in Toast Notifications

## Introduction

Khi người dùng click "Check-in" trên lịch hẹn, hệ thống điều hướng sang trang Patients nhưng xuất hiện nhiều toast notification duplicate. Vấn đề này gây trải nghiệm người dùng kém và cần được khắc phục.

## Glossary

- **Check-in**: Hành động xác nhận bệnh nhân đã đến và sẵn sàng khám
- **Highlight**: Làm nổi bật dòng bệnh nhân trong danh sách
- **Flash Add**: Làm nổi bật nút "+ Thêm" để tạo hồ sơ mới
- **Patient Prefill**: Thông tin bệnh nhân được điền sẵn từ lịch hẹn

## Requirements

### Requirement 1: Prevent Duplicate Toast on Check-in Navigation

**User Story:** As a receptionist, when I check-in a patient, I want to see only ONE toast notification about the next action, so that I'm not overwhelmed with duplicate messages.

#### Acceptance Criteria

1. WHEN a user clicks "Check-in" on an appointment THEN the system SHALL show exactly ONE toast notification
2. WHEN the Patients page loads after check-in THEN the system SHALL NOT show duplicate toast notifications
3. WHEN the check-in context is detected THEN the system SHALL show the toast notification only once per navigation flow
4. WHEN the user navigates away from Patients page THEN the system SHALL clear the check-in context

### Requirement 2: Prevent Multiple Toast on Re-renders

**User Story:** As a user, when the Patients page re-renders, I want to avoid seeing the same toast notification multiple times, so that the UI remains clean.

#### Acceptance Criteria

1. WHEN the Patients component re-renders THEN the system SHALL NOT show duplicate toast notifications
2. WHEN the highlight or flashAdd context has already been processed THEN the system SHALL skip showing the toast again
3. WHEN the useEffect hook runs multiple times THEN the system SHALL use a flag to prevent duplicate toast calls
4. WHEN the toast is shown once THEN the system SHALL mark the context as "notified"

### Requirement 3: Maintain Highlight and Flash Functionality

**User Story:** As a user, when I check-in a patient, I want the patient row to be highlighted or the "+ Thêm" button to flash, so that I know which action to take next.

#### Acceptance Criteria

1. WHEN checking in an existing patient THEN the system SHALL highlight the patient row in the list
2. WHEN checking in a new patient THEN the system SHALL flash the "+ Thêm" button
3. WHEN the highlight or flash animation is triggered THEN the system SHALL maintain the animation for 5 seconds
4. WHEN the animation completes THEN the system SHALL automatically clear the animation state

### Requirement 4: Clean Context Management

**User Story:** As a developer, I want the check-in context to be properly managed and cleaned up, so that stale data doesn't cause issues.

#### Acceptance Criteria

1. WHEN the check-in toast is shown THEN the system SHALL mark the context as "notified"
2. WHEN the user performs the required action THEN the system SHALL clear the check-in context
3. WHEN the user navigates away from Patients page THEN the system SHALL preserve or clear context appropriately
4. WHEN the context is older than 1 hour THEN the system SHALL automatically expire and clear it

## Technical Notes

### Current Issues

1. **Multiple Toast Calls**:
   - `Appointments.jsx` handleCheckIn() calls toast (4 places: lines 488, 499, 511, 518)
   - `Patients.jsx` useEffect for flashAddAt calls toast (line 286)
   - `Patients.jsx` useEffect for flashAddAt calls toast again (line 325)

2. **No Duplicate Prevention**:
   - No flag to track if toast has been shown
   - useEffect hooks can run multiple times

3. **Context Not Marked as Processed**:
   - UIStore states (highlightPid, flashAddAt) remain unchanged after showing toast
   - No way to know if notification was already shown

### Proposed Solution

1. **Centralize toast in Patients.jsx**: Only show toast when detecting highlight/flash
2. **Add "notified" tracking to UIStore**: Track if toast was already shown
3. **Use refs in Patients.jsx**: Prevent duplicate useEffect execution
4. **Remove toast from Appointments.jsx**: Only set UIStore states, don't show toast

### Files to Modify

- `my-patients/src/routes/Appointments.jsx`
- `my-patients/src/routes/Patients.jsx`
- `my-patients/src/components/stores/appStore.js`
