// src/api/pharmacy.js
// API & hooks cho trang Nhà thuốc (Kho thuốc + Đơn thuốc)

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "./http.js";
import { on } from "./realtime.js";

/** ================== HELPERS ================== */

function toNumber(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function toDateOnly(raw) {
  if (!raw) return "";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);

  const s = String(raw);
  // Chuẩn ISO hoặc yyyy-MM-dd → cắt 10 ký tự đầu
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

/** ================== NORMALIZE DTO ================== */

// DTO kho thuốc (DrugDto / KhoThuocDto) → FE
function normalizeDrug(dto = {}) {
  const code =
    dto.code ??
    dto.maThuoc ??
    dto.MaThuoc ??
    dto.maHangHoa ??
    dto.MaHangHoa ??
    "";

  const name =
    dto.name ??
    dto.tenThuoc ??
    dto.TenThuoc ??
    dto.thuoc?.TenThuoc ??
    dto.Thuoc?.TenThuoc ??
    "";

  const unit =
    dto.unit ??
    dto.donViTinh ??
    dto.DonViTinh ??
    dto.thuoc?.DonViTinh ??
    dto.Thuoc?.DonViTinh ??
    "";

  const usage =
    dto.usage ??
    dto.congDung ??
    dto.CongDung ??
    "";

  const qty = toNumber(
    dto.qty,
    dto.soLuongTon,
    dto.SoLuongTon,
    dto.tonKho,
    dto.TonKho
  );

  const price = toNumber(
    dto.price,
    dto.giaNiemYet,
    dto.GiaNiemYet,
    dto.donGia,
    dto.DonGia
  );

  const exp = toDateOnly(
    dto.exp ?? dto.hanSuDung ?? dto.HanSuDung
  );

  const lot =
    dto.lot ??
    dto.soLo ??
    dto.SoLo ??
    "";

  const statusRaw =
    (dto.status ?? dto.trangThai ?? dto.TrangThai ?? "")
      .toString()
      .toLowerCase();

  let status = statusRaw || "hoat_dong";

  // Chuẩn hoá vài biến thể
  if (["expired"].includes(status)) status = "het_han";
  if (["inactive", "tam_dung", "tam_ngung", "paused"].includes(status)) {
    status = "tam_ngung";
  }

  const id =
    dto.id ??
    dto.maKhoThuoc ??
    dto.MaKhoThuoc ??
    `${code || "drug"}-${lot || "na"}-${exp || "na"}`;

  return {
    id,
    code,
    name,
    unit,
    usage,
    qty,
    price,
    exp,
    lot,
    status,
    raw: dto,
  };
}

// Chi tiết 1 dòng thuốc trong đơn
function normalizePrescriptionItem(d = {}) {
  const code =
    d.code ??
    d.maThuoc ??
    d.MaThuoc ??
    "";

  const name =
    d.name ??
    d.tenThuoc ??
    d.TenThuoc ??
    "";

  const unit =
    d.unit ??
    d.donViTinh ??
    d.DonViTinh ??
    "";

  const qty = toNumber(d.qty, d.soLuong, d.SoLuong);
  const price = toNumber(
    d.price,
    d.donGia,
    d.DonGia,
    d.giaNiemYet,
    d.GiaNiemYet
  );
  const amount = toNumber(
        d.amount,
        d.thanhTien,
        d.ThanhTien,
        price * qty
      );
    
      const dose =
        d.dose ??
        d.chiDinhSuDung ??
    d.ChiDinhSuDung ??
        d.lieuDung ??
        d.LieuDung ??
        d.huongDan ??
        d.HuongDan ??
        d.cachDung ??
        d.CachDung ??
        "";

  const usage =
    d.usage ??
    d.congDung ??
    d.CongDung ??
    "";

  return {
    code,
    name,
    unit,
    qty,
    price,
    amount,
    dose,
    usage,
    raw: d,
  };
}

// DTO PrescriptionDto → FE
function normalizePrescription(dto = {}) {
  const code =
    dto.code ??
    dto.maDonThuoc ??
    dto.MaDonThuoc ??
    "";

  const ptId =
    dto.maBenhNhan ??
    dto.MaBenhNhan ??
    dto.BenhNhan?.MaBenhNhan ??
    null;

  const ptName =
    dto.ptName ??
    dto.tenBenhNhan ??
    dto.TenBenhNhan ??
    dto.benhNhan?.HoTen ??
    dto.BenhNhan?.HoTen ??
    "";

  const doctorId =
    dto.maBacSiKeDon ??
    dto.MaBacSiKeDon ??
    null;

  const doctorName =
    dto.doctor ??
    dto.tenBacSiKeDon ??
    dto.TenBacSiKeDon ??
    dto.BacSiKeDon?.HoTen ??
    "";

  const diagnosisId =
    dto.maPhieuChanDoanCuoi ??
    dto.MaPhieuChanDoanCuoi ??
    null;

  const diagnosis =
    dto.chanDoan ??
    dto.ChanDoan ??
    dto.PhieuChanDoanCuoi?.ChanDoanCuoi ??
    "";

    const atRaw =
        dto.at ??
        dto.thoiGianKeDon ??
        dto.ThoiGianKeDon ??
        dto.createdAt ??
        dto.CreatedAt ??
        null;
    
      const rawStatus =
        dto.status ??
        dto.trangThai ??
        dto.TrangThai ??
        "";

        const total = toNumber(
              dto.total,
              dto.tongTienDon,
              dto.TongTienDon
            );

  const itemsRaw =
    dto.items ??
    dto.chiTiet ??
    dto.ChiTiet ??
    [];

  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(normalizePrescriptionItem)
    : [];

  return {
    id: code || dto.id,
    code,
    rawStatus,
        status: rawStatus,
        at: atRaw,
        total,
        // alias cho bệnh nhân
        patientId: ptId,
        patientName: ptName,
        ptId,
        ptName,
        // alias cho bác sĩ
        doctorId,
        doctorName,
        doctor: doctorName,
        // alias cho chẩn đoán
        diagnosisId,
        diagnosis,
        diag: diagnosis,
    items,
    raw: dto,
  };
}
function normalizeStatusForUpsert(status) {
  const raw = String(status || "").toLowerCase();

  if (
    raw === "tam_dung" ||
    raw === "tam_ngung" ||
    raw === "paused" ||
    raw === "inactive"
  ) {
    return "tam_dung";
  }

  // Mặc định là hoạt động, các trạng thái khác BE tự tính
  return "hoat_dong";
}
/** ================== RAW API CALLS ================== */
function extractItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  return [];
}

// GET /api/pharmacy/prescriptions
// ✅ Lấy danh sách đơn thuốc với filtering và pagination
export async function searchRxOrders({ keyword, status, fromDate, toDate, page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  if (keyword) params.append("keyword", keyword);
  if (status && status !== "all" && status !== "Tất cả") {
    // Map frontend status → backend status
    const statusMap = {
      "Đã kê": "da_ke",
      "Chờ phát": "cho_phat",
      "Đã phát": "da_phat",
    };
    params.append("trangThai", statusMap[status] || status);
  }
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  params.append("page", page);
  params.append("pageSize", pageSize);

  const data = await get(`/pharmacy/prescriptions?${params.toString()}`);
  
  // ✅ Trả về PagedResult đầy đủ
  const list = extractItems(data);
  return {
    Items: list.map(normalizePrescription),
    TotalItems: data?.TotalItems ?? data?.totalItems ?? list.length,
    Page: data?.Page ?? data?.page ?? page,
    PageSize: data?.PageSize ?? data?.pageSize ?? pageSize,
  };
}

// Deprecated: sử dụng searchRxOrders thay thế
export async function getRxOrders() {
  const result = await searchRxOrders({ page: 1, pageSize: 1000 });
  return result.Items;
}

// GET /api/pharmacy/stock
export async function getStock() {
  const data = await get("/pharmacy/stock");

  const list = extractItems(data);
  return list.map(normalizeDrug);
}
// ✅ Trả về PagedResult đầy đủ
export async function searchStock({ keyword, status, expFrom, expTo, tonMin, tonMax, page = 1, pageSize = 50 } = {}) {
  const payload = {
    Keyword: keyword || null,
    TrangThai: status === "all" ? null : status || null,
    HanSuDungFrom: expFrom || null,
    HanSuDungTo: expTo || null,
    TonToiThieu: tonMin ?? null,
    TonToiDa: tonMax ?? null,
    SortBy: null,
    SortDirection: null,
    Page: page,
    PageSize: pageSize,
  };

  const data = await post("/pharmacy/stock/search", payload);
  
  // ✅ Trả về PagedResult đầy đủ
  if (data && typeof data === "object" && ("TotalItems" in data || "totalItems" in data)) {
    return {
      Items: extractItems(data).map(normalizeDrug),
      TotalItems: data.TotalItems ?? data.totalItems ?? 0,
      Page: data.Page ?? data.page ?? page,
      PageSize: data.PageSize ?? data.pageSize ?? pageSize,
    };
  }
  
  // Fallback: nếu không phải PagedResult
  const list = extractItems(data);
  return {
    Items: list.map(normalizeDrug),
    TotalItems: list.length,
    Page: page,
    PageSize: pageSize,
  };
}



/**
 * Upsert kho thuốc
 * BE: POST /api/pharmacy/stock (DrugDto)
 * form: { code, name, unit, usage, price, qty, exp, lot, status }
 */
export async function upsertStockItem(form) {
  if (!form || !form.code) {
    throw new Error("Thiếu mã thuốc (code)");
  }

  const payload = {
    MaThuoc: form.code,
    TenThuoc: form.name,
    DonViTinh: form.unit,
    CongDung: form.usage || null,
    GiaNiemYet: toNumber(form.price),
    SoLuongTon: toNumber(form.qty),
    TrangThai: normalizeStatusForUpsert(form.status), // 🔑
    HanSuDung: form.exp || null, // yyyy-MM-dd
    SoLo: form.lot || null,
  };

  const dto = await post("/pharmacy/stock", payload);
  return normalizeDrug(dto);
}

/** ================== REACT QUERY HOOKS ================== */

export function useStock(options = {}) {
  return useQuery({
    queryKey: ["pharmacy", "stock"],
    queryFn: getStock,
    staleTime: 30_000,
    ...options,
  });
}

// ✅ Hook cho search orders với filtering và pagination
export function useSearchRxOrders(filters = {}, options = {}) {
  const {
    keyword = "",
    status = "Tất cả",
    fromDate = null,
    toDate = null,
    page = 1,
    pageSize = 50,
  } = filters;

  return useQuery({
    queryKey: ["pharmacy", "rxOrders", "search", { keyword, status, fromDate, toDate, page, pageSize }],
    queryFn: () => searchRxOrders({ keyword, status, fromDate, toDate, page, pageSize }),
    staleTime: 10_000,
    keepPreviousData: true,
    ...options,
  });
}

// Deprecated: sử dụng useSearchRxOrders thay thế
export function useRxOrders(options = {}) {
  return useQuery({
    queryKey: ["pharmacy", "rxOrders"],
    queryFn: getRxOrders,
    staleTime: 30_000,
    ...options,
  });
}

// ✅ Hook cho search stock với phân trang
export function useSearchStock(filters = {}, options = {}) {
  const {
    keyword = "",
    status = "all",
    unit = "",
    expFrom = null,
    expTo = null,
    tonMin = null,
    tonMax = null,
    page = 1,
    pageSize = 50,
  } = filters;

  return useQuery({
    queryKey: ["pharmacy", "stock", "search", { keyword, status, unit, expFrom, expTo, tonMin, tonMax, page, pageSize }],
    queryFn: () => searchStock({ keyword, status, unit, expFrom, expTo, tonMin, tonMax, page, pageSize }),
    staleTime: 10_000,
    keepPreviousData: true, // Giữ data cũ khi chuyển trang
    ...options,
  });
}

export function useUpsertStockItem(options = {}) {
  const qc = useQueryClient();
  const { onSuccess, ...rest } = options || {};

  return useMutation({
    mutationFn: upsertStockItem,
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["pharmacy", "stock"] });
      qc.invalidateQueries({ queryKey: ["pharmacy", "rxOrders"] });
      if (typeof onSuccess === "function") {
        onSuccess(data, variables, context);
      }
    },
    ...rest,
  });
}

export async function cancelPrescription(maDonThuoc) {
  if (!maDonThuoc) throw new Error("Missing maDonThuoc");
  const res = await http.put(`/pharmacy/prescriptions/${maDonThuoc}/cancel`);
  return res?.data ?? res;
}

export function useCancelPrescription(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelPrescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy", "rxOrders"] });
      qc.invalidateQueries({ queryKey: ["pharmacy", "rxOrders", "search"] });
    },
    ...options,
  });
}

/** ================== REALTIME (SignalR / WS) ================== */
// Server emit: { type: "rx_order_updated" | "stock_upserted" | "stock_deleted", ... }
export function subscribePharmacy(handler) {
  return on("pharmacy.updated", (evt) => {
    if (typeof handler === "function") handler(evt);
  });
}
