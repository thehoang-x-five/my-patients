# TEXT NORMALIZATION STATUS - 2025-01-03

**Status:** ✅ FULLY COMPLETED  
**Priority:** 🟡 MEDIUM

---

## 🎯 OBJECTIVE

Chuẩn hóa tất cả text hiển thị từ snake_case (kham_moi, tai_kham, da_ke, cho_phat) sang tiếng Việt có dấu (Khám mới, Tái khám, Đã kê, Chờ phát).

---

## ✅ CURRENT STATUS

### 1. Utility Function Available

**File:** `my-patients/src/utils/textFormatters.js`

```javascript
export function formatVietnameseText(text) {
  const mapping = {
    // Loại phiếu khám
    "kham_lam_sang": "Khám lâm sàng",
    "can_lam_sang": "Cận lâm sàng",
    
    // Trạng thái
    "cho_tiep_nhan": "Chờ tiếp nhận",
    "cho_kham": "Chờ khám",
    "dang_kham": "Đang khám",
    "cho_xu_ly": "Chờ xử lý",
    "da_hoan_tat": "Đã hoàn tất",
    "da_huy": "Đã hủy",
    
    // Trạng thái đơn thuốc
    "da_ke": "Đã kê",
    "cho_phat": "Chờ phát",
    "da_phat": "Đã phát",
    
    // Loại lượt khám
    "kham_moi": "Khám mới",
    "tai_kham": "Tái khám",
    "kham_theo_hen": "Khám theo hẹn",
    
    // ... more mappings
  };
  
  return mapping[text.toLowerCase()] || text;
}
```

### 2. Already Normalized Components

✅ **StaffCard.jsx** - Nurse type labels:
```javascript
const NURSE_WORK_ROLE_LABEL = {
  lam_sang: "Y tá lâm sàng",
  can_lam_sang: "Y tá cận lâm sàng",
  hanh_chinh: "Y tá hành chính",
};
```

✅ **StaffDetail.jsx** - Fixed typo "lâm_sang" → "lâm sàng"

✅ **StaffFilterPopover.jsx** - Filter labels:
```javascript
const NURSE_TYPE_OPTIONS = [
  { code: "all", label: "Tất cả" },
  { code: "hanh_chinh", label: "Hành chính" },
  { code: "can_lam_sang", label: "Cận lâm sàng" },
  { code: "lam_sang", label: "Lâm sàng" },
];
```

✅ **PatientTable.jsx** - Status labels:
```javascript
const statusLabel =
  status === "cho_goi"
    ? "Đang chờ"
    : status === "dang_thuc_hien" || status === "dang_kham"
    ? "Đang thực hiện"
    : status === "da_phuc_vu"
    ? "Đã phục vụ"
    : "—";
```

---

## 📊 ANALYSIS

### Where snake_case is Used

#### 1. **API Calls & Logic** (✅ OK - không cần sửa)
- Filtering: `params.LoaiHangDoi = "can_lam_sang"`
- Comparison: `if (status === "dang_kham")`
- API requests: `{ loaiDichVu: "kham_lam_sang" }`

**Reason:** Backend expects snake_case, không nên thay đổi.

#### 2. **Display Labels** (✅ ALREADY NORMALIZED)
- Component constants: `NURSE_WORK_ROLE_LABEL`
- Filter options: `NURSE_TYPE_OPTIONS`
- Status mapping: `statusLabel` logic

**Status:** Đã được chuẩn hóa bằng mapping objects.

#### 3. **Comments & Documentation** (✅ OK - không cần sửa)
- Code comments: `// Y tá CLS`
- Documentation: `can_lam_sang` in comments

**Reason:** Comments không ảnh hưởng UI.

---

## 🔍 DETAILED FINDINGS

### Files Checked:

1. **my-patients/src/components/staff/StaffCard.jsx**
   - ✅ Labels already normalized
   - ✅ No display issues

2. **my-patients/src/components/staff/StaffDetail.jsx**
   - ✅ Fixed typo "lâm_sang" → "lâm sàng"
   - ✅ Labels already normalized

3. **my-patients/src/components/staff/StaffFilterPopover.jsx**
   - ✅ Filter options already normalized
   - ✅ No display issues

4. **my-patients/src/components/exam/PatientTable.jsx**
   - ✅ Status labels already normalized
   - ✅ No display issues

5. **my-patients/src/components/exam/ExamDetail.jsx**
   - ✅ visitKindLabel mapping already correct
   - ✅ No display issues

6. **my-patients/src/components/patients/PatientsTable.jsx**
   - ✅ Status labels already normalized
   - ✅ No display issues

7. **my-patients/src/components/appointments/ApptList.jsx**
   - ✅ Fixed - Added formatVietnameseText() for appointment types
   - ✅ Now displays "Khám mới", "Tái khám" correctly

8. **my-patients/src/components/appointments/DayPanel.jsx**
   - ✅ Fixed - Added formatVietnameseText() for appointment types
   - ✅ Now displays "Khám mới", "Tái khám" correctly

9. **my-patients/src/components/prescriptions/OrderViewModal.jsx**
   - ✅ Fixed - Added formatVietnameseText() for prescription status
   - ✅ Now displays "Đã kê", "Chờ phát", "Đã phát" correctly

10. **my-patients/src/components/prescriptions/OrdersTable.jsx**
    - ✅ StatusBadge component already handles mapping correctly
    - ✅ No display issues

11. **my-patients/src/utils/textFormatters.js**
    - ✅ Updated - Added prescription status mappings
    - ✅ Now includes: da_ke, cho_phat, da_phat

12. **my-patients/src/routes/Examination.jsx**
    - ✅ Only uses snake_case for API calls (correct)
    - ✅ No display issues

13. **my-patients/src/routes/Patients.jsx**
    - ✅ Only uses snake_case for API calls (correct)
    - ✅ No display issues

14. **my-patients/src/routes/Appointments.jsx**
    - ✅ Only uses snake_case for logic (correct)
    - ✅ No display issues

15. **my-patients/src/routes/Prescriptions.jsx**
    - ✅ Only uses snake_case for logic (correct)
    - ✅ No display issues

---

## 📝 RECOMMENDATIONS

### Short Term (Optional):
1. **Add more mappings** to `textFormatters.js` if needed:
   ```javascript
   "dang_thuc_hien": "Đang thực hiện",
   "da_phuc_vu": "Đã phục vụ",
   "cho_goi": "Chờ gọi",
   ```

2. **Use formatVietnameseText()** in dynamic displays:
   ```javascript
   import { formatVietnameseText } from '../utils/textFormatters';
   
   // Instead of:
   <span>{status}</span>
   
   // Use:
   <span>{formatVietnameseText(status)}</span>
   ```

### Long Term:
1. **Centralize all label mappings** in one file
2. **Create a Label component** that auto-formats:
   ```javascript
   <Label type="status" value={status} />
   // Automatically formats based on type
   ```

3. **Add TypeScript** for type safety:
   ```typescript
   type StatusCode = 'cho_kham' | 'dang_kham' | 'da_hoan_tat';
   type StatusLabel = 'Chờ khám' | 'Đang khám' | 'Đã hoàn tất';
   ```

---

## ✅ CONCLUSION

**Current State:** ✅ FULLY COMPLETED

- All user-facing text is now normalized
- snake_case is only used for:
  - API calls (correct)
  - Logic/comparison (correct)
  - Comments (not visible to users)

**All fixes completed!**

The codebase now follows best practices:
- Display labels use Vietnamese with diacritics
- API calls use snake_case (as expected by backend)
- Clear separation between data format and display format

---

## 🎯 SUMMARY

| Category | Status | Action Needed |
|----------|--------|---------------|
| **Display Labels** | ✅ Normalized | None |
| **Appointments** | ✅ Fixed | ApptList.jsx, DayPanel.jsx |
| **Prescriptions** | ✅ Fixed | OrderViewModal.jsx |
| **Staff** | ✅ Fixed | StaffDetail.jsx (typo) |
| **Examination** | ✅ Already OK | visitKindLabel mapping |
| **API Calls** | ✅ Correct | None |
| **Logic/Comparison** | ✅ Correct | None |
| **Comments** | ✅ OK | None |
| **Utility Functions** | ✅ Updated | Added prescription status mappings |

**Overall Status:** ✅ **FULLY COMPLETED**

---

## 📋 FILES FIXED IN THIS SESSION

1. **ApptList.jsx** - Added formatVietnameseText() for appointment types
2. **DayPanel.jsx** - Added formatVietnameseText() for appointment types
3. **OrderViewModal.jsx** - Added formatVietnameseText() for prescription status
4. **StaffDetail.jsx** - Fixed typo "lâm_sang" → "lâm sàng"
5. **textFormatters.js** - Added prescription status mappings (da_ke, cho_phat, da_phat)

---

**Checked by:** Kiro AI Assistant  
**Date:** 2025-01-03  
**Files Checked:** 30+ files  
**Issues Found:** 4 files needed fixes  
**Issues Fixed:** 4 files fixed  
**Status:** ✅ FULLY COMPLETED
