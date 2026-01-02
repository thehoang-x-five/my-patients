# 🔧 Fix: Hàng chờ lấy thiếu data - Vấn đề timezone

## ❌ Vấn đề

1. **Lấy thiếu data**: Hàng chờ trang khám bệnh không hiển thị đầy đủ dữ liệu trong database
2. **Thời gian không đúng**: Đặt lịch hẹn 8h PM (20:00) hôm nay nhưng không lấy được

## 🔍 Nguyên nhân

### Backend (QueueService.cs)
```csharp
// Lưu thời gian check-in
var now = DateTime.Now; // Local time (UTC+7 for Vietnam)
entity.ThoiGianCheckin = now;

// Filter theo thời gian
if (filter.FromTime.HasValue)
    query = query.Where(h => h.ThoiGianCheckin >= filter.FromTime.Value);

if (filter.ToTime.HasValue)
    query = query.Where(h => h.ThoiGianCheckin <= filter.ToTime.Value);
```

**Backend lưu và so sánh:** Local time (UTC+7)

### Frontend (Examination.jsx) - TRƯỚC KHI FIX
```javascript
// Date range: hôm nay
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
params.FromTime = startOfToday.toISOString(); // ❌ Convert to UTC!
params.ToTime = endOfToday.toISOString();     // ❌ Convert to UTC!
```

**Frontend gửi:** UTC time (sau khi `.toISOString()`)

### Vấn đề timezone mismatch

**Ví dụ:** Múi giờ Vietnam (UTC+7), hôm nay là 2/1/2026

1. **Frontend tạo:**
   - `startOfToday` = 2/1/2026 00:00:00 (local)
   - `endOfToday` = 2/1/2026 23:59:59 (local)

2. **Frontend gửi (sau `.toISOString()`):**
   - `FromTime` = "2026-01-01T17:00:00.000Z" (UTC) = 1/1/2026 17:00 UTC
   - `ToTime` = "2026-01-02T16:59:59.999Z" (UTC) = 2/1/2026 16:59 UTC

3. **Backend nhận và so sánh:**
   - Database có: `ThoiGianCheckin` = 2/1/2026 20:00:00 (local)
   - Backend so sánh: `2/1/2026 20:00:00` với `1/1/2026 17:00:00` (UTC string)
   - ❌ **Mismatch!** Backend coi UTC string như local time

4. **Kết quả:**
   - Nếu check-in lúc 20:00 (8 PM) hôm nay
   - Backend so sánh: `20:00 >= 17:00` ✅ (nhưng sai ngày!)
   - Hoặc: `20:00 <= 16:59` ❌ (bị filter out!)

## ✅ Giải pháp

### Frontend: Gửi local time string (không convert UTC)

```javascript
// Date range: hôm nay (local time, không convert UTC)
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);

// ✅ Format local time as ISO string without timezone conversion
// Backend expects local time (DateTime.Now), not UTC
const formatLocalDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

params.FromTime = formatLocalDateTime(startOfToday);
params.ToTime = formatLocalDateTime(endOfToday);
```

**Bây giờ gửi:**
- `FromTime` = "2026-01-02T00:00:00" (local, không có Z)
- `ToTime` = "2026-01-02T23:59:59" (local, không có Z)

**Backend nhận:**
- Parse string thành DateTime (coi như local time)
- So sánh: `2/1/2026 20:00:00` với `2/1/2026 00:00:00` ✅
- So sánh: `2/1/2026 20:00:00` với `2/1/2026 23:59:59` ✅

## 🧪 Testing

### Test Case 1: Lịch hẹn 8h PM hôm nay
```
Thời gian hiện tại: 2/1/2026 15:00 (3 PM)
Lịch hẹn: 2/1/2026 20:00 (8 PM)
ThoiGianCheckin: 2/1/2026 20:00 (khi check-in)

Filter:
- FromTime: "2026-01-02T00:00:00"
- ToTime: "2026-01-02T23:59:59"

Result: ✅ Lấy được (20:00 nằm trong khoảng 00:00 - 23:59)
```

### Test Case 2: Check-in sáng sớm
```
ThoiGianCheckin: 2/1/2026 07:00 (7 AM)

Filter:
- FromTime: "2026-01-02T00:00:00"
- ToTime: "2026-01-02T23:59:59"

Result: ✅ Lấy được (07:00 nằm trong khoảng 00:00 - 23:59)
```

### Test Case 3: Check-in đêm khuya
```
ThoiGianCheckin: 2/1/2026 23:30 (11:30 PM)

Filter:
- FromTime: "2026-01-02T00:00:00"
- ToTime: "2026-01-02T23:59:59"

Result: ✅ Lấy được (23:30 nằm trong khoảng 00:00 - 23:59)
```

## 📝 Files Changed

1. **my-patients/src/routes/Examination.jsx**
   - Thay `.toISOString()` bằng `formatLocalDateTime()`
   - Gửi local time string thay vì UTC

## 🎯 Lợi ích

1. **Đúng timezone**: Frontend và backend đều dùng local time
2. **Lấy đủ data**: Không bị filter out do timezone mismatch
3. **Thời gian chính xác**: 8 PM hôm nay sẽ lấy được đúng

## ⚠️ Lưu ý

**Nếu backend muốn dùng UTC:**
- Phải đổi tất cả `DateTime.Now` → `DateTime.UtcNow`
- Phải đổi database column type sang `datetime(6)` với UTC
- Phải update tất cả data hiện có

**Hiện tại:** Giữ nguyên backend dùng local time, frontend cũng gửi local time → Đơn giản và nhất quán!

## 🚀 Next Steps

**Không cần làm gì thêm!** Fix này đã giải quyết vấn đề timezone mismatch.

**Optional (nếu muốn chuẩn hóa):**
- Có thể migrate toàn bộ hệ thống sang UTC (backend + database)
- Nhưng cần test kỹ và update tất cả code liên quan đến DateTime
