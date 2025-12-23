# Design Document - Hoàn thiện Hệ thống HealthCare

## Overview

Hệ thống HealthCare là một ứng dụng quản lý bệnh viện với kiến trúc SOA (Service-Oriented Architecture), bao gồm:
- **Backend**: ASP.NET Core 8.0 với Entity Framework Core, MySQL database (single deployment)
- **Frontend**: React 19 với SignalR client, TanStack Query, Zustand
- **Real-time**: SignalR Hub cho communication 2 chiều
- **Authentication**: JWT Bearer tokens
- **Service Organization**: 6 service modules trong cùng một ứng dụng
- **Communication**: HTTP REST APIs thay vì database joins

Mục tiêu thiết kế là hoàn thiện các luồng nghiệp vụ chính, bổ sung hệ thống phân quyền theo vai trò, và refactor code để tuân thủ nguyên tắc SOA.

## Architecture

### SOA Architecture (Single Deployment)

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Bác Sĩ   │  │ Y Tá HC  │  │ Y Tá PK  │  │ Kỹ Thuật │   │
│  │   UI     │  │   UI     │  │   UI     │  │  Viên UI │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │            │            │            │             │
│         └────────────┴────────────┴────────────┘             │
│                      │                                        │
│              ┌───────▼────────┐                              │
│              │  HTTP Client   │                              │
│              │  + SignalR     │                              │
│              └───────┬────────┘                              │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTPS + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              ASP.NET Core Backend (Single App)               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Controllers                           │ │
│  │  - UserInteractionController  - MasterDataController   │ │
│  │  - PatientController          - OutpatientController   │ │
│  │  - MedicationController       - ReportController       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Service Modules (SOA)                  │ │
│  │                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │UserInteraction  │  │  Master Data    │             │ │
│  │  │Service          │  │  Service        │             │ │
│  │  │- Auth, Users    │  │- Departments    │             │ │
│  │  │- Notifications  │  │- Rooms, Staff   │             │ │
│  │  │- Realtime       │  │- Services       │             │ │
│  │  └─────────────────┘  └─────────────────┘             │ │
│  │                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │Patient Mgmt     │  │Outpatient Care  │             │ │
│  │  │Service          │  │Service          │             │ │
│  │  │- Patients       │  │- Clinical Exams │             │ │
│  │  │- Appointments   │  │- CLS Orders     │             │ │
│  │  └─────────────────┘  │- Queue, Visits  │             │ │
│  │                       └─────────────────┘             │ │
│  │                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │Medication       │  │Report Service   │             │ │
│  │  │Billing Service  │  │- History        │             │ │
│  │  │- Drugs, Rx      │  │- Dashboard      │             │ │
│  │  │- Invoices       │  │- Statistics     │             │ │
│  │  └─────────────────┘  └─────────────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            HTTP Client (Internal Service Calls)        │ │
│  │  - PatientServiceClient                                │ │
│  │  - MasterDataServiceClient                             │ │
│  │  - UserInteractionServiceClient                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Entity Framework Core                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    MySQL Database                            │
│  - Users, Roles       - BenhNhans, LichHenKhams            │
│  - ThongBaos          - PhieuKhamLamSangs                   │
│  - Khoas, Phongs      - PhieuKhamCanLamSangs                │
│  - DichVuYTes         - KhoThuocs, DonThuocs                │
│  - HangDois           - HoaDonThanhToans                    │
└─────────────────────────────────────────────────────────────┘

Service Communication Pattern:
- Same process, different service modules
- HTTP calls via HttpClient (internal)
- No direct database joins between services
- Each service owns specific tables
```

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                      Roles & Permissions                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin (admin)                                               │
│  ├─ Quản lý toàn bộ hệ thống                                │
│  ├─ Cấu hình phòng ban, dịch vụ                             │
│  ├─ Xem báo cáo tổng hợp                                    │
│  └─ Quản lý nhân viên                                       │
│                                                              │
│  Bác Sĩ (bac_si)                                            │
│  ├─ Xem hàng đợi phòng khám                                 │
│  ├─ Khám bệnh (tạo/cập nhật phiếu khám LS)                 │
│  ├─ Chỉ định CLS                                            │
│  ├─ Xem kết quả CLS                                         │
│  ├─ Lập chẩn đoán cuối                                      │
│  └─ Kê đơn thuốc                                            │
│                                                              │
│  Y Tá Hành Chính (y_ta_hanh_chinh)                         │
│  ├─ Tiếp nhận bệnh nhân                                     │
│  ├─ Quản lý lịch hẹn                                        │
│  ├─ Thu tiền / Thanh toán                                   │
│  ├─ Phát thuốc                                              │
│  └─ Xem báo cáo doanh thu                                   │
│                                                              │
│  Y Tá Phòng Khám (y_ta_phong_kham)                         │
│  ├─ Xem hàng đợi phòng khám                                 │
│  ├─ Hỗ trợ bác sĩ khám bệnh                                 │
│  ├─ Cập nhật thông tin bệnh nhân                            │
│  └─ Quản lý lượt khám                                       │
│                                                              │
│  Kỹ Thuật Viên (ky_thuat_vien)                             │
│  ├─ Xem hàng đợi CLS theo phòng                             │
│  ├─ Thực hiện dịch vụ CLS                                   │
│  ├─ Nhập kết quả CLS                                        │
│  ├─ Upload file đính kèm                                    │
│  └─ Chốt kết quả                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Authentication & Authorization

#### AuthService Interface
```csharp
public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserDto> GetCurrentUserAsync(string userId);
    Task<bool> ValidateRoleAsync(string userId, string requiredRole);
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userId);
}
```

#### Role-Based Authorization Middleware
```csharp
// Attribute để đánh dấu endpoint cần role cụ thể
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireRoleAttribute : Attribute
{
    public string[] Roles { get; }
    public RequireRoleAttribute(params string[] roles)
    {
        Roles = roles;
    }
}

// Middleware kiểm tra role
public class RoleAuthorizationMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var roleAttr = endpoint?.Metadata.GetMetadata<RequireRoleAttribute>();
        
        if (roleAttr != null)
        {
            var userRole = context.User.FindFirst("role")?.Value;
            if (!roleAttr.Roles.Contains(userRole))
            {
                context.Response.StatusCode = 403;
                return;
            }
        }
        
        await _next(context);
    }
}
```

### 2. Clinical Examination Service

#### ClinicalService Interface
```csharp
public interface IClinicalService
{
    // Tạo phiếu khám lâm sàng
    Task<ClinicalExamDto> TaoPhieuKhamAsync(ClinicalExamCreateRequest request);
    
    // Lấy thông tin phiếu khám
    Task<ClinicalExamDto?> LayPhieuKhamAsync(string maPhieuKham);
    
    // Cập nhật trạng thái phiếu khám
    Task<ClinicalExamDto?> CapNhatTrangThaiPhieuKhamAsync(
        string maPhieuKham, 
        ClinicalExamStatusUpdateRequest request);
    
    // Tạo chẩn đoán cuối
    Task<FinalDiagnosisDto> TaoChanDoanCuoiAsync(FinalDiagnosisCreateRequest request);
    
    // Lấy chẩn đoán cuối
    Task<FinalDiagnosisDto?> LayChanDoanCuoiAsync(string maPhieuKham);
    
    // Tìm kiếm phiếu khám
    Task<PagedResult<ClinicalExamDto>> TimKiemPhieuKhamAsync(
        string? maBenhNhan,
        string? maBacSi,
        DateTime? fromDate,
        DateTime? toDate,
        string? trangThai,
        int page,
        int pageSize);
}
```

### 3. Paraclinical Service (CLS)

#### ClsService Interface
```csharp
public interface IClsService
{
    // Tạo phiếu CLS
    Task<ClsOrderDto> TaoPhieuClsAsync(ClsOrderCreateRequest request);
    
    // Lấy phiếu CLS
    Task<ClsOrderDto?> LayPhieuClsAsync(string maPhieuKhamCls);
    
    // Cập nhật trạng thái phiếu CLS
    Task<ClsOrderDto?> CapNhatTrangThaiPhieuClsAsync(string maPhieuKhamCls, string trangThai);
    
    // Tạo chi tiết dịch vụ
    Task<ClsItemDto> TaoChiTietDichVuAsync(ClsItemCreateRequest request);
    
    // Lấy danh sách dịch vụ CLS
    Task<IReadOnlyList<ClsItemDto>> LayDanhSachDichVuClsAsync(string maPhieuKhamCls);
    
    // Tạo kết quả CLS
    Task<ClsResultDto> TaoKetQuaClsAsync(ClsResultCreateRequest request);
    
    // Lấy kết quả theo phiếu CLS
    Task<IReadOnlyList<ClsResultDto>> LayKetQuaTheoPhieuClsAsync(string maPhieuKhamCls);
    
    // Tạo phiếu tổng hợp kết quả
    Task<ClsSummaryDto> TaoTongHopAsync(string maPhieuKhamCls);
    
    // Lấy phiếu tổng hợp
    Task<ClsSummaryDto?> LayPhieuTongHopKetQuaAsync(string maPhieuTongHop);
    
    // Cập nhật trạng thái tổng hợp
    Task<ClsSummaryDto?> CapNhatTrangThaiTongHopAsync(
        string maPhieuTongHop,
        ClsSummaryStatusUpdateRequest request);
}
```

### 4. Pharmacy Service

#### PharmacyService Interface
```csharp
public interface IPharmacyService
{
    // Quản lý kho thuốc
    Task<DrugDto> TaoHoacCapNhatThuocAsync(DrugDto dto);
    Task<IReadOnlyList<DrugDto>> LayDanhSachThuocAsync();
    Task<PagedResult<DrugDto>> TimKiemThuocAsync(DrugSearchFilter filter);
    
    // Quản lý đơn thuốc
    Task<PrescriptionDto> TaoDonThuocAsync(PrescriptionCreateRequest request);
    Task<PrescriptionDto?> LayDonThuocAsync(string maDonThuoc);
    Task<PrescriptionDto?> CapNhatTrangThaiDonThuocAsync(
        string maDonThuoc,
        PrescriptionStatusUpdateRequest request);
    Task<PagedResult<PrescriptionDto>> TimKiemDonThuocAsync(
        string? maBenhNhan,
        DateTime? fromDate,
        DateTime? toDate,
        string? trangThai,
        int page,
        int pageSize);
}
```

### 5. Billing Service

#### BillingService Interface
```csharp
public interface IBillingService
{
    // Tạo hóa đơn
    Task<InvoiceDto> TaoHoaDonAsync(InvoiceCreateRequest request);
    
    // Lấy hóa đơn
    Task<InvoiceDto?> LayHoaDonAsync(string maHoaDon);
    
    // Tìm kiếm hóa đơn
    Task<PagedResult<InvoiceHistoryRecordDto>> TimKiemHoaDonAsync(
        InvoiceSearchFilter filter);
    
    // Cập nhật trạng thái hóa đơn
    Task<InvoiceDto?> CapNhatTrangThaiHoaDonAsync(
        string maHoaDon,
        InvoiceStatusUpdateRequest request);
}
```

### 6. Notification Service

#### NotificationService Interface
```csharp
public interface INotificationService
{
    // Tạo thông báo
    Task<NotificationDto> TaoThongBaoAsync(NotificationCreateRequest request);
    
    // Lấy thông báo theo người dùng
    Task<PagedResult<NotificationDto>> LayThongBaoTheoNguoiDungAsync(
        string maNguoiDung,
        string? loaiNguoiDung,
        int page,
        int pageSize);
    
    // Đánh dấu đã đọc
    Task<NotificationDto?> DanhDauDaDocAsync(string maThongBao);
    
    // Đánh dấu tất cả đã đọc
    Task<int> DanhDauTatCaDaDocAsync(string maNguoiDung, string? loaiNguoiDung);
}
```

### 7. Realtime Service

#### RealtimeService Interface
```csharp
public interface IRealtimeService
{
    // Clinical Exam broadcasts
    Task BroadcastClinicalExamCreatedAsync(ClinicalExamDto dto);
    Task BroadcastClinicalExamUpdatedAsync(ClinicalExamDto dto);
    Task BroadcastFinalDiagnosisChangedAsync(FinalDiagnosisDto dto);
    
    // CLS broadcasts
    Task BroadcastClsOrderCreatedAsync(ClsOrderDto dto);
    Task BroadcastClsOrderStatusUpdatedAsync(ClsOrderDto dto);
    Task BroadcastClsItemUpdatedAsync(ClsItemDto dto);
    Task BroadcastClsResultCreatedAsync(ClsResultDto dto);
    Task BroadcastClsSummaryCreatedAsync(ClsSummaryDto dto);
    Task BroadcastClsSummaryUpdatedAsync(ClsSummaryDto dto);
    
    // Pharmacy broadcasts
    Task BroadcastPrescriptionCreatedAsync(PrescriptionDto dto);
    Task BroadcastPrescriptionStatusUpdatedAsync(PrescriptionDto dto);
    Task BroadcastDrugChangedAsync(DrugDto dto);
    
    // Billing broadcasts
    Task BroadcastInvoiceChangedAsync(InvoiceDto dto);
    
    // Dashboard broadcasts
    Task BroadcastDashboardTodayAsync(DashboardTodayDto dto);
    
    // Notification broadcasts
    Task BroadcastNotificationAsync(NotificationDto dto, string targetRole);
}
```

## Data Models

### Core Entities

#### NhanVienYTe (Medical Staff)
```csharp
public class NhanVienYTe
{
    public string MaNhanVien { get; set; }
    public string HoTen { get; set; }
    public string Email { get; set; }
    public string DienThoai { get; set; }
    public string ChucVu { get; set; }  // bac_si, y_ta_hanh_chinh, y_ta_phong_kham, ky_thuat_vien
    public string? MaPhong { get; set; }  // Phòng làm việc chính
    public string? ChuyenKhoa { get; set; }
    public bool DangHoatDong { get; set; }
    
    // Navigation
    public Phong? PhongLamViec { get; set; }
}
```

#### PhieuKhamLamSang (Clinical Examination)
```csharp
public class PhieuKhamLamSang
{
    public string MaPhieuKham { get; set; }
    public string MaBenhNhan { get; set; }
    public string MaBacSiKham { get; set; }
    public string MaNguoiLap { get; set; }
    public string MaDichVuKham { get; set; }
    public string? MaLichHen { get; set; }
    public string? MaPhieuKqKhamCls { get; set; }  // Link to summary
    
    public DateTime NgayLap { get; set; }
    public TimeSpan GioLap { get; set; }
    public string? TrieuChung { get; set; }
    public string? HinhThucTiepNhan { get; set; }  // walkin, appointment, service_return
    public string TrangThai { get; set; }  // da_lap, dang_kham, da_hoan_tat, da_huy
    
    // Navigation
    public BenhNhan BenhNhan { get; set; }
    public NhanVienYTe BacSiKham { get; set; }
    public NhanVienYTe NguoiLap { get; set; }
    public DichVuYTe DichVuKham { get; set; }
    public LichHenKham? LichHenKham { get; set; }
    public PhieuTongHopKetQua? PhieuTongHopKetQua { get; set; }
    public HangDoi? HangDois { get; set; }
    public PhieuChanDoanCuoi? PhieuChanDoanCuoi { get; set; }
}
```

#### PhieuKhamCanLamSang (Paraclinical Order)
```csharp
public class PhieuKhamCanLamSang
{
    public string MaPhieuKhamCls { get; set; }
    public string MaPhieuKhamLs { get; set; }
    public DateTime NgayGioLap { get; set; }
    public bool AutoPublishEnabled { get; set; }
    public string TrangThai { get; set; }  // da_lap, dang_thuc_hien, da_hoan_tat
    public string? GhiChu { get; set; }
    
    // Navigation
    public PhieuKhamLamSang PhieuKhamLamSang { get; set; }
    public ICollection<ChiTietDichVu> ChiTietDichVus { get; set; }
    public PhieuTongHopKetQua? PhieuTongHopKetQua { get; set; }
}
```

#### ChiTietDichVu (Service Item)
```csharp
public class ChiTietDichVu
{
    public string MaChiTietDv { get; set; }
    public string MaPhieuKhamCls { get; set; }
    public string MaDichVu { get; set; }
    public string TrangThai { get; set; }  // chua_co_ket_qua, dang_thuc_hien, da_co_ket_qua
    public string? GhiChu { get; set; }
    
    // Navigation
    public PhieuKhamCanLamSang PhieuKhamCanLamSang { get; set; }
    public DichVuYTe DichVuYTe { get; set; }
    public KetQuaDichVu? KetQuaDichVu { get; set; }
    public HangDoi? HangDoi { get; set; }
}
```

#### KetQuaDichVu (Service Result)
```csharp
public class KetQuaDichVu
{
    public string MaKetQua { get; set; }
    public string MaChiTietDv { get; set; }
    public string TrangThaiChot { get; set; }  // tam_thoi, chinh_thuc
    public string NoiDungKetQua { get; set; }
    public string MaNguoiTao { get; set; }  // Kỹ thuật viên
    public DateTime ThoiGianTao { get; set; }
    public string? TepDinhKem { get; set; }  // JSON array of file paths
    
    // Navigation
    public ChiTietDichVu ChiTietDichVu { get; set; }
    public NhanVienYTe NhanVienYTes { get; set; }
}
```

#### PhieuTongHopKetQua (Result Summary)
```csharp
public class PhieuTongHopKetQua
{
    public string MaPhieuTongHop { get; set; }
    public string MaPhieuKhamCls { get; set; }
    public string LoaiPhieu { get; set; }  // tong_hop_cls
    public string TrangThai { get; set; }  // cho_xu_ly, da_xu_ly
    public DateTime ThoiGianXuLy { get; set; }
    public string? MaNhanSuXuLy { get; set; }
    public string SnapshotJson { get; set; }  // JSON snapshot of all results
    
    // Navigation
    public PhieuKhamCanLamSang PhieuKhamCanLamSang { get; set; }
    public NhanVienYTe? NhanSuXuLy { get; set; }
}
```

#### ThongBao (Notification)
```csharp
public class ThongBao
{
    public string MaThongBao { get; set; }
    public string LoaiThongBao { get; set; }  // phieu_kham, cls, don_thuoc, hoa_don, etc.
    public string TieuDe { get; set; }
    public string NoiDung { get; set; }
    public string MucDoUuTien { get; set; }  // low, normal, high
    public DateTime ThoiGianTao { get; set; }
    public string? NguonLienQuan { get; set; }  // phieu_kham, phieu_cls, etc.
    public string? MaDoiTuongLienQuan { get; set; }
    
    // Navigation
    public ICollection<NguoiNhanThongBao> NguoiNhans { get; set; }
}
```

#### NguoiNhanThongBao (Notification Recipient)
```csharp
public class NguoiNhanThongBao
{
    public string MaNguoiNhan { get; set; }
    public string MaThongBao { get; set; }
    public string LoaiNguoiNhan { get; set; }  // bac_si, y_ta, ky_thuat_vien, admin
    public string? MaNguoiDung { get; set; }  // Specific user ID or null for broadcast
    public bool DaDoc { get; set; }
    public DateTime? ThoiGianDoc { get; set; }
    
    // Navigation
    public ThongBao ThongBao { get; set; }
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Clinical Examination Properties

**Property 1: Tạo phiếu khám tự động tạo hàng đợi**
*For any* phiếu khám lâm sàng được tạo, hệ thống phải tự động tạo một hàng đợi tương ứng và cập nhật trạng thái bệnh nhân thành "cho_kham"
**Validates: Requirements 1.1**

**Property 2: Cập nhật trạng thái khi bắt đầu khám**
*For any* phiếu khám khi bác sĩ bắt đầu khám, hệ thống phải cập nhật trạng thái lượt khám và broadcast realtime event
**Validates: Requirements 1.2**

**Property 3: Workflow sau hoàn tất khám**
*For any* phiếu khám đã hoàn tất, hệ thống phải cho phép tạo chẩn đoán cuối hoặc chỉ định CLS
**Validates: Requirements 1.3**

**Property 4: Transaction rollback khi có lỗi**
*For any* operation tạo/cập nhật phiếu khám gặp lỗi, hệ thống phải rollback toàn bộ transaction và database phải giữ nguyên trạng thái trước đó
**Validates: Requirements 1.4**

**Property 5: Broadcast khi cập nhật phiếu khám**
*For any* phiếu khám được cập nhật, hệ thống phải broadcast thông tin mới qua SignalR Hub
**Validates: Requirements 1.5**

### Paraclinical Service Properties

**Property 6: Tạo phiếu CLS tự động thu phí**
*For any* phiếu CLS được tạo, hệ thống phải tự động tạo hóa đơn thanh toán với loại "can_lam_sang" và tổng tiền bằng tổng giá các dịch vụ
**Validates: Requirements 2.1**

**Property 7: Tạo hàng đợi cho mỗi dịch vụ CLS**
*For any* phiếu CLS với N dịch vụ, hệ thống phải tạo đúng N hàng đợi tương ứng
**Validates: Requirements 2.2**

**Property 8: Lưu kết quả CLS cập nhật trạng thái**
*For any* kết quả CLS được nhập, hệ thống phải lưu kết quả và cập nhật trạng thái chi tiết dịch vụ thành "da_co_ket_qua"
**Validates: Requirements 2.3**

**Property 9: Tự động tạo phiếu tổng hợp khi hoàn tất**
*For any* phiếu CLS có AutoPublishEnabled=true, khi tất cả dịch vụ có trạng thái "da_co_ket_qua", hệ thống phải tự động tạo phiếu tổng hợp kết quả
**Validates: Requirements 2.4**

**Property 10: Broadcast và notify khi có kết quả CLS**
*For any* kết quả CLS mới, hệ thống phải broadcast realtime và gửi notification cho bác sĩ chỉ định
**Validates: Requirements 2.5**

### Diagnosis and Prescription Properties

**Property 11: Lưu chẩn đoán liên kết phiếu khám**
*For any* chẩn đoán cuối được tạo, hệ thống phải lưu thông tin và tạo liên kết 2 chiều với phiếu khám lâm sàng
**Validates: Requirements 3.1**

**Property 12: Kiểm tra tồn kho khi kê đơn**
*For any* đơn thuốc được tạo, hệ thống phải kiểm tra tồn kho đủ cho tất cả thuốc trong đơn trước khi lưu
**Validates: Requirements 3.2**

**Property 13: Tính tổng tiền đơn thuốc**
*For any* đơn thuốc, tổng tiền phải bằng tổng của (số lượng × đơn giá) của tất cả thuốc trong đơn
**Validates: Requirements 3.3**

**Property 14: Cập nhật trạng thái cascade khi hoàn tất chẩn đoán**
*For any* chẩn đoán cuối được hoàn tất, hệ thống phải cập nhật trạng thái phiếu khám thành "da_hoan_tat" và trạng thái lượt khám thành "hoan_tat"
**Validates: Requirements 3.4**

**Property 15: Notify nhân viên phát thuốc**
*For any* đơn thuốc mới, hệ thống phải gửi notification cho nhóm Y Tá Hành Chính
**Validates: Requirements 3.5**

### Billing Properties

**Property 16: Validate trước khi tạo hóa đơn**
*For any* hóa đơn được tạo, hệ thống phải validate sự tồn tại của bệnh nhân, nhân sự thu, và dịch vụ liên quan
**Validates: Requirements 4.1**

**Property 17: Tự động tạo hóa đơn khám lâm sàng**
*For any* phiếu khám lâm sàng không phải "service_return" và không phải tái khám đúng giờ, hệ thống phải tự động tạo hóa đơn với loại "kham_lam_sang"
**Validates: Requirements 4.2**

**Property 18: Tự động tạo hóa đơn CLS**
*For any* phiếu CLS chuyển sang trạng thái "dang_thuc_hien", hệ thống phải tự động tạo hóa đơn với loại "can_lam_sang"
**Validates: Requirements 4.3**

**Property 19: Thanh toán thuốc trừ tồn kho**
*For any* đơn thuốc chuyển sang trạng thái "da_phat", hệ thống phải tạo hóa đơn và trừ tồn kho cho tất cả thuốc trong đơn
**Validates: Requirements 4.4**

**Property 20: Broadcast dashboard khi có giao dịch**
*For any* hóa đơn mới được tạo, hệ thống phải broadcast cập nhật dashboard doanh thu
**Validates: Requirements 4.5**

### Result Delivery Properties

**Property 21: Lưu kết quả với trạng thái đúng**
*For any* kết quả CLS được nhập, chi tiết dịch vụ phải có trạng thái "da_co_ket_qua"
**Validates: Requirements 5.1**

**Property 22: Cập nhật hàng đợi và lượt khám khi chốt kết quả**
*For any* kết quả CLS được chốt, hệ thống phải cập nhật trạng thái hàng đợi thành "da_phuc_vu" và lượt khám thành "hoan_tat"
**Validates: Requirements 5.2**

**Property 23: Tạo phiếu tổng hợp khi tất cả kết quả sẵn sàng**
*For any* phiếu CLS khi tất cả dịch vụ có kết quả, hệ thống phải tạo phiếu tổng hợp và gắn mã vào phiếu khám LS để bệnh nhân có thể quay lại khám
**Validates: Requirements 5.3**

**Property 24: Broadcast targeted cho bác sĩ chỉ định**
*For any* kết quả CLS mới, hệ thống phải broadcast realtime cho bác sĩ đã chỉ định dịch vụ đó
**Validates: Requirements 5.4**

### Realtime Communication Properties

**Property 25: Broadcast sự kiện quan trọng**
*For any* sự kiện quan trọng (tạo phiếu khám, kết quả CLS, đơn thuốc, hóa đơn), hệ thống phải broadcast qua SignalR Hub
**Validates: Requirements 6.1**

**Property 26: Authenticate SignalR connection**
*For any* client kết nối SignalR, hệ thống phải authenticate bằng JWT token từ query string hoặc header
**Validates: Requirements 6.2**

**Property 27: Broadcast theo nhóm bác sĩ**
*For any* phiếu khám mới, hệ thống phải broadcast cho nhóm bác sĩ liên quan (bác sĩ được chỉ định)
**Validates: Requirements 6.3**

**Property 28: Broadcast kết quả CLS cho bác sĩ**
*For any* kết quả CLS, hệ thống phải broadcast cho bác sĩ đã chỉ định dịch vụ
**Validates: Requirements 6.4**

**Property 29: Broadcast dashboard cho tất cả**
*For any* thay đổi dashboard, hệ thống phải broadcast cho tất cả client đang kết nối
**Validates: Requirements 6.5**

### Notification Properties

**Property 30: Tạo notification với priority đúng**
*For any* sự kiện quan trọng, hệ thống phải tạo notification với mức độ ưu tiên phù hợp (high cho cấp cứu, normal cho thường)
**Validates: Requirements 7.1**

**Property 31: Routing notification theo role**
*For any* notification được tạo, hệ thống phải xác định người nhận dựa trên vai trò (bac_si, y_ta_hanh_chinh, ky_thuat_vien) và liên quan đến sự kiện
**Validates: Requirements 7.2**

**Property 32: Persist và broadcast notification**
*For any* notification được tạo, hệ thống phải lưu vào database và broadcast realtime đồng thời
**Validates: Requirements 7.3**

**Property 33: Cập nhật trạng thái đọc**
*For any* notification khi người dùng đọc, hệ thống phải cập nhật trạng thái "da_doc" và thời gian đọc
**Validates: Requirements 7.4**

**Property 34: Đánh dấu priority cao**
*For any* notification về cấp cứu hoặc kết quả bất thường, hệ thống phải đánh dấu mức độ ưu tiên "high"
**Validates: Requirements 7.5**

### Frontend Validation Properties

**Property 35: Validate input trước khi submit**
*For any* form submit, frontend phải validate tất cả required fields và format đúng trước khi gọi API
**Validates: Requirements 8.2**

### Error Handling Properties

**Property 36: Rollback transaction khi lỗi database**
*For any* operation gặp lỗi database, hệ thống phải rollback transaction và trả về error message rõ ràng
**Validates: Requirements 9.1**

**Property 37: HTTP 400 cho validation error**
*For any* request có lỗi validation, hệ thống phải trả về HTTP 400 với thông tin chi tiết về field nào bị lỗi
**Validates: Requirements 9.2**

**Property 38: HTTP 404 cho not found**
*For any* request tìm kiếm entity không tồn tại, hệ thống phải trả về HTTP 404
**Validates: Requirements 9.3**

**Property 39: HTTP 500 và logging cho server error**
*For any* unhandled exception, hệ thống phải log chi tiết error và trả về HTTP 500
**Validates: Requirements 9.4**

### Authorization Properties

**Property 40: Xác định role khi đăng nhập**
*For any* user đăng nhập thành công, hệ thống phải xác định role và include trong JWT token
**Validates: Requirements 10.1**

**Property 41: Bác sĩ access control**
*For any* endpoint khám bệnh/chẩn đoán/kê đơn, chỉ user có role "bac_si" mới được phép truy cập
**Validates: Requirements 10.2**

**Property 42: Y Tá Hành Chính access control**
*For any* endpoint tiếp nhận/lịch hẹn/thanh toán, chỉ user có role "y_ta_hanh_chinh" mới được phép truy cập
**Validates: Requirements 10.3**

**Property 43: Y Tá Phòng Khám access control**
*For any* endpoint hỗ trợ khám/quản lý hàng đợi phòng khám, chỉ user có role "y_ta_phong_kham" hoặc "bac_si" mới được phép truy cập
**Validates: Requirements 10.4**

**Property 44: Kỹ Thuật Viên access control**
*For any* endpoint thực hiện CLS/nhập kết quả, chỉ user có role "ky_thuat_vien" mới được phép truy cập
**Validates: Requirements 10.5**

**Property 45: Admin access control**
*For any* endpoint quản trị/cấu hình, chỉ user có role "admin" mới được phép truy cập
**Validates: Requirements 10.6**

### Role-Based Notification Properties

**Property 46: Notify bác sĩ khi có phiếu khám mới**
*For any* phiếu khám mới, hệ thống phải gửi notification cho bác sĩ được chỉ định (role: bac_si)
**Validates: Requirements 12.1**

**Property 47: Notify kỹ thuật viên khi có chỉ định CLS**
*For any* phiếu CLS mới, hệ thống phải gửi notification cho kỹ thuật viên phòng CLS tương ứng (role: ky_thuat_vien)
**Validates: Requirements 12.2**

**Property 48: Notify bác sĩ khi có kết quả CLS**
*For any* kết quả CLS mới, hệ thống phải gửi notification cho bác sĩ đã chỉ định (role: bac_si)
**Validates: Requirements 12.3**

**Property 49: Notify y tá hành chính khi có đơn thuốc**
*For any* đơn thuốc mới, hệ thống phải gửi notification cho nhóm y tá hành chính (role: y_ta_hanh_chinh)
**Validates: Requirements 12.4**

**Property 50: Notify y tá hành chính khi có thanh toán**
*For any* hóa đơn mới, hệ thống phải gửi notification cho nhóm y tá hành chính (role: y_ta_hanh_chinh)
**Validates: Requirements 12.5**

### Technician Workflow Properties

**Property 51: Filter hàng đợi CLS theo phòng**
*For any* kỹ thuật viên xem hàng đợi, hệ thống phải chỉ hiển thị bệnh nhân chờ CLS thuộc phòng của kỹ thuật viên đó
**Validates: Requirements 13.1**

**Property 52: Cập nhật trạng thái khi bắt đầu thực hiện CLS**
*For any* kỹ thuật viên bắt đầu thực hiện dịch vụ CLS, hệ thống phải cập nhật trạng thái chi tiết dịch vụ thành "dang_thuc_hien"
**Validates: Requirements 13.2**

**Property 53: Lưu kết quả và cập nhật trạng thái**
*For any* kỹ thuật viên nhập kết quả CLS, hệ thống phải lưu kết quả và cập nhật trạng thái chi tiết dịch vụ thành "da_co_ket_qua"
**Validates: Requirements 13.3**

**Property 54: Notify bác sĩ khi hoàn tất**
*For any* kết quả CLS được hoàn tất, hệ thống phải gửi notification cho bác sĩ chỉ định
**Validates: Requirements 13.4**

### Performance Properties

**Property 55: Pagination cho query lớn**
*For any* query trả về nhiều hơn 100 records, hệ thống phải sử dụng pagination với page size tối đa 500
**Validates: Requirements 14.4**

## Error Handling

### Exception Handling Strategy

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, message) = exception switch
        {
            ArgumentException => (400, exception.Message),
            InvalidOperationException => (400, exception.Message),
            KeyNotFoundException => (404, "Resource not found"),
            UnauthorizedAccessException => (403, "Access denied"),
            DbUpdateException => (500, "Database error occurred"),
            _ => (500, "An unexpected error occurred")
        };

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new
        {
            error = message,
            timestamp = DateTime.UtcNow
        }, cancellationToken);

        return true;
    }
}
```

### Transaction Management

```csharp
// Example: Complex transaction in ClinicalService
public async Task<ClinicalExamDto> TaoPhieuKhamAsync(ClinicalExamCreateRequest request)
{
    await using var transaction = await _db.Database.BeginTransactionAsync();
    try
    {
        // 1. Create clinical exam
        var phieu = new PhieuKhamLamSang { /* ... */ };
        _db.PhieuKhamLamSangs.Add(phieu);
        await _db.SaveChangesAsync();

        // 2. Create queue
        await _queue.ThemVaoHangDoiAsync(/* ... */);

        // 3. Update patient status
        await _patients.CapNhatTrangThaiBenhNhanAsync(/* ... */);

        // 4. Create invoice if needed
        if (shouldCharge)
        {
            await _billing.TaoHoaDonAsync(/* ... */);
        }

        await transaction.CommitAsync();
        
        // 5. Broadcast after commit
        await _realtime.BroadcastClinicalExamCreatedAsync(dto);
        
        return dto;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

## Testing Strategy

### Unit Testing

Sử dụng xUnit và Moq cho unit testing:

```csharp
public class ClinicalServiceTests
{
    [Fact]
    public async Task TaoPhieuKham_ShouldCreateQueue_WhenPhieuKhamCreated()
    {
        // Arrange
        var mockDb = new Mock<DataContext>();
        var mockQueue = new Mock<IQueueService>();
        var service = new ClinicalService(mockDb.Object, mockQueue.Object, /* ... */);
        
        // Act
        var result = await service.TaoPhieuKhamAsync(request);
        
        // Assert
        mockQueue.Verify(q => q.ThemVaoHangDoiAsync(It.IsAny<QueueEnqueueRequest>()), Times.Once);
    }
}
```

### Integration Testing

Sử dụng WebApplicationFactory cho integration testing:

```csharp
public class ClinicalControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_TaoPhieuKham_Returns201_WithValidData()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new ClinicalExamCreateRequest { /* ... */ };
        
        // Act
        var response = await client.PostAsJsonAsync("/api/clinical/phieu-kham", request);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

### Property-Based Testing

Sử dụng FsCheck.Xunit cho property-based testing:

```csharp
public class ClinicalServicePropertyTests
{
    [Property]
    public Property TaoPhieuKham_AlwaysCreatesQueue(
        NonEmptyString maBenhNhan,
        NonEmptyString maBacSi)
    {
        // Property 1: Tạo phiếu khám tự động tạo hàng đợi
        return Prop.ForAll<ClinicalExamCreateRequest>(request =>
        {
            var result = _service.TaoPhieuKhamAsync(request).Result;
            var queue = _db.HangDois.FirstOrDefault(h => h.MaPhieuKham == result.MaPhieuKham);
            return queue != null;
        });
    }
}
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RoleGuard.jsx
│   ├── exam/
│   │   ├── ClinicalExamForm.jsx
│   │   ├── ClinicalExamList.jsx
│   │   └── DiagnosisForm.jsx
│   ├── cls/
│   │   ├── ClsOrderForm.jsx
│   │   ├── ClsResultForm.jsx
│   │   └── ClsQueueList.jsx
│   ├── pharmacy/
│   │   ├── PrescriptionForm.jsx
│   │   └── DrugInventory.jsx
│   └── notifications/
│       ├── NotificationBell.jsx
│       └── NotificationList.jsx
├── api/
│   ├── clinical.js
│   ├── cls.js
│   ├── pharmacy.js
│   └── realtime.js
├── hooks/
│   ├── useAuth.js
│   ├── useRealtime.js
│   └── useNotifications.js
└── stores/
    ├── authStore.js
    └── notificationStore.js
```

### Role-Based UI Components

```jsx
// RoleGuard.jsx
export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage
<RoleGuard allowedRoles={['bac_si']}>
  <ClinicalExamForm />
</RoleGuard>
```

### SignalR Integration

```javascript
// realtime.js
import * as signalR from '@microsoft/signalr';

export const createRealtimeConnection = (token) => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/realtime', {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  connection.on('ClinicalExamCreated', (data) => {
    // Update UI
    queryClient.invalidateQueries(['clinical-exams']);
  });

  connection.on('ClsResultCreated', (data) => {
    // Show notification
    toast.success('Có kết quả CLS mới');
    queryClient.invalidateQueries(['cls-results']);
  });

  connection.on('NotificationReceived', (data) => {
    // Update notification badge
    notificationStore.addNotification(data);
  });

  return connection;
};
```

### React Query Integration

```javascript
// useClinicalExams.js
export const useClinicalExams = (filters) => {
  return useQuery({
    queryKey: ['clinical-exams', filters],
    queryFn: () => clinicalApi.search(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const useCreateClinicalExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clinicalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-exams']);
      toast.success('Tạo phiếu khám thành công');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
```

## Deployment Considerations

### Database Migrations

```bash
# Create migration
dotnet ef migrations add AddRoleToNhanVienYTe

# Update database
dotnet ef database update
```

### Environment Configuration

```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-db;Database=HealthCare;..."
  },
  "Jwt": {
    "Key": "production-secret-key",
    "Issuer": "HealthCare",
    "Audience": "HealthCare-Client",
    "ExpiryMinutes": 60
  },
  "AllowedCorsOrigins": [
    "https://healthcare.example.com"
  ]
}
```

### Performance Monitoring

- Sử dụng Application Insights cho monitoring
- Log tất cả exceptions và slow queries
- Monitor SignalR connection count và message throughput
- Track API response times và error rates

## Security Considerations

### JWT Token Security

- Token expiry: 60 minutes
- Refresh token: 7 days
- Store tokens in httpOnly cookies (frontend)
- Validate token signature và expiry trên mỗi request

### SQL Injection Prevention

- Sử dụng Entity Framework parameterized queries
- Không bao giờ concatenate SQL strings
- Validate và sanitize user input

### XSS Prevention

- Sanitize HTML content trước khi render
- Sử dụng Content Security Policy headers
- Escape user input trong notifications

### CORS Configuration

- Chỉ allow specific origins trong production
- Không allow credentials với wildcard origins
- Validate Origin header trên mỗi request

## Service Module Organization

### 1. UserInteractionService
**Responsibility**: Authentication, Users, Notifications, Realtime

**Tables Owned**:
- NhanVienYTes (Users)
- Roles, Permissions
- ThongBaos, NguoiNhanThongBaos
- RefreshTokens, OtpCodes

**Internal APIs**:
```csharp
public interface IUserInteractionService
{
    Task<UserDto> GetUserAsync(string userId);
    Task<IReadOnlyList<UserDto>> GetUsersByRoleAsync(string role);
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request);
    Task BroadcastRealtimeAsync(string eventName, object data, string? targetRole = null);
}
```

### 2. MasterDataService
**Responsibility**: Departments, Rooms, Staff Info, Services, Schedules

**Tables Owned**:
- Khoas, Phongs
- DichVuYTes
- LichTrucs

**Internal APIs**:
```csharp
public interface IMasterDataService
{
    Task<DepartmentDto> GetDepartmentAsync(string departmentId);
    Task<RoomDto> GetRoomAsync(string roomId);
    Task<ServiceDto> GetServiceAsync(string serviceId);
    Task<IReadOnlyList<ServiceDto>> GetServicesByTypeAsync(string serviceType);
    Task<StaffScheduleDto> GetStaffScheduleAsync(string staffId, DateTime date);
}
```

### 3. PatientManagementService
**Responsibility**: Patients, Appointments

**Tables Owned**:
- BenhNhans
- LichHenKhams

**Internal APIs**:
```csharp
public interface IPatientManagementService
{
    Task<PatientDto> GetPatientAsync(string patientId);
    Task<PatientDto> CreatePatientAsync(CreatePatientRequest request);
    Task<AppointmentDto> GetAppointmentAsync(string appointmentId);
    Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentRequest request);
}
```

### 4. OutpatientCareService
**Responsibility**: Clinical Exams, CLS Orders/Results, Queue, Visits

**Tables Owned**:
- PhieuKhamLamSangs
- PhieuKhamCanLamSangs, ChiTietDichVus, KetQuaDichVus
- PhieuTongHopKetQuas
- PhieuChanDoanCuois
- HangDois, LuotKhamBenhs

**Internal APIs**:
```csharp
public interface IOutpatientCareService
{
    Task<ClinicalExamDto> CreateClinicalExamAsync(CreateClinicalExamRequest request);
    Task<ClsOrderDto> CreateClsOrderAsync(CreateClsOrderRequest request);
    Task<ClsResultDto> CreateClsResultAsync(CreateClsResultRequest request);
    Task<QueueDto> EnqueuePatientAsync(EnqueuePatientRequest request);
}
```

### 5. MedicationBillingService
**Responsibility**: Drug Inventory, Prescriptions, Invoices

**Tables Owned**:
- KhoThuocs
- DonThuocs, ChiTietDonThuocs
- HoaDonThanhToans

**Internal APIs**:
```csharp
public interface IMedicationBillingService
{
    Task<DrugDto> GetDrugAsync(string drugId);
    Task<PrescriptionDto> CreatePrescriptionAsync(CreatePrescriptionRequest request);
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceRequest request);
    Task<bool> CheckDrugAvailabilityAsync(string drugId, int quantity);
}
```

### 6. ReportService
**Responsibility**: History, Dashboard, Statistics, Reports

**Tables Accessed**: Read-only access to all tables via other services

**Internal APIs**:
```csharp
public interface IReportService
{
    Task<DashboardDto> GetTodayDashboardAsync();
    Task<PatientHistoryDto> GetPatientHistoryAsync(string patientId);
    Task<RevenueReportDto> GetRevenueReportAsync(DateTime fromDate, DateTime toDate);
}
```

## Service Communication Pattern

### HTTP Client Implementation

```csharp
// Example: ClinicalService calling PatientService
public class ClinicalService
{
    private readonly IPatientServiceClient _patientClient;
    private readonly IMasterDataServiceClient _masterDataClient;
    private readonly IBillingServiceClient _billingClient;
    
    public async Task<ClinicalExamDto> CreateExamAsync(CreateExamRequest request)
    {
        // Get patient info via HTTP call instead of DB join
        var patient = await _patientClient.GetPatientAsync(request.PatientId);
        if (patient == null)
            throw new InvalidOperationException("Patient not found");
            
        // Get service info via HTTP call
        var service = await _masterDataClient.GetServiceAsync(request.ServiceId);
        if (service == null)
            throw new InvalidOperationException("Service not found");
            
        // Create exam (only access own tables)
        var exam = new PhieuKhamLamSang
        {
            MaPhieuKham = GenerateId(),
            MaBenhNhan = request.PatientId, // Store ID only
            MaDichVuKham = request.ServiceId, // Store ID only
            // ... other fields
        };
        
        await _db.PhieuKhamLamSangs.AddAsync(exam);
        await _db.SaveChangesAsync();
        
        // Auto-create invoice via HTTP call
        await _billingClient.CreateInvoiceAsync(new CreateInvoiceRequest
        {
            PatientId = request.PatientId,
            ExamId = exam.MaPhieuKham,
            Amount = service.Price
        });
        
        return MapToDto(exam, patient, service);
    }
}

// HTTP Client for internal service calls
public class PatientServiceClient : IPatientServiceClient
{
    private readonly HttpClient _httpClient;
    
    public async Task<PatientDto> GetPatientAsync(string patientId)
    {
        var response = await _httpClient.GetAsync($"/internal/patients/{patientId}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PatientDto>();
    }
}
```

### Benefits of This Approach

1. **Loose Coupling**: Services don't depend on each other's database schema
2. **Clear Boundaries**: Each service owns specific tables
3. **Testability**: Easy to mock service dependencies
4. **Future Migration**: Can easily extract to separate microservices
5. **Single Deployment**: Still runs as one application for simplicity

### Migration Path

1. **Phase 1**: Refactor existing code to use service interfaces
2. **Phase 2**: Implement HTTP clients for internal calls
3. **Phase 3**: Remove direct database joins between services
4. **Phase 4**: (Optional) Extract to separate microservices