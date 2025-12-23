# Service-Oriented Architecture (SOA) Design - HealthCare System

## Overview

Hệ thống HealthCare được thiết kế theo kiến trúc hướng dịch vụ (SOA) kết hợp phong cách RESTful, có tham chiếu tới tư duy Domain-Driven Design (DDD). 

**Đặc điểm:**
- **6 Bounded Contexts**: Mỗi service đại diện cho một miền nghiệp vụ rõ ràng
- **Database per Service**: Mỗi service có database riêng, không join trực tiếp
- **Service Communication**: HTTP REST (sync) + Message Bus (async)
- **Deployment**: Tất cả services chạy trên 1 máy (có thể scale ra nhiều máy)

**Lưu ý**: Về triển khai thực tế, các service này hiện vẫn chạy chung trong một backend .NET nhưng được tách logic và controller rõ ràng. Document này hướng dẫn refactor để tách thành các service độc lập.

---

## Service Breakdown (6 Bounded Contexts)

### 1. User Interaction Service (Port 5001)

**Phạm vi nghiệp vụ:**
- Tài khoản người dùng hệ thống: bác sĩ, y tá, y tá hành chính, kỹ thuật viên, admin
- Phân quyền và vai trò truy cập (role, quyền chức năng)
- Cơ chế đăng nhập, xác thực, cấp và làm mới token (JWT + RefreshToken)
- OTP cho các thao tác nhạy cảm (đổi mật khẩu)
- Thông báo gửi tới người dùng (notification, chuông thông báo realtime)

**Database**: UserInteractionDB
- Users (NhanVienYTe)
- Roles
- Permissions
- RefreshTokens
- OtpCodes
- ThongBaos
- NguoiNhanThongBaos

**APIs**:
```
Authentication:
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

User Management:
- GET /api/users
- GET /api/users/{id}
- POST /api/users
- PUT /api/users/{id}
- PUT /api/users/{id}/role

OTP:
- POST /api/otp/send
- POST /api/otp/verify

Notifications:
- GET /api/notifications/my
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all
- POST /api/notifications (internal)

Realtime (SignalR Hub):
- /hubs/realtime
```

**Vai trò & lý do tách:**
1. Tài khoản, phân quyền, xác thực, OTP và thông báo đều là mối quan tâm dùng chung cho toàn bộ hệ thống
2. Gom Auth, User, OTP và Notification vào một service giúp tập trung toàn bộ logic bảo mật và tương tác người dùng
3. Khi cần thay đổi cách xác thực hoặc kênh thông báo, chỉ cần điều chỉnh trong User Interaction Service

**Dependencies**: None (base service)

**Events Published**:
- UserLoggedIn
- NotificationCreated
- NotificationRead

---

### 2. Master Data Service (Port 5002)

**Phạm vi nghiệp vụ:**
- Danh mục khoa, phòng khám, phòng cận lâm sàng
- Thông tin nhân sự ở mức hành chính (mã nhân viên, chức danh, khoa/phòng phụ trách)
- Danh mục dịch vụ y tế (khám, CLS, thủ thuật)
- Lịch trực cơ bản của phòng và nhân sự

**Database**: MasterDataDB
- Khoas
- Phongs
- NhanVienYTe (reference data only - full data ở User Interaction)
- DichVuYTes
- LichTrucs

**APIs**:
```
Departments & Rooms:
- GET /api/departments
- GET /api/departments/{id}
- POST /api/departments
- GET /api/rooms
- GET /api/rooms/{id}
- POST /api/rooms

Staff (Administrative):
- GET /api/staff
- GET /api/staff/{id}
- GET /api/staff/by-room/{roomId}

Services:
- GET /api/services
- GET /api/services/{id}
- POST /api/services
- PUT /api/services/{id}

Schedules:
- GET /api/schedules
- GET /api/schedules/room/{roomId}
- POST /api/schedules
```

**Vai trò & lý do tách:**
1. Các bảng Khoa, Phòng, Nhân sự, Dịch vụ có tần suất thay đổi thấp nhưng được hầu hết các module khác tham chiếu → rất phù hợp làm master data
2. Việc tách riêng giúp giảm coupling: các service khác chỉ cần mã Khoa/Phòng/Nhân viên/Dịch vụ, không cần join trực tiếp
3. Thuận lợi cho việc cache và tái sử dụng

**Dependencies**:
- User Interaction Service (validate token)

**Events Published**:
- ServiceCreated
- ServiceUpdated
- RoomScheduleChanged

---

### 3. Patient Management Service (Port 5003)

**Phạm vi nghiệp vụ:**
- Hồ sơ bệnh nhân (BenhNhan)
- Lịch hẹn (LichHenKham)
- Trạng thái cơ bản của bệnh nhân: đã đặt lịch, đã check-in, vắng, hủy lịch

**Database**: PatientDB
- BenhNhans
- LichHenKhams

**APIs**:
```
Patients:
- GET /api/patients
- GET /api/patients/{id}
- POST /api/patients
- PUT /api/patients/{id}
- PUT /api/patients/{id}/status
- GET /api/patients/search

Appointments:
- GET /api/appointments
- GET /api/appointments/{id}
- POST /api/appointments
- PUT /api/appointments/{id}
- PUT /api/appointments/{id}/checkin
- PUT /api/appointments/{id}/cancel
```

**Vai trò & lý do tách:**
1. Đây là điểm bắt đầu của hành trình khám bệnh: bệnh nhân được tạo hồ sơ, đặt lịch, xác nhận và check-in
2. Domain logic giữa bệnh nhân – lịch hẹn – trạng thái check-in gắn chặt với quy trình tiếp nhận
3. Dễ mở rộng nhiều kênh đặt lịch (quầy, điện thoại, website, mobile app)

**Dependencies**:
- User Interaction Service (validate token)
- Master Data Service (get department/room info)

**Events Published**:
- PatientCreated
- PatientUpdated
- AppointmentCreated
- AppointmentCheckedIn
- AppointmentCancelled

---

### 4. Outpatient Care Service (Port 5004)

**Phạm vi nghiệp vụ:**
Quản lý toàn bộ vòng đời một lượt khám ngoại trú:
1. **Khám lâm sàng** (lần khám ban đầu và khám lại sau khi có kết quả CLS)
2. **Chỉ định và ghi nhận phiếu cận lâm sàng** (Phiếu CLS)
3. **Quản lý hàng đợi khám** tại phòng khám và điều phối bệnh nhân
4. **Lưu trữ chẩn đoán cuối** và kết luận cho mỗi lượt khám

**Database**: OutpatientCareDB
- LuotKhamBenhs
- PhieuKhamLamSangs
- PhieuKhamCanLamSangs
- ChiTietDichVus
- KetQuaDichVus
- PhieuTongHopKetQuas
- HangDois
- PhieuChanDoanCuois

**APIs**:
```
Clinical Exams:
- POST /api/outpatient/exams
- GET /api/outpatient/exams/{id}
- PUT /api/outpatient/exams/{id}/status
- GET /api/outpatient/exams/search

CLS Orders:
- POST /api/outpatient/cls/orders
- GET /api/outpatient/cls/orders/{id}
- PUT /api/outpatient/cls/orders/{id}/status
- POST /api/outpatient/cls/items
- GET /api/outpatient/cls/items/{id}

CLS Results:
- POST /api/outpatient/cls/results
- GET /api/outpatient/cls/results/{itemId}
- PUT /api/outpatient/cls/results/{id}

CLS Summary:
- POST /api/outpatient/cls/summary
- GET /api/outpatient/cls/summary/{id}

Queue Management:
- GET /api/outpatient/queue
- GET /api/outpatient/queue/room/{roomId}
- POST /api/outpatient/queue/enqueue
- PUT /api/outpatient/queue/{id}/status
- PUT /api/outpatient/queue/{id}/call

Visits:
- GET /api/outpatient/visits/{id}
- POST /api/outpatient/visits/start
- PUT /api/outpatient/visits/{id}/complete

Diagnosis:
- POST /api/outpatient/diagnosis
- GET /api/outpatient/diagnosis/{examId}
- PUT /api/outpatient/diagnosis/{id}
```

**Vai trò & lý do tách:**
1. Ở góc nhìn của bác sĩ và điều dưỡng, trọng tâm là "lượt khám" và trạng thái của lượt đó
2. Các quy tắc về ưu tiên hàng đợi, luồng gọi bệnh nhân, quy trình khám vòng 1 → làm CLS → khám sau CLS → kết luận cuối đều xoay quanh cùng một LuotKham
3. Gom khám lâm sàng, cận lâm sàng và hàng đợi vào cùng một service giúp dễ nhìn, đúng với cách vận hành thực tế

**Module nội bộ:**
- **Module Khám lâm sàng**: Quản lý phiếu khám, triệu chứng, chẩn đoán sơ bộ
- **Module Cận lâm sàng (CLS)**: Phiếu chỉ định, chi tiết dịch vụ, kết quả, phiếu tổng hợp
- **Module Hàng đợi**: Quản lý hàng đợi khám, điều phối lượt khám

**Dependencies**:
- User Interaction Service (validate token, send notifications)
- Patient Management Service (get patient info)
- Master Data Service (get service info, room info)
- Medication Billing Service (create invoice, create prescription)

**Events Published**:
- ClinicalExamCreated
- ClinicalExamUpdated
- ClsOrderCreated
- ClsResultCreated
- ClsSummaryCreated
- DiagnosisCreated
- QueueUpdated

---

### 5. Medication Billing Service (Port 5005)

**Phạm vi nghiệp vụ:**
- Kho thuốc (KhoThuoc)
- Đơn thuốc và chi tiết đơn thuốc (DonThuoc, ChiTietDonThuoc)
- Hóa đơn thu tiền (HoaDonThanhToan)

**Database**: MedicationBillingDB
- KhoThuocs
- DonThuocs
- ChiTietDonThuocs
- HoaDonThanhToans

**APIs**:
```
Drug Inventory:
- GET /api/medication/drugs
- GET /api/medication/drugs/{id}
- POST /api/medication/drugs
- PUT /api/medication/drugs/{id}
- GET /api/medication/drugs/search
- GET /api/medication/drugs/low-stock

Prescriptions:
- POST /api/medication/prescriptions
- GET /api/medication/prescriptions/{id}
- PUT /api/medication/prescriptions/{id}/status
- GET /api/medication/prescriptions/pending
- GET /api/medication/prescriptions/search

Billing:
- POST /api/billing/invoices
- GET /api/billing/invoices/{id}
- GET /api/billing/invoices/search
- PUT /api/billing/invoices/{id}/status
- GET /api/billing/revenue/today
- GET /api/billing/revenue/summary
```

**Vai trò & lý do tách:**
1. Nghiệp vụ dược – tài chính (phát thuốc, tính tiền, thanh toán) có yêu cầu kiểm soát, audit, báo cáo riêng
2. Tách riêng giúp sau này dễ tích hợp với hệ thống kế toán hoặc hệ thống kho dược toàn viện
3. Các bảng hóa đơn, kho thuốc thường có số lượng giao dịch lớn, cần tối ưu riêng về hiệu năng

**Dependencies**:
- User Interaction Service (validate token, send notifications)
- Patient Management Service (get patient info)
- Master Data Service (get service pricing)

**Events Published**:
- PrescriptionCreated
- PrescriptionDispensed
- DrugStockLow
- InvoiceCreated
- PaymentReceived

**Events Subscribed**:
- DiagnosisCreated (to allow prescription creation)

---

### 6. Report Service (Port 5006)

**Phạm vi nghiệp vụ:**
- Các API phục vụ tra cứu lịch sử khám chữa bệnh và lịch sử thanh toán
- Các API báo cáo và dashboard: số lượt khám theo ngày/khoa, thời gian chờ trung bình, số ca có CLS, doanh thu theo loại dịch vụ
- Dữ liệu được tổng hợp từ nhiều service nghiệp vụ

**Database**: ReportDB (Read-only replicas hoặc data warehouse)
- Có thể sử dụng views, materialized views hoặc ETL từ các service khác

**APIs**:
```
History:
- GET /api/reports/history/patient/{patientId}
- GET /api/reports/history/exam/{examId}
- GET /api/reports/history/billing/{patientId}

Dashboard:
- GET /api/reports/dashboard/today
- GET /api/reports/dashboard/overview
- GET /api/reports/dashboard/queue-status

Statistics:
- GET /api/reports/stats/exams
- GET /api/reports/stats/revenue
- GET /api/reports/stats/services
- GET /api/reports/stats/waiting-time

Reports:
- GET /api/reports/daily-summary
- GET /api/reports/monthly-summary
- GET /api/reports/department-performance
- GET /api/reports/doctor-performance
```

**Vai trò & lý do tách:**
1. Truy vấn lịch sử và báo cáo thường có đặc điểm: lượng đọc lớn, cần join hoặc tổng hợp từ nhiều bảng
2. Nếu dồn toàn bộ logic báo cáo vào từng service nghiệp vụ, các service này sẽ vừa phải xử lý giao dịch online vừa gánh thêm truy vấn báo cáo nặng
3. Định nghĩa riêng một Reporting Service giúp gom các API lịch sử và báo cáo vào một chỗ, dễ quản lý và mở rộng

**Dependencies**:
- User Interaction Service (validate token)
- Tất cả các service khác (read data via HTTP hoặc replicated database)

**Events Subscribed**:
- All major events (to update reporting database)

---

### 7. API Gateway (Port 5000)

**Responsibility**: Routing, load balancing, rate limiting

**Technology**: Ocelot hoặc YARP

**Routes**:
```json
{
  "/api/auth/*": "http://localhost:5001",
  "/api/users/*": "http://localhost:5001",
  "/api/otp/*": "http://localhost:5001",
  "/api/notifications/*": "http://localhost:5001",
  "/hubs/realtime": "http://localhost:5001",
  
  "/api/departments/*": "http://localhost:5002",
  "/api/rooms/*": "http://localhost:5002",
  "/api/staff/*": "http://localhost:5002",
  "/api/services/*": "http://localhost:5002",
  "/api/schedules/*": "http://localhost:5002",
  
  "/api/patients/*": "http://localhost:5003",
  "/api/appointments/*": "http://localhost:5003",
  
  "/api/outpatient/*": "http://localhost:5004",
  
  "/api/medication/*": "http://localhost:5005",
  "/api/billing/*": "http://localhost:5005",
  
  "/api/reports/*": "http://localhost:5006"
}
```

---

## Service Communication Patterns

### 1. Synchronous Communication (HTTP REST)

**Use Cases**: 
- Lấy thông tin bệnh nhân từ Patient Service
- Validate token với Auth Service
- Tạo hóa đơn qua Billing Service

**Example**:
```csharp
// In ClinicalService
public class PatientServiceClient
{
    private readonly HttpClient _httpClient;
    
    public async Task<PatientDto> GetPatientAsync(string patientId)
    {
        var response = await _httpClient.GetAsync($"http://localhost:5002/api/patients/{patientId}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PatientDto>();
    }
}
```

**Pros**: 
- Simple, easy to understand
- Immediate response

**Cons**:
- Tight coupling
- Service availability dependency

---

### 2. Asynchronous Communication (Message Bus)

**Technology**: RabbitMQ hoặc In-Memory Event Bus (cho development)

**Use Cases**:
- Gửi notifications
- Broadcast events cho multiple services
- Eventual consistency

**Example**:
```csharp
// In ClinicalService - Publish event
public async Task<ClinicalExamDto> CreateExamAsync(CreateExamRequest request)
{
    // Create exam
    var exam = new PhieuKhamLamSang { /* ... */ };
    await _db.SaveChangesAsync();
    
    // Publish event
    await _messageBus.PublishAsync(new ClinicalExamCreatedEvent
    {
        ExamId = exam.MaPhieuKham,
        PatientId = exam.MaBenhNhan,
        DoctorId = exam.MaBacSiKham,
        Timestamp = DateTime.UtcNow
    });
    
    return MapToDto(exam);
}

// In NotificationService - Subscribe to event
public class ClinicalExamCreatedHandler : IEventHandler<ClinicalExamCreatedEvent>
{
    public async Task HandleAsync(ClinicalExamCreatedEvent @event)
    {
        // Create notification
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            Title = "Phiếu khám mới",
            Content = $"Có phiếu khám mới {@event.ExamId}",
            RecipientRole = "bac_si",
            RecipientId = @event.DoctorId
        });
    }
}
```

**Pros**:
- Loose coupling
- Scalability
- Resilience

**Cons**:
- Eventual consistency
- More complex

---

## Data Consistency Strategies

### 1. Saga Pattern

**Use Case**: Tạo phiếu khám + Tạo hóa đơn + Gửi notification

**Implementation**: Orchestration-based Saga

```csharp
public class CreateClinicalExamSaga
{
    public async Task<Result> ExecuteAsync(CreateExamRequest request)
    {
        var sagaId = Guid.NewGuid();
        
        try
        {
            // Step 1: Create exam
            var exam = await _clinicalService.CreateExamAsync(request);
            
            // Step 2: Create invoice
            var invoice = await _billingService.CreateInvoiceAsync(new CreateInvoiceRequest
            {
                PatientId = exam.PatientId,
                ExamId = exam.ExamId,
                Amount = exam.ServiceFee
            });
            
            // Step 3: Send notification
            await _notificationService.SendAsync(new SendNotificationRequest
            {
                RecipientId = exam.DoctorId,
                Message = $"Phiếu khám mới {exam.ExamId}"
            });
            
            return Result.Success(exam);
        }
        catch (Exception ex)
        {
            // Compensating transactions
            await CompensateAsync(sagaId);
            return Result.Failure(ex.Message);
        }
    }
    
    private async Task CompensateAsync(Guid sagaId)
    {
        // Rollback steps in reverse order
        // Delete notification
        // Cancel invoice
        // Delete exam
    }
}
```

---

### 2. Event Sourcing (Optional - Advanced)

**Use Case**: Audit trail cho tất cả thay đổi

**Implementation**: Store events thay vì state

```csharp
public class ClinicalExamAggregate
{
    public string Id { get; private set; }
    private List<IEvent> _events = new();
    
    public void Create(CreateExamCommand command)
    {
        var @event = new ClinicalExamCreatedEvent
        {
            ExamId = Guid.NewGuid().ToString(),
            PatientId = command.PatientId,
            // ...
        };
        
        Apply(@event);
        _events.Add(@event);
    }
    
    private void Apply(ClinicalExamCreatedEvent @event)
    {
        Id = @event.ExamId;
        // Update state
    }
}
```

---

## Deployment Architecture

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./ApiGateway
    ports:
      - "5000:80"
    depends_on:
      - auth-service
      - patient-service
      - clinical-service
      - cls-service
      - pharmacy-service
      - billing-service
      - notification-service
      - realtime-service

  auth-service:
    build: ./AuthService
    ports:
      - "5001:80"
    environment:
      - ConnectionStrings__DefaultConnection=Server=auth-db;Database=AuthDB;...
    depends_on:
      - auth-db

  auth-db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=AuthDB
    volumes:
      - auth-data:/var/lib/mysql

  patient-service:
    build: ./PatientService
    ports:
      - "5002:80"
    environment:
      - ConnectionStrings__DefaultConnection=Server=patient-db;Database=PatientDB;...
    depends_on:
      - patient-db

  patient-db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=PatientDB
    volumes:
      - patient-data:/var/lib/mysql

  # ... similar for other services

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  auth-data:
  patient-data:
  clinical-data:
  cls-data:
  pharmacy-data:
  billing-data:
  notification-data:
```

---

## Migration Strategy

### Phase 1: Strangler Fig Pattern

1. **Keep existing monolith running**
2. **Extract one service at a time**
3. **Route new requests to new service**
4. **Gradually migrate old data**

### Phase 2: Service Extraction Order

1. **Auth Service** (foundation)
2. **Patient Service** (core domain)
3. **Notification Service** (supporting)
4. **Billing Service** (supporting)
5. **Clinical Service** (main workflow)
6. **CLS Service** (main workflow)
7. **Pharmacy Service** (main workflow)
8. **Realtime Service** (cross-cutting)

### Phase 3: Data Migration

```csharp
public class DataMigrationService
{
    public async Task MigratePatientDataAsync()
    {
        // Read from monolith DB
        var patients = await _monolithDb.BenhNhans.ToListAsync();
        
        // Write to Patient Service DB
        foreach (var patient in patients)
        {
            await _patientServiceClient.CreatePatientAsync(new CreatePatientRequest
            {
                MaBenhNhan = patient.MaBenhNhan,
                HoTen = patient.HoTen,
                // ...
            });
        }
    }
}
```

---

## Benefits of Microservice Architecture

1. **Independent Deployment**: Deploy Clinical Service without affecting Pharmacy Service
2. **Technology Diversity**: Use different tech stack for different services
3. **Scalability**: Scale CLS Service independently during peak hours
4. **Fault Isolation**: If Pharmacy Service fails, Clinical Service still works
5. **Team Autonomy**: Different teams can own different services
6. **Database Optimization**: Each service can optimize its own database

---

## Challenges & Solutions

### Challenge 1: Distributed Transactions

**Problem**: Tạo phiếu khám + Tạo hóa đơn phải atomic

**Solution**: 
- Use Saga pattern
- Implement compensating transactions
- Use eventual consistency where acceptable

### Challenge 2: Data Duplication

**Problem**: Patient info cần ở nhiều services

**Solution**:
- Store only IDs in other services
- Fetch data via HTTP when needed
- Cache frequently accessed data
- Use CQRS for read-heavy scenarios

### Challenge 3: Service Discovery

**Problem**: Services cần biết địa chỉ của nhau

**Solution**:
- Use API Gateway for external clients
- Use service registry (Consul) for internal communication
- Use environment variables for development

### Challenge 4: Monitoring & Debugging

**Problem**: Khó trace request qua nhiều services

**Solution**:
- Implement distributed tracing (Jaeger, Zipkin)
- Use correlation IDs
- Centralized logging (ELK stack)
- Health checks for each service

---

## Implementation Checklist

- [ ] Setup API Gateway (Ocelot/YARP)
- [ ] Extract Auth Service
- [ ] Extract Patient Service
- [ ] Setup Message Bus (RabbitMQ)
- [ ] Implement Event Bus abstraction
- [ ] Extract Notification Service
- [ ] Extract Billing Service
- [ ] Extract Clinical Service
- [ ] Extract CLS Service
- [ ] Extract Pharmacy Service
- [ ] Extract Realtime Service
- [ ] Implement Saga pattern for complex workflows
- [ ] Setup distributed tracing
- [ ] Setup centralized logging
- [ ] Create Docker Compose for local development
- [ ] Migrate data from monolith
- [ ] Update frontend to use API Gateway
- [ ] Performance testing
- [ ] Security audit


---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│   │ Bác Sĩ   │  │ Y Tá HC  │  │ Y Tá PK  │  │ Kỹ Thuật │          │
│   │   UI     │  │   UI     │  │   UI     │  │  Viên UI │          │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│          │            │            │            │                    │
│          └────────────┴────────────┴────────────┘                    │
│                       │                                               │
│               ┌───────▼────────┐                                     │
│               │  API Gateway   │                                     │
│               │  Port: 5000    │                                     │
│               └───────┬────────┘                                     │
└───────────────────────┼──────────────────────────────────────────────┘
                        │ HTTPS + WebSocket
                        │
┌───────────────────────┴──────────────────────────────────────────────┐
│                    Service Layer (SOA)                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. User Interaction Service (Port 5001)                     │   │
│  │     - Auth, Users, OTP, Notifications, Realtime (SignalR)   │   │
│  │     Database: UserInteractionDB                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  2. Master Data Service (Port 5002)                          │   │
│  │     - Departments, Rooms, Staff, Services, Schedules         │   │
│  │     Database: MasterDataDB                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  3. Patient Management Service (Port 5003)                   │   │
│  │     - Patients, Appointments                                 │   │
│  │     Database: PatientDB                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  4. Outpatient Care Service (Port 5004)                      │   │
│  │     - Clinical Exams, CLS Orders, Results, Queue, Visits     │   │
│  │     Database: OutpatientCareDB                               │   │
│  │     Modules: Clinical, CLS, Queue Management                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  5. Medication Billing Service (Port 5005)                   │   │
│  │     - Drug Inventory, Prescriptions, Invoices                │   │
│  │     Database: MedicationBillingDB                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  6. Report Service (Port 5006)                               │   │
│  │     - History, Dashboard, Statistics, Reports                │   │
│  │     Database: ReportDB (read replicas)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Message Bus (RabbitMQ / In-Memory)                   │   │
│  │  Events: ClinicalExamCreated, ClsResultCreated,              │   │
│  │          PrescriptionCreated, InvoiceCreated, etc.           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘

Service Communication:
- HTTP REST: Synchronous calls (get patient info, validate token)
- Message Bus: Asynchronous events (notifications, data sync)
- Each service has its own database (Database per Service pattern)
```
