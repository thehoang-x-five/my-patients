// src/api/examination.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";

/**
 * Lưu ý:
 * - VITE_API_BASE = https://localhost:7146/api
 *   => http đã baseURL = "/api"
 *   => Tất cả route bên dưới KHÔNG thêm /api lần nữa.
 *
 * Map theo API Doc:
 * - ClinicalController: base /clinical
 * - ClsController:      base /cls
 * - MasterData:         base /master-data
 */

const CLINICAL_BASE = "/clinical";
const CLS_BASE = "/cls";
const MASTER_BASE = "/master-data";
export const EXTRA_FIELDS = [
  { key: "di_ung", label: "Dị ứng" },
  { key: "chong_chi_dinh", label: "Chống chỉ định" },
  { key: "thuoc_dang_dung", label: "Thuốc đang dùng" },
  { key: "tieu_su_benh", label: "Tiểu sử bệnh" },
  { key: "tien_su_phau_thuat", label: "Tiền sử phẫu thuật" },
  { key: "nhom_mau", label: "Nhóm máu" },
  { key: "benh_man_tinh", label: "Bệnh mạn tính" },
  { key: "sinh_hieu", label: "Sinh hiệu" }
];
/** ===== Helpers chung ===== */

function unwrap(res) {
  return res?.data ?? res;
}

function unwrapArray(res) {
  const data = unwrap(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}




// Tạm thời: chưa có trong API Doc -> trả [] để tránh 404
export async function getExtraFields() {
  return EXTRA_FIELDS;
}


/** ===== CLINICAL EXAM (PHIẾU KHÁM) =====
 * Theo ClinicalController:
 *  - POST /api/clinical                       (TaoPhieuKham)
 *  - GET  /api/clinical/{maPhieuKham}        (LayPhieuKham)
 *  - PUT  /api/clinical/{maPhieuKham}/status (CapNhatTrangThai)
 *  - POST /api/clinical/final-diagnosis      (TaoHoacCapNhatChanDoan)
 *  - GET  /api/clinical/{maPhieuKham}/final-diagnosis
 *  - GET  /api/clinical/search               (Search)
 */
/** ServiceOverviewDto
 *  public record class ServiceOverviewDto
 *  {
 *      public string LoaiDichVu { get; init; }   // kham_lam_sang, can_lam_sang,...
 *      public string MaDV { get; init; }
 *      public string TenDV { get; init; }
 *  }
 */
function normalizeServiceOverview(dto = {}) {
  const loaiDichVu =
    dto.LoaiDichVu || dto.loaiDichVu || dto.loai_dich_vu || "";

  const code =
    dto.MaDV || dto.maDV || dto.ma_dv || dto.MaDichVu || dto.maDichVu || "";

  const name =
    dto.TenDV || dto.tenDV || dto.ten_dv || dto.TenDichVu || dto.tenDichVu || "";

  return {
    _raw: dto,
    id: code,
    code,
    maDichVu: code,
    name,
    tenDichVu: name,
    loaiDichVu,    // kham_lam_sang, can_lam_sang, ...
    type: loaiDichVu,
  };
}




// Tổng quan dịch vụ theo phòng (services/overview)
// Backend: GET /api/master-data/services/overview
//  - [FromQuery] string? maPhong
//  - [FromQuery] string? loaiDichVu
// FE truyền maPhong nếu có, nếu không truyền gì thì BE sẽ dùng loaiDichVu mặc định.
export async function getServicesOverview(params = {}) {
  // Mặc định lấy dịch vụ khám lâm sàng nếu không truyền
  const { maPhong, loaiDichVu = "kham_lam_sang" } = params || {};

  const query = {};
  if (maPhong) query.maPhong = maPhong;
  if (loaiDichVu) query.loaiDichVu = loaiDichVu;

  const res = await http.get(`${MASTER_BASE}/services/overview`, {
    params: query,
  });

  const arr = unwrapArray(res);
  return arr.map(normalizeServiceOverview);
}

// Tạo phiếu khám lâm sàng
export async function createClinicalExam(payload = {}) {
  if (!payload) throw new Error("createClinicalExam: missing payload");

  // Nếu FE đã map đúng ClinicalExamCreateRequest thì forward 1:1
  if (
    payload.MaBenhNhan ||
    payload.MaKhoa ||
    payload.MaPhong ||
    payload.MaBacSiKham
  ) {
    const res = await http.post(CLINICAL_BASE, payload);
    return unwrap(res);
  }

  const {
    pid,
    patientId,
    deptId,
    roomId,
    doctorId,
    createdBy,
    examType,
    symptoms,
    note,
    receptionNote,
    examDate,
    examTime,
    bhyt = {},
    extra = {},
  } = payload;

  const now = new Date();
  const ngayLap =
    examDate || payload.NgayLap || now.toISOString().slice(0, 10);
  const gioLap =
    examTime ||
    payload.GioLap ||
    now.toISOString().slice(11, 19);

  const body = {
    // Bắt buộc
    MaBenhNhan:
      payload.MaBenhNhan ?? payload.maBenhNhan ?? pid ?? patientId ?? null,
    MaKhoa: payload.MaKhoa ?? payload.maKhoa ?? deptId ?? null,
    MaPhong: payload.MaPhong ?? payload.maPhong ?? roomId ?? null,
    MaBacSiKham:
      payload.MaBacSiKham ?? payload.maBacSiKham ?? doctorId ?? null,
    MaNguoiLap:
      payload.MaNguoiLap ?? payload.maNguoiLap ?? createdBy ?? "admin",
    MaDichVuKham:
      payload.MaDichVuKham ?? payload.maDichVuKham ?? payload.serviceId ?? null,

    // Tuỳ chọn / enum
    HinhThucTiepNhan:
      payload.HinhThucTiepNhan ||
      payload.hinhThucTiepNhan ||
      payload.hinhThuc ||
      "tiep_nhan_truc_tiep",
    LoaiPhieuKham:
      payload.LoaiPhieuKham ?? payload.loaiPhieuKham ?? examType ?? null,

    TrieuChung:
      payload.TrieuChung ?? payload.trieuChung ?? symptoms ?? "",
    GhiChu:
      payload.GhiChu ??
      payload.ghiChu ??
      receptionNote ??
      note ??
      "",

    NgayLap: ngayLap,
    GioLap: gioLap,
    MaLichHen:
      payload.MaLichHen ?? payload.maLichHen ?? payload.bookingId ?? null,

    // Thông tin BHYT
    TheBHYT:
      payload.TheBHYT ?? payload.theBHYT ?? bhyt.soThe ?? null,
    NoiDangKyKCB:
      payload.NoiDangKyKCB ??
      payload.noiDangKyKCB ??
      bhyt.coQuan ??
      null,
    ThongTinBHYT:
      payload.ThongTinBHYT ??
      payload.thongTinBHYT ??
      bhyt.thongTin ??
      null,
    GhiChuBHYT:
      payload.GhiChuBHYT ??
      payload.ghiChuBHYT ??
      bhyt.ghiChu ??
      null,

    // Các trường mở rộng (dị ứng, tiền sử...)
    DiUng: payload.DiUng ?? extra.di_ung ?? null,
    ChongChiDinh:
      payload.ChongChiDinh ?? extra.chong_chi_dinh ?? null,
    ThuocDangDung:
      payload.ThuocDangDung ?? extra.thuoc_dang_dung ?? null,
    TieuSuBenh:
      payload.TieuSuBenh ?? extra.tieu_su_benh ?? null,
    TienSuPhauThuat:
      payload.TienSuPhauThuat ?? extra.tien_su_phau_thuat ?? null,
    NhomMau: payload.NhomMau ?? extra.nhom_mau ?? null,
    BenhManTinh:
      payload.BenhManTinh ?? extra.benh_man_tinh ?? null,
    SinhHieu: payload.SinhHieu ?? extra.sinh_hieu ?? null,
  };

  const res = await http.post(CLINICAL_BASE, body);
  return unwrap(res);
}

// Lấy chi tiết phiếu khám theo mã
export async function getClinicalExam(maPhieuKham) {
  if (!maPhieuKham) return null;
  const res = await http.get(`${CLINICAL_BASE}/${maPhieuKham}`);
  return unwrap(res);
}

// Cập nhật trạng thái phiếu khám (dang_kham, da_kham, huy, ...)
export async function updateClinicalExamStatus(maPhieuKham, trangThai) {
  if (!maPhieuKham) throw new Error("Thiếu maPhieuKham");
  const body = { TrangThai: trangThai };
  const res = await http.put(`${CLINICAL_BASE}/${maPhieuKham}/status`, body);
  return unwrap(res);
}

// Tạo / cập nhật chẩn đoán cuối cùng
export async function upsertFinalDiagnosis(payload) {
  // payload theo FinalDiagnosisCreateRequest: MaPhieuKham, ChanDoanChinh, ...
  const res = await http.post(`${CLINICAL_BASE}/final-diagnosis`, payload);
  return unwrap(res);
}

// Lấy chẩn đoán cuối cùng của phiếu khám
export async function getFinalDiagnosis(maPhieuKham) {
  if (!maPhieuKham) return null;
  const res = await http.get(
    `${CLINICAL_BASE}/${maPhieuKham}/final-diagnosis`
  );
  return unwrap(res);
}

// Hoàn tất phiếu khám
export async function completeExam(maPhieuKham, payload = {}) {
  if (!maPhieuKham) throw new Error("MaPhieuKham là bắt buộc");
  const res = await http.post(
    `${CLINICAL_BASE}/${maPhieuKham}/complete`,
    payload
  );
  return unwrap(res);
}

// Search phiếu khám theo bộ lọc
export async function searchClinicalExams(filters = {}) {
  // Map filter camelCase -> query theo API Doc nếu cần
  const params = {
    maBenhNhan: filters.maBenhNhan,
    maBacSi: filters.maBacSi,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    trangThai: filters.trangThai,
    page: filters.page,
    pageSize: filters.pageSize,
  };

  const res = await http.get(`${CLINICAL_BASE}/search`, { params });
  return unwrapArray(res);
}

/** ===== CLS (CẬN LÂM SÀNG) =====
 * Theo ClsController:
 *  - POST /api/cls/orders                     (TaoPhieuCls)
 *  - GET  /api/cls/orders/{maPhieuKhamCls}
 *  - PUT  /api/cls/orders/{maPhieuKhamCls}/status
 *  - GET  /api/cls/orders                     (SearchOrders)
 *  - POST /api/cls/items                      (TaoChiTietDichVu)
 *  - GET  /api/cls/orders/{maPhieuKhamCls}/items
 *  - POST /api/cls/results                    (TaoKetQua)
 *  - GET  /api/cls/orders/{maPhieuKhamCls}/results
 *  - POST /api/cls/summary/{maPhieuKhamCls}
 *  - GET  /api/cls/summary/{maPhieuTongHop}
 *  - GET  /api/cls/summary
 *  - PUT  /api/cls/summary/{maPhieuTongHop}/status
 *  - PUT  /api/cls/summary/{maPhieuTongHop}
 */

// Tạo phiếu CLS (order) cho một lượt khám
export async function createClsOrder(payload = {}) {
  if (!payload) throw new Error("createClsOrder: missing payload");

  // Nếu đã là ClsOrderCreateRequest thì post thẳng
  if (
    payload.MaBenhNhan &&
    payload.MaPhieuKhamLs &&
    Array.isArray(payload.ListItemDV)
  ) {
    const res = await http.post(`${CLS_BASE}/orders`, payload);
    return unwrap(res);
  }

  const {
    pid,
    patientId,
    clinicalExamId,
    createdBy,
    autoPublishEnabled = true,
    note,
    status,
    services = [],
  } = payload;

  const listItemDV =
    Array.isArray(services) && services.length
      ? services.map((s) => ({
        MaChiTietDv:
          s.MaChiTietDv ??
          s.maChiTietDv ??
          s.serviceItemId ??
          null,
        MaPhieuKhamCls:
          s.MaPhieuKhamCls ?? s.maPhieuKhamCls ?? null,
        MaDichVu:
          s.MaDichVu ??
          s.maDichVu ??
          s.id ??
          s.serviceId ??
          null,
        TenDichVu:
          s.TenDichVu ??
          s.tenDichVu ??
          s.name ??
          s.ten ??
          "",
        LoaiDichVu:
          s.LoaiDichVu ?? s.loaiDichVu ?? s.type ?? null,
        PhiDV: String(
          s.PhiDV ?? s.phiDV ?? s.price ?? s.fee ?? ""
        ),
        GhiChu: s.GhiChu ?? s.note ?? "",
        TrangThai: s.TrangThai ?? s.status ?? "cho_ket_qua",
      }))
      : [];

  const body = {
    MaBenhNhan:
      payload.MaBenhNhan ??
      payload.maBenhNhan ??
      pid ??
      patientId ??
      null,
    MaPhieuKhamLs:
      payload.MaPhieuKhamLs ??
      payload.maPhieuKhamLs ??
      clinicalExamId ??
      payload.clinicalExamId ??
      null,
    MaNguoiLap:
      payload.MaNguoiLap ?? payload.maNguoiLap ?? createdBy ?? null,
    AutoPublishEnabled:
      payload.AutoPublishEnabled ??
      payload.autoPublishEnabled ??
      autoPublishEnabled,
    GhiChu: payload.GhiChu ?? payload.ghiChu ?? note ?? "",
    TrangThai:
      payload.TrangThai ?? payload.trangThai ?? status ?? null,
    ListItemDV:
      payload.ListItemDV ??
      payload.listItemDV ??
      listItemDV,
  };

  const res = await http.post(`${CLS_BASE}/orders`, body);
  return unwrap(res);
}

// Search CLS orders (GET /api/cls/orders)
export async function searchClsOrders(params = {}) {
  const res = await http.get(`${CLS_BASE}/orders`, { params });
  const data = unwrap(res);
  if (!data) return { Items: [], TotalItems: 0, Page: 1, PageSize: 0 };
  if (Array.isArray(data)) {
    return {
      Items: data,
      TotalItems: data.length,
      Page: 1,
      PageSize: data.length,
    };
  }
  if (Array.isArray(data.items)) {
    return {
      Items: data.items,
      TotalItems: data.totalItems ?? data.items.length ?? 0,
      Page: data.page ?? 1,
      PageSize: data.pageSize ?? data.items.length ?? 0,
    };
  }
  if (Array.isArray(data.Items)) return data;
  return { Items: [], TotalItems: 0, Page: 1, PageSize: 0 };
}

// Lấy phiếu CLS theo mã
export async function getClsOrder(maPhieuKhamCls) {
  if (!maPhieuKhamCls) return null;
  const res = await http.get(`${CLS_BASE}/orders/${maPhieuKhamCls}`);
  return unwrap(res);
}

// Cập nhật trạng thái phiếu CLS
export async function updateClsOrderStatus(maPhieuKhamCls, trangThai) {
  if (!maPhieuKhamCls) throw new Error("Thiếu maPhieuKhamCls");
  if (!trangThai) throw new Error("Thiếu trangThai");

  // API nhận trangThai qua query param, không phải JSON body
  const res = await http.put(
    `${CLS_BASE}/orders/${maPhieuKhamCls}/status`,
    null,
    { params: { trangThai } }
  );
  return unwrap(res);
}

// Tạo chi tiết dịch vụ CLS (1 dịch vụ trên phiếu)
export async function createClsItem(payload) {
  const res = await http.post(`${CLS_BASE}/items`, payload);
  return unwrap(res);
}

// Lấy danh sách dịch vụ CLS theo phiếu
export async function getClsItemsByOrder(maPhieuKhamCls) {
  if (!maPhieuKhamCls) return [];
  const res = await http.get(`${CLS_BASE}/orders/${maPhieuKhamCls}/items`);
  return unwrapArray(res);
}

// Tạo kết quả CLS – cái này hook useCreateClsResult đang dùng
export async function createClsResult(payload) {
  const res = await http.post(`${CLS_BASE}/results`, payload);
  return unwrap(res);
}

// Lấy danh sách kết quả theo phiếu CLS
export async function getClsResultsByOrder(maPhieuKhamCls) {
  if (!maPhieuKhamCls) return [];
  const res = await http.get(`${CLS_BASE}/orders/${maPhieuKhamCls}/results`);
  return unwrapArray(res);
}





// Dịch vụ khám (LS/CLS) theo phòng hoặc loại DV – services/overview
// params: { maPhong?, loaiDichVu? }
export function useExamServices(paramsOrOptions = {}, maybeOptions = {}) {
  const isParams =
    paramsOrOptions &&
    (Object.prototype.hasOwnProperty.call(paramsOrOptions, "maPhong") ||
      Object.prototype.hasOwnProperty.call(paramsOrOptions, "loaiDichVu"));

  const params = isParams ? paramsOrOptions : {};
  const options = isParams ? maybeOptions : paramsOrOptions;

  // dùng luôn hook overview để đảm bảo đồng bộ
  return useServicesOverview(params, options);
}




export function useServicesOverview(params = {}, options = {}) {
  return useQuery({
    queryKey: ["servicesOverview", params],
    queryFn: () => getServicesOverview(params),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
    ...options,
  });
}

// ===== LẤY THÔNG TIN CHI TIẾT DỊCH VỤ (KHOA + PHÒNG + BÁC SĨ) =====
// Backend: GET /api/master-data/services/info?maDv={maDv}
//
// ServiceDetailInfoDto:
//  - string MaKhoa
//  - string TenKhoa
//  - string MaPhong
//  - string TenPhong
//  - string MaBacSi
//  - string TenBacSi
//  - string TenDichVu
//  - string LoaiDichVu
//  - decimal DonGia

export async function getServiceInfo(maDv) {
  if (!maDv) return null;

  const res = await http.get(`${MASTER_BASE}/services/info`, {
    params: { maDv },
  });

  return unwrap(res);
}

export function useServiceInfo(maDv, options = {}) {
  const enabled = (options.enabled ?? true) && !!maDv;

  return useQuery({
    queryKey: ["serviceInfo", maDv],
    queryFn: () => getServiceInfo(maDv),
    enabled,
    ...options,
  });
}



// Phiếu khám
export function useClinicalExam(maPhieuKham, options = {}) {
  const enabled = (options.enabled ?? true) && !!maPhieuKham;

  return useQuery({
    queryKey: ["clinicalExam", maPhieuKham],
    queryFn: () => getClinicalExam(maPhieuKham),
    enabled,
    ...options,
  });
}

export function useFinalDiagnosis(maPhieuKham, options = {}) {
  const enabled = (options.enabled ?? true) && !!maPhieuKham;

  return useQuery({
    queryKey: ["finalDiagnosis", maPhieuKham],
    queryFn: () => getFinalDiagnosis(maPhieuKham),
    enabled,
    ...options,
  });
}

export function useSearchClinicalExams(filters, options = {}) {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ["clinicalExams", filters],
    queryFn: () => searchClinicalExams(filters),
    enabled,
    ...options,
  });
}

// Tạo phiếu khám lâm sàng
export function useCreateClinicalExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClinicalExam,
    onSuccess: (data, variables) => {
      // Sau khi tạo phiếu khám -> cập nhật hàng đợi, lượt khám, bệnh nhân
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      // Invalidate chi tiết bệnh nhân nếu có MaBenhNhan
      const pid = variables?.MaBenhNhan ?? variables?.maBenhNhan ?? variables?.pid;
      if (pid) {
        qc.invalidateQueries({ queryKey: ["patient", pid] });
      }
    },
  });
}

// CLS – hook cũ: giữ nguyên tên để FE không phải sửa
export function useCreateClsResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClsResult,
    onSuccess: () => {
      // CLS hoàn tất -> cập nhật lại hàng đợi + lượt khám + bệnh nhân
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}



/** ===== ADAPTER CHO MÀN EXAMINATION CŨ =====
 * Giữ nguyên tên hook để Examination.jsx không phải sửa.
 * Bên dưới chỉ là lớp adapter gọi vào API mới.
 */

// Xuất phiếu CLS từ màn LS
export function useCreateExamOrder() {
  const qc = useQueryClient();
  return useMutation({
    // payload hiện tại từ Examination: { pid, services: [{id, note}], note, fromDoctor }
    mutationFn: async (payload) => {
      // TODO: Map sang CreateClsOrderRequest theo API Doc khi BE chốt schema
      // Tạm thời forward 1-1 để không 404, bạn chỉnh lại field name theo BE sau.
      return createClsOrder(payload);
    },
    onSuccess: () => {
      // Sau khi tạo order CLS -> cập nhật hàng đợi, lượt khám, bệnh nhân
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
// === Search phiếu khám lâm sàng (GET /api/clinical/search) ===
// Dùng để lấy lại phiếu đang "dang_thuc_hien"
export async function searchClinicalRaw(params = {}) {
  const res = await http.get("/clinical/search", { params });
  const data = res?.data;

  if (!data) return [];

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

// Xuất chẩn đoán cuối cùng (bao gồm dx/rx/CLS result...) từ màn LS/CLS
export function useCreateDiagnosis(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => upsertFinalDiagnosis(payload),
    onSuccess: (data, vars, ctx) => {
      if (!options.skipInvalidate) {
        qc.invalidateQueries({ queryKey: ["queue"] });
        qc.invalidateQueries({ queryKey: ["visits"] });
        qc.invalidateQueries({ queryKey: ["patients"] });
      }
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, vars, ctx);
      }
    },
    ...options,
  });
}

// Hoàn tất phiếu khám
export function useCompleteExam(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ maPhieuKham, ...payload }) =>
      completeExam(maPhieuKham, payload),
    onSuccess: (data, vars, ctx) => {
      if (!options.skipInvalidate) {
        qc.invalidateQueries({ queryKey: ["clinical"] });
        qc.invalidateQueries({ queryKey: ["queue"] });
        qc.invalidateQueries({ queryKey: ["patients"] });
        qc.invalidateQueries({ queryKey: ["visits"] });
      }
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, vars, ctx);
      }
    },
    ...options,
  });
}

// ===== HỦY LƯỢT KHÁM =====
// Backend: PUT /api/clinical/visits/{maLuotKham}/cancel
export async function cancelVisit(maLuotKham) {
  if (!maLuotKham) throw new Error("Thiếu maLuotKham");
  const res = await http.put(`${CLINICAL_BASE}/visits/${maLuotKham}/cancel`);
  return unwrap(res);
}

export function useCancelVisit(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelVisit,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, vars, ctx);
      }
    },
    ...options,
  });
}

// ===== HỦY PHIẾU CLS =====
// Backend: PUT /api/cls/orders/{maPhieuKhamCls}/cancel
export async function cancelClsOrder(maPhieuKhamCls) {
  if (!maPhieuKhamCls) throw new Error("Thiếu maPhieuKhamCls");
  const res = await http.put(`${CLS_BASE}/orders/${maPhieuKhamCls}/cancel`);
  return unwrap(res);
}

export function useCancelClsOrder(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelClsOrder,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, vars, ctx);
      }
    },
    ...options,
  });
}
