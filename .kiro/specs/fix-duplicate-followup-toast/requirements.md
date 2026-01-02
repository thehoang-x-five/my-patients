# Requirements: Fix Duplicate Follow-up Toast Notifications

## Introduction

Khi bác sĩ click "Hoàn tất & thu phí" và có chọn "Tái khám", hệ thống điều hướng sang trang Lịch hẹn nhưng xuất hiện nhiều toast notification duplicate về "lập lịch hẹn tái khám cho bệnh nhân". Vấn đề này gây trải nghiệm người dùng kém và cần được khắc phục.

## Glossary

- **Toast Notification**: Thông báo popup xuất hiện tạm thời trên màn hình
- **Follow-up Context**: Thông tin tái khám được lưu trong localStorage để truyền giữa các trang
- **PatientModal**: Modal xử lý chẩn đoán bệnh nhân
- **Appointments Page**: Trang quản lý lịch hẹn

## Requirements

### Requirement 1: Prevent Duplicate Toast on Navigation

**User Story:** As a doctor, when I complete an exam with follow-up appointment, I want to see only ONE toast notification about creating the follow-up appointment, so that I'm not overwhelmed with duplicate messages.

#### Acceptance Criteria

1. WHEN a doctor clicks "Hoàn tất & thu phí" with "Tái khám" selected THEN the system SHALL show exactly ONE toast notification about creating follow-up appointment
2. WHEN the Appointments page loads after follow-up navigation THEN the system SHALL NOT show duplicate toast notifications
3. WHEN the follow-up context is detected THEN the system SHALL show the toast notification only once per navigation flow
4. WHEN the user navigates away from Appointments page THEN the system SHALL clear the follow-up context to prevent stale notifications

### Requirement 2: Prevent Multiple Toast on Re-renders

**User Story:** As a user, when the Appointments page re-renders, I want to avoid seeing the same toast notification multiple times, so that the UI remains clean and professional.

#### Acceptance Criteria

1. WHEN the Appointments component re-renders THEN the system SHALL NOT show duplicate toast notifications
2. WHEN the follow-up context has already been processed THEN the system SHALL skip showing the toast again
3. WHEN the useEffect hook runs multiple times THEN the system SHALL use a flag to prevent duplicate toast calls
4. WHEN the toast is shown once THEN the system SHALL mark the context as "processed" to prevent future duplicates

### Requirement 3: Maintain Flash Animation Functionality

**User Story:** As a user, when I navigate to Appointments page for follow-up, I want the "Tạo lịch hẹn" button to flash/highlight, so that I know which action to take next.

#### Acceptance Criteria

1. WHEN the follow-up context is detected THEN the system SHALL trigger the flash animation on "Tạo lịch hẹn" button
2. WHEN the flash animation is triggered THEN the system SHALL maintain the animation for 5 seconds
3. WHEN the user clicks the "Tạo lịch hẹn" button THEN the system SHALL acknowledge and clear the flash animation
4. WHEN the flash animation completes THEN the system SHALL automatically clear the animation state

### Requirement 4: Clean Context Management

**User Story:** As a developer, I want the follow-up context to be properly managed and cleaned up, so that stale data doesn't cause issues in future navigation flows.

#### Acceptance Criteria

1. WHEN the follow-up toast is shown THEN the system SHALL mark the context as "notified"
2. WHEN the user creates a follow-up appointment THEN the system SHALL clear the follow-up context
3. WHEN the user navigates away from Appointments page without creating appointment THEN the system SHALL preserve the context for next visit
4. WHEN the context is older than 1 hour THEN the system SHALL automatically expire and clear it

## Technical Notes

### Current Issues

1. **Double Toast Call**: 
   - `PatientModal.jsx` line 2179 calls `toast.info()`
   - `Appointments.jsx` line 91 calls `toast.info()` again when detecting context

2. **No Duplicate Prevention**:
   - No flag to track if toast has been shown
   - useEffect in Appointments.jsx can run multiple times

3. **Context Not Marked as Processed**:
   - Context remains unchanged after showing toast
   - No way to know if notification was already shown

### Proposed Solution

1. **Remove toast from PatientModal**: Only save context, don't show toast
2. **Add "notified" flag to context**: Track if toast was already shown
3. **Use ref in Appointments**: Prevent duplicate useEffect execution
4. **Add context expiration**: Auto-clear old contexts

### Files to Modify

- `my-patients/src/components/patients/PatientModal.jsx`
- `my-patients/src/routes/Appointments.jsx`
- `my-patients/src/utils/followupContext.js`
