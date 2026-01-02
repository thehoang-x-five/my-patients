# ✅ Thêm phân trang cho trang Khám bệnh

## 🎯 Vấn đề

Database có 54 records nhưng FE chỉ hiển thị 50 → bị giới hạn bởi pagination backend (PageSize = 50).

```sql
SELECT count(*) FROM healthcaredb.hang_doi WHERE Date(ThoiGianCheckin)="2026-01-02";
-- Result: 54 records

-- Nhưng FE chỉ hiển thị 50 records
```

## 🔍 Nguyên nhân

1. **Backend đã có pagination:**
   - `QueueService.cs` trả về `PagedResult<QueueItemDto>`
   - Default: `PageSize = 50`
   - Trang 1: items 1-50
   - Trang 2: items 51-54

2. **Frontend đã có state:**
   - `const [page, setPage] = useState(1);`
   - `const totalPages = Math.ceil(totalItems / 50);`
   - Nhưng **CHƯA CÓ UI** để chuyển trang

3. **Các trang khác đã có:**
   - `History.jsx` ✅ Có Pagination UI
   - `Patients.jsx` ✅ Có Pagination UI
   - `Examination.jsx` ❌ Chưa có Pagination UI

## ✅ Giải pháp

### 1. Import Pagination component

```jsx
import Pagination from "../components/ui/Pagination.jsx";
```

### 2. Thêm Pagination UI vào render

**Trước:**
```jsx
<motion.div
  key="table"
  className="h-full min-h-0"
>
  <PatientTable
    items={filtered}
    onStart={canCall ? handleStart : undefined}
    inProgress={inProgress}
    stretch
  />
</motion.div>
```

**Sau:**
```jsx
<motion.div
  key="table"
  className="h-full min-h-0 flex flex-col"
>
  <div className="flex-1 min-h-0 overflow-auto">
    <PatientTable
      items={filtered}
      onStart={canCall ? handleStart : undefined}
      inProgress={inProgress}
      stretch
    />
  </div>
  
  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-lg mt-2 pt-2">
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={50}
        onPageChange={setPage}
        className="px-3 pb-2"
      />
    </div>
  )}
</motion.div>
```

### 3. Logic đã có sẵn

```jsx
// ✅ State
const [page, setPage] = useState(1);

// ✅ Tính toán
const totalItems = queueData.TotalItems || queueData.totalItems || 0;
const totalPages = Math.ceil(totalItems / 50);

// ✅ Gửi lên backend
const queueFilterParams = useMemo(() => {
  const params = {
    Page: page,
    PageSize: 50,
    // ... other filters
  };
  return params;
}, [filter, page]);

// ✅ Reset page khi filter thay đổi
useEffect(() => {
  if (page > 1) setPage(1);
}, [filter.source, filter.status, filter.kind, filter.search]);
```

## 🎨 UI Features

### Pagination Component (`src/components/ui/Pagination.jsx`)

**Features:**
1. ✅ Hiển thị số trang với ellipsis (1 ... 5 6 7 ... 10)
2. ✅ Nút "← Trước" và "Sau →"
3. ✅ Highlight trang hiện tại
4. ✅ Disable nút khi ở trang đầu/cuối
5. ✅ Hiển thị thông tin: "Hiển thị 1 - 50 trong tổng số 54 kết quả"
6. ✅ Tự động ẩn nếu chỉ có 1 trang

**Props:**
- `currentPage`: Trang hiện tại (1-based)
- `totalPages`: Tổng số trang
- `totalItems`: Tổng số items
- `pageSize`: Số items mỗi trang
- `onPageChange`: Callback khi đổi trang
- `className`: CSS class bổ sung

## 🧪 Testing

### Test Case 1: Hiển thị pagination khi > 50 items
```
Database: 54 records
PageSize: 50
TotalPages: 2

Expected:
- Trang 1: Hiển thị 50 items + pagination UI
- Pagination: "Hiển thị 1 - 50 trong tổng số 54 kết quả"
- Nút "Sau →" enabled
```

### Test Case 2: Chuyển sang trang 2
```
Click "Sau →" hoặc click số "2"

Expected:
- Trang 2: Hiển thị 4 items (51-54)
- Pagination: "Hiển thị 51 - 54 trong tổng số 54 kết quả"
- Nút "← Trước" enabled
- Nút "Sau →" disabled
```

### Test Case 3: Ẩn pagination khi <= 50 items
```
Database: 30 records
PageSize: 50
TotalPages: 1

Expected:
- Hiển thị 30 items
- KHÔNG hiển thị pagination UI (totalPages <= 1)
```

### Test Case 4: Reset page khi filter thay đổi
```
Đang ở trang 2
User thay đổi filter (source, status, kind, search)

Expected:
- Tự động quay về trang 1
- Fetch data mới với page = 1
```

## 📝 Files Changed

1. **my-patients/src/routes/Examination.jsx**
   - Import `Pagination` component
   - Thêm Pagination UI vào render
   - Wrap PatientTable trong flex container để pagination nằm dưới

## 🎯 Kết quả

**Trước:**
- Database: 54 records
- FE hiển thị: 50 records
- Không có cách xem 4 records còn lại

**Sau:**
- Database: 54 records
- FE hiển thị: 50 records (trang 1) + Pagination UI
- Click "Sau →" → Hiển thị 4 records còn lại (trang 2)
- Tổng: Xem được đầy đủ 54 records

## 🚀 Tương thích

**Các trang đã có pagination:**
- ✅ `History.jsx` - Có pagination cho visits và transactions
- ✅ `Patients.jsx` - Có pagination cho danh sách bệnh nhân
- ✅ `Examination.jsx` - **MỚI THÊM** - Có pagination cho hàng chờ khám

**UI nhất quán:**
- Tất cả đều dùng `Pagination` component
- Cùng style và behavior
- Cùng logic reset page khi filter thay đổi

## 💡 Lưu ý

1. **PageSize = 50**: Có thể thay đổi nếu cần (ví dụ: 20, 100)
2. **Auto-scroll**: Khi chuyển trang, có thể cần scroll lên đầu table
3. **Loading state**: Khi fetch trang mới, có thể thêm loading indicator
4. **URL sync**: Có thể sync page với URL query params (optional)

## 🎉 Hoàn thành

Trang Khám bệnh giờ đã có phân trang đầy đủ, người dùng có thể xem tất cả records trong database!
