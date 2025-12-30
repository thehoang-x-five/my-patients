# Requirements Document - Cải thiện Flow Chẩn đoán và Tái khám

## Introduction

Cải thiện trải nghiệm người dùng trong flow chẩn đoán và tái khám:
1. **Tự động tải chẩn đoán**: Khi mở tab "Xử lý chẩn đoán", tự động tải chẩn đoán cuối (không cần click button)
2. **Bắt buộc chọn hướng xử trí**: Bác sĩ phải chọn ít nhất 1 checkbox hướng xử trí trước khi hoàn tất
3. **Đồng bộ hướng xử trí**: Các checkbox ở tab "Khám" sẽ được sync sang tab "Xử lý chẩn đoán" (không nhập text)
4. **Flow tái khám tự động**: Khi chọn "Tái khám", nút "Hoàn tất" sẽ:
   - Thu phí thuốc (nếu có)
   - Lưu thông tin bác sĩ vào localStorage
   - Điều hướng sang trang Lịch hẹn
   - Highlight nút "Tạo lịch hẹn"
   - Prefill thông tin bệnh nhân + bác sĩ khi click "Tạo lịch hẹn"

## Glossary

- **Tab Khám (ExamDetail)**: Tab để bác sĩ nhập chẩn đoán, đơn thuốc, hướng xử trí
- **Tab Xử lý chẩn đoán (PatientProcessMode)**: Tab để xem lại và hoàn tất chẩn đoán
- **Hướng xử trí**: Các lựa chọn: Cho về, Cho thuốc về, Tái khám
- **Chẩn đoán cuối (Final Diagnosis)**: Kết quả khám bệnh cuối cùng từ bác sĩ
- **Flow tái khám**: Quy trình tạo lịch hẹn tái khám cho bệnh nhân

## Requirements

### Requirement 1: Tự động tải chẩn đoán khi mở tab

**User Story:** As a bác sĩ, I want the diagnosis to load automatically when I open the "Xử lý chẩn đoán" tab, so that I don't have to click an extra button.

#### Acceptance Criteria

1. WHEN bác sĩ switches to "Xử lý chẩn đoán" tab THEN the system SHALL automatically fetch final diagnosis data
2. WHEN final diagnosis data is available THEN the system SHALL display it immediately without requiring user action
3. WHEN final diagnosis fetch fails THEN the system SHALL show an error message
4. WHEN no final diagnosis exists THEN the system SHALL show empty state message

### Requirement 2: Bắt buộc chọn hướng xử trí

**User Story:** As a system administrator, I want to ensure doctors select at least one treatment direction, so that patient care plans are complete.

#### Acceptance Criteria

1. WHEN bác sĩ clicks "Hoàn tất" button THEN the system SHALL validate that at least one treatment direction checkbox is selected
2. WHEN no treatment direction is selected THEN the system SHALL display error message "Vui lòng chọn ít nhất một hướng xử trí"
3. WHEN at least one treatment direction is selected THEN the system SHALL allow completion
4. WHEN validation fails THEN the system SHALL prevent form submission

### Requirement 3: Đồng bộ hướng xử trí giữa các tab

**User Story:** As a bác sĩ, I want treatment direction checkboxes to sync between tabs, so that I don't have to re-enter information.

#### Acceptance Criteria

1. WHEN bác sĩ selects treatment direction in "Khám" tab THEN the system SHALL sync the selection to "Xử lý chẩn đoán" tab
2. WHEN bác sĩ views "Xử lý chẩn đoán" tab THEN the system SHALL display treatment directions as checkboxes (not text input)
3. WHEN treatment direction changes in either tab THEN the system SHALL update both tabs
4. WHEN final diagnosis is loaded THEN the system SHALL populate treatment direction checkboxes from saved data

### Requirement 4: Flow tái khám tự động

**User Story:** As a bác sĩ, I want the system to automatically guide me through creating a follow-up appointment when I select "Tái khám", so that the process is streamlined.

#### Acceptance Criteria

1. WHEN bác sĩ selects "Tái khám" checkbox and clicks "Hoàn tất" THEN the system SHALL save doctor information to localStorage
2. WHEN "Tái khám" is selected and there are medications THEN the system SHALL process medication payment before navigation
3. WHEN payment is complete THEN the system SHALL navigate to Appointments page
4. WHEN Appointments page loads THEN the system SHALL highlight "Tạo lịch hẹn" button
5. WHEN user clicks "Tạo lịch hẹn" for the first time THEN the system SHALL prefill patient ID and doctor information
6. WHEN prefilling appointment form THEN the system SHALL use doctor's schedule for available time slots
7. WHEN appointment is created THEN the system SHALL clear localStorage data

### Requirement 5: Lưu trữ thông tin tái khám

**User Story:** As a system, I need to store follow-up appointment context, so that the appointment creation form can be prefilled correctly.

#### Acceptance Criteria

1. WHEN saving follow-up context THEN the system SHALL store: patient ID, patient name, doctor code, doctor name, exam date
2. WHEN storing context THEN the system SHALL use localStorage key "followup-appointment-context"
3. WHEN context is older than 1 hour THEN the system SHALL ignore it
4. WHEN appointment is created or cancelled THEN the system SHALL clear the context
5. WHEN user navigates away from Appointments page THEN the system SHALL preserve context for return

### Requirement 6: Highlight nút tạo lịch hẹn

**User Story:** As a bác sĩ, I want the "Tạo lịch hẹn" button to be highlighted after completing diagnosis with "Tái khám", so that I know what to do next.

#### Acceptance Criteria

1. WHEN Appointments page loads with follow-up context THEN the system SHALL add visual highlight to "Tạo lịch hẹn" button
2. WHEN button is highlighted THEN the system SHALL use animation or color to draw attention
3. WHEN user clicks the button THEN the system SHALL remove highlight
4. WHEN user navigates away THEN the system SHALL preserve highlight state if context exists

---

**Ngày tạo:** 2024-12-30
**Người tạo:** System Analysis
**Trạng thái:** Draft - Chờ xác nhận từ user
