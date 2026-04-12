// src/constants/enums.js
// Tất cả enum constants dùng chung giữa FE và BE — không hardcode string ở component.
// Giá trị phải khớp 100% với BE snake_case convention.

// ==================== VAI TRÒ & PHÂN QUYỀN ====================

export const VAI_TRO = {
  ADMIN: 'admin',
  BAC_SI: 'bac_si',
  Y_TA: 'y_ta',
  KY_THUAT_VIEN: 'ky_thuat_vien',
};

export const LOAI_Y_TA = {
  HANH_CHINH: 'hanhchinh',
  LAM_SANG: 'ls',
  CAN_LAM_SANG: 'cls',
};

export const VAI_TRO_LABEL = {
  [VAI_TRO.ADMIN]: 'Quản trị viên',
  [VAI_TRO.BAC_SI]: 'Bác sĩ',
  [VAI_TRO.Y_TA]: 'Y tá',
  [VAI_TRO.KY_THUAT_VIEN]: 'Kỹ thuật viên',
};

export const LOAI_Y_TA_LABEL = {
  [LOAI_Y_TA.HANH_CHINH]: 'Y tá hành chính',
  [LOAI_Y_TA.LAM_SANG]: 'Y tá lâm sàng',
  [LOAI_Y_TA.CAN_LAM_SANG]: 'Y tá CLS',
};

// ==================== TRẠNG THÁI LỊCH HẸN ====================

export const TRANG_THAI_LICH_HEN = {
  DANG_CHO: 'dang_cho',
  DA_XAC_NHAN: 'da_xac_nhan',
  DA_CHECKIN: 'da_checkin',
  DA_HUY: 'da_huy',
};

export const TRANG_THAI_LICH_HEN_LABEL = {
  [TRANG_THAI_LICH_HEN.DANG_CHO]: 'Đang chờ',
  [TRANG_THAI_LICH_HEN.DA_XAC_NHAN]: 'Đã xác nhận',
  [TRANG_THAI_LICH_HEN.DA_CHECKIN]: 'Đã check-in',
  [TRANG_THAI_LICH_HEN.DA_HUY]: 'Đã hủy',
};

// ==================== TRẠNG THÁI BỆNH NHÂN (HÔM NAY) ====================

export const TRANG_THAI_BN = {
  CHO_TIEP_NHAN: 'cho_tiep_nhan',
  CHO_KHAM: 'cho_kham',
  DANG_KHAM: 'dang_kham',
  CHO_KQ_CLS: 'cho_kq_cls',
  CHO_KE_DON: 'cho_ke_don',
  HOAN_TAT: 'hoan_tat',
  DA_HUY: 'da_huy',
};

export const TRANG_THAI_BN_LABEL = {
  [TRANG_THAI_BN.CHO_TIEP_NHAN]: 'Chờ tiếp nhận',
  [TRANG_THAI_BN.CHO_KHAM]: 'Chờ khám',
  [TRANG_THAI_BN.DANG_KHAM]: 'Đang khám',
  [TRANG_THAI_BN.CHO_KQ_CLS]: 'Chờ KQ CLS',
  [TRANG_THAI_BN.CHO_KE_DON]: 'Chờ kê đơn',
  [TRANG_THAI_BN.HOAN_TAT]: 'Hoàn tất',
  [TRANG_THAI_BN.DA_HUY]: 'Đã hủy',
};

// ==================== HÀNG ĐỢI ====================

export const TRANG_THAI_HANG_DOI = {
  DANG_CHO: 'dang_cho',
  DANG_KHAM: 'dang_kham',
  HOAN_TAT: 'hoan_tat',
};

export const LOAI_HANG_DOI = {
  KHAM_LS: 'kham_lam_sang',
  KHAM_CLS: 'kham_can_lam_sang',
};

// ==================== PHIẾU KHÁM LÂM SÀNG ====================

export const TRANG_THAI_PHIEU_KHAM = {
  DANG_KHAM: 'dang_kham',
  CHO_KQ: 'cho_ket_qua',
  HOAN_TAT: 'hoan_tat',
  DA_HUY: 'da_huy',
};

// ==================== PHIẾU CẬN LÂM SÀNG ====================

export const TRANG_THAI_CLS = {
  CHO_THUC_HIEN: 'cho_thuc_hien',
  DANG_THUC_HIEN: 'dang_thuc_hien',
  DA_CO_KET_QUA: 'da_co_ket_qua',
  DA_HUY: 'da_huy',
};

export const LOAI_CLS = {
  XET_NGHIEM: 'xet_nghiem',
  CHAN_DOAN_HINH_ANH: 'chan_doan_hinh_anh',
  THAM_DO_CHUC_NANG: 'tham_do_chuc_nang',
};

// ==================== ĐƠN THUỐC ====================

export const TRANG_THAI_DON_THUOC = {
  DA_KE: 'da_ke',
  CHO_PHAT: 'cho_phat',
  DA_PHAT: 'da_phat',
  DA_HUY: 'da_huy',
};

export const TRANG_THAI_DON_THUOC_LABEL = {
  [TRANG_THAI_DON_THUOC.DA_KE]: 'Đã kê',
  [TRANG_THAI_DON_THUOC.CHO_PHAT]: 'Chờ phát',
  [TRANG_THAI_DON_THUOC.DA_PHAT]: 'Đã phát',
  [TRANG_THAI_DON_THUOC.DA_HUY]: 'Đã hủy',
};

// ==================== HÓA ĐƠN ====================

export const TRANG_THAI_HOA_DON = {
  CHUA_THU: 'chua_thu',
  DA_THU: 'da_thu',
  DA_HUY: 'da_huy',
  BAO_LUU: 'bao_luu',
};

export const TRANG_THAI_HOA_DON_LABEL = {
  [TRANG_THAI_HOA_DON.CHUA_THU]: 'Chưa thu',
  [TRANG_THAI_HOA_DON.DA_THU]: 'Đã thu',
  [TRANG_THAI_HOA_DON.DA_HUY]: 'Đã hủy',
  [TRANG_THAI_HOA_DON.BAO_LUU]: 'Bảo lưu',
};

export const PHUONG_THUC_THANH_TOAN = {
  TIEN_MAT: 'tien_mat',
  THE: 'the',
  CHUYEN_KHOAN: 'chuyen_khoan',
  VIETQR: 'vietqr',
};

export const PHUONG_THUC_THANH_TOAN_LABEL = {
  [PHUONG_THUC_THANH_TOAN.TIEN_MAT]: 'Tiền mặt',
  [PHUONG_THUC_THANH_TOAN.THE]: 'Thẻ',
  [PHUONG_THUC_THANH_TOAN.CHUYEN_KHOAN]: 'Chuyển khoản',
  [PHUONG_THUC_THANH_TOAN.VIETQR]: 'VietQR',
};

// ==================== TRẠNG THÁI TÀI KHOẢN ====================

export const TRANG_THAI_TAI_KHOAN = {
  HOAT_DONG: 'hoat_dong',
  TAM_KHOA: 'tam_khoa',
  VO_HIEU_HOA: 'vo_hieu_hoa',
};

export const TRANG_THAI_TAI_KHOAN_LABEL = {
  [TRANG_THAI_TAI_KHOAN.HOAT_DONG]: 'Hoạt động',
  [TRANG_THAI_TAI_KHOAN.TAM_KHOA]: 'Tạm khóa',
  [TRANG_THAI_TAI_KHOAN.VO_HIEU_HOA]: 'Vô hiệu hóa',
};

// ==================== LOẠI THÔNG BÁO ====================

export const LOAI_THONG_BAO = {
  LICH_HEN_MOI: 'lich_hen_moi',
  BN_CHECKIN: 'bn_checkin',
  PHIEU_CLS_MOI: 'phieu_cls_moi',
  KET_QUA_CLS: 'ket_qua_cls',
  DON_THUOC_MOI: 'don_thuoc_moi',
  HOA_DON_MOI: 'hoa_don_moi',
  HE_THONG: 'he_thong',
};
