// src/api/billing.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";
import { on } from "./realtime.js";
import { PHUONG_THUC_THANH_TOAN } from "../constants/enums.js";

/**
 * BILLING API
 * Base route: /api/billing
 * Dựa trên tài liệu BillingController [cite: 8, 9, 10]
 */

const BASE = "/billing";

/* =========================================================
 * 1. API CALLS (AXIOS)
 * =======================================================*/

// Tạo hóa đơn mới (CreateInvoice)
// POST /api/billing/invoices
export async function createInvoice(payload = {}) {
  // Map input flexible (camelCase) sang DTO Server (PascalCase) 
  const body = {
    MaBenhNhan: payload.MaBenhNhan ?? payload.maBenhNhan ?? payload.patientId,
    MaNhanSuThu: payload.MaNhanSuThu ?? payload.maNhanSuThu ?? payload.staffId ?? "admin", // Tạm thời hardcode hoặc lấy từ AuthStore
    LoaiDotThu: payload.LoaiDotThu ?? payload.loaiDotThu ?? payload.type ?? "kham_lam_sang",
    SoTien: payload.SoTien ?? payload.soTien ?? payload.amount ?? 0,
    PhuongThucThanhToan: payload.PhuongThucThanhToan ?? payload.phuongThucThanhToan ?? payload.paymentMethod ?? PHUONG_THUC_THANH_TOAN.TIEN_MAT,
    NoiDung: payload.NoiDung ?? payload.noiDung ?? payload.content ?? payload.item ?? "",
    TrangThai: payload.TrangThai ?? payload.trangThai ?? payload.status ?? null,
    
    // Các trường optional 
    MaPhieuKham: payload.MaPhieuKham ?? payload.maPhieuKham ?? null,
    MaPhieuKhamCls: payload.MaPhieuKhamCls ?? payload.maPhieuKhamCls ?? null,
    MaDonThuoc: payload.MaDonThuoc ?? payload.maDonThuoc ?? null,
  };

  const res = await http.post(`${BASE}/invoices`, body);
  return res.data; // Trả về InvoiceDto 
}

// Lấy chi tiết hóa đơn
// GET /api/billing/invoices/{maHoaDon}
export async function getInvoice(maHoaDon) {
  if (!maHoaDon) return null;
  const res = await http.get(`${BASE}/invoices/${maHoaDon}`);
  return res.data;
}

// Tìm kiếm lịch sử hóa đơn
// POST /api/billing/invoices/search
export async function searchInvoices(filter = {}) {
  // Map filter sang InvoiceSearchFilter 
  const body = {
    MaBenhNhan: filter.MaBenhNhan ?? filter.maBenhNhan ?? filter.patientId ?? null,
    FromTime: filter.FromTime ?? filter.fromTime ?? null,
    ToTime: filter.ToTime ?? filter.toTime ?? null,
    LoaiDotThu: filter.LoaiDotThu ?? filter.loaiDotThu ?? null,
    TrangThai: filter.TrangThai ?? filter.trangThai ?? null,
    MinAmount: filter.MinAmount ?? filter.minAmount ?? null,
    MaxAmount: filter.MaxAmount ?? filter.maxAmount ?? null,
    Keyword: filter.Keyword ?? filter.keyword ?? null,
    SortBy: filter.SortBy ?? filter.sortBy ?? null,
    SortDirection: filter.SortDirection ?? filter.sortDirection ?? null,
    Page: filter.Page ?? filter.page ?? 1,
    PageSize: filter.PageSize ?? filter.pageSize ?? 20,
  };

  const res = await http.post(`${BASE}/invoices/search`, body);
  return res.data; // PagedResult<InvoiceHistoryRecordDto>
}

/**
 * Tìm hoá đơn loại "thuoc" gắn đúng mã đơn thuốc (dùng tab xử lý BN / tránh vòng lặp thu↔phát).
 */
export async function findDrugInvoiceByPrescription(maBenhNhan, maDonThuoc) {
  if (!maBenhNhan || !maDonThuoc) return null;
  const data = await searchInvoices({
    MaBenhNhan: maBenhNhan,
    LoaiDotThu: "thuoc",
    Page: 1,
    PageSize: 100,
  });
  const items = data?.Items ?? data?.items ?? [];
  const target = String(maDonThuoc).trim();
  return (
    items.find(
      (row) =>
        String(row.MaDonThuoc ?? row.maDonThuoc ?? "").trim() === target
    ) || null
  );
}

// Cập nhật trạng thái hóa đơn (Hủy, Hoàn tác...)
// PUT /api/billing/invoices/{maHoaDon}/status
export async function updateInvoiceStatus({ id, status, soTien, noiDung }) {
  if (!id || !status) throw new Error("Thiếu id hoặc status");
  const body = { TrangThai: status }; // InvoiceStatusUpdateRequest 
  if (soTien != null) body.SoTien = soTien;
  if (noiDung != null) body.NoiDung = noiDung;
  const res = await http.put(`${BASE}/invoices/${id}/status`, body);
  return res.data;
}

/* =========================================================
 * 2. REACT QUERY HOOKS
 * =======================================================*/

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (data, variables) => {
      // Invalidate cache liên quan
      qc.invalidateQueries({ queryKey: ["invoices"] });
      // Nếu có patientId, invalidate lịch sử giao dịch của BN đó (nếu UI dùng transaction list cũ)
      const pid = variables.MaBenhNhan ?? variables.maBenhNhan ?? variables.patientId;
      if (pid) {
        qc.invalidateQueries({ queryKey: ["transactions", pid] });
        qc.invalidateQueries({ queryKey: ["patient", pid] }); // Refresh detail BN để update số dư nợ nếu có
      }
    },
  });
}

export function useSearchInvoices(filter, options = {}) {
  return useQuery({
    queryKey: ["invoices", "search", filter],
    queryFn: () => searchInvoices(filter),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id),
    enabled: !!id,
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateInvoiceStatus,
    onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ["invoices"] });
        if (data?.MaBenhNhan) {
             qc.invalidateQueries({ queryKey: ["transactions", data.MaBenhNhan] });
        }
    },
  });
}

/* =========================================================
 * 3. HỦY HÓA ĐƠN
 * Backend: PUT /api/billing/invoices/{maHoaDon}/cancel
 * =======================================================*/

// Hủy hóa đơn (CancelInvoice)
export async function cancelInvoice(maHoaDon, payload = {}) {
  if (!maHoaDon) throw new Error("Thiếu mã hóa đơn");
  // payload: { LyDoHuy? } — optional
  const body = {
    LyDo: payload.LyDo ?? payload.lyDo ?? payload.LyDoHuy ?? payload.lyDoHuy ?? payload.reason ?? null,
  };
  const res = await http.put(`${BASE}/invoices/${maHoaDon}/cancel`, body);
  return res.data;
}

export function useCancelInvoice(options = {}) {
  const qc = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ maHoaDon, ...payload }) => cancelInvoice(maHoaDon, payload),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["history", "transactions"] });
      if (typeof onSuccess === "function") {
        onSuccess(data, vars, ctx);
      }
    },
    ...rest,
  });
}

/* =========================================================
 * 4. XÁC NHẬN THANH TOÁN (Week 4 — chờ Dev1 endpoint)
 * Backend: PUT /api/billing/invoices/{maHoaDon}/confirm
 * =======================================================*/

// Xác nhận hóa đơn đã thanh toán
export async function confirmInvoice(maHoaDon, payload = {}) {
  if (!maHoaDon) throw new Error("Thiếu mã hóa đơn");
  const body = {
    PhuongThucThanhToan:
      payload.PhuongThucThanhToan ??
      payload.phuongThucThanhToan ??
      payload.method ??
      PHUONG_THUC_THANH_TOAN.TIEN_MAT,
    MaNhanSuThu: payload.MaNhanSuThu ?? payload.maNhanSuThu ?? null,
    MaGiaoDich: payload.MaGiaoDich ?? payload.maGiaoDich ?? null,
    GhiChu: payload.GhiChu ?? payload.ghiChu ?? payload.note ?? null,
  };
  const res = await http.put(`${BASE}/invoices/${maHoaDon}/confirm`, body);
  return res.data;
}

export function useConfirmInvoice(options = {}) {
  const qc = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ maHoaDon, ...payload }) =>
      confirmInvoice(maHoaDon, payload),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["history", "transactions"] });
      if (typeof onSuccess === "function") {
        onSuccess(data, vars, ctx);
      }
    },
    ...rest,
  });
}

/* =========================================================
 * 5. VIETQR — Tạo mã QR thanh toán
 * Backend: POST /api/billing/invoices/{maHoaDon}/generate-qr
 * =======================================================*/

// Tạo mã QR VietQR cho hóa đơn
export async function generateVietQR(maHoaDon, payload = {}) {
  if (!maHoaDon) throw new Error("Thiếu mã hóa đơn");
  const body = {
    SoTien: payload.SoTien ?? payload.soTien ?? payload.amount ?? 0,
    NoiDung: payload.NoiDung ?? payload.noiDung ?? payload.memo ?? null,
  };
  const res = await http.post(`${BASE}/invoices/${maHoaDon}/generate-qr`, body);
  return res.data; // VietQRResponse { QrDataUrl, BankName, AccountNo, AccountName, SoTien, NoiDung }
}

export function useGenerateVietQR(options = {}) {
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ maHoaDon, ...payload }) =>
      generateVietQR(maHoaDon, payload),
    onSuccess: (data, vars, ctx) => {
      if (typeof onSuccess === "function") {
        onSuccess(data, vars, ctx);
      }
    },
    ...rest,
  });
}

/* =========================================================
 * 6. REALTIME — Subscribe to Invoice changes (SignalR)
 * Backend broadcasts: InvoiceChanged(InvoiceDto)
 * Sent to: admin nurses + admin role groups
 * =======================================================*/

/**
 * Subscribe to realtime invoice changes from SignalR.
 * Invalidates and refetches the invoice query cache when an invoice is
 * created, updated, cancelled, or confirmed on the backend.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @returns {() => void} unsubscribe function
 */
export function subscribeBillingRealtime(queryClient) {
  const handler = async (dto) => {
    console.log("[BILLING-RT] 📋 InvoiceChanged:", dto?.MaHoaDon ?? dto?.maHoaDon, dto?.TrangThai ?? dto?.trangThai);

    if (queryClient && typeof queryClient.invalidateQueries === "function") {
      // Invalidate all invoice search queries (công nợ + bảo lưu tabs)
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Refetch only the actively mounted queries
      await queryClient.refetchQueries?.({ queryKey: ["invoices"], type: "active" });

      // Also invalidate history/transactions if needed
      const pid = dto?.MaBenhNhan ?? dto?.maBenhNhan;
      if (pid) {
        await queryClient.invalidateQueries({ queryKey: ["transactions", pid] });
        await queryClient.invalidateQueries({ queryKey: ["patient", pid] });
      }
    }
  };

  // Backend event name: InvoiceChanged (defined in IRealtimeClient.cs)
  const offInvoiceChanged = on("InvoiceChanged", handler);

  return () => {
    offInvoiceChanged?.();
  };
}
