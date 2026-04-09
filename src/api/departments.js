// src/api/departments.js
// Khoa / phòng / lịch trực / dịch vụ theo MasterDataController
// Mapping theo API_Health_full_with_tables_updated_full.docx:
//  1. Departments overview (DepartmentOverviewDto)
//     GET  /api/master-data/departments/overview   -> getDepartmentsOverview / useDepartments
//  2. Danh sách khoa
//     GET  /api/master-data/departments            -> join tên khoa cho RoomDto
//  3. Tìm kiếm phòng (RoomSearchFilter)
//     POST /api/master-data/rooms/search           -> listDepartments (phòng + khoa)
//  4. Lịch trực điều dưỡng
//     GET  /api/master-data/duty-schedules         -> getDutyByRoom / useDutyByRoom
//  5. Dịch vụ theo phòng
//     GET  /api/master-data/services               -> listServicesByRoom / useServicesByRoom
//  6. Bác sĩ theo khoa (StaffOverviewDto)
//     GET  /api/master-data/staff/overview         -> useDoctorQueueByDept

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";
import { ensureStarted, on } from "./realtime.js";
import { formatStatus } from "../utils/textFormatters.js";

/* ========= Helpers chung ========= */

function normalizeListLike(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  return [];
}

function cleanupFilter(obj) {
  const copy = { ...obj };
  Object.keys(copy).forEach((k) => {
    const v = copy[k];
    if (v === undefined || v === null || v === "") {
      delete copy[k];
    }
  });
  return copy;
}

// at = { ngay, gio } – nếu không truyền thì mặc định lấy thời điểm hiện tại
function buildAt(at) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  const defaultNgay = now.toISOString().slice(0, 10); // yyyy-MM-dd
  const defaultGio = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds()
  )}`;

  if (!at) {
    return { ngay: defaultNgay, gio: defaultGio };
  }

  return {
    ngay: at.ngay || defaultNgay,
    gio: at.gio || defaultGio,
  };
}

/* ========= Normalizer: DepartmentOverviewDto ========= */
/**
 * DepartmentOverviewDto:
 *  - string MaKhoa
 *  - string TenKhoa
 *  - int SoPhongKham
 *  - int SoPhongCls
 *  - int TongSoPhong
 *  - int SoBacSiDangCongTac
 */
function normalizeDepartmentOverview(dto) {
  if (!dto) return null;

  const code = dto.MaKhoa || dto.maKhoa || dto.code || dto.id;

  return {
    _raw: dto,

    id: code,
    code,
    maKhoa: code,
    deptCode: code,

    name: dto.TenKhoa || dto.tenKhoa || "",
    tenKhoa: dto.TenKhoa || dto.tenKhoa || "",

    totalRooms: dto.TongSoPhong ?? dto.tongSoPhong ?? 0,
    tongSoPhong: dto.TongSoPhong ?? dto.tongSoPhong ?? 0,

    examRooms: dto.SoPhongKham ?? dto.soPhongKham ?? 0,
    soPhongKham: dto.SoPhongKham ?? dto.soPhongKham ?? 0,

    clsRooms: dto.SoPhongCls ?? dto.soPhongCls ?? 0,
    soPhongCls: dto.SoPhongCls ?? dto.soPhongCls ?? 0,

    activeDoctors: dto.SoBacSiDangCongTac ?? dto.soBacSiDangCongTac ?? 0,
    soBacSiDangCongTac:
      dto.SoBacSiDangCongTac ?? dto.soBacSiDangCongTac ?? 0,
  };
}
// ========== Normalizer: RoomCardDto (card grid) ==========
/**
 * RoomCardDto:
 *  - MaPhong, TenPhong, TenKhoa, LoaiPhong, TrangThai
 *  - MaBacSiPhuTrach, TenBacSiPhuTrach
 *  - DienThoai, Email
 *  - DangCho, DaHoanThanh, TongHomNay
 */
function normalizeRoomCard(dto) {
  if (!dto) return null;

  const code =
    dto.MaPhong || dto.maPhong || dto.ma_phong || dto.code || dto.id || "";
  const roomName =
    dto.TenPhong || dto.tenPhong || dto.ten_phong || dto.name || "";
  const deptName =
    dto.TenKhoa || dto.tenKhoa || dto.ten_khoa || dto.deptName || "";
  const roomType =
    dto.LoaiPhong || dto.loaiPhong || dto.loai_phong || dto.type || "";

  const statusRaw =
    dto.TrangThai ||
    dto.trangThai ||
    dto.trang_thai ||
    dto.status ||
    "hoat_dong";
  const isActive = String(statusRaw).toLowerCase() === "hoat_dong";

  const doctorInCharge =
    dto.TenBacSiPhuTrach ||
    dto.tenBacSiPhuTrach ||
    dto.BacSiPhuTrach ||
    dto.bacSiPhuTrach ||
    null;

  const nurseInCharge = null; // DTO RoomCardDto chưa có, để trống

  const waitingPatients = dto.DangCho ?? dto.dangCho ?? 0;
  const examinedPatients = dto.DaHoanThanh ?? dto.daHoanThanh ?? 0;
  const totalToday = dto.TongHomNay ?? dto.tongHomNay ?? 0;

  return {
    _raw: dto,

    id: code,
    roomId: code,
    code,
    maPhong: code,
    short: roomName?.trim()?.charAt(0)?.toUpperCase() || "P",

    name: deptName,
    tenKhoa: deptName,
    deptName,

    room: {
      id: code,
      number: code,      // dùng mã phòng làm "số phòng"
      name: roomName,
      type: roomType,
      loaiPhong: roomType,
      status: isActive,
      phone: dto.DienThoai || dto.dienThoai || "",
      email: dto.Email || dto.email || "",
      area: null,
      capacity: null,
    },

    roomType,
    loaiPhong: roomType,

    status: isActive ? "active" : "inactive",
    trangThai: statusRaw,

    doctorInCharge,
    nurseInCharge,

    waitingPatients,
    examinedPatients,
    doneToday: examinedPatients,
    totalToday,
    capacityPerDay: null,
    equipments: [],
  };
}

/* ========= Normalizer: RoomDto + DepartmentDto ========= */
/**
 * RoomDto:
 *  - string MaPhong
 *  - string TenPhong
 *  - string MaKhoa
 *  - string LoaiPhong // phong_kham_ls, phong_cls, thu_ngan...
 *  - int? SucChua
 *  - string? ViTri
 *  - string? Email
 *  - string? DienThoai
 *  - TimeSpan? GioMoCua
 *  - TimeSpan? GioDongCua
 *  - List<string> ThietBi
 *  - string TrangThai // hoat_dong, tam_dung
 *  - string? MaBacSiPhuTrach
 */
function normalizeRoomWithDept(room, deptMap) {
  if (!room) return null;

  const roomId =
    room.MaPhong ||
    room.maPhong ||
    room.ma_phong ||
    room.id ||
    room.code ||
    "";

  const roomName =
    room.TenPhong || room.tenPhong || room.ten_phong || room.name || "";

  const roomType =
    room.LoaiPhong || room.loaiPhong || room.loai_phong || room.type || "";

  const capacity =
    room.SucChua ?? room.sucChua ?? room.capacity ?? room.suc_chua ?? 0;

  const location = room.ViTri || room.viTri || room.location || "";
  const phone = room.DienThoai || room.dienThoai || "";
  const email = room.Email || room.email || "";

  const openTime = room.GioMoCua || room.gioMoCua || null;
  const closeTime = room.GioDongCua || room.gioDongCua || null;

  const equipments = room.ThietBi || room.thietBi || [];

  const deptCode =
    room.MaKhoa || room.maKhoa || room.ma_khoa || room.deptCode || "";

  const deptDto = deptMap?.get(deptCode) || {};
  const deptName =
    deptDto.TenKhoa || deptDto.tenKhoa || deptDto.name || deptDto.ten_khoa || "";

  const trangThai =
    room.TrangThai ||
    room.trangThai ||
    room.trang_thai ||
    room.status ||
    "hoat_dong";

  const isActive = String(trangThai).toLowerCase() === "hoat_dong";

  // Nếu BE sau này bơm thêm các thống kê phòng → map vào đây
  const waitingPatients =
    room.SoBenhNhanDangCho ??
    room.soBenhNhanDangCho ??
    room.waitingPatients ??
    0;
  const inServicePatients =
    room.SoBenhNhanDangKham ??
    room.soBenhNhanDangKham ??
    room.inServicePatients ??
    0;
  const doneToday =
    room.SoBenhNhanDaKhamHomNay ??
    room.soBenhNhanDaKhamHomNay ??
    room.doneToday ??
    0;
  const avgWaitMinutes =
    room.ThoiGianChoTrungBinhPhut ??
    room.thoiGianChoTrungBinhPhut ??
    room.avgWaitMinutes ??
    0;

  const headDoctor =
    room.MaBacSiPhuTrach ||
    room.maBacSiPhuTrach ||
    room.headDoctorCode ||
    null;

  return {
    _raw: room,

    // ID / code phòng
    id: roomId,
    roomId,
    code: roomId,
    maPhong: roomId,
    roomCode: roomId,
    roomNumber: roomId,

    // Tên phòng
    name: roomName,
    tenPhong: roomName,
    roomName,

    // Loại phòng
    roomType,
    loaiPhong: roomType,
    type: roomType,

    // Khoa
    deptCode,
    maKhoa: deptCode,
    deptName,
    tenKhoa: deptName,
    dept: {
      code: deptCode,
      name: deptName,
    },

    // Thông tin bổ sung
    capacity,
    sucChua: capacity,
    location,
    viTri: location,
    phone,
    dienThoai: phone,
    email,
    openTime,
    gioMoCua: openTime,
    closeTime,
    gioDongCua: closeTime,
    equipments,
    thietBi: equipments,

    headDoctor,

    // Thống kê (nếu BE có trả)
    waitingPatients,
    inServicePatients,
    doneToday,
    avgWaitMinutes,

    // Trạng thái hoạt động
    status: isActive ? "active" : "inactive",
    trangThai,
  };
}

/* ========= Normalizer: StaffOverviewDto ========= */
/**
 * StaffOverviewDto:
 *  - string VaiTro – bac_si
 *  - int SoBenhNhanDangCho
 *  - int SoLichHenHomNay
 *  - string TenBS
 */
function normalizeStaffOverview(dto, maKhoa) {
  if (!dto) return null;
  const name =
    dto.TenBS || dto.tenBS || dto.tenBs || dto.ten_bac_si || dto.name || "";

  return {
    _raw: dto,
    id: name,
    code: name,
    name,
    role: dto.VaiTro || dto.vaiTro || "bac_si",
    waiting: dto.SoBenhNhanDangCho ?? dto.soBenhNhanDangCho ?? 0,
    appointments: dto.SoLichHenHomNay ?? dto.soLichHenHomNay ?? 0,
    status: formatStatus("dang_cong_tac"),
    deptCode: maKhoa || "",
  };
}

/* ========= Normalizer: ServiceDto ========= */
/**
 * ServiceDto:
 *  - string MaDichVu
 *  - string TenDichVu
 *  - string LoaiDichVu
 *  - string? MaKhoa
 *  - string? MaPhong
 *  - decimal DonGia
 *  - int ThoiGianDuKienPhut
 */
function normalizeService(dto, fallbackRoomId) {
  if (!dto) return null;

  const code =
    dto.MaDichVu || dto.maDichVu || dto.ma_dich_vu || dto.code || dto.id || "";
  const name =
    dto.TenDichVu || dto.tenDichVu || dto.ten_dich_vu || dto.name || "";
  const loaiDichVu =
    dto.LoaiDichVu || dto.loaiDichVu || dto.loai_dich_vu || dto.type || "";

  const maKhoa = dto.MaKhoa || dto.maKhoa || dto.ma_khoa || "";
  const maPhong =
    dto.MaPhong || dto.maPhong || dto.ma_phong || dto.roomId || fallbackRoomId;

  const donGia = dto.DonGia ?? dto.donGia ?? dto.price ?? 0;
  const thoiGianDuKienPhut =
    dto.ThoiGianDuKienPhut ??
    dto.thoiGianDuKienPhut ??
    dto.expectedMinutes ??
    0;

  const status =
    dto.TrangThai ||
    dto.trangThai ||
    dto.trang_thai ||
    dto.status ||
    "hoat_dong";

  return {
    _raw: dto,
    id: code,
    code,
    name,
    tenDichVu: name,
    loaiDichVu,
    type: loaiDichVu,
    maKhoa,
    maPhong,
    roomId: maPhong,
    price: donGia,
    donGia,
    thoiGianDuKienPhut,
    expectedMinutes: thoiGianDuKienPhut,
    status,
  };
}

/* ========= RoomSearchFilter builder ========= */

function buildRoomSearchFilter(params = {}) {
  const {
    // FE đặt tên
    dept,
    roomType,
    status,
    q,
    keyword,
    page,
    pageSize,
    sortBy,
    sortDirection,
    // BE field
    maKhoa,
    loaiPhong,
    trangThai,
  } = params || {};

  const filter = cleanupFilter({
    Keyword: q ?? keyword,
    MaKhoa: dept ?? maKhoa,
    LoaiPhong: roomType ?? loaiPhong,
    TrangThai: status ?? trangThai,
    SortBy: sortBy,
    SortDirection: sortDirection,
    Page: page ?? 1,
    PageSize: pageSize ?? 50,
  });

  return filter;
}

/* ========= Core REST: Departments overview ========= */

/**
 * GetDepartmentsOverview
 * GET /api/master-data/departments/overview
 * Query: ngay, gio
 * Output: IReadOnlyList<DepartmentOverviewDto>
 */
export const getDepartmentsOverview = async (at) => {
  const { ngay, gio } = buildAt(at);

  const res = await http.get("/master-data/departments/overview", {
    params: { ngay, gio },
  });

  const data = res.data ?? res;
  const arr = normalizeListLike(data);
  return arr.map(normalizeDepartmentOverview).filter(Boolean);
};

/**
 * List rooms + join tên khoa (RoomDto + DepartmentDto)
 * POST /api/master-data/rooms/search
 * + GET /api/master-data/departments
 */
export const listDepartments = async (params = {}) => {
  // 1) rooms (RoomCardDto)
  const filter = buildRoomSearchFilter(params);
  const res = await http.post("/master-data/rooms/cards/search", filter);
  const body = res.data ?? res;

  const roomsRaw = normalizeListLike(body);

  // 2) departments (vẫn có thể dùng sau này, nhưng thực ra RoomCardDto đã có TenKhoa)
  let deptMap = new Map();
  try {
    const deptRes = await http.get("/master-data/departments");
    const deptBody = deptRes.data ?? deptRes;
    const deptArr = normalizeListLike(deptBody);
    deptMap = new Map(
      deptArr.map((d) => {
        const code =
          d.MaKhoa || d.maKhoa || d.ma_khoa || d.code || d.id || "";
        return [code, d];
      })
    );
  } catch {
    // ignore
  }

  const items = roomsRaw.map((room) => {
    const card = normalizeRoomCard(room);
    if (!card) return null;

    // nếu BE chưa bơm TenKhoa, fallback từ deptMap
    if (!card.deptName && deptMap.size) {
      const mk =
        room.MaKhoa || room.maKhoa || room.ma_khoa || room.deptCode || "";
      const deptDto = deptMap.get(mk);
      const dk =
        deptDto?.TenKhoa || deptDto?.tenKhoa || deptDto?.ten_khoa || "";
      card.deptName = dk;
      card.tenKhoa = dk;
      card.name = dk;
    }

    return card;
  }).filter(Boolean);

  return {
    ...body,
    items,
    totalItems:
      body.TotalItems ?? body.totalItems ?? body.total ?? items.length,
    page: body.Page ?? body.page ?? filter.Page ?? 1,
    pageSize: body.PageSize ?? body.pageSize ?? filter.PageSize ?? items.length,
  };
};

export const listDepartmentCatalog = async () => {
  const res = await http.get("/master-data/departments");
  const data = res.data ?? res;
  const arr = normalizeListLike(data);

  return arr.map((dto) => ({
    MaKhoa: dto.MaKhoa || dto.maKhoa || dto.code || dto.id || "",
    TenKhoa: dto.TenKhoa || dto.tenKhoa || dto.name || "",
    TrangThai: dto.TrangThai || dto.trangThai || "hoat_dong",
    MoTa: dto.MoTa || dto.moTa || "",
    DienThoai: dto.DienThoai || dto.dienThoai || "",
    Email: dto.Email || dto.email || "",
    DiaDiem: dto.DiaDiem || dto.diaDiem || "",
    GhiChu: dto.GhiChu || dto.ghiChu || "",
  }));
};

export const listRoomCatalog = async (params = {}) => {
  const filter = buildRoomSearchFilter({
    ...params,
    page: params.page || 1,
    pageSize: params.pageSize || 200,
  });

  const [roomRes, deptRes] = await Promise.all([
    http.post("/master-data/rooms/search", filter),
    http.get("/master-data/departments"),
  ]);

  const roomPayload = roomRes.data ?? roomRes;
  const deptPayload = deptRes.data ?? deptRes;
  const roomItems = normalizeListLike(roomPayload);
  const deptItems = normalizeListLike(deptPayload);

  const deptMap = new Map(
    deptItems.map((d) => [
      d.MaKhoa || d.maKhoa || d.code || d.id || "",
      d.TenKhoa || d.tenKhoa || d.name || "",
    ])
  );

  return {
    items: roomItems.map((dto) => ({
      MaPhong: dto.MaPhong || dto.maPhong || dto.code || dto.id || "",
      TenPhong: dto.TenPhong || dto.tenPhong || dto.name || "",
      MaKhoa: dto.MaKhoa || dto.maKhoa || "",
      TenKhoa:
        dto.TenKhoa || dto.tenKhoa || deptMap.get(dto.MaKhoa || dto.maKhoa || "") || "",
      LoaiPhong: dto.LoaiPhong || dto.loaiPhong || "",
      SucChua: dto.SucChua ?? dto.sucChua ?? null,
      ViTri: dto.ViTri || dto.viTri || "",
      Email: dto.Email || dto.email || "",
      DienThoai: dto.DienThoai || dto.dienThoai || "",
      GioMoCua: dto.GioMoCua || dto.gioMoCua || null,
      GioDongCua: dto.GioDongCua || dto.gioDongCua || null,
      ThietBi: dto.ThietBi || dto.thietBi || [],
      TrangThai: dto.TrangThai || dto.trangThai || "hoat_dong",
      MaBacSiPhuTrach: dto.MaBacSiPhuTrach || dto.maBacSiPhuTrach || "",
    })),
    totalItems: roomPayload.TotalItems ?? roomPayload.totalItems ?? roomItems.length,
    page: roomPayload.Page ?? roomPayload.page ?? 1,
    pageSize: roomPayload.PageSize ?? roomPayload.pageSize ?? roomItems.length,
  };
};

export const listServiceCatalog = async (params = {}) => {
  const payload = cleanupFilter({
    Keyword: params.keyword,
    MaKhoa: params.maKhoa,
    MaPhong: params.maPhong,
    LoaiDichVu: params.loaiDichVu,
    SortBy: params.sortBy || "TenDichVu",
    SortDirection: params.sortDirection || "asc",
    Page: params.page || 1,
    PageSize: params.pageSize || 200,
  });

  const res = await http.post("/master-data/services/search", payload);
  const body = res.data ?? res;
  const serviceItems = normalizeListLike(body);

  return {
    items: serviceItems.map((dto) => {
      const normalized = normalizeService(dto);
      if (!normalized) return null;

      return {
        MaDichVu: normalized.code,
        TenDichVu: normalized.tenDichVu,
        LoaiDichVu: normalized.loaiDichVu,
        MaKhoa: normalized.maKhoa || "",
        MaPhong: normalized.maPhong || "",
        DonGia: normalized.donGia,
        ThoiGianDuKienPhut: normalized.thoiGianDuKienPhut ?? 0,
      };
    }).filter(Boolean),
    totalItems: body.TotalItems ?? body.totalItems ?? serviceItems.length,
    page: body.Page ?? body.page ?? 1,
    pageSize: body.PageSize ?? body.pageSize ?? serviceItems.length,
  };
};

export const createDepartment = async (payload) => {
  const res = await http.post("/master-data/departments", payload);
  return res.data ?? res;
};

export const updateDepartment = async ({ id, data }) => {
  const res = await http.put(`/master-data/departments/${id}`, data);
  return res.data ?? res;
};

export const createRoom = async (payload) => {
  const res = await http.post("/master-data/rooms", payload);
  return res.data ?? res;
};

export const updateRoom = async ({ id, data }) => {
  const res = await http.put(`/master-data/rooms/${id}`, data);
  return res.data ?? res;
};

export const createService = async (payload) => {
  const res = await http.post("/master-data/services", payload);
  return res.data ?? res;
};

export const updateService = async ({ id, data }) => {
  const res = await http.put(`/master-data/services/${id}`, data);
  return res.data ?? res;
};


/**
 * Lấy chi tiết 1 phòng theo mã phòng
 * -> dùng SearchRooms + Keyword để tìm 1 item
 *
 * POST /api/master-data/rooms/search
 */
// ========== RoomDetailDto + RoomServiceItemDto ==========
function normalizeRoomDetail(dto) {
  if (!dto) return null;

  const code =
    dto.MaPhong || dto.maPhong || dto.ma_phong || dto.code || dto.id || "";
  const roomName =
    dto.TenPhong || dto.tenPhong || dto.ten_phong || dto.name || "";
  const deptName =
    dto.TenKhoa || dto.tenKhoa || dto.ten_khoa || dto.deptName || "";

  const roomType =
    dto.LoaiPhong || dto.loaiPhong || dto.loai_phong || dto.type || "";

  const statusRaw =
    dto.TrangThai ||
    dto.trangThai ||
    dto.trang_thai ||
    dto.status ||
    "hoat_dong";
  const isActive = String(statusRaw).toLowerCase() === "hoat_dong";

  const doctorInCharge =
    dto.TenBacSiPhuTrach ||
    dto.tenBacSiPhuTrach ||
    dto.BacSiPhuTrach ||
    dto.bacSiPhuTrach ||
    null;

  const nurseInCharge = null; // Detail chưa có tên y tá cố định

  const waitingPatients = dto.DangCho ?? dto.dangCho ?? 0;
  const examinedPatients = dto.DaHoanThanh ?? dto.daHoanThanh ?? 0;
  const totalToday = dto.TongHomNay ?? dto.tongHomNay ?? waitingPatients + examinedPatients;
  const capacityPerDay = dto.SucChuaNgay ?? dto.sucChuaNgay ??dto.sucChua ?? dto.SucChua??  null;

  const equipments = dto.ThietBi || dto.thietBi || [];

  const servicesRaw =
    dto.DichVuTaiPhong ||
    dto.dichVuTaiPhong ||
    dto.services ||
    [];

  const services = Array.isArray(servicesRaw)
    ? servicesRaw.map((dv) => normalizeRoomServiceItem(dv, code)).filter(Boolean)
    : [];

  return {
    _raw: dto,

    id: code,
    roomId: code,
    code,
    maPhong: code,

    name: deptName,
    tenKhoa: deptName,
    deptName,

    room: {
      id: code,
      number: code,
      name: roomName,
      type: roomType,
      loaiPhong: roomType,
      status: isActive,
      area: dto.KhuVuc || dto.khuVuc || "",
      phone: dto.DienThoai || dto.dienThoai || "",
      email: dto.Email || dto.email || "",
      capacity: capacityPerDay,
    },

    roomType,
    loaiPhong: roomType,
    status: isActive ? "active" : "inactive",
    trangThai: statusRaw,

    doctorInCharge,
    nurseInCharge,

    equipments,
    waitingPatients,
    examinedPatients,
    doneToday: examinedPatients,
    totalToday,
    capacityPerDay,

    services,
  };
}

/**
 * RoomServiceItemDto:
 *  - MaDichVu, TenDichVu, LoaiDichVu, ThoiGianPhut, DonGia
 */
function normalizeRoomServiceItem(dto, roomId) {
  if (!dto) return null;
  const code =
    dto.MaDichVu || dto.maDichVu || dto.ma_dich_vu || dto.code || dto.id || "";
  const name =
    dto.TenDichVu || dto.tenDichVu || dto.ten_dich_vu || dto.name || "";
  const type =
    dto.LoaiDichVu || dto.loaiDichVu || dto.loai_dich_vu || dto.type || "";
  const minutes = dto.ThoiGianPhut ?? dto.thoiGianPhut ?? 0;
  const price = dto.DonGia ?? dto.donGia ?? dto.price ?? 0;

  return {
    _raw: dto,
    id: code,
    code,
    maDichVu: code,
    name,
    tenDichVu: name,
    type,
    loaiDichVu: type,
    roomId,
    expectedMinutes: minutes,
    thoi_gian_du_kien_phut: minutes,
    price,
    don_gia: price,
  };
}

export const getDepartment = async (id) => {
  if (!id) return null;

  // GET /api/master-data/rooms/{maPhong}/detail
  const res = await http.get(`/master-data/rooms/${id}/detail`);
  const detail = res.data ?? res;
  if (!detail) return null;

  return normalizeRoomDetail(detail);
};

function normalizeRoomDutyWeek(data) {
  if (!data) return null;

  const dutyItems = Array.isArray(data.LichDieuDuongTuan || data.lichDieuDuongTuan)
    ? data.LichDieuDuongTuan || data.lichDieuDuongTuan
    : [];

  return {
    roomId: data.MaPhong || data.maPhong || "",
    roomName: data.TenPhong || data.tenPhong || "",
    deptName: data.TenKhoa || data.tenKhoa || "",
    doctorId: data.MaBacSiPhuTrach || data.maBacSiPhuTrach || "",
    doctorName: data.TenBacSiPhuTrach || data.tenBacSiPhuTrach || "",
    today: data.Today || data.today || null,
    items: dutyItems.map((item) => ({
      day: item.Thu || item.thu || "",
      nghiTruc: Boolean(item.NghiTruc ?? item.nghiTruc ?? false),
      maNhanVien: item.MaYTa || item.maYTa || "",
      tenNhanVien: item.TenYTa || item.tenYTa || "",
      shift: item.CaTruc || item.caTruc || "",
      gioBatDau: item.GioBatDau || item.gioBatDau || null,
      gioKetThuc: item.GioKetThuc || item.gioKetThuc || null,
    })),
    raw: data,
  };
}

export const getRoomDutyWeek = async (id) => {
  if (!id) return null;

  const res = await http.get(`/master-data/rooms/${id}/duty-week`);
  return normalizeRoomDutyWeek(res.data ?? res);
};



/**
 * Lịch trực điều dưỡng theo phòng
 *
 * GET /api/master-data/rooms/{maPhong}/duty-week
 * Output: RoomDutyWeekDto (wrapper chứa list lịch trực)
 */
/**
 * RoomDutyWeekDto:
 *  - MaPhong, TenPhong, TenKhoa
 *  - TenBacSiPhuTrach
 *  - Today, LichDieuDuongTuan: RoomDutyDayDto[]
 *
 * RoomDutyDayDto:
 *  - Thu, NghiTruc, MaYTa, TenYTa, CaTruc, GioBatDau, GioKetThuc
 */
export const getDutyByRoom = async (id) => {
  const dutyWeek = await getRoomDutyWeek(id);
  if (!dutyWeek) return [];

  // convert -> list các dòng để buildWeekDaysFromDuty xử lý
  return dutyWeek.items
    .filter((item) => !item.nghiTruc)
    .map((item) => ({
      DayOfWeek: item.day,
      TenDieuDuong: item.tenNhanVien,
      CaTruc: item.shift,
      GioBatDau: item.gioBatDau,
      GioKetThuc: item.gioKetThuc,
      BacSi: dutyWeek.doctorName,
    }));
};

export const updateRoomDutyWeek = async ({ id, data }) => {
  if (!id) throw new Error("Missing room id");

  const res = await http.put(`/master-data/rooms/${id}/duty-week`, data);
  return normalizeRoomDutyWeek(res.data ?? res);
};



/**
 * Dịch vụ theo phòng (ServiceDto)
 *
 * GET /api/master-data/services?maPhong=...
 */
export const listServicesByRoom = async (roomId) => {
  if (!roomId) return [];
  const res = await http.get("/master-data/services", {
    params: { maPhong: roomId },
  });
  const data = res.data ?? res;
  const arr = normalizeListLike(data);
  return arr.map((dv) => normalizeService(dv, roomId)).filter(Boolean);
};

// Alias để tương thích các component cũ
export const listRoomServices = listServicesByRoom;

/**
 * GetStaffOverview
 * GET /api/master-data/staff/overview?maKhoa=...&ngay=...&gio=...
 */
export const getStaffOverviewByDept = async (maKhoa, at) => {
  if (!maKhoa) return [];
  const { ngay, gio } = buildAt(at);

  const res = await http.get("/master-data/staff/overview", {
    params: { maKhoa, ngay, gio },
  });

  const data = res.data ?? res;
  const arr = normalizeListLike(data);
  return arr.map((dto) => normalizeStaffOverview(dto, maKhoa)).filter(Boolean);
};

/* ========= Hooks: Query ========= */

/**
 * Lấy overview khoa (dùng cho Departments page & CreateDrawer)
 *
 * CreateDrawer đang dùng:
 *   const { data: departments = [] } = useDepartments();
 */

export function useDepartments(options = {}) {
  const at = options.at; // { ngay, gio } nếu muốn override
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["departments", at || null],
    queryFn: () => getDepartmentsOverview(at),
    enabled,
    staleTime: 60_000,
    ...options,
  });
}
/**
 * NEW: Lấy danh sách phòng dạng card (RoomCardDto + DepartmentDto)
 * POST /api/master-data/rooms/cards/search
 * Trả về object PagedResult có .items
 */

export function useDepartmentRooms(params = {}, options = {}) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["department-rooms", params],
    queryFn: () => listDepartments(params),
    select: (res) => {
      // ✅ listDepartments đã trả về PagedResult, chuẩn hóa về format chung
      if (res && typeof res === "object") {
        return {
          Items: res.items || res.Items || [],
          TotalItems: res.TotalItems ?? res.totalItems ?? (res.items?.length ?? 0),
          Page: res.Page ?? res.page ?? (params?.page ?? 1),
          PageSize: res.PageSize ?? res.pageSize ?? (params?.pageSize ?? 50),
        };
      }
      // Fallback
      const items = Array.isArray(res) ? res : [];
      return {
        Items: items,
        TotalItems: items.length,
        Page: params?.page ?? 1,
        PageSize: params?.pageSize ?? 50,
      };
    },
    enabled,
    keepPreviousData: true,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useDepartmentCatalog(options = {}) {
  return useQuery({
    queryKey: ["departments-admin-catalog"],
    queryFn: listDepartmentCatalog,
    staleTime: 30_000,
    ...options,
  });
}

export function useRoomCatalog(params = {}, options = {}) {
  return useQuery({
    queryKey: ["rooms-admin-catalog", params],
    queryFn: () => listRoomCatalog(params),
    staleTime: 30_000,
    keepPreviousData: true,
    ...options,
  });
}

export function useServiceCatalog(params = {}, options = {}) {
  return useQuery({
    queryKey: ["services-admin-catalog", params],
    queryFn: () => listServiceCatalog(params),
    staleTime: 30_000,
    keepPreviousData: true,
    ...options,
  });
}


/**
 * Lấy danh sách bác sĩ + số BN đang chờ + số lịch hôm nay theo khoa.
 *
 * CreateDrawer đang dùng:
 *   const { data: doctorQueue = [] } =
 *     useDoctorQueueByDept(selectedDeptCode, { enabled: !!selectedDeptCode });
 *
 * Trả về: [{ name, waiting, appointments, status, deptCode, ... }]
 */
export function useDoctorQueueByDept(maKhoa, options = {}) {
  const at = options.at; // { ngay, gio } nếu muốn lấy theo ngày/giờ khác
  const enabled = (options.enabled ?? true) && !!maKhoa;

  return useQuery({
    queryKey: ["staff-overview", maKhoa, at || null],
    queryFn: () => getStaffOverviewByDept(maKhoa, at),
    enabled,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Detail 1 phòng
 */
export function useDepartment(id, options = {}) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartment(id),
    enabled: !!id && (options.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });
}

/**
 * Lịch trực điều dưỡng theo phòng
 */
export function useDutyByRoom(id, options = {}) {
  return useQuery({
    queryKey: ["duty", id],
    queryFn: () => getDutyByRoom(id),
    enabled: !!id && (options.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: 30_000,
    ...options,
  });
}

export function useRoomDutyWeek(id, options = {}) {
  return useQuery({
    queryKey: ["room-duty-week", id],
    queryFn: () => getRoomDutyWeek(id),
    enabled: !!id && (options.enabled ?? true),
    staleTime: 30_000,
    ...options,
  });
}


/**
 * Dịch vụ theo phòng
 */
export function useServicesByRoom(roomId, options = {}) {
  return useQuery({
    queryKey: ["dept-services", roomId],
    queryFn: () => listServicesByRoom(roomId),
    enabled: !!roomId && (options.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });
}

// Alias cho các component cũ
export function useRoomServices(roomId, options = {}) {
  return useServicesByRoom(roomId, options);
}

/* ========= Hooks: Mutations ========= */

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
      qc.invalidateQueries({ queryKey: ["department"] });
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
      qc.invalidateQueries({ queryKey: ["department"] });
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["dept-services"] });
      qc.invalidateQueries({ queryKey: ["department"] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services-admin-catalog"] });
      qc.invalidateQueries({ queryKey: ["dept-services"] });
      qc.invalidateQueries({ queryKey: ["department"] });
    },
  });
}

export function useUpdateRoomDutyWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateRoomDutyWeek,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["duty", vars?.id] });
      qc.invalidateQueries({ queryKey: ["room-duty-week", vars?.id] });
      qc.invalidateQueries({ queryKey: ["department-rooms"] });
      qc.invalidateQueries({ queryKey: ["department", vars?.id] });
    },
  });
}



/* ========= Realtime subscribe ========= */
/**
 * Đăng ký realtime cho Departments page
 *  - "departments.updated"          → reload danh sách khoa/phòng
 *  - "departments.services.updated" → reload dịch vụ theo phòng
 *  - "departments.duty.updated"     → reload lịch trực
 */
export async function subscribeDepartments(qc) {
  await ensureStarted();
  if (!qc || typeof qc.invalidateQueries !== "function") {
    return () => {};
  }

  const off1 = on("departments.updated", () => {
    qc.invalidateQueries({ queryKey: ["departments"] });
    qc.invalidateQueries({ queryKey: ["department-rooms"] });
  });
  const off2 = on("departments.services.updated", () => {
    qc.invalidateQueries({ queryKey: ["dept-services"] });
  });
  const off3 = on("departments.duty.updated", () => {
    qc.invalidateQueries({ queryKey: ["duty"] });
  });

  return () => {
    try {
      off1?.();
      off2?.();
      off3?.();
    } catch {
      // ignore
    }
  };
}
