// src/api/history.js
// API & hooks cho trang Lịch sử (Khám bệnh  Giao dịch)
import { useQuery } from "@tanstack/react-query";
import { http } from "./http.js";
import { on } from "./realtime.js";

// xác định khoa dịch vụ cho FE
export function isServiceDept(dept) {
  if (!dept) return false;
  const text = String(
    typeof dept === "string" ? dept : dept.name || dept.tenKhoa || ""
  ).toLowerCase();
  return text.includes("dịch vụ") || text.includes("dv ");
}

function ensureArray(payload) {
  if (!payload) return [];

  // trường hợp trả về luôn mảng
  if (Array.isArray(payload)) return payload;

  // PagedResult kiểu thường: { items: [...] }
  if (Array.isArray(payload.items)) return payload.items;

  // PagedResult kiểu BE của bạn: { Items: [...], Page, PageSize, TotalItems }
  if (Array.isArray(payload.Items)) return payload.Items;

  // Trường hợp bọc thêm 1 lớp { data: ... }
  if (payload.data) {
    const inner = payload.data;

    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner.items)) return inner.items;
    if (Array.isArray(inner.Items)) return inner.Items;
  }

  return [];
}


// thống kê hôm nay cho toolbar
export function todayStats(visits = [], txns = []) {
  const today = new Date();
  const isToday = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const todayVisits = visits.filter((v) => isToday(v.date));
  const todayTxns = txns.filter((t) => isToday(t.date));

  const tSum = todayTxns.reduce(
    (sum, t) => sum + Number(t.amount ?? t.money ?? 0),
    0
  );

  return {
    vCount: todayVisits.length,
    tCount: todayTxns.length,
    tSum,
  };
}

// ===== Normalizers cho data trả về từ BE (Entities) =====
// Chuẩn theo:
// - HistoryController.SearchVisits  GetVisitDetail (HistoryVisitRecordDto / HistoryVisitDetailDto)
// - BillingController.SearchInvoices (InvoiceHistoryRecordDto) :contentReference[oaicite:0]{index=0}

function normalizeVisit(dto = {}) {
  return {
    // mã lượt khám – dùng để gọi API chi tiết
    visitCode:
      dto.MaLuotKham ??
      dto.maLuotKham ??
      "",

    // thời gian
    date:
      dto.ThoiGian ??
      dto.thoiGian ??
      null,

    // bệnh nhân
    id:
      dto.MaBenhNhan ??
      dto.maBenhNhan ??
      "",
    name:
      dto.TenBenhNhan ??
      dto.tenBenhNhan ??
      "",

    // khoa & bác sĩ
    dept:
      dto.TenKhoa ??
      dto.tenKhoa ??
      "",
    deptId:
      dto.MaKhoa ??
      dto.maKhoa ??
      null,
    doctor:
      dto.TenBacSi ??
      dto.tenBacSi ??
      "",
    doctorId:
      dto.MaBacSi ??
      dto.maBacSi ??
      null,

    // loại lượt + flag khám dịch vụ
    type:
      dto.LoaiLuot ??
      dto.loaiLuot ??
      "",
    isService:
      dto.LaKhamDichVu ??
      dto.laKhamDichVu ??
      false,

    // ghi chú
    note:
      dto.GhiChu ??
      dto.ghiChu ??
      "",

    // liên kết tới phiếu/đơn để mở chi tiết
    examId:
      dto.MaPhieuKhamLs ??
      dto.maPhieuKhamLs ??
      null,
    clsId:
      dto.MaPhieuKhamCls ??
      dto.maPhieuKhamCls ??
      dto.MaPhieuTongHopCls ??
      dto.maPhieuTongHopCls ??
      null,
    rxId:
      dto.MaDonThuoc ??
      dto.maDonThuoc ??
      null,
    finalDiagnosisId:
      dto.MaPhieuChanDoanCuoi ??
      dto.maPhieuChanDoanCuoi ??
      null,
  };
}




function normalizeVisitDetail(dto = {}) {
  // Lấy khung chung từ list (ngày, BN, khoa, bác sĩ, type, isServiceVisit, examId, clsId, rxId...)
  const base = normalizeVisit(dto);

  // ----- 1) Chẩn đoán -----
  const chanDoanDto = dto.chanDoan || dto.ChanDoan || null;
  const diagnosis = chanDoanDto
    ? {
        // Chẩn đoán sơ bộ
        pre:
          chanDoanDto.chanDoanSoBo ||
          chanDoanDto.ChanDoanSoBo ||
          "",

        // Chẩn đoán xác định
        final:
          chanDoanDto.chanDoanXacDinh ||
          chanDoanDto.ChanDoanXacDinh ||
          "",

        // Phác đồ điều trị
        plan:
          chanDoanDto.phacDoDieuTri ||
          chanDoanDto.PhacDoDieuTri ||
          "",

        // Tư vấn & dặn dò
        advice:
          chanDoanDto.tuVanDanDo ||
          chanDoanDto.TuVanDanDo ||
          "",
      }
    : null;

  // ----- 2) Kết quả khám (examRows) -----
  const examRowsRaw =
    dto.ketQuaKham ||
    dto.KetQuaKham ||
    [];

  const examRows = examRowsRaw.map((r) => ({
    // Nhãn chỉ số / nội dung
    label:
      r.label ||
      r.Label ||
      r.tenChiSo ||
      r.TenChiSo ||
      "",
    // Giá trị kết quả
    value:
      r.value ||
      r.Value ||
      r.ketQua ||
      r.KetQua ||
      "",
  }));

  // ----- 3) Dịch vụ thực hiện (services) -----
  const servicesRaw =
    dto.ketQuaDichVu ||
    dto.KetQuaDichVu ||
    [];

  const services = servicesRaw.map((s) => ({
    code: s.maDichVu || s.MaDichVu || "",
    name: s.tenDichVu || s.TenDichVu || "",
    result: s.ketQua || s.KetQua || "",
    price:
      s.donGia ||
      s.DonGia ||
      s.thanhTien ||
      s.ThanhTien ||
      0,
  }));

  // ----- 4) Gộp lại cho FE -----
  return {
    ...base,
    // Ưu tiên tóm tắt khám, fallback về ghi chú hoặc base.note
    note:
      dto.tomTatKham ||
      dto.TomTatKham ||
      dto.ghiChu ||
      dto.GhiChu ||
      base.note,
    diagnosis,
    examRows,
    services,
  };
}

function normalizeTransaction(dto = {}) {
  const soTienRaw =
    dto.SoTien ??
    dto.soTien ??
    dto.TienThuoc ??
    dto.tienThuoc ??
    0;

  const amount = Number(soTienRaw) || 0;

  return {
    // khóa chính hóa đơn (dùng mở modal chi tiết)
    invoiceId:
      dto.MaHoaDon ??
      dto.maHoaDon ??
      "",

    // thời gian thu
    date:
      dto.ThoiGian ??
      dto.thoiGian ??
      null,

    // bệnh nhân
    id:
      dto.MaBenhNhan ??
      dto.maBenhNhan ??
      "",
    name:
      dto.TenBenhNhan ??
      dto.tenBenhNhan ??
      "",

    // loại đợt thu, nội dung, trạng thái, phương thức
    kind:
      dto.LoaiDotThu ??
      dto.loaiDotThu ??
      "",
    content:
      dto.NoiDung ??
      dto.noiDung ??
      "",
    status:
      dto.TrangThai ??
      dto.trangThai ??
      "",
    method:
      dto.PhuongThucThanhToan ??
      dto.phuongThucThanhToan ??
      "",

    // thu ngân
    staffId:
      dto.MaNhanSuThu ??
      dto.maNhanSuThu ??
      "",
    staffName:
      dto.TenNhanSuThu ??
      dto.tenNhanSuThu ??
      "",

    // số tiền (FE thường dùng cả amount & money)
    amount,
    money: amount,

    // link sang các entity khác
    examId:
      dto.MaPhieuKham ??
      dto.maPhieuKham ??
      null,
    clsId:
      dto.MaPhieuKhamCls ??
      dto.maPhieuKhamCls ??
      null,
    rxId:
      dto.MaDonThuoc ??
      dto.maDonThuoc ??
      null,
  };
}


/* ===================== RAW FETCHERS ===================== */

// Lấy danh sách lượt khám (search) – khớp HistoryController.SearchVisits

// Lấy danh sách lượt khám
export async function getHistoryVisits() {
  const filter = {
    maBenhNhan: null,
    fromTime: null,
    toTime: null,
    loaiLuot: null,
    keyword: null,
    onlyToday: null,
    page: 1,
    pageSize: 500,
  };

  const res = await http.post("/history/visits/search", filter);
  const list = ensureArray(res?.data);
  // debug nếu cần
  return list.map(normalizeVisit);
}

// Lấy lịch sử giao dịch
export async function getHistoryTransactions() {
  const filter = {
    maBenhNhan: null,
    fromTime: null,
    toTime: null,
    loaiDotThu: null,
    trangThai: null,
    phuongThucThanhToan: null,
    keyword: null,
    page: 1,
    pageSize: 500,
  };

  const res = await http.post("/billing/invoices/search", filter);
  const list = ensureArray(res?.data);
  return list.map(normalizeTransaction);
}

// Lấy chi tiết 1 lượt khám – khớp HistoryController.GetVisitDetail
export async function getHistoryVisitDetail(maLuotKham) {
  if (!maLuotKham) {
    throw new Error("Thiếu mã lượt khám");
  }
  const res = await http.get(
    `/history/visits/${encodeURIComponent(maLuotKham)}`
  );
  const dto = res.data;
  return normalizeVisitDetail(dto);
}





/* ===================== HOOKS (TanStack Query) ===================== */


export function useHistoryVisits(options = {}) {
  return useQuery({
    queryKey: ["history", "visits"],
    queryFn: getHistoryVisits,
    staleTime: 60_000,
    ...options,
  });
}
export function useHistoryVisitDetail(maLuotKham, options = {}) {
  const { enabled, ...rest } = options;
  return useQuery({
    queryKey: ["history", "visit-detail", maLuotKham],
    queryFn: () => getHistoryVisitDetail(maLuotKham),
    enabled: enabled ?? !!maLuotKham,
    staleTime: 60_000,
    ...rest,
  });
}
export function useHistoryTransactions(options = {}) {
  return useQuery({
    queryKey: ["history", "transactions"],
    queryFn: getHistoryTransactions,
    staleTime: 60_000,
    ...options,
  });
}


/* ===================== REALTIME (SignalR) ===================== */

// Server emit: "history.updated" khi có giao dịch mới/cập nhật
export function subscribeHistory(handler) {
  return on("history.updated", (evt) => {
    if (typeof handler === "function") handler(evt);
  });
}