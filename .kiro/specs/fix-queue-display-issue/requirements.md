# Requirements Document

## Introduction

Y tá hành chính đang gặp vấn đề khi tạo phiếu lịch sử trong tab khám bệnh - mặc dù API `/api/queue/search` trả về status 200 OK với data đúng, nhưng frontend không hiển thị danh sách hàng chờ (hiển thị rỗng). Vấn đề này cần được khắc phục để y tá hành chính có thể làm việc bình thường.

## Glossary

- **Y tá hành chính (Administrative Nurse)**: Nhân viên y tế có vai trò hành chính, được phép xem và quản lý tất cả hàng chờ trong hệ thống.
- **Hàng chờ (Queue)**: Danh sách bệnh nhân đang chờ khám hoặc thực hiện dịch vụ y tế.
- **Tab Khám bệnh (Medical Examination Tab)**: Giao diện người dùng hiển thị danh sách lịch sử khám bệnh và hàng chờ.
- **Frontend (FE)**: Phần giao diện người dùng của ứng dụng (React).
- **Backend (BE)**: Phần xử lý logic và dữ liệu của ứng dụng (ASP.NET Core).

## Requirements

### Requirement 1

**User Story:** Là developer, tôi muốn debug và log thông tin khi API queue search được gọi từ frontend, để tôi có thể xác định tại sao data không được hiển thị mặc dù API trả về thành công.

#### Acceptance Criteria

1. WHEN frontend gọi API queue search THEN hệ thống SHALL log request payload được gửi đi
2. WHEN API trả về response THEN hệ thống SHALL log response data nhận được
3. WHEN data được normalize THEN hệ thống SHALL log kết quả sau khi normalize
4. WHEN component render danh sách THEN hệ thống SHALL log số lượng items được render
5. WHEN có lỗi xảy ra THEN hệ thống SHALL log chi tiết lỗi và stack trace

### Requirement 2

**User Story:** Là y tá hành chính, tôi muốn xem danh sách hàng chờ được hiển thị đúng sau khi API trả về data, để tôi có thể tạo phiếu lịch sử cho bệnh nhân.

#### Acceptance Criteria

1. WHEN API queue search trả về data với status 200 THEN frontend SHALL parse và hiển thị danh sách hàng chờ
2. WHEN response chứa PagedResult với Items array THEN frontend SHALL extract Items array đúng cách
3. WHEN Items array không rỗng THEN frontend SHALL render từng item trong danh sách
4. WHEN Items array rỗng THEN frontend SHALL hiển thị thông báo "Không có hàng chờ"
5. WHEN data được normalize THEN frontend SHALL giữ nguyên tất cả thông tin cần thiết từ backend

### Requirement 3

**User Story:** Là developer, tôi muốn kiểm tra xem component nào đang sử dụng API queue search, để tôi có thể xác định đúng nơi cần fix.

#### Acceptance Criteria

1. WHEN tìm kiếm trong codebase THEN hệ thống SHALL liệt kê tất cả components sử dụng useQueueSearch hook
2. WHEN tìm kiếm trong codebase THEN hệ thống SHALL liệt kê tất cả nơi gọi search() function trực tiếp
3. WHEN xác định được component THEN hệ thống SHALL kiểm tra cách component xử lý data từ API
4. WHEN xác định được component THEN hệ thống SHALL kiểm tra cách component render danh sách
5. WHEN xác định được component THEN hệ thống SHALL kiểm tra các điều kiện filter hoặc transform data

### Requirement 4

**User Story:** Là developer, tôi muốn verify rằng data flow từ API đến UI hoạt động đúng, để đảm bảo không có bước nào bị mất data.

#### Acceptance Criteria

1. WHEN API trả về response THEN React Query SHALL cache data đúng cách
2. WHEN React Query cache data THEN useQueueSearch hook SHALL trả về data cho component
3. WHEN component nhận data THEN component SHALL không filter hoặc transform làm mất data
4. WHEN component render THEN component SHALL sử dụng đúng field name từ normalized data
5. WHEN có realtime update THEN component SHALL refetch và update danh sách đúng cách
