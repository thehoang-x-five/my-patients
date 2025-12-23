# Implementation Plan - Hoàn thiện Hệ thống HealthCare (SOA Architecture)

## Phase 1: Backend - Service Module Organization & SOA Refactoring

- [x] 1. Tổ chức lại cấu trúc project theo SOA



  - Tạo 6 folders cho 6 service modules: UserInteraction, MasterData, PatientManagement, OutpatientCare, MedicationBilling, Report
  - Di chuyển các service classes vào đúng module
  - Tạo interface cho mỗi service module
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 2. Implement Service Interfaces

  - [x] 2.1 Tạo IUserInteractionService interface và implementation

    - GetUserAsync, GetUsersByRoleAsync, CreateNotificationAsync, BroadcastRealtimeAsync
    - _Requirements: 16.2_
  

  - [ ] 2.2 Tạo IMasterDataService interface và implementation
    - GetDepartmentAsync, GetRoomAsync, GetServiceAsync, GetServicesByTypeAsync
    - _Requirements: 16.3_

  
  - [ ] 2.3 Tạo IPatientManagementService interface và implementation
    - GetPatientAsync, CreatePatientAsync, GetAppointmentAsync, CreateAppointmentAsync

    - _Requirements: 16.4_
  
  - [x] 2.4 Tạo IOutpatientCareService interface và implementation

    - CreateClinicalExamAsync, CreateClsOrderAsync, CreateClsResultAsync, EnqueuePatientAsync
    - _Requirements: 16.5_
  

  - [ ] 2.5 Tạo IMedicationBillingService interface và implementation
    - GetDrugAsync, CreatePrescriptionAsync, CreateInvoiceAsync, CheckDrugAvailabilityAsync
    - _Requirements: 16.6_
  
  - [ ] 2.6 Tạo IReportService interface và implementation
    - GetTodayDashboardAsync, GetPatientHistoryAsync, GetRevenueReportAsync
    - _Requirements: 16.6_

- [x] 3. Implement HTTP Service Clients



  - [x] 3.1 Tạo PatientServiceClient


    - HTTP calls thay vì direct database access
    - _Requirements: 15.1, 15.3_
  

  - [x] 3.2 Tạo MasterDataServiceClient

    - HTTP calls cho department, room, service info
    - _Requirements: 15.2_

  

  - [ ] 3.3 Tạo UserInteractionServiceClient
    - HTTP calls cho user info, notifications

    - _Requirements: 15.4_
  
  - [x] 3.4 Tạo BillingServiceClient

    - HTTP calls cho invoice creation
    - _Requirements: 15.4_

  
  - [ ] 3.5 Tạo ReportServiceClient
    - HTTP calls cho dashboard data
    - _Requirements: 15.5_

## Phase 2: Backend - Refactor Service Dependencies (SOA Pattern)

- [x] 4. Refactor ClinicalService để sử dụng HTTP clients



  - [x] 4.1 Thay thế database joins bằng HTTP calls

    - Sử dụng PatientServiceClient.GetPatientAsync() thay vì join BenhNhans
    - Sử dụng MasterDataServiceClient.GetServiceAsync() thay vì join DichVuYTes
    - _Requirements: 15.1, 15.2_

  

  - [ ] 4.2 Cập nhật MapClinicalExam method
    - Nhận patient và service info từ HTTP calls
    - Chỉ map data từ PhieuKhamLamSang table

    - _Requirements: 15.1_

  
  - [x] 4.3 Cập nhật auto-billing logic

    - Sử dụng BillingServiceClient.CreateInvoiceAsync()

    - _Requirements: 15.4_

- [ ] 5. Refactor ClsService để sử dụng HTTP clients
  - [x] 5.1 Thay thế database joins bằng HTTP calls


    - Sử dụng PatientServiceClient cho patient info
    - Sử dụng MasterDataServiceClient cho service info
    - _Requirements: 15.1, 15.2_
  

  - [ ] 5.2 Cập nhật BuildClsOrderDtoAsync method
    - Gọi HTTP APIs thay vì join queries


    - _Requirements: 15.1, 15.2_
  

  - [ ] 5.3 Cập nhật auto-billing cho CLS
    - Sử dụng BillingServiceClient

    - _Requirements: 15.4_


- [x] 6. Refactor PharmacyService để sử dụng HTTP clients

  - [x] 6.1 Thay thế patient info joins

    - Sử dụng PatientServiceClient.GetPatientAsync()
    - _Requirements: 15.3_
  


  - [ ] 6.2 Cập nhật prescription creation
    - Gọi UserInteractionServiceClient cho doctor info
    - _Requirements: 15.4_


- [x] 7. Refactor BillingService để sử dụng HTTP clients


  - [x] 7.1 Thay thế user info joins

    - Sử dụng UserInteractionServiceClient.GetUserAsync()
    - _Requirements: 15.4_
  

  - [ ] 7.2 Thay thế patient info joins
    - Sử dụng PatientServiceClient.GetPatientAsync()
    - _Requirements: 15.3_

## Phase 3: Backend - Role & Authorization System

- [x] 8. Cập nhật Entity và Database Schema
  - Thêm field `ChucVu` vào `NhanVienYTe` entity với các giá trị: bac_si, y_ta_hanh_chinh, y_ta_phong_kham, ky_thuat_vien, admin
  - Tạo migration để cập nhật database schema
  - Seed dữ liệu mẫu cho các vai trò
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Implement Role-Based Authorization
  - [x] 9.1 Tạo `RequireRoleAttribute` để đánh dấu endpoints cần role cụ thể
    - Implement attribute với danh sách roles được phép
    - _Requirements: 10.1_
  
  - [ ] 9.2 Tạo `RoleAuthorizationMiddleware` để kiểm tra quyền truy cập
    - Đọc role từ JWT claims
    - So sánh với roles được phép trong attribute
    - Trả về 403 nếu không có quyền
    - _Requirements: 10.1_
  
  - [x] 9.3 Cập nhật `AuthService` để include role trong JWT token
    - Thêm role claim vào token generation
    - Implement `ValidateRoleAsync` method
    - Implement `GetUserRolesAsync` method
    - _Requirements: 10.1_
  
  - [x] 9.4 Apply `RequireRole` attribute cho các controllers
    - ClinicalController: bac_si
    - ClsController endpoints: ky_thuat_vien cho nhập kết quả, bac_si cho chỉ định
    - PharmacyController: y_ta_hanh_chinh cho phát thuốc, bac_si cho kê đơn
    - BillingController: y_ta_hanh_chinh
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

## Phase 4: Backend - Enhanced Business Logic (với SOA pattern)

- [x] 10. Hoàn thiện ClinicalService (với SOA pattern)



  - [x] 10.1 Cải thiện error handling và transaction management

    - Wrap tất cả operations trong try-catch
    - Sử dụng database transactions cho operations phức tạp
    - Rollback khi có lỗi
    - _Requirements: 1.4, 9.1_
  
  - [x] 10.2 Đảm bảo broadcast realtime sau mỗi operation

    - Sử dụng UserInteractionServiceClient.BroadcastRealtimeAsync()
    - Broadcast sau khi commit transaction thành công
    - _Requirements: 1.2, 1.5_
  
  - [x] 10.3 Cải thiện workflow chuyển trạng thái

    - Validate trạng thái hợp lệ trước khi chuyển
    - Cập nhật cascade: phiếu khám -> lượt khám -> hàng đợi -> bệnh nhân
    - _Requirements: 1.3_

- [x] 11. Hoàn thiện ClsService (với SOA pattern)



  - [x] 11.1 Cải thiện auto-billing cho CLS

    - Sử dụng BillingServiceClient.CreateInvoiceAsync()
    - Tính tổng tiền từ MasterDataServiceClient.GetServiceAsync()
    - _Requirements: 2.1, 4.3_
  

  - [x] 11.2 Cải thiện queue management cho từng dịch vụ CLS

    - Tạo hàng đợi riêng cho mỗi dịch vụ trong phiếu CLS
    - Gắn `MaChiTietDv` vào hàng đợi
    - Tự động enqueue dịch vụ tiếp theo khi dịch vụ hiện tại hoàn tất
    - _Requirements: 2.2_
  


  - [ ] 11.3 Hoàn thiện auto-publish phiếu tổng hợp
    - Kiểm tra `AutoPublishEnabled` flag
    - Tự động tạo phiếu tổng hợp khi tất cả dịch vụ có kết quả
    - Gắn `MaPhieuKqKhamCls` vào phiếu khám LS
    - _Requirements: 2.4, 5.3_

  

  - [ ] 11.4 Implement targeted broadcast cho bác sĩ chỉ định
    - Sử dụng UserInteractionServiceClient.BroadcastRealtimeAsync()
    - Broadcast kết quả CLS chỉ cho bác sĩ đó
    - _Requirements: 2.5, 5.4, 6.4_

- [ ] 12. Hoàn thiện PharmacyService (với SOA pattern)
  - [ ] 12.1 Cải thiện validation tồn kho
    - Kiểm tra tồn kho đủ cho tất cả thuốc trước khi tạo đơn
    - Kiểm tra hạn sử dụng (không cho phép thuốc hết hạn)
    - _Requirements: 3.2_
  
  - [ ] 12.2 Đảm bảo tính tổng tiền chính xác
    - Tính tổng từ `SoLuong * DonGia` của tất cả thuốc
    - Lưu vào field `TongTienDon`
    - _Requirements: 3.3_
  
  - [ ] 12.3 Cải thiện trừ tồn kho khi phát thuốc
    - Trừ tồn kho khi đơn chuyển sang "da_phat"
    - Sử dụng transaction để đảm bảo consistency
    - Cập nhật trạng thái thuốc (sap_het_ton, het_han)
    - _Requirements: 4.4_

- [ ] 13. Hoàn thiện BillingService (với SOA pattern)
  - [ ] 13.1 Đảm bảo validation đầy đủ
    - Sử dụng PatientServiceClient để validate bệnh nhân tồn tại
    - Sử dụng UserInteractionServiceClient để validate nhân sự thu tồn tại
    - Validate dịch vụ liên quan (phiếu khám, phiếu CLS, đơn thuốc)
    - _Requirements: 4.1_
  
  - [ ] 13.2 Cải thiện auto-billing cho các loại dịch vụ
    - Khám lâm sàng: tự động tạo khi tạo phiếu khám (trừ service_return và tái khám đúng giờ)
    - CLS: tự động tạo khi phiếu CLS chuyển sang "dang_thuc_hien"
    - Thuốc: tạo khi đơn thuốc chuyển sang "da_phat"
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ] 13.3 Broadcast dashboard update sau mỗi giao dịch
    - Sử dụng UserInteractionServiceClient.BroadcastRealtimeAsync()
    - _Requirements: 4.5_

## Phase 5: Backend - Notification & Realtime Enhancements

- [ ] 14. Hoàn thiện NotificationService (trong UserInteractionService)
  - [ ] 14.1 Implement role-based notification routing
    - Xác định người nhận dựa trên `LoaiNguoiNhan` (bac_si, y_ta_hanh_chinh, ky_thuat_vien)
    - Hỗ trợ broadcast cho cả nhóm (MaNguoiDung = null) và cá nhân cụ thể
    - _Requirements: 7.2, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 14.2 Implement priority-based notification
    - Tự động đánh dấu "high" cho cấp cứu và kết quả bất thường
    - Mặc định "normal" cho các thông báo thường
    - _Requirements: 7.1, 7.5_
  
  - [ ] 14.3 Đảm bảo persist và broadcast đồng thời
    - Lưu vào database trước
    - Broadcast qua SignalR sau khi lưu thành công
    - _Requirements: 7.3_
  
  - [ ] 14.4 Implement mark as read functionality
    - Cập nhật `DaDoc = true` và `ThoiGianDoc`
    - Hỗ trợ mark all as read cho một user
    - _Requirements: 7.4_

- [ ] 15. Hoàn thiện RealtimeService (trong UserInteractionService)
  - [ ] 15.1 Implement targeted broadcast methods
    - `BroadcastToUserAsync(userId, event, data)` - broadcast cho user cụ thể
    - `BroadcastToRoleAsync(role, event, data)` - broadcast cho nhóm role
    - `BroadcastToRoomAsync(roomId, event, data)` - broadcast cho phòng cụ thể
    - _Requirements: 6.3, 6.4_
  
  - [ ] 15.2 Đảm bảo authentication cho SignalR connections
    - Đọc JWT token từ query string `access_token`
    - Validate token và extract user claims
    - Reject connection nếu token invalid
    - _Requirements: 6.2_
  
  - [ ] 15.3 Implement connection grouping
    - Group connections theo role (bac_si, y_ta, ky_thuat_vien)
    - Group connections theo phòng (cho kỹ thuật viên CLS)
    - _Requirements: 6.3_

## Phase 6: Backend - Technician Workflow

- [ ] 16. Implement Kỹ Thuật Viên workflow (trong OutpatientCareService)
  - [ ] 16.1 Tạo endpoint lấy hàng đợi CLS theo phòng
    - Filter hàng đợi theo `MaPhong` của kỹ thuật viên
    - Chỉ hiển thị hàng đợi loại "can_lam_sang"
    - Sắp xếp theo độ ưu tiên và thời gian
    - _Requirements: 13.1_
  
  - [ ] 16.2 Implement workflow bắt đầu thực hiện CLS
    - Cập nhật trạng thái chi tiết dịch vụ thành "dang_thuc_hien"
    - Cập nhật trạng thái hàng đợi
    - Broadcast realtime update
    - _Requirements: 13.2_
  
  - [ ] 16.3 Implement workflow nhập kết quả CLS
    - Lưu kết quả với `MaNguoiTao` là kỹ thuật viên
    - Cập nhật trạng thái chi tiết dịch vụ thành "da_co_ket_qua"
    - Hỗ trợ upload file đính kèm (lưu path vào `TepDinhKem`)
    - _Requirements: 13.3, 13.5_
  
  - [ ] 16.4 Implement notification cho bác sĩ khi hoàn tất
    - Gửi notification cho bác sĩ chỉ định
    - Broadcast realtime cho bác sĩ
    - _Requirements: 13.4_

## Phase 7: Frontend - Role-Based UI

- [ ] 17. Implement Role-Based Components
  - [ ] 17.1 Tạo `RoleGuard` component
    - Kiểm tra role của user hiện tại
    - Redirect đến /unauthorized nếu không có quyền
    - **GIỮ NGUYÊN**: Style hiện tại của các components được protect
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 17.2 Tạo `useAuth` hook
    - Lấy thông tin user từ JWT token
    - Expose `user`, `role`, `isAuthenticated`
    - **KHÔNG THAY ĐỔI UI**: Chỉ là logic hook
    - _Requirements: 10.1_
  
  - [ ] 17.3 Implement role-based navigation menu
    - Bác Sĩ: Khám bệnh, Chẩn đoán, Kê đơn
    - Y Tá Hành Chính: Tiếp nhận, Lịch hẹn, Thanh toán, Phát thuốc
    - Y Tá Phòng Khám: Hàng đợi phòng khám, Hỗ trợ khám
    - Kỹ Thuật Viên: Hàng đợi CLS, Nhập kết quả
    - Admin: Quản trị, Báo cáo, Cấu hình
    - **GIỮ NGUYÊN**: Style, layout, animations của navigation menu hiện tại
    - **CHỈ THAY ĐỔI**: Menu items dựa trên role
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 18. Implement Bác Sĩ UI
  - [ ] 18.1 Cập nhật ClinicalExamForm
    - Validate input trước khi submit
    - Hiển thị error messages rõ ràng
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic validation và error handling
    - _Requirements: 8.2_
  
  - [ ] 18.2 Cập nhật DiagnosisForm
    - Form nhập chẩn đoán cuối
    - Form kê đơn thuốc inline
    - Validate tồn kho thuốc
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.2_
  
  - [ ] 18.3 Implement ClsOrderForm
    - Form chỉ định CLS với multiple services
    - Hiển thị giá dịch vụ và tổng tiền
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.2_

- [ ] 19. Implement Y Tá Hành Chính UI
  - [ ] 19.1 Cập nhật PatientReceptionForm
    - Form tiếp nhận bệnh nhân
    - Tạo phiếu khám lâm sàng
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.2_
  
  - [ ] 19.2 Implement BillingList
    - Danh sách hóa đơn cần thanh toán
    - Filter theo loại dịch vụ
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.1_
  
  - [ ] 19.3 Implement PrescriptionDispenseForm
    - Danh sách đơn thuốc chờ phát
    - Cập nhật trạng thái "da_phat"
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.2_

- [ ] 20. Implement Kỹ Thuật Viên UI
  - [ ] 20.1 Implement ClsQueueList
    - Danh sách hàng đợi CLS theo phòng
    - Filter theo trạng thái
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.1_
  
  - [ ] 20.2 Implement ClsResultForm
    - Form nhập kết quả CLS
    - Upload file đính kèm
    - Chốt kết quả
    - **GIỮ NGUYÊN**: Style, layout, animations, transitions hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.2_

## Phase 8: Frontend - Realtime & Notifications

- [ ] 21. Implement SignalR Integration
  - [ ] 21.1 Tạo `useRealtime` hook
    - Tạo SignalR connection với JWT token
    - Auto-reconnect khi mất kết nối
    - Expose connection status
    - **KHÔNG THAY ĐỔI UI**: Chỉ là logic hook
    - _Requirements: 6.1, 6.2_
  
  - [ ] 21.2 Implement event handlers
    - `ClinicalExamCreated` -> invalidate queries
    - `ClsResultCreated` -> show toast + invalidate queries
    - `NotificationReceived` -> update notification badge
    - `DashboardUpdated` -> invalidate dashboard queries
    - **GIỮ NGUYÊN**: Style của toast notifications hiện tại
    - **CHỈ BỔ SUNG**: Event handling logic
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ] 21.3 Integrate với React Query
    - Invalidate queries khi nhận realtime updates
    - Optimistic updates cho mutations
    - **KHÔNG THAY ĐỔI UI**: Chỉ là data management logic
    - _Requirements: 8.3_

- [ ] 22. Implement Notification System
  - [ ] 22.1 Tạo `NotificationBell` component
    - Hiển thị số lượng notification chưa đọc
    - Dropdown list notifications
    - **GIỮ NGUYÊN**: Style, animations, transitions của bell icon và dropdown hiện tại (nếu có)
    - **CHỈ BỔ SUNG**: Logic hiển thị notifications
    - _Requirements: 8.4_
  
  - [ ] 22.2 Tạo `NotificationList` component
    - Danh sách tất cả notifications
    - Filter theo loại
    - Mark as read / Mark all as read
    - **GIỮ NGUYÊN**: Style, layout, animations hiện tại
    - **CHỈ BỔ SUNG**: Logic nghiệp vụ
    - _Requirements: 8.4_
  
  - [ ] 22.3 Implement toast notifications
    - Show toast khi có notification mới
    - Different styles cho priority levels
    - **GIỮ NGUYÊN**: Toast style, animations, positioning hiện tại (nếu có)
    - **CHỈ BỔ SUNG**: Logic hiển thị toast dựa trên priority
    - _Requirements: 8.4_

## Phase 9: Performance Optimization & Caching

- [ ] 23. Implement Memory Cache cho Master Data
  - [ ] 23.1 Tạo CacheService với cache keys constants
    - Define cache keys: "departments", "services", "rooms", "staff"
    - Define cache expiration times (departments: 1 hour, services: 30 mins, etc.)
    - _Requirements: 14.3_
  
  - [ ] 23.2 Implement cache cho MasterDataService
    - Cache `LayDanhSachKhoaAsync()` - danh sách khoa
    - Cache `LayDanhSachDichVuAsync()` - danh sách dịch vụ
    - Cache `LayDanhSachPhongAsync()` - danh sách phòng
    - Cache `LayDanhSachNhanSuAsync()` - danh sách nhân sự
    - _Requirements: 14.3_
  
  - [ ] 23.3 Implement cache invalidation
    - Invalidate cache khi có update/create/delete master data
    - Implement `InvalidateCacheAsync(cacheKey)` method
    - Hook vào các update endpoints
    - _Requirements: 14.3_
  
  - [ ] 23.4 Implement cache warming on startup
    - Pre-load master data vào cache khi app khởi động
    - Đảm bảo first request không bị slow
    - _Requirements: 14.3_

- [ ] 24. Fix Missing AsNoTracking Queries
  - [ ] 24.1 Fix HistoryService queries
    - Thêm `.AsNoTracking()` cho tất cả read-only queries
    - Lines: 142, 271, 299, 424, 442, 494
    - _Requirements: 14.1_
  
  - [ ] 24.2 Audit tất cả services cho missing AsNoTracking
    - Review tất cả queries trong các services
    - Thêm AsNoTracking cho queries không cần tracking
    - _Requirements: 14.1_

- [ ] 25. Optimize SignalR Broadcast Payload
  - [ ] 25.1 Tạo lightweight DTOs cho realtime events
    - Chỉ include fields cần thiết thay vì full entity
    - Tạo `RealtimeEventDto` với minimal data
    - _Requirements: 14.5_
  
  - [ ] 25.2 Cập nhật broadcast methods
    - Sử dụng lightweight DTOs thay vì full entities
    - Giảm payload size cho mỗi broadcast
    - _Requirements: 14.5_

## Phase 10: Testing & Quality Assurance

- [ ] 26. Backend Testing
  - [ ]* 26.1 Write unit tests cho service interfaces
    - UserInteractionService: 3 tests
    - MasterDataService: 3 tests
    - PatientManagementService: 3 tests
    - OutpatientCareService: 5 tests
    - MedicationBillingService: 3 tests
    - ReportService: 3 tests
  
  - [ ]* 26.2 Write integration tests cho HTTP service clients
    - PatientServiceClient: 2 tests
    - MasterDataServiceClient: 2 tests
    - UserInteractionServiceClient: 2 tests
    - BillingServiceClient: 2 tests

- [ ] 27. Frontend Testing
  - [ ]* 27.1 Write unit tests cho components
    - RoleGuard: 2 tests
    - ClinicalExamForm: 3 tests
    - ClsResultForm: 3 tests
    - NotificationBell: 2 tests
  
  - [ ]* 27.2 Write integration tests cho workflows
    - Bác sĩ workflow: tạo phiếu khám -> chỉ định CLS -> chẩn đoán
    - Kỹ thuật viên workflow: nhận hàng đợi -> nhập kết quả
    - Y tá workflow: tiếp nhận -> thanh toán -> phát thuốc

- [ ] 28. Checkpoint - Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 11: Documentation & Deployment

- [ ] 29. Documentation
  - [ ] 29.1 Cập nhật API documentation
    - Swagger annotations cho tất cả endpoints
    - Mô tả service interfaces
    - Ví dụ cho HTTP client usage
  
  - [ ] 29.2 Viết SOA migration guide
    - Hướng dẫn cách refactor từ database joins sang HTTP calls
    - Best practices cho service communication
  
  - [ ] 29.3 Viết developer guide
    - Setup instructions
    - SOA architecture overview
    - Service boundaries và responsibilities

- [ ] 30. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all services communicate via HTTP APIs
  - Performance testing
  - Security audit