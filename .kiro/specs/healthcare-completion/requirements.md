# Requirements Document - Hoàn thiện Hệ thống HealthCare

## Introduction

Dự án HealthCare là một hệ thống quản lý bệnh viện với kiến trúc SOA (Service-Oriented Architecture), bao gồm backend (ASP.NET Core) và frontend (React). Hệ thống được tổ chức thành 6 service modules trong cùng một ứng dụng, giao tiếp qua HTTP APIs thay vì database joins. Cần hoàn thiện các luồng nghiệp vụ chính: khám lâm sàng, cận lâm sàng, thanh toán, kê thuốc, chẩn đoán, trả kết quả, realtime và notification.

## Glossary

- **System**: Hệ thống HealthCare với kiến trúc SOA
- **Backend**: API server ASP.NET Core với Entity Framework, tổ chức thành 6 service modules
- **Frontend**: Ứng dụng React với SignalR client
- **Service Communication**: HTTP REST APIs thay vì database joins
- **User Interaction Service**: Module quản lý auth, users, notifications, realtime
- **Master Data Service**: Module quản lý danh mục khoa, phòng, nhân sự, dịch vụ
- **Patient Management Service**: Module quản lý bệnh nhân và lịch hẹn
- **Outpatient Care Service**: Module quản lý khám lâm sàng, CLS, hàng đợi
- **Medication Billing Service**: Module quản lý kho thuốc, đơn thuốc, hóa đơn
- **Report Service**: Module báo cáo và thống kê
- **Phiếu Khám LS**: Phiếu khám lâm sàng (Clinical Examination)
- **Phiếu CLS**: Phiếu cận lâm sàng (Paraclinical Services)
- **Hàng Đợi**: Queue system cho bệnh nhân
- **Lượt Khám**: Visit record trong hệ thống
- **Đơn Thuốc**: Prescription
- **Hóa Đơn**: Invoice/Payment
- **SignalR Hub**: Real-time communication hub
- **Notification**: Thông báo hệ thống
- **Bác Sĩ**: Nhân viên y tế thực hiện khám và chẩn đoán (role: bac_si)
- **Y Tá Hành Chính**: Nhân viên tiếp nhận và quản lý hành chính (role: y_ta_hanh_chinh)
- **Y Tá Phòng Khám**: Nhân viên hỗ trợ bác sĩ tại phòng khám lâm sàng (role: y_ta_phong_kham)
- **Kỹ Thuật Viên**: Nhân viên thực hiện và nhập kết quả CLS (role: ky_thuat_vien)
- **Admin**: Quản trị viên hệ thống (role: admin)

## Requirements

### Requirement 1: Hoàn thiện Luồng Khám Lâm Sàng

**User Story:** Là bác sĩ, tôi muốn có luồng khám lâm sàng hoàn chỉnh từ tiếp nhận đến hoàn tất, để quản lý bệnh nhân hiệu quả.

#### Acceptance Criteria

1. WHEN bác sĩ tạo phiếu khám lâm sàng THEN THE System SHALL tự động tạo hàng đợi và cập nhật trạng thái bệnh nhân
2. WHEN bác sĩ bắt đầu khám THEN THE System SHALL cập nhật trạng thái lượt khám và broadcast realtime
3. WHEN bác sĩ hoàn tất khám THEN THE System SHALL cho phép chuyển sang chẩn đoán hoặc chỉ định CLS
4. WHEN có lỗi trong quá trình khám THEN THE System SHALL rollback transaction và thông báo lỗi rõ ràng
5. WHEN phiếu khám được cập nhật THEN THE System SHALL broadcast thông tin mới qua SignalR

### Requirement 2: Hoàn thiện Luồng Cận Lâm Sàng (CLS)

**User Story:** Là bác sĩ, tôi muốn chỉ định và theo dõi các dịch vụ cận lâm sàng, để có đầy đủ thông tin chẩn đoán.

#### Acceptance Criteria

1. WHEN bác sĩ chỉ định CLS THEN THE System SHALL tạo phiếu CLS với danh sách dịch vụ và tự động thu phí
2. WHEN phiếu CLS được tạo THEN THE System SHALL tạo hàng đợi cho từng dịch vụ CLS
3. WHEN y tá nhập kết quả CLS THEN THE System SHALL lưu kết quả và cập nhật trạng thái chi tiết dịch vụ
4. WHEN tất cả dịch vụ CLS hoàn tất THEN THE System SHALL tạo phiếu tổng hợp kết quả
5. WHEN có kết quả CLS mới THEN THE System SHALL broadcast realtime và gửi notification cho bác sĩ

### Requirement 3: Hoàn thiện Luồng Chẩn Đoán và Kê Đơn

**User Story:** Là bác sĩ, tôi muốn lập chẩn đoán cuối và kê đơn thuốc, để hoàn tất quá trình khám bệnh.

#### Acceptance Criteria

1. WHEN bác sĩ lập chẩn đoán cuối THEN THE System SHALL lưu thông tin chẩn đoán và liên kết với phiếu khám
2. WHEN bác sĩ kê đơn thuốc THEN THE System SHALL kiểm tra tồn kho và tạo đơn thuốc
3. WHEN đơn thuốc được tạo THEN THE System SHALL tính tổng tiền và broadcast realtime
4. WHEN chẩn đoán hoàn tất THEN THE System SHALL cập nhật trạng thái phiếu khám và lượt khám
5. WHEN có đơn thuốc mới THEN THE System SHALL gửi notification cho nhân viên phát thuốc

### Requirement 4: Hoàn thiện Luồng Thanh Toán

**User Story:** Là nhân viên thu ngân, tôi muốn quản lý thanh toán cho các dịch vụ, để theo dõi doanh thu chính xác.

#### Acceptance Criteria

1. WHEN tạo hóa đơn THEN THE System SHALL validate thông tin bệnh nhân và dịch vụ
2. WHEN thanh toán khám lâm sàng THEN THE System SHALL tự động tạo hóa đơn với loại "kham_lam_sang"
3. WHEN thanh toán CLS THEN THE System SHALL tự động tạo hóa đơn với loại "can_lam_sang"
4. WHEN thanh toán thuốc THEN THE System SHALL tạo hóa đơn và trừ tồn kho
5. WHEN có giao dịch mới THEN THE System SHALL broadcast realtime và cập nhật dashboard doanh thu

### Requirement 5: Hoàn thiện Luồng Trả Kết Quả CLS

**User Story:** Là y tá, tôi muốn nhập và trả kết quả cận lâm sàng, để bác sĩ có thông tin chẩn đoán.

#### Acceptance Criteria

1. WHEN y tá nhập kết quả CLS THEN THE System SHALL lưu kết quả với trạng thái "da_co_ket_qua"
2. WHEN kết quả được chốt THEN THE System SHALL cập nhật trạng thái hàng đợi và lượt khám
3. WHEN tất cả kết quả CLS sẵn sàng THEN THE System SHALL tạo phiếu tổng hợp và cho phép bệnh nhân quay lại khám
4. WHEN có kết quả mới THEN THE System SHALL broadcast realtime cho bác sĩ chỉ định
5. WHEN kết quả có file đính kèm THEN THE System SHALL lưu trữ và cho phép tải xuống

### Requirement 6: Hoàn thiện Hệ thống Realtime (SignalR)

**User Story:** Là người dùng hệ thống, tôi muốn nhận cập nhật realtime, để theo dõi thông tin kịp thời.

#### Acceptance Criteria

1. WHEN có sự kiện quan trọng THEN THE System SHALL broadcast qua SignalR Hub
2. WHEN client kết nối THEN THE System SHALL authenticate bằng JWT token
3. WHEN có phiếu khám mới THEN THE System SHALL broadcast cho nhóm bác sĩ liên quan
4. WHEN có kết quả CLS THEN THE System SHALL broadcast cho bác sĩ chỉ định
5. WHEN có thay đổi dashboard THEN THE System SHALL broadcast cho tất cả client đang kết nối

### Requirement 7: Hoàn thiện Hệ thống Notification

**User Story:** Là người dùng, tôi muốn nhận thông báo về các sự kiện quan trọng, để không bỏ lỡ thông tin.

#### Acceptance Criteria

1. WHEN có sự kiện quan trọng THEN THE System SHALL tạo notification với mức độ ưu tiên phù hợp
2. WHEN tạo notification THEN THE System SHALL xác định người nhận dựa trên vai trò và liên quan
3. WHEN notification được tạo THEN THE System SHALL lưu vào database và broadcast realtime
4. WHEN người dùng đọc notification THEN THE System SHALL cập nhật trạng thái "da_doc"
5. WHEN notification quan trọng THEN THE System SHALL đánh dấu mức độ ưu tiên "high"

### Requirement 8: Hoàn thiện Frontend Components

**User Story:** Là người dùng frontend, tôi muốn có giao diện đầy đủ cho các luồng nghiệp vụ, để thao tác dễ dàng.

#### Acceptance Criteria

1. WHEN hiển thị danh sách phiếu khám THEN THE Frontend SHALL hiển thị đầy đủ thông tin và trạng thái
2. WHEN tạo/cập nhật dữ liệu THEN THE Frontend SHALL validate input và hiển thị lỗi rõ ràng
3. WHEN nhận realtime update THEN THE Frontend SHALL cập nhật UI tự động
4. WHEN có notification mới THEN THE Frontend SHALL hiển thị toast và cập nhật badge
5. WHEN thao tác với form THEN THE Frontend SHALL sử dụng React Query để quản lý state

### Requirement 9: Xử lý Lỗi và Transaction

**User Story:** Là developer, tôi muốn hệ thống xử lý lỗi và transaction đúng cách, để đảm bảo tính toàn vẹn dữ liệu.

#### Acceptance Criteria

1. WHEN có lỗi database THEN THE System SHALL rollback transaction và trả về lỗi rõ ràng
2. WHEN có lỗi validation THEN THE System SHALL trả về HTTP 400 với thông tin chi tiết
3. WHEN có lỗi không tìm thấy THEN THE System SHALL trả về HTTP 404
4. WHEN có lỗi server THEN THE System SHALL log chi tiết và trả về HTTP 500
5. WHEN thực hiện transaction phức tạp THEN THE System SHALL sử dụng database transaction

### Requirement 10: Hệ thống Phân Quyền và Vai Trò

**User Story:** Là admin, tôi muốn quản lý phân quyền theo vai trò, để đảm bảo mỗi người dùng chỉ truy cập được chức năng phù hợp.

#### Acceptance Criteria

1. WHEN người dùng đăng nhập THEN THE System SHALL xác định vai trò và cấp quyền tương ứng
2. WHEN Bác Sĩ truy cập THEN THE System SHALL cho phép khám bệnh, chẩn đoán và kê đơn
3. WHEN Y Tá Hành Chính truy cập THEN THE System SHALL cho phép tiếp nhận bệnh nhân và quản lý lịch hẹn
4. WHEN Y Tá Phòng Khám truy cập THEN THE System SHALL cho phép hỗ trợ bác sĩ và quản lý hàng đợi phòng khám
5. WHEN Kỹ Thuật Viên truy cập THEN THE System SHALL cho phép thực hiện và nhập kết quả CLS
6. WHEN Admin truy cập THEN THE System SHALL cho phép quản lý toàn bộ hệ thống và cấu hình

### Requirement 11: Phân Quyền Frontend theo Vai Trò

**User Story:** Là người dùng, tôi muốn giao diện hiển thị đúng chức năng theo vai trò của tôi, để thao tác thuận tiện.

#### Acceptance Criteria

1. WHEN Bác Sĩ đăng nhập THEN THE Frontend SHALL hiển thị menu khám bệnh, chẩn đoán, kê đơn
2. WHEN Y Tá Hành Chính đăng nhập THEN THE Frontend SHALL hiển thị menu tiếp nhận, lịch hẹn, thanh toán
3. WHEN Y Tá Phòng Khám đăng nhập THEN THE Frontend SHALL hiển thị menu hàng đợi phòng khám, hỗ trợ khám
4. WHEN Kỹ Thuật Viên đăng nhập THEN THE Frontend SHALL hiển thị menu hàng đợi CLS, nhập kết quả
5. WHEN Admin đăng nhập THEN THE Frontend SHALL hiển thị menu quản trị, báo cáo, cấu hình

### Requirement 12: Notification theo Vai Trò

**User Story:** Là người dùng, tôi muốn nhận thông báo phù hợp với vai trò của tôi, để tập trung vào công việc.

#### Acceptance Criteria

1. WHEN có phiếu khám mới THEN THE System SHALL gửi notification cho Bác Sĩ được chỉ định
2. WHEN có chỉ định CLS THEN THE System SHALL gửi notification cho Kỹ Thuật Viên phòng CLS
3. WHEN có kết quả CLS THEN THE System SHALL gửi notification cho Bác Sĩ chỉ định
4. WHEN có đơn thuốc mới THEN THE System SHALL gửi notification cho Y Tá Hành Chính phát thuốc
5. WHEN có thanh toán THEN THE System SHALL gửi notification cho Y Tá Hành Chính thu ngân

### Requirement 13: Quản lý Kỹ Thuật Viên CLS

**User Story:** Là Kỹ Thuật Viên, tôi muốn quản lý hàng đợi và nhập kết quả CLS, để hoàn thành công việc hiệu quả.

#### Acceptance Criteria

1. WHEN Kỹ Thuật Viên xem hàng đợi THEN THE System SHALL hiển thị danh sách bệnh nhân chờ CLS theo phòng
2. WHEN Kỹ Thuật Viên bắt đầu thực hiện THEN THE System SHALL cập nhật trạng thái "dang_thuc_hien"
3. WHEN Kỹ Thuật Viên nhập kết quả THEN THE System SHALL lưu kết quả và cập nhật trạng thái
4. WHEN Kỹ Thuật Viên hoàn tất THEN THE System SHALL gửi notification cho Bác Sĩ
5. WHEN Kỹ Thuật Viên upload file THEN THE System SHALL lưu trữ file đính kèm

### Requirement 14: Tối ưu Performance và Caching

**User Story:** Là system admin, tôi muốn hệ thống hoạt động nhanh và hiệu quả, để phục vụ nhiều người dùng đồng thời.

#### Acceptance Criteria

1. WHEN query dữ liệu THEN THE System SHALL sử dụng AsNoTracking cho read-only queries
2. WHEN load dữ liệu liên quan THEN THE System SHALL sử dụng Include để tránh N+1 queries
3. WHEN có dữ liệu thay đổi ít THEN THE System SHALL sử dụng memory cache
4. WHEN query phức tạp THEN THE System SHALL sử dụng pagination
5. WHEN broadcast realtime THEN THE System SHALL chỉ gửi dữ liệu cần thiết

### Requirement 15: Refactor Service Communication (SOA Pattern)

**User Story:** Là developer, tôi muốn refactor code để các service giao tiếp qua HTTP APIs thay vì database joins, để tuân thủ nguyên tắc SOA.

#### Acceptance Criteria

1. WHEN ClinicalService cần thông tin bệnh nhân THEN THE System SHALL gọi PatientService API thay vì join bảng BenhNhans
2. WHEN ClsService cần thông tin dịch vụ THEN THE System SHALL gọi MasterDataService API thay vì join bảng DichVuYTes
3. WHEN PharmacyService cần thông tin bệnh nhân THEN THE System SHALL gọi PatientService API thay vì join bảng BenhNhans
4. WHEN BillingService cần thông tin nhân sự THEN THE System SHALL gọi UserInteractionService API thay vì join bảng NhanVienYTes
5. WHEN ReportService cần dữ liệu tổng hợp THEN THE System SHALL gọi các service APIs thay vì join nhiều bảng

### Requirement 16: Service Module Organization

**User Story:** Là developer, tôi muốn tổ chức code thành 6 service modules rõ ràng, để dễ maintain và có thể tách thành microservices sau này.

#### Acceptance Criteria

1. WHEN tổ chức code THEN THE System SHALL có 6 folders tương ứng với 6 service modules
2. WHEN UserInteractionService được gọi THEN THE System SHALL chỉ truy cập tables: Users, Roles, Notifications, OTP
3. WHEN MasterDataService được gọi THEN THE System SHALL chỉ truy cập tables: Khoas, Phongs, DichVuYTes, LichTrucs
4. WHEN PatientManagementService được gọi THEN THE System SHALL chỉ truy cập tables: BenhNhans, LichHenKhams
5. WHEN OutpatientCareService được gọi THEN THE System SHALL chỉ truy cập tables: PhieuKhamLamSangs, PhieuKhamCanLamSangs, ChiTietDichVus, KetQuaDichVus, HangDois, LuotKhamBenhs
6. WHEN MedicationBillingService được gọi THEN THE System SHALL chỉ truy cập tables: KhoThuocs, DonThuocs, ChiTietDonThuocs, HoaDonThanhToans