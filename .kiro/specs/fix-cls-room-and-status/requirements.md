# Requirements Document - Fix CLS Room Display and Patient Status Update

## Introduction

Khi y tá tiếp nhận và thực hiện dịch vụ CLS (Cận lâm sàng), hiện tại có 2 vấn đề:
1. **Phòng thực hiện hiển thị dạng combobox**: Mỗi dịch vụ CLS chỉ có 1 phòng cố định (ví dụ: tất cả xét nghiệm đều ở phòng xét nghiệm), nên không cần combobox mà chỉ cần hiển thị text phòng đã được gán sẵn.
2. **Trạng thái bệnh nhân không được cập nhật đúng**: Khi update status phiếu CLS từ `da_lap` → `dang_thuc_hien`, backend đang set sai giá trị (`cho_kham_dv` hiện tại, nhưng theo flow đúng phải luân phiên giữa `cho_kham_dv` và `dang_kham_dv` cho từng dịch vụ).

**Flow CLS đúng:**
- BS chỉ định CLS → BN: `cho_tiep_nhan_dv`
- Y tá tiếp nhận phiếu CLS → BN: `cho_kham_dv` (chờ khám DV đầu tiên)
- Y tá gọi vào DV #1 → BN: `dang_kham_dv` (đang khám DV #1)
- Y tá hoàn tất DV #1 → BN: `cho_kham_dv` (chờ khám DV #2)
- Y tá gọi vào DV #2 → BN: `dang_kham_dv` (đang khám DV #2)
- ... luân phiên cho đến hết
- Tất cả DV xong → BN: `cho_xu_ly` (chờ BS xem kết quả)

## Glossary

- **CLS (Cận Lâm Sàng)**: Các dịch vụ xét nghiệm, chẩn đoán hình ảnh (X-quang, siêu âm, CT, MRI)
- **Phiếu CLS**: Phiếu chỉ định các dịch vụ CLS do bác sĩ lập
- **Chi tiết dịch vụ (ChiTietDichVu)**: Một dòng dịch vụ cụ thể trong phiếu CLS
- **Phòng thực hiện (MaPhongThucHien)**: Phòng được gán sẵn cho mỗi dịch vụ CLS trong seed data
- **Y tá CLS**: Nhân viên y tế thực hiện các dịch vụ CLS
- **Trạng thái bệnh nhân (TrangThaiHomNay)**: Trạng thái hiện tại của bệnh nhân trong ngày

## Requirements

### Requirement 1: Hiển thị phòng CLS dạng text thay vì combobox

**User Story:** As a y tá CLS, I want to see the assigned room for each CLS service as read-only text, so that I don't have to select from a dropdown when the room is already predetermined.

#### Acceptance Criteria

1. WHEN y tá mở modal tiếp nhận dịch vụ CLS THEN the system SHALL display the room name as read-only text for each service
2. WHEN the service has a room assigned in seed data THEN the system SHALL prefill and display that room name
3. WHEN displaying multiple CLS services THEN the system SHALL show each service's assigned room without allowing changes
4. WHEN the room field is displayed THEN the system SHALL use a text display instead of a combobox/select element

### Requirement 2: Cập nhật đúng trạng thái bệnh nhân khi tiếp nhận CLS

**User Story:** As a y tá CLS, I want the patient status to correctly reflect "chờ khám dịch vụ" when I accept the CLS order, so that the patient enters the queue for individual service execution.

#### Acceptance Criteria

1. WHEN y tá clicks "Tiếp nhận" to update CLS order status to `dang_thuc_hien` THEN the system SHALL update patient status to `cho_kham_dv`
2. WHEN the backend method `CapNhatTrangThaiPhieuClsAsync` is called with status `dang_thuc_hien` THEN the system SHALL call `CapNhatTrangThaiBenhNhanAsync` with `TrangThaiHomNay = "cho_kham_dv"`
3. WHEN patient status is updated to `cho_kham_dv` THEN the system SHALL broadcast the status change via realtime service
4. WHEN viewing patient list THEN the system SHALL display patients with status `cho_kham_dv` as "Chờ khám dịch vụ (CLS)"

### Requirement 3: Đảm bảo tính nhất quán của trạng thái qua từng bước CLS

**User Story:** As a system administrator, I want patient status to transition correctly through each CLS service step, so that the queue and workflow management accurately reflect the patient's current state.

#### Acceptance Criteria

1. WHEN CLS order is created (status `da_lap`) THEN patient status SHALL be `cho_tiep_nhan_dv`
2. WHEN CLS order status changes to `dang_thuc_hien` (y tá tiếp nhận) THEN patient status SHALL be `cho_kham_dv`
3. WHEN y tá clicks "Gọi vào" for a specific service THEN patient status SHALL be `dang_kham_dv`
4. WHEN y tá completes one service and patient has more services pending THEN patient status SHALL return to `cho_kham_dv`
5. WHEN all CLS services are completed THEN patient status SHALL be `cho_xu_ly`
6. WHEN patient status changes THEN the system SHALL update dashboard statistics and broadcast via realtime service

---

**Ngày tạo:** 2024-12-30
**Người tạo:** System Analysis
**Trạng thái:** Draft - Chờ xác nhận từ user
