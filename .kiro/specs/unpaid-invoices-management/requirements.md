# Requirements: Quản lý hóa đơn chưa thu (Unpaid Invoices Management)

## 1. Tổng quan (Overview)

### 1.1 Mục đích
Hiện tại hệ thống đã hỗ trợ tạo hóa đơn với tùy chọn "Thu sau" (deferred payment), nhưng chưa có giao diện tập trung để quản lý các hóa đơn chưa thu tiền. Tính năng này sẽ cung cấp một màn hình chuyên dụng cho nhân viên thu ngân/lễ tân để:
- Xem danh sách tất cả hóa đơn chưa thu
- Tìm kiếm và lọc hóa đơn theo bệnh nhân, thời gian, loại dịch vụ
- Thu tiền cho các hóa đơn đã tạo trước đó
- Theo dõi công nợ của bệnh nhân

### 1.2 Bối cảnh nghiệp vụ
Trong thực tế phòng khám, có nhiều trường hợp cần "thu sau":
- Bệnh nhân chưa có tiền ngay lúc khám
- Bệnh nhân quen biết, thanh toán định kỳ
- Công ty/bảo hiểm thanh toán sau
- Gia đình bệnh nhân đang đi rút tiền

Hiện tại các hóa đơn này được tạo với trạng thái `chua_thu` nhưng chỉ có thể xem trong:
- Tab "Giao dịch" của từng bệnh nhân (phải vào từng hồ sơ)
- Trang Lịch sử (History) - tab Transactions (không có chức năng thu tiền trực tiếp)

### 1.3 Vấn đề cần giải quyết
- **Không có view tổng quan**: Nhân viên không thể xem tất cả hóa đơn chưa thu của tất cả bệnh nhân
- **Không có chức năng thu tiền trực tiếp**: Phải vào từng hồ sơ bệnh nhân để thu tiền
- **Khó theo dõi công nợ**: Không biết tổng số tiền chưa thu, bệnh nhân nào nợ bao nhiêu
- **Không có cảnh báo**: Không có thông báo về hóa đơn quá hạn hoặc nợ lâu

## 2. User Stories

### 2.1 Xem danh sách hóa đơn chưa thu
**Là** nhân viên lễ tân/thu ngân  
**Tôi muốn** xem danh sách tất cả hóa đơn chưa thu  
**Để** biết bệnh nhân nào còn nợ tiền và cần thu

**Acceptance Criteria:**
- Hiển thị bảng danh sách hóa đơn với trạng thái `chua_thu`
- Mỗi dòng hiển thị: Mã HĐ, Mã BN, Tên BN, Loại dịch vụ, Số tiền, Ngày tạo, Số ngày chưa thu
- Sắp xếp mặc định: Ngày tạo (cũ nhất trước)
- Phân trang: 20 hóa đơn/trang
- Highlight hóa đơn quá 7 ngày chưa thu (màu vàng), quá 30 ngày (màu đỏ)

### 2.2 Tìm kiếm và lọc hóa đơn
**Là** nhân viên lễ tân/thu ngân  
**Tôi muốn** tìm kiếm hóa đơn theo bệnh nhân hoặc lọc theo tiêu chí  
**Để** nhanh chóng tìm được hóa đơn cần thu

**Acceptance Criteria:**
- Ô tìm kiếm: Tìm theo Mã BN, Tên BN, Mã HĐ
- Bộ lọc:
  - Loại dịch vụ: Khám LS, CLS, Thuốc
  - Khoảng thời gian: Từ ngày - Đến ngày
  - Khoảng số tiền: Từ - Đến
  - Số ngày chưa thu: < 7 ngày, 7-30 ngày, > 30 ngày
- Kết quả tìm kiếm cập nhật real-time khi nhập
- Hiển thị số lượng kết quả tìm được

### 2.3 Thu tiền cho hóa đơn
**Là** nhân viên lễ tân/thu ngân  
**Tôi muốn** thu tiền trực tiếp từ danh sách hóa đơn chưa thu  
**Để** không phải vào từng hồ sơ bệnh nhân

**Acceptance Criteria:**
- Nút "Thu tiền" trên mỗi dòng hóa đơn
- Click vào mở PaymentWizard với thông tin hóa đơn đã điền sẵn
- PaymentWizard bỏ qua bước REVIEW, đi thẳng đến bước METHOD
- Sau khi thu tiền thành công:
  - Hóa đơn biến mất khỏi danh sách
  - Hiển thị toast thông báo thành công
  - Cập nhật số liệu thống kê

### 2.4 Xem thống kê công nợ
**Là** quản lý/kế toán  
**Tôi muốn** xem tổng quan về công nợ  
**Để** theo dõi tình hình tài chính

**Acceptance Criteria:**
- Hiển thị các KPI:
  - Tổng số hóa đơn chưa thu
  - Tổng số tiền chưa thu
  - Số hóa đơn quá 7 ngày
  - Số hóa đơn quá 30 ngày
- Biểu đồ phân bố theo loại dịch vụ (pie chart)
- Biểu đồ xu hướng theo thời gian (line chart)
- Top 10 bệnh nhân nợ nhiều nhất

### 2.5 Xem chi tiết hóa đơn
**Là** nhân viên lễ tân/thu ngân  
**Tôi muốn** xem chi tiết hóa đơn trước khi thu tiền  
**Để** xác nhận thông tin chính xác

**Acceptance Criteria:**
- Nút "Xem chi tiết" trên mỗi dòng
- Modal hiển thị:
  - Thông tin bệnh nhân: Mã, Tên, SĐT
  - Thông tin hóa đơn: Mã HĐ, Ngày tạo, Loại dịch vụ
  - Chi tiết dịch vụ: Tên dịch vụ, Số lượng, Đơn giá, Thành tiền
  - Tổng tiền phải thu
  - Lịch sử: Ai tạo, khi nào
- Nút "Thu tiền" trong modal

### 2.6 Hủy hóa đơn chưa thu
**Là** quản lý/kế toán  
**Tôi muốn** hủy hóa đơn không hợp lệ  
**Để** dọn dẹp dữ liệu

**Acceptance Criteria:**
- Nút "Hủy" chỉ hiển thị cho role Admin, Kế toán
- Click vào hiển thị dialog xác nhận với ô nhập lý do
- Sau khi hủy:
  - Hóa đơn chuyển sang trạng thái `da_huy`
  - Biến mất khỏi danh sách chưa thu
  - Ghi log lịch sử hủy

## 3. Functional Requirements

### 3.1 Routing
- **Route mới**: `/unpaid-invoices`
- **Menu**: Thêm mục "Hóa đơn chưa thu" vào sidebar, icon 💰
- **Permission**: Chỉ role `admin`, `y_ta` (loại `hanhchinh`) được truy cập
- **URL**: Hỗ trợ query params cho filter: `?search=&type=&from=&to=&minAmount=&maxAmount=&daysOverdue=`

### 3.2 API Integration
Sử dụng API đã có trong `src/api/billing.js`:
- `searchInvoices({ TrangThai: "chua_thu", ... })` - Lấy danh sách
- `confirmInvoice(maHoaDon, payload)` - Thu tiền
- `cancelInvoice(maHoaDon, payload)` - Hủy hóa đơn
- `getInvoice(maHoaDon)` - Xem chi tiết

### 3.3 Component Structure
```
routes/
  UnpaidInvoices.jsx          # Route chính

components/billing/
  UnpaidInvoicesTable.jsx     # Bảng danh sách
  UnpaidInvoiceFilters.jsx    # Bộ lọc
  UnpaidInvoiceStats.jsx      # Thống kê KPI
  UnpaidInvoiceDetail.jsx     # Modal chi tiết
  PaymentWizard.jsx           # Đã có - tái sử dụng
```

### 3.4 State Management
- Sử dụng React Query (`useSearchInvoices`) để fetch và cache
- Local state cho filters, pagination, selected invoice
- Optimistic updates khi thu tiền/hủy

### 3.5 UI/UX Requirements
- **Responsive**: Hoạt động tốt trên tablet (iPad)
- **Loading states**: Skeleton loading khi fetch data
- **Empty states**: Hiển thị thông báo khi không có hóa đơn chưa thu
- **Error handling**: Toast thông báo lỗi rõ ràng
- **Accessibility**: Keyboard navigation, ARIA labels

## 4. Non-Functional Requirements

### 4.1 Performance
- Trang load trong < 2 giây
- Tìm kiếm debounce 300ms
- Pagination để tránh load quá nhiều dữ liệu

### 4.2 Security
- Kiểm tra permission trước khi render route
- Validate role trước khi cho phép hủy hóa đơn
- Log mọi thao tác thu tiền/hủy

### 4.3 Usability
- Giao diện nhất quán với các trang khác
- Sử dụng design system hiện có (Tailwind, Framer Motion)
- Ngôn ngữ: Tiếng Việt

## 5. Out of Scope (Không làm trong phase này)

- ❌ Gửi SMS/Email nhắc nợ tự động
- ❌ Tính lãi suất chậm trả
- ❌ In hóa đơn công nợ
- ❌ Export Excel danh sách công nợ
- ❌ Tích hợp với hệ thống kế toán bên ngoài
- ❌ Thanh toán một phần (partial payment)
- ❌ Ghi chú/comment trên hóa đơn

## 6. Dependencies

### 6.1 Backend APIs
- ✅ `POST /api/billing/invoices/search` - Đã có
- ✅ `PUT /api/billing/invoices/{id}/confirm` - Đã có
- ✅ `PUT /api/billing/invoices/{id}/cancel` - Đã có
- ✅ `GET /api/billing/invoices/{id}` - Đã có

### 6.2 Frontend Components
- ✅ `PaymentWizard.jsx` - Đã có, cần điều chỉnh nhỏ
- ✅ `Button.jsx`, `Chip.jsx`, `Modal.jsx` - Đã có
- ✅ `useAuthStore` - Đã có
- ✅ `permissions.js` - Đã có

### 6.3 Libraries
- ✅ React Query - Đã cài
- ✅ Framer Motion - Đã cài
- ✅ React Router - Đã cài
- ⚠️ Chart library (nếu cần biểu đồ) - Cần cài thêm (recharts hoặc chart.js)

## 7. Success Metrics

- Nhân viên có thể tìm và thu tiền cho hóa đơn chưa thu trong < 30 giây
- Giảm 80% thời gian so với cách cũ (vào từng hồ sơ bệnh nhân)
- 100% hóa đơn chưa thu được hiển thị và quản lý tập trung
- Không có lỗi khi thu tiền hoặc hủy hóa đơn

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API search chậm khi có nhiều hóa đơn | High | Implement pagination, indexing ở DB |
| Conflict khi 2 người thu cùng 1 hóa đơn | Medium | Optimistic locking, refresh sau khi thu |
| Permission không đúng | High | Double-check permission ở cả FE và BE |
| PaymentWizard không tương thích | Medium | Test kỹ integration, có fallback UI |

## 9. Timeline Estimate

- **Design & Planning**: ✅ Hoàn thành
- **Implementation**: ✅ Hoàn thành
  - Route + Table: ✅ Hoàn thành
  - Filters + Stats: ✅ Hoàn thành
  - Detail Modal: ✅ Hoàn thành
  - Integration với PaymentWizard: ✅ Hoàn thành
  - Menu + Routing: ✅ Hoàn thành
- **Total**: ✅ Đã implement đầy đủ

## 10. Files Created/Modified

### ✅ Files Created:
1. `my-patients/src/routes/UnpaidInvoices.jsx` - Route chính
2. `my-patients/src/components/billing/UnpaidInvoiceStats.jsx` - KPI Cards
3. `my-patients/src/components/billing/UnpaidInvoiceFilters.jsx` - Bộ lọc
4. `my-patients/src/components/billing/UnpaidInvoicesTable.jsx` - Bảng danh sách
5. `my-patients/src/components/billing/UnpaidInvoiceDetailModal.jsx` - Modal chi tiết

### ✅ Files Modified:
1. `my-patients/src/main.jsx` - Thêm route `/unpaid-invoices`
2. `my-patients/src/components/ui/Sidebar.jsx` - Thêm menu item + icon
3. `my-patients/src/utils/permissions.js` - Thêm permission check
4. `my-patients/src/context/UIContext.jsx` - Thêm translations (VI/EN)

## 11. How to Use

1. **Truy cập**: Vào menu sidebar → Click "💰 Hóa đơn chưa thu"
2. **Xem danh sách**: Tất cả hóa đơn chưa thu hiển thị với highlight màu theo độ ưu tiên
3. **Tìm kiếm**: Dùng ô search hoặc bộ lọc để tìm hóa đơn cụ thể
4. **Thu tiền**: Click nút "💳 Thu" → Mở PaymentWizard → Chọn phương thức → Xác nhận
5. **Xem chi tiết**: Click nút "👁️" → Xem thông tin đầy đủ → Thu tiền từ modal

## 12. Next Steps (Optional - Không làm trong phase này)

- ❌ Gửi SMS/Email nhắc nợ tự động
- ❌ Tính lãi suất chậm trả
- ❌ In hóa đơn công nợ
- ❌ Export Excel danh sách công nợ
- ❌ Tích hợp với hệ thống kế toán bên ngoài
- ❌ Thanh toán một phần (partial payment)
- ❌ Ghi chú/comment trên hóa đơn

## 10. References

- Existing code:
  - `my-patients/src/components/billing/PaymentWizard.jsx`
  - `my-patients/src/api/billing.js`
  - `my-patients/src/components/patients/PatientTransactions.jsx`
  - `my-patients/src/components/history/HistoryTable.jsx`
- Backend API: `HealthCare/Services/MedicationBilling/BillingService.cs`
- Enums: `my-patients/src/constants/enums.js`
