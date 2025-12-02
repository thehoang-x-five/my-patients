// src/api/billing.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";

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
    PhuongThucThanhToan: payload.PhuongThucThanhToan ?? payload.phuongThucThanhToan ?? payload.paymentMethod ?? "tien_mat",
    NoiDung: payload.NoiDung ?? payload.noiDung ?? payload.content ?? payload.item ?? "",
    
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
    Keyword: filter.Keyword ?? filter.keyword ?? null,
    Page: filter.Page ?? filter.page ?? 1,
    PageSize: filter.PageSize ?? filter.pageSize ?? 20,
  };

  const res = await http.post(`${BASE}/invoices/search`, body);
  return res.data; // PagedResult<InvoiceHistoryRecordDto>
}

// Cập nhật trạng thái hóa đơn (Hủy, Hoàn tác...)
// PUT /api/billing/invoices/{maHoaDon}/status
export async function updateInvoiceStatus({ id, status }) {
  if (!id || !status) throw new Error("Thiếu id hoặc status");
  const body = { TrangThai: status }; // InvoiceStatusUpdateRequest 
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

export function useSearchInvoices(filter) {
  return useQuery({
    queryKey: ["invoices", filter],
    queryFn: () => searchInvoices(filter),
    keepPreviousData: true,
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