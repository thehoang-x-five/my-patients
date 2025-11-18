// src/api/departments.js
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";
import { mockEnabled, mockDepartmentsApi } from "./mockData";

/* ========= Normalizer từ ERD -> UI ========= */

function splitList(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return String(str)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeDepartment(raw) {
  if (!raw) return null;

  // Nếu BE đã trả đúng shape UI thì dùng luôn
  if (raw.room && ("waitingPatients" in raw || "examinedPatients" in raw)) {
    return {
      ...raw,
      status: raw.status ?? (raw.room.status ? "active" : "inactive"),
    };
  }

  const room = raw.room || raw.phong || {};
  const khoa = raw.khoa || {};

  const roomId = room.id || room.ma_phong || raw.ma_phong || raw.id;
  const roomNumber = room.number || room.ten_phong || roomId;

  const deptId = khoa.ma_khoa || raw.ma_khoa || raw.id || roomId;
  const deptName = khoa.ten_khoa || raw.ten_khoa || raw.name || "—";

  const trangThaiPhong =
    room.trang_thai || raw.trang_thai_phong || raw.trang_thai || "hoat_dong";
  const isActive = trangThaiPhong === "hoat_dong";

  const phone =
    room.dien_thoai ||
    raw.dien_thoai_phong ||
    raw.dien_thoai ||
    room.phone ||
    raw.phone ||
    "";
    const email =
    room.email ||
    raw.email_phong ||
    raw.email ||
    khoa.email ||
    "";
  const area =
    room.vi_tri ||
    khoa.dia_diem ||
    room.area ||
    raw.area ||
    "";
    const roomType = room.loai_phong || raw.loai_phong || null;
  const services =
    room.services || splitList(room.dich_vu_cung_cap || raw.dich_vu_cung_cap);

  const equipments =
    room.equipments || splitList(room.thiet_bi || raw.thiet_bi);

  const waitingPatients =
    raw.waitingPatients ?? raw.queue_waiting ?? 0;
  const examinedPatients =
    raw.examinedPatients ?? raw.queue_done ?? 0;

  const capacityPerDay =
    raw.capacityPerDay ?? room.suc_chua ?? 0;

  const head =
    raw.head ||
    khoa.ten_truong_khoa ||
    raw.truong_khoa ||
    "";

  const doctorInCharge =
    raw.doctorInCharge ||
    room.bac_si_phu_trach_name ||
    raw.bac_si_phu_trach_name ||
    "";

  const notes = raw.ghi_chu || raw.notes || "";

  return {
    id: roomId || deptId,
    name: deptName,
    head,
    doctorInCharge,
    room: {
      id: roomId,
      number: roomNumber,
      status: isActive,
      phone,
      email,
      area,
      type: roomType,   
      services,
      capacity: capacityPerDay,
    },
    waitingPatients,
    examinedPatients,
    capacityPerDay,
    equipments,
    notes,
    status: isActive ? "active" : "inactive",
  };
}

/* ========= Core REST / MOCK ========= */

export const listDepartments = async (params) => {
  if (mockEnabled && mockDepartmentsApi?.list) {
    const raw = await mockDepartmentsApi.list(params);
    return raw.map(normalizeDepartment);
  }
  const res = await http.get("/departments", { params });
  const data = res.data;
  const arr = Array.isArray(data) ? data : data?.items || [];
  return arr.map(normalizeDepartment);
};

export const getDepartment = async (id) => {
  if (!id) return null;
  if (mockEnabled && mockDepartmentsApi?.get) {
    const raw = await mockDepartmentsApi.get(id);
    return normalizeDepartment(raw);
  }
  const res = await http.get(`/departments/${id}`);
  return normalizeDepartment(res.data);
};

export const updateDepartment = async ({ id, patch }) => {
  if (mockEnabled && mockDepartmentsApi?.update) {
    const raw = await mockDepartmentsApi.update({ id, patch });
    return normalizeDepartment(raw);
  }
  const res = await http.patch(`/departments/${id}`, patch);
  return normalizeDepartment(res.data);
};

export const toggleRoomStatus = async ({ id, status }) => {
  if (mockEnabled && mockDepartmentsApi?.toggleRoom) {
    const raw = await mockDepartmentsApi.toggleRoom({ id, status });
    return normalizeDepartment(raw);
  }
  const res = await http.patch(`/departments/${id}/toggle-room`, { status });
  return normalizeDepartment(res.data);
};

// Lịch trực điều dưỡng theo phòng (không đổi bác sĩ)
export const getDutyByRoom = async (id) => {
  if (!id) return null;
  if (mockEnabled && mockDepartmentsApi?.getDutyByRoom) {
    return mockDepartmentsApi.getDutyByRoom(id); // { Mon:{ nurse }, ... } hoặc dạng mảng ca trực
  }
  const res = await http.get(`/departments/${id}/duty`);
  return res.data;
};

// Dịch vụ theo phòng (dich_vu_y_te.ma_phong_thuc_hien)
export const listServicesByRoom = async (roomId) => {
  if (!roomId) return [];
  if (mockEnabled && mockDepartmentsApi?.listServicesByRoom) {
    return mockDepartmentsApi.listServicesByRoom(roomId);
  }
  const res = await http.get(`/departments/${roomId}/services`);
  const data = res.data;
  const arr = Array.isArray(data) ? data : data?.items || [];
  return arr.map((dv) => ({
    id: dv.ma_dich_vu || dv.id,
    code: dv.ma_dich_vu || dv.id,
    name: dv.ten_dich_vu || dv.name,
    type: dv.loai_dich_vu || dv.type, // kham_lam_sang / kham_chuyen_khoa / can_lam_sang
    price: dv.don_gia ?? dv.price ?? 0,
    expectedMinutes: dv.thoi_gian_du_kien_phut ?? dv.expectedMinutes ?? 0,
    status: dv.trang_thai || dv.status || "hoat_dong",
  }));
};

// Alias để tương thích các component cũ
export const listRoomServices = (roomId) => listServicesByRoom(roomId);

export const getDoctorQueueByDept = async (dept) => {
  if (mockEnabled && mockDepartmentsApi?.getDoctorQueueByDept) {
    return mockDepartmentsApi.getDoctorQueueByDept(dept);
  }
  const res = await http.get("/metadata/doctor-queue", { params: { dept } });
  return res.data;
};

/* ========= Hooks (Queries) ========= */
export function useDepartments(params) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => listDepartments(params),
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartment(id),
    enabled: !!id,
  });
}

export function useDutyByRoom(id, options = {}) {
  return useQuery({
    queryKey: ["duty", id],
    queryFn: () => getDutyByRoom(id),
    enabled: !!id && (options.enabled ?? true),
  });
}

export function useServicesByRoom(roomId, options = {}) {
  return useQuery({
    queryKey: ["dept-services", roomId],
    queryFn: () => listServicesByRoom(roomId),
    enabled: !!roomId && (options.enabled ?? true),
  });
}

// Alias hook để tương thích các component đang gọi useRoomServices(...)
export function useRoomServices(roomId, options = {}) {
  return useServicesByRoom(roomId, options);
}

export function useDoctorQueueByDept(dept, options = {}) {
  return useQuery({
    queryKey: ["metadata", "doctor-queue", dept],
    queryFn: () => getDoctorQueueByDept(dept),
    enabled: !!dept && (options.enabled ?? true),
  });
}

/* ========= Hooks (Mutations) ========= */
export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useToggleRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleRoomStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

/* ========= Realtime (SignalR) ========= */
export async function subscribeDepartments(qc) {
  await ensureStarted();
  const off1 = on("departments.updated", () => {
    qc.invalidateQueries({ queryKey: ["departments"] });
  });
  const off2 = on("departments.services.updated", () => {
    qc.invalidateQueries({ queryKey: ["dept-services"] });
  });
  const off3 = on("departments.duty.updated", () => {
    qc.invalidateQueries({ queryKey: ["duty"] });
  });
  return () => {
    try { off1?.(); off2?.(); off3?.(); } catch {}
  };
}
