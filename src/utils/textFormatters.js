// Utility functions for formatting text

/**
 * Map snake_case to Vietnamese text with diacritics
 * @param {string} text - Text in snake_case format
 * @returns {string} - Formatted Vietnamese text
 */
export function formatVietnameseText(text) {
  if (!text) return "";
  
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
    "da_lap": "Đã lập",
    "da_lap_chan_doan": "Đã lập chẩn đoán",
    "dang_thuc_hien": "Đang thực hiện",
    
    // Trạng thái đơn thuốc
    "da_ke": "Đã kê",
    "cho_phat": "Chờ phát",
    "da_phat": "Đã phát",
    
    // Hướng xử trí
    "cho_ve": "Cho về",
    "cho_thuoc_ve": "Cho thuốc về",
    "tai_kham": "Tái khám",
    
    // Loại hàng đợi
    "kham_benh": "Khám bệnh",
    "dich_vu": "Dịch vụ",
    
    // Loại lượt khám
    "kham_moi": "Khám mới",
    "tai_kham": "Tái khám",
    "kham_theo_hen": "Khám theo hẹn",
    
    // Trạng thái tài khoản
    "hoat_dong": "Hoạt động",
    "khong_hoat_dong": "Không hoạt động",
    "da_xoa": "Đã xóa",
  };
  
  const lowerText = String(text).toLowerCase().trim();
  
  // Check exact match first
  if (mapping[lowerText]) {
    return mapping[lowerText];
  }
  
  // If no exact match, try to capitalize each word
  return text
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format service type text
 * @param {string} serviceType - Service type code
 * @returns {string} - Formatted service type
 */
export function formatServiceType(serviceType) {
  return formatVietnameseText(serviceType);
}

/**
 * Format status text
 * @param {string} status - Status code
 * @returns {string} - Formatted status
 */
export function formatStatus(status) {
  return formatVietnameseText(status);
}
