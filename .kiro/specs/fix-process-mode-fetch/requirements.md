# Requirements Document

## Introduction

Khi người dùng click vào nút "Xử lý chẩn đoán" trong danh sách bệnh nhân, hệ thống cần tự động gọi API để lấy thông tin chẩn đoán cuối từ backend và hiển thị lên form. Hiện tại:

1. ✅ Patients.jsx đã tìm và truyền `maPhieuKham` vào patient object
2. ✅ PatientModal có useEffect để trigger fetch khi mode="process"
3. ✅ Hàm `fetchFinalDiagnosis` tồn tại ở dòng 1330
4. ❌ **Hàm sử dụng `maPhieuKhamCurrent` - một biến không reactive** → khi `patient` prop thay đổi (có maPhieuKham mới), `maPhieuKhamCurrent` vẫn giữ giá trị cũ
5. ❌ Hàm check `if (!maPhieuKhamCurrent)` và return sớm → không có API call nào được thực hiện

**Root cause:** `maPhieuKhamCurrent` là biến thường được tính toán một lần khi component render, không tự động update khi `patient` hoặc `form` thay đổi. Khi `fetchFinalDiagnosis()` được gọi, nó check một giá trị stale và return sớm.

**Solution:** Cần wrap `maPhieuKhamCurrent` trong `useMemo` để nó reactive, hoặc sử dụng ref pattern như trong commit 3ddaeb9 để lấy giá trị động.

## Glossary

- **PatientModal**: Component modal chính để quản lý thông tin bệnh nhân với nhiều mode khác nhau (view, edit, exam, process)
- **Patients.jsx**: Component danh sách bệnh nhân, xử lý action "process" để mở modal xử lý chẩn đoán
- **maPhieuKham**: Mã phiếu khám lâm sàng, dùng để query chẩn đoán cuối
- **maPhieuKhamCurrent**: Biến trong PatientModal để lưu mã phiếu khám hiện tại - KHÔNG reactive (tính toán một lần khi render)
- **fetchFinalDiagnosis**: Hàm async ở dòng 1330 để gọi API getFinalDiagnosis - hiện tại sử dụng maPhieuKhamCurrent stale
- **getFinalDiagnosis**: API function từ examination.js để lấy thông tin chẩn đoán cuối từ backend
- **mode**: Trạng thái hiện tại của PatientModal (view/edit/exam/process)
- **diagnosisData**: State lưu thông tin chẩn đoán (dxPrimary, dxSecondary, summary, orders, advice, etc.)
- **Reactive value**: Giá trị tự động update khi dependencies thay đổi (useMemo, useCallback, useRef)
- **Stale closure**: Vấn đề khi function capture giá trị cũ của biến và không nhận được giá trị mới

## Requirements

### Requirement 1

**User Story:** Là bác sĩ/y tá, tôi muốn khi click vào nút "Xử lý chẩn đoán" trong danh sách bệnh nhân, hệ thống tự động load thông tin chẩn đoán từ backend, để tôi có thể xem và xử lý ngay mà không cần thao tác thêm.

#### Acceptance Criteria

1. WHEN người dùng click nút "Xử lý chẩn đoán" trong danh sách bệnh nhân THEN hệ thống SHALL mở PatientModal với mode="process" và patient object chứa maPhieuKham
2. WHEN PatientModal được mount với mode="process" AND có maPhieuKham hợp lệ THEN hệ thống SHALL tự động gọi API getFinalDiagnosis
3. WHEN API getFinalDiagnosis trả về thành công THEN hệ thống SHALL cập nhật diagnosisData với thông tin chẩn đoán sơ bộ, chẩn đoán cuối, nội dung khám, phác đồ điều trị, lời khuyên
4. WHEN API getFinalDiagnosis trả về lỗi THEN hệ thống SHALL hiển thị toast error với thông báo lỗi rõ ràng
5. WHEN không có maPhieuKham THEN hệ thống SHALL hiển thị toast error "Thiếu mã phiếu khám"

### Requirement 2

**User Story:** Là developer, tôi muốn `maPhieuKhamCurrent` là một reactive value hoặc hàm `fetchFinalDiagnosis` lấy giá trị động, để logic fetch chẩn đoán hoạt động đúng khi patient prop thay đổi.

#### Acceptance Criteria

1. WHEN patient prop thay đổi (có maPhieuKham mới) THEN maPhieuKhamCurrent SHALL tự động update với giá trị mới HOẶC fetchFinalDiagnosis SHALL lấy giá trị động từ patient/form
2. WHEN fetchFinalDiagnosis được gọi THEN hàm SHALL lấy maPhieuKham từ nguồn động (patient/form/ref) thay vì sử dụng maPhieuKhamCurrent stale
3. WHEN maPhieuKham hợp lệ THEN hàm SHALL gọi API getFinalDiagnosis với maPhieuKham
4. WHEN API trả về success THEN hàm SHALL map response data vào diagnosisData state
5. WHEN API trả về error THEN hàm SHALL hiển thị toast error với message rõ ràng
6. WHEN hàm đang chạy THEN hàm SHALL set loadingFinalDiagnosis = true và reset về false khi hoàn thành
