// src/api/staff.js
import { http } from "./http.js";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime.js";

/* ============ Helper: build payload search ============ */

function buildStaffSearchPayload(params = {}) {
  const {
    role,
    q,
    status,
    nurseKind,
    dept,
    page,
    pageSize,
    sortBy,
    sortDirection,
  } = params;

  const payload = {
    // map sang StaffSearchFilter trong API
    Keyword: q || undefined,             // string? Keyword
    MaKhoa: dept || undefined,           // string? MaKhoa
    VaiTro: role || undefined,           // bac_si | y_ta
    TrangThaiCongTac: status || undefined, // dang_cong_tac, tam_nghi, nghi_viec
    // BE có thể bỏ qua nếu không support
    LoaiYTa: nurseKind || undefined,
    SortBy: sortBy || undefined,         // "HoTen", ...
    SortDirection: sortDirection || undefined, // "asc" | "desc"
    Page: page ?? 1,
    PageSize: pageSize ?? 50,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined || payload[k] === null || payload[k] === "") {
      delete payload[k];
    }
  });

  return payload;
}

function mapTrangThaiToUi(trangThai) {
  const v = (trangThai || "").toString().toLowerCase();
  // Domain: dang_cong_tac, tam_nghi, nghi_viec...
  if (v === "dang_cong_tac") return "online";
  if (v === "tam_nghi") return "pause";
  return "offline"; // nghi_viec, hoặc khác → xem như offline
}
// Thay toàn bộ hàm cũ bằng hàm này
function normalizeStaffCard(dto) {
  if (!dto) return null;

  const maNhanVien = dto.MaNhanVien ?? dto.maNhanVien;
  const vaiTro = dto.VaiTro ?? dto.vaiTro;
  const trangThai =
    dto.TrangThaiCongTac ?? dto.trangThaiCongTac ?? "dang_cong_tac";

  const uiStatus = mapTrangThaiToUi(trangThai);

  const soLichHen =
    dto.SoLichHenHomNay ?? dto.soLichHenHomNay ?? 0;
  const soCaTruc =
    dto.SoCaTrucTuanNay ?? dto.soCaTrucTuanNay ?? 0;
  const soCaLamClsHomNay =
    dto.SoCaLamClsHomNay ?? dto.soCaLamClsHomNay ?? 0;

  const tenPhongHomNay =
    dto.TenPhongHomNay ?? dto.tenPhongHomNay ?? null;
  const tenPhongPhuTrach =
    dto.TenPhongPhuTrach ?? dto.tenPhongPhuTrach ?? null;
  const maPhongPhuTrach =
    dto.MaPhongPhuTrach ?? dto.maPhongPhuTrach ?? null;

  return {
    raw: dto,

    // ID
    id: maNhanVien,
    maNhanSu: maNhanVien,
    maNhanVien,

    // Thông tin hiển thị
    name: dto.HoTen ?? dto.hoTen,
    hoTen: dto.HoTen ?? dto.hoTen,
    role: vaiTro,
    vaiTro,

    maKhoa: dto.MaKhoa ?? dto.maKhoa ?? null,
    tenKhoa: dto.TenKhoa ?? dto.tenKhoa ?? null,
    dept:
      dto.TenKhoa ??
      dto.tenKhoa ??
      dto.MaKhoa ??
      dto.maKhoa ??
      null,

    hocVi: dto.HocVi ?? dto.hocVi ?? null,
    chuyenKhoa: dto.ChuyenKhoa ?? dto.chuyenKhoa ?? null,

    email: dto.Email ?? dto.email ?? null,
    dienThoai: dto.DienThoai ?? dto.dienThoai ?? null,
    phone: dto.DienThoai ?? dto.dienThoai ?? null,

    avatarUrl: dto.AnhDaiDien ?? dto.anhDaiDien ?? null,
    anhDaiDien: dto.AnhDaiDien ?? dto.anhDaiDien ?? null,

    // Trạng thái
    trangThaiCongTac: trangThai,
    status: uiStatus, // online / pause / offline

    // Y tá (nếu có)
    loaiYTa: dto.LoaiYTa ?? dto.loaiYTa ?? null,
    nurseType: dto.LoaiYTa ?? dto.loaiYTa ?? null,
    vai_tro_cong_tac: dto.LoaiYTa ?? dto.loaiYTa ?? null,

    // Phòng / thống kê hôm nay
    maPhongHomNay: dto.MaPhongHomNay ?? dto.maPhongHomNay ?? null,
    tenPhongHomNay,
    maPhongPhuTrach,
    tenPhongPhuTrach,
    // card đang dùng doctorRoom / roomToday
    doctorRoom: vaiTro === "bac_si" ? (tenPhongPhuTrach || tenPhongHomNay) : null,
    clsRoom: vaiTro === "ky_thuat_vien" ? (tenPhongPhuTrach || tenPhongHomNay) : null,
    roomToday: tenPhongHomNay || tenPhongPhuTrach,

    soLichHenHomNay: soLichHen,
    appointmentsToday: soLichHen,
    apptCount: soLichHen,        // để card hiển thị đúng 3
    soCaTrucTuanNay: soCaTruc,
    soCaLamClsHomNay,
  };
}

  
// Thay toàn bộ hàm normalizeStaffDetail cũ bằng hàm này
function normalizeStaffDetail(dto) {
  if (!dto) return null;

  const maNhanVien = dto.MaNhanVien ?? dto.maNhanVien;
  const vaiTro = dto.VaiTro ?? dto.vaiTro;
  const trangThai =
    dto.TrangThaiCongTac ?? dto.trangThaiCongTac ?? "dang_cong_tac";

  const uiStatus = mapTrangThaiToUi(trangThai);

  const soLichHen =
    dto.SoLichHenHomNay ?? dto.soLichHenHomNay ?? 0;
  const soCaTruc =
    dto.SoCaTrucTuanNay ?? dto.soCaTrucTuanNay ?? 0;
  const soCaLamClsHomNay =
    dto.SoCaLamClsHomNay ?? dto.soCaLamClsHomNay ?? 0;

  const tenPhong =
    dto.TenPhongHoacBanHomNay ??
    dto.tenPhongHoacBanHomNay ??
    null;
  const tenPhongPhuTrach =
    dto.TenPhongPhuTrach ?? dto.tenPhongPhuTrach ?? null;
  const maPhongPhuTrach =
    dto.MaPhongPhuTrach ?? dto.maPhongPhuTrach ?? null;

  const kyNang =
    dto.KyNang ??
    dto.kyNang ??
    [];

  return {
    raw: dto,

    id: maNhanVien,
    maNhanVien,
    ma_nhan_vien: maNhanVien,

    name: dto.HoTen ?? dto.hoTen,
    hoTen: dto.HoTen ?? dto.hoTen,
    vaiTro,
    role: vaiTro,

    tenKhoa: dto.TenKhoa ?? dto.tenKhoa ?? null,
    dept: dto.TenKhoa ?? dto.tenKhoa ?? dto.MaKhoa ?? dto.maKhoa ?? null,

    trangThaiCongTac: trangThai,
    status: uiStatus,

    hocVi: dto.HocVi ?? dto.hocVi ?? null,
    degree: dto.HocVi ?? dto.hocVi ?? null,
    chuyenKhoa: dto.ChuyenKhoa ?? dto.chuyenKhoa ?? null,
    specialties: dto.ChuyenKhoa ? [dto.ChuyenKhoa] : [],

    soNamKinhNghiem:
      dto.SoNamKinhNghiem ?? dto.soNamKinhNghiem ?? 0,
    so_nam_kinh_nghiem:
      dto.SoNamKinhNghiem ?? dto.soNamKinhNghiem ?? 0,

    email: dto.Email ?? dto.email ?? null,
    dienThoai: dto.DienThoai ?? dto.dienThoai ?? null,
    phone: dto.DienThoai ?? dto.dienThoai ?? null,

    loaiYTa: dto.LoaiYTa ?? dto.loaiYTa ?? null,
    nurseType: dto.LoaiYTa ?? dto.loaiYTa ?? null,
    vai_tro_cong_tac: dto.LoaiYTa ?? dto.loaiYTa ?? null,

    soLichHenHomNay: soLichHen,
    appointmentsToday: soLichHen,
    apptCount: soLichHen,
    soCaTrucTuanNay: soCaTruc,
    soCaLamClsHomNay,

    maPhongHoacBanHomNay:
      dto.MaPhongHoacBanHomNay ?? dto.maPhongHoacBanHomNay ?? null,
    tenPhongHoacBanHomNay: tenPhong,
    maPhongPhuTrach,
    tenPhongPhuTrach,
    doctorRoom: vaiTro === "bac_si" ? (tenPhongPhuTrach || tenPhong) : null,
    clsRoom: vaiTro === "ky_thuat_vien" ? (tenPhongPhuTrach || tenPhong) : null,
    roomToday: tenPhong || tenPhongPhuTrach,

    kyNang,
    skills: kyNang,
  };
}


function normalizeStaffDutyWeek(dto) {
  if (!dto) return null;

  const items = dto.Items ?? dto.items ?? [];

  const week = items.map((d) => {
    const rawShift = d.CaTruc ?? d.caTruc ?? null;
    let shift = rawShift;

    if (rawShift) {
      const s = rawShift.toString().toLowerCase().trim();
      if (s === "sang") shift = "Sáng";
      else if (s === "chieu" || s === "chiều") shift = "Chiều";
      else if (s === "toi" || s === "tối") shift = "Tối";
    }

    return {
      raw: d,
      day: d.Thu ?? d.thu, // "Mon", "Tue", ...
      shift,
      gioBatDau: d.GioBatDau ?? d.gioBatDau,
      gioKetThuc: d.GioKetThuc ?? d.gioKetThuc,
      maPhong: d.MaPhong ?? d.maPhong,
      tenPhong: d.TenPhong ?? d.tenPhong,
      trangThaiLamViec: d.TrangThaiLamViec ?? d.trangThaiLamViec,
    };
  });

  return {
    raw: dto,
    maNhanVien: dto.MaNhanVien ?? dto.maNhanVien,
    hoTen: dto.HoTen ?? dto.hoTen,
    vaiTro: dto.VaiTro ?? dto.vaiTro,
    tenKhoa: dto.TenKhoa ?? dto.tenKhoa,
    today: dto.Today ?? dto.today,
    caHomNay: dto.CaHomNay ?? dto.caHomNay,
    trangThaiLamViecHomNay:
      dto.TrangThaiLamViecHomNay ?? dto.trangThaiLamViecHomNay,
    tenPhongHoacBanHomNay:
      dto.TenPhongHoacBanHomNay ?? dto.tenPhongHoacBanHomNay,
    maPhongHoacBanHomNay:
      dto.MaPhongHoacBanHomNay ?? dto.maPhongHoacBanHomNay,
    week,
  };
}

function normalizeDutyRoomsFromDutyWeek(dto) {
  if (!dto) return { today: null, week: [] };

  const today =
    dto.MaPhongHoacBanHomNay || dto.TenPhongHoacBanHomNay
      ? {
          maPhong:
            dto.MaPhongHoacBanHomNay ?? dto.maPhongHoacBanHomNay ?? null,
          tenPhong:
            dto.TenPhongHoacBanHomNay ?? dto.tenPhongHoacBanHomNay ?? null,
        }
      : null;

  const items = dto.Items ?? dto.items ?? [];
  const week = items.map((d) => ({
    day: d.Thu ?? d.thu,
    maPhong: d.MaPhong ?? d.maPhong,
    tenPhong: d.TenPhong ?? d.tenPhong,
    caTruc: d.CaTruc ?? d.caTruc,
    gioBatDau: d.GioBatDau ?? d.gioBatDau,
    gioKetThuc: d.GioKetThuc ?? d.gioKetThuc,
  }));

  return { today, week };
}

/* ============ Core REST ============ */

/**
 * Search staff cards:
 * POST /master-data/staff/cards/search (SearchStaffCards)
 * Body: StaffSearchFilter
 * Return: PagedResult<StaffCardDto>
 */
export const listStaff = async (params = {}) => {
  const payload = buildStaffSearchPayload(params);
  const res = await http.post("/master-data/staff/cards/search", payload);

  const paged = res.data || res; // axios: res.data là body

  const itemsRaw = paged.Items ?? paged.items ?? [];
  const items = itemsRaw.map(normalizeStaffCard).filter(Boolean);

  return {
    ...paged,
    items,
    totalItems: paged.TotalItems ?? paged.totalItems ?? items.length,
    page: paged.Page ?? paged.page ?? 1,
    pageSize: paged.PageSize ?? paged.pageSize ?? items.length,
  };
};

/**
 * GET /master-data/staff/{maNhanVien} (GetStaffDetail)
 */
export const getStaff = async (id) => {
  if (!id) throw new Error("Missing staff id");
  const res = await http.get(`/master-data/staff/${id}`);

  return normalizeStaffDetail(res.data || res);
};

/**
 * GET /master-data/staff/{maNhanVien}/duty-week (GetStaffDutyWeek)
 * today: string "yyyy-MM-dd" (optional)
 */
export const getStaffDutyWeek = async (id, today) => {
  if (!id) throw new Error("Missing staff id");

  const res = await http.get(`/master-data/staff/${id}/duty-week`, {
    params: today ? { today } : undefined,
  });

  return normalizeStaffDutyWeek(res.data || res);
};

export const updateStaffDutyWeek = async ({ id, data }) => {
  if (!id) throw new Error("Missing staff id");
  const res = await http.put(`/master-data/staff/${id}/duty-week`, data);
  return normalizeStaffDutyWeek(res.data || res);
};

/**
 * Dựa trên duty-week, suy ra phòng làm việc hôm nay + cả tuần.
 * FE dùng cho roomToday + weekRoom trong StaffDetail / StaffSchedule.
 */
export const getStaffDutyRoom = async (id, today) => {
  const dutyWeek = await getStaffDutyWeek(id, today);
   // getStaffDutyWeek đã normalize: { raw, maNhanVien, week, ... }
   // Dùng raw (DTO gốc từ BE) để suy ra phòng/bàn cho đúng.
   return normalizeDutyRoomsFromDutyWeek(dutyWeek?.raw || dutyWeek);
 };
 

/**
 * Thống kê staff cho toolbar: online / pause / offline + số khoa
 * FE chỉ cần stats.online, stats.idle, stats.offline, stats.depts.
 */
export const getStaffStats = async (params = {}) => {
  const data = await listStaff({ ...params, page: 1, pageSize: 1000 });
  const items = data.items || [];

  let online = 0;
  let idle = 0;
  let offline = 0;
  const deptSet = new Set();

  for (const s of items) {
    const st = (s.status || "").toString().toLowerCase();
    if (st === "online") online++;
    else if (st === "pause") idle++;
    else offline++;

    if (s.maKhoa || s.dept) {
      deptSet.add(s.maKhoa || s.dept);
    }
  }

  return {
    online,
    idle,
    offline,
    depts: deptSet.size,
  };
};

/**
 * GET /master-data/departments (GetDepartments)
 */
export const listDepartments = async () => {
  const res = await http.get("/master-data/departments");

  return res.data || res;
};

/**
 * Cập nhật trạng thái công tác nhân viên.
 * ⚠️ Backend cần implement:
 * PUT /master-data/staff/{id}/status
 * Body: { TrangThaiCongTac }
 */
export const updateStaffStatus = async ({ id, status }) => {
  if (!id) throw new Error("Missing staff id");
  if (!status) throw new Error("Missing status");

  const body = { TrangThaiCongTac: status };
  const res = await http.put(`/master-data/staff/${id}/status`, body);

  return res.data || res;
};

/* ============ React Query hooks (chuẩn với Staff.jsx) ============ */

/**
 * Hook chính cho Staff.jsx
 * useStaff({ role, q, status, nurseKind, dept })
 */
export function useStaff(filters, options) {
  return useQuery({
    queryKey: ["staff-cards", filters],
    queryFn: () => listStaff(filters),
    select: (res) => {
      // ✅ listStaff đã trả về PagedResult, chuẩn hóa về format chung
      if (res && typeof res === "object") {
        return {
          Items: res.items || res.Items || [],
          TotalItems: res.TotalItems ?? res.totalItems ?? (res.items?.length ?? 0),
          Page: res.Page ?? res.page ?? (filters?.page ?? 1),
          PageSize: res.PageSize ?? res.pageSize ?? (filters?.pageSize ?? 50),
        };
      }
      // Fallback
      const items = Array.isArray(res) ? res : [];
      return {
        Items: items,
        TotalItems: items.length,
        Page: filters?.page ?? 1,
        PageSize: filters?.pageSize ?? 50,
      };
    },
    keepPreviousData: true,
    ...options,
  });
}

/**
 * Thống kê online/pause/offline + số khoa cho toolbar
 */
export function useStaffStats(filters, options) {
  return useQuery({
    queryKey: ["staff-stats", filters],
    queryFn: () => getStaffStats(filters),
    ...options,
  });
}

/**
 * Lịch tuần chi tiết (duty-week) cho 1 nhân sự
 * Staff.jsx dùng để build scheduleMap
 */
export function useStaffSchedule(id, options) {
  return useQuery({
    enabled: !!id && (options?.enabled ?? true),
    queryKey: ["staff-duty-week", id],
    queryFn: () => getStaffDutyWeek(id),
    ...options,
  });
}

/**
 * Thông tin phòng làm việc hôm nay + tuần (roomToday, weekRoom)
 * Staff.jsx dùng: useDutyRoom(activeId, todayStr)
 */
export function useDutyRoom(id, today, options) {
  return useQuery({
    enabled: !!id && (options?.enabled ?? true),
    queryKey: ["staff-duty-room", id, today || null],
    queryFn: () => getStaffDutyRoom(id, today),
    ...options,
  });
}

/**
 * Hook lấy master data Khoa
 */
export function useDepartments(options) {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => listDepartments(),
    ...options,
  });
}

/**
 * Các hook cũ vẫn giữ lại để không phá chỗ khác (nếu có)
 */
export function useStaffListQuery(filters, options) {
  return useStaff(filters, options);
}

export function useStaffDetailQuery(id, options) {
  return useQuery({
    enabled: !!id && (options?.enabled ?? true),
    queryKey: ["staff-detail", id],
    queryFn: () => getStaff(id),
    ...options,
  });
}

/* ============ Realtime (SignalR) ============ */
// server needs to broadcast: "staff.updated", "staff.status.changed", "staff.schedule.updated"
export async function subscribeStaff(qc) {
  await ensureStarted();

  if (!qc || typeof qc.invalidateQueries !== "function") {
    return () => {};
  }

  const offs = [];
  offs.push(
    on("staff.updated", ({ id }) => {
      qc.invalidateQueries({ queryKey: ["staff-cards"] });
      if (id) {
        qc.invalidateQueries({ queryKey: ["staff-detail", id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-week", id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", id] });
      }
    })
  );
  offs.push(
    on("staff.status.changed", ({ id }) => {
      qc.invalidateQueries({ queryKey: ["staff-cards"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      if (id) {
        qc.invalidateQueries({ queryKey: ["staff-detail", id] });
      }
    })
  );
  offs.push(
    on("staff.schedule.updated", ({ id }) => {
      if (id) {
        qc.invalidateQueries({ queryKey: ["staff-duty-week", id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", id] });
      }
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
      qc.invalidateQueries({ queryKey: ["duty"] });
      qc.invalidateQueries({ queryKey: ["room-duty-week"] });
    })
  );
  return () => offs.forEach((off) => off && off());
}

/* ============ Mutation hook ============ */

export function useUpdateStaffStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStaffStatus,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["staff-cards"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      if (vars?.id) {
        qc.invalidateQueries({ queryKey: ["staff-detail", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-week", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", vars.id] });
      }
    },
  });
}

export function useUpdateStaffDutyWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStaffDutyWeek({ id, data }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["staff-cards"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
      if (vars?.id) {
        qc.invalidateQueries({ queryKey: ["staff-duty-week", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-detail", vars.id] });
      }
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
      qc.invalidateQueries({ queryKey: ["duty"] });
      qc.invalidateQueries({ queryKey: ["room-duty-week"] });
    },
  });
}
