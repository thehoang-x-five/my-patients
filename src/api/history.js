// src/api/history.js
// API & hooks cho trang Lịch sử (Khám bệnh + Giao dịch)

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { on } from "./realtime.js";
import { mockEnabled } from "./mockData.js";
import { mockHistoryApi } from "./historyMock.js";

const api = axios.create({
  // baseURL: "/api",
  withCredentials: true,
});

/* ===================== HELPERS ===================== */

// xác định khoa dịch vụ cho FE
export function isServiceDept(dept) {
  if (!dept) return false;
  const text = String(
    typeof dept === "string" ? dept : dept.name || dept.tenKhoa || ""
  ).toLowerCase();
  return text.includes("dịch vụ") || text.includes("dv ");
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

function normalizeVisit(dto = {}) {
  return {
    date:
      dto.date ||
      dto.ngayKham ||
      dto.NgayKham ||
      dto.thoiGian ||
      dto.ThoiGian ||
      null,
    id:
      dto.id ||
      dto.maBenhNhan ||
      dto.MaBenhNhan ||
      dto.benhNhan?.maBenhNhan ||
      dto.BenhNhan?.MaBenhNhan ||
      "",
    name:
      dto.name ||
      dto.tenBenhNhan ||
      dto.TenBenhNhan ||
      dto.benhNhan?.hoTen ||
      dto.BenhNhan?.HoTen ||
      "",
    dept:
      dto.dept ||
      dto.tenKhoa ||
      dto.TenKhoa ||
      dto.khoa?.tenKhoa ||
      dto.Khoa?.TenKhoa ||
      "",
    doctor:
      dto.doctor ||
      dto.bacSi ||
      dto.BacSi ||
      dto.bacSiKham?.hoTen ||
      dto.BacSiKham?.HoTen ||
      "",
    note: dto.note || dto.ghiChu || dto.GhiChu || "",
    diagnosis: dto.diagnosis || dto.chanDoan || dto.ChanDoan || {},
    examRows: dto.examRows || [],
    services: dto.services || [],
    fees: dto.fees || {},
    prescriptionId: dto.prescriptionId || dto.maDonThuoc || dto.MaDonThuoc,
    type: dto.type || dto.loaiLuot || dto.LoaiLuot || "clinic",
  };
}

function normalizeTransaction(dto = {}) {
  const thoiGian =
    dto.thoiGian || dto.ThoiGian || dto.date || dto.ngayThu || dto.NgayThu;
  const date = thoiGian ? new Date(thoiGian).toISOString() : null;

  const soTien = dto.soTien || dto.SoTien || dto.amount || dto.money || 0;

  return {
    invoiceId: dto.maHoaDon || dto.MaHoaDon || dto.invoiceId || dto.id,
    date,
    id:
      dto.maBenhNhan ||
      dto.MaBenhNhan ||
      dto.idBenhNhan ||
      dto.IdBenhNhan ||
      dto.ptId ||
      "",
    name:
      dto.benhNhan?.hoTen ||
      dto.BenhNhan?.HoTen ||
      dto.tenBenhNhan ||
      dto.TenBenhNhan ||
      dto.name ||
      "",
    amount: soTien,
    money: soTien,
    content: dto.noiDung || dto.NoiDung || dto.content || "",
    kind: dto.loaiDotthu || dto.LoaiDotthu || dto.kind || "kham_lam_sang",
    status: dto.trangThai || dto.TrangThai || dto.status || "da_thu",
    method:
      dto.phuongThucThanhToan ||
      dto.PhuongThucThanhToan ||
      dto.method ||
      "tien_mat",
    staffId: dto.maNhanSuThu || dto.MaNhanSuThu || dto.staffId || "",
    staffName:
      dto.nhanSuThu?.hoTen ||
      dto.NhanSuThu?.HoTen ||
      dto.tenNhanSuThu ||
      dto.TenNhanSuThu ||
      dto.staffName ||
      "",
    examId: dto.maPhieuKham || dto.MaPhieuKham || null,
    clsId: dto.maPhieuKhamCls || dto.MaPhieuKhamCls || null,
    rxId: dto.maDonThuoc || dto.MaDonThuoc || dto.rxId || null,
  };
}

/* ===================== RAW FETCHERS ===================== */

export async function getHistoryVisits() {
  if (mockEnabled) {
    // Mock trả về đúng shape FE luôn
    const list = await mockHistoryApi.listVisits();
    return list;
  }

  const res = await api.get("/history/visits");
  const data = res.data;
  const list = data?.items || data || [];
  return list.map(normalizeVisit);
}

export async function getHistoryTransactions() {
  if (mockEnabled) {
    const list = await mockHistoryApi.listTransactions();
    return list;
  }

  const res = await api.get("/history/transactions");
  const data = res.data;
  const list = data?.items || data || [];
  return list.map(normalizeTransaction);
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
