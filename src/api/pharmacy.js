// src/api/pharmacy.js
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockEnabled, mockPharmacyApi } from "./mockData.js";
import { on } from "./realtime.js";

/** ================== AXIOS INSTANCE ================== */
// Có thể chỉnh baseURL theo BE của anh, tạm để relative cho an toàn
const api = axios.create({
  // baseURL: "/api", // nếu BE mount dưới /api thì bật dòng này
  withCredentials: true,
});

/** ================== NORMALIZE HELPERS ================== */

function normalizeDrug(dto = {}) {
  const code = dto.code || dto.maThuoc || dto.MaThuoc;
  const name = dto.name || dto.tenThuoc || dto.TenThuoc;
  const unit = dto.unit || dto.donViTinh || dto.DonViTinh;

  const price =
    dto.price ??
    dto.giaNiemYet ??
    dto.GiaNiemYet ??
    dto.giaBanLe ??
    dto.GiaBanLe ??
    0;

  const usage = dto.usage || dto.congDung || dto.CongDung || "";

  const qty = dto.qty ?? dto.soLuongTon ?? dto.SoLuongTon ?? 0;

  const exp =
    dto.exp ||
    dto.hanSuDung ||
    dto.HanSuDung ||
    dto.ngayHetHan ||
    dto.NgayHetHan ||
    null;

  const lot = dto.lot || dto.soLo || dto.SoLo || "";

  const status = dto.status || dto.trangThai || dto.TrangThai || "hoat_dong";

  return { code, name, unit, price, usage, qty, exp, lot, status };
}

function normalizePrescription(dto = {}) {
  const id = dto.id || dto.maDonThuoc || dto.MaDonThuoc;

  const at =
    dto.at ||
    dto.thoiGianKeDon ||
    dto.ThoiGianKeDon ||
    dto.ngayKeDon ||
    dto.NgayKeDon ||
    null;

  const ptId =
    dto.ptId ||
    dto.maBenhNhan ||
    dto.MaBenhNhan ||
    dto.benhNhan?.maBenhNhan ||
    dto.BenhNhan?.MaBenhNhan ||
    null;

  const ptName =
    dto.ptName ||
    dto.tenBenhNhan ||
    dto.TenBenhNhan ||
    dto.benhNhan?.hoTen ||
    dto.benhNhan?.tenBenhNhan ||
    dto.BenhNhan?.HoTen ||
    "";

  const doctor =
    dto.doctor ||
    dto.bacSiKeDon ||
    dto.BacSiKeDon ||
    dto.bacSiKeDon?.hoTen ||
    dto.BacSiKeDon?.HoTen ||
    "";

  const diag =
    dto.diag ||
    dto.chanDoan ||
    dto.ChanDoan ||
    dto.chuanDoanChinh ||
    dto.ChuanDoanChinh ||
    "";

  const rawStatus = dto.status || dto.trangThai || dto.TrangThai || "da_ke";
  let status = rawStatus;

  // FE quy ước:
  // - done      -> đã phát
  // - pending   -> chờ phát / đã kê
  if (rawStatus === "da_phat") status = "done";
  else if (rawStatus === "cho_phat" || rawStatus === "da_ke") status = "pending";

  const total = dto.total ?? dto.tongTienDon ?? dto.TongTienDon ?? 0;

  const itemsSrc =
    dto.items ??
    dto.Items ??
    dto.chiTiet ??
    dto.ChiTiet ??
    dto.chiTietDonThuocs ??
    dto.ChiTietDonThuocs ??
    [];

  const items = (itemsSrc || []).map((it) => ({
    code: it.code || it.maThuoc || it.MaThuoc,
    name: it.name || it.tenThuoc || it.TenThuoc,
    unit: it.unit || it.donViTinh || it.DonViTinh,
    dose: it.dose || it.lieuDung || it.LieuDung || "",
    qty: it.qty ?? it.soLuong ?? it.SoLuong ?? 0,
    price: it.price ?? it.donGia ?? it.DonGia ?? 0,
  }));

  return { id, at, ptId, ptName, doctor, diag, status, total, items };
}

/** ================== RAW API (axios) ================== */

export async function getStock() {
  if (mockEnabled) {
    const list = await mockPharmacyApi.listStock();
    return list.map(normalizeDrug);
  }

  const res = await api.get("/pharmacy/stock");
  const data = res.data;
  const list = data?.items || data || [];
  return list.map(normalizeDrug);
}

export async function getRxOrders() {
  if (mockEnabled) {
    const list = await mockPharmacyApi.listPrescriptions();
    return list.map(normalizePrescription);
  }

  const res = await api.get("/pharmacy/prescriptions");
  const data = res.data;
  const list = data?.items || data || [];
  return list.map(normalizePrescription);
}

export async function upsertStockItem(form) {
  if (mockEnabled) {
    const saved = await mockPharmacyApi.upsertStock(form);
    return normalizeDrug(saved);
  }

  // Map form FE -> DTO BE
  const payload = {
    maThuoc: form.code,
    tenThuoc: form.name,
    donViTinh: form.unit,
    giaNiemYet: form.price ?? 0,
    congDung: form.usage || undefined,
    soLuongTon: form.qty ?? 0,
    soLo: form.lot || undefined,
  };

  if (form.exp) {
    // Giả định input là yyyy-MM-dd
    payload.hanSuDung = form.exp;
  }

  const res = await api.post("/pharmacy/stock", payload);
  return normalizeDrug(res.data);
}

/** ================== REACT QUERY HOOKS ================== */

export function useStock(options = {}) {
  return useQuery({
    queryKey: ["pharmacy", "stock"],
    queryFn: getStock,
    staleTime: 60_000,
    ...options,
  });
}

export function useRxOrders(options = {}) {
  return useQuery({
    queryKey: ["pharmacy", "rxOrders"],
    queryFn: getRxOrders,
    staleTime: 60_000,
    ...options,
  });
}

export function useUpsertStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertStockItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy", "stock"] });
      qc.invalidateQueries({ queryKey: ["pharmacy", "rxOrders"] });
    },
  });
}

/** ================== REALTIME (SignalR / WS) ================== */
// Server emit: { type: "rx_order_updated" | "stock_upserted" | "stock_deleted", ... }
export function subscribePharmacy(handler) {
  return on("pharmacy.updated", (evt) => {
    if (typeof handler === "function") handler(evt);
  });
}
