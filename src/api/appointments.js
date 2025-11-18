// src/api/appointments.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http";
import { mockEnabled, mockAppointmentsApi } from "./mockData";

/** ===== Trạng thái lịch hẹn theo ERD ===== */
export const APPT_STATUS = {
  DANG_CHO: "dang_cho",
  DA_XAC_NHAN: "da_xac_nhan",
  DA_CHECKIN: "da_checkin",
  DA_HUY: "da_huy",
};

export const APPT_STATUS_LABEL = {
  [APPT_STATUS.DANG_CHO]: "Đang chờ",
  [APPT_STATUS.DA_XAC_NHAN]: "Đã xác nhận",
  [APPT_STATUS.DA_CHECKIN]: "Đã check-in",
  [APPT_STATUS.DA_HUY]: "Đã hủy",
};

/** Map raw BE (ERD) -> DTO FE chuẩn */
function normalizeAppt(raw) {
  if (!raw) return null;
  const id = raw.ma_lich_hen || raw.id;

  return {
    id,
    date: raw.ngay_hen || raw.date,
    time: raw.gio_hen || raw.time || raw.gio || "08:00",
    duration:
      raw.thoi_luong_phut != null
        ? Number(raw.thoi_luong_phut)
        : raw.duration != null
        ? Number(raw.duration)
        : 30,

    patientCode:
      raw.ma_benh_nhan || raw.patientCode || raw.code || raw.patient_code || null,
    patientName:
      raw.ten_benh_nhan ||
      raw.patientName ||
      raw.patient ||
      raw.patient_name ||
      "",
    phone: raw.so_dien_thoai || raw.phone || "",

    apptType: raw.loai_hen || raw.apptType || raw.type || "Khám mới",

    status: raw.trang_thai || raw.status || APPT_STATUS.DANG_CHO,
    effective:
      typeof raw.co_hieu_luc === "boolean"
        ? raw.co_hieu_luc
        : raw.effective ?? true,

    scheduleId: raw.ma_lich_truc || raw.scheduleId || null,
    note: raw.ghi_chu || raw.note || "",

    doctorName: raw.doctorName || raw.doctor || null,
    deptName: raw.deptName || raw.dept || null,
    roomName: raw.roomName || raw.phong || null,
  };
}

/** Map DTO FE -> payload BE (ERD) */
function toPayload(input) {
  if (!input) return {};
  return {
    ma_lich_hen: input.id,
    ngay_hen: input.date,
    gio_hen: input.time,
    thoi_luong_phut: input.duration,
    ma_benh_nhan: input.patientCode || null,
    loai_hen: input.apptType,
    ten_benh_nhan: input.patientName,
    so_dien_thoai: input.phone,
    ma_lich_truc: input.scheduleId || null,
    ghi_chu: input.note,
    trang_thai: input.status || APPT_STATUS.DANG_CHO,
    co_hieu_luc: input.effective ?? true,
  };
}

const api = {
  async listByDate(date) {
    if (!date) return [];
    if (mockEnabled) {
      const raw = await mockAppointmentsApi.listByDate(date);
      return raw.map(normalizeAppt);
    }
    const res = await http.get("/appointments", { params: { date } });
    const data = res.data;
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];
    return arr.map(normalizeAppt);
  },

  async create(payload) {
    const base = normalizeAppt(payload) || payload;
    const body = toPayload(base);
    if (mockEnabled) {
      const raw = await mockAppointmentsApi.createAppointment(body);
      return normalizeAppt(raw);
    }
    const res = await http.post("/appointments", body);
    return normalizeAppt(res.data);
  },

  async update({ id, patch }) {
    const merged = { id, ...(patch || {}) };
    const base = normalizeAppt(merged);
    const body = toPayload(base);
    if (mockEnabled) {
      const raw = await mockAppointmentsApi.updateAppointment({
        id: body.ma_lich_hen,
        patch: body,
      });
      return normalizeAppt(raw);
    }
    const res = await http.patch(`/appointments/${id}`, body);
    return normalizeAppt(res.data);
  },

  async checkIn(id) {
    if (mockEnabled) {
      const raw = await mockAppointmentsApi.checkIn(id);
      return normalizeAppt(raw);
    }
    const res = await http.post(`/appointments/${id}/check-in`);
    return normalizeAppt(res.data);
  },

  async findLast({ code, name, cutoff }) {
    if (mockEnabled) {
      const raw = await mockAppointmentsApi.findLastAppointment({
        code,
        name,
        cutoff,
      });
      return raw ? normalizeAppt(raw) : null;
    }
    const res = await http.get("/appointments/last", {
      params: { code, name, cutoff },
    });
    return res.data ? normalizeAppt(res.data) : null;
  },
  async listRange(fromDate, toDate) {
    if (!fromDate || !toDate) return [];
    if (mockEnabled) {
      // mockAppointmentsApi đã có listAppointments
      const raw = await mockAppointmentsApi.listAppointments({
        fromDate,
        toDate,
      });
      return raw.map(normalizeAppt);
    }
    const res = await http.get("/appointments", {
      params: { fromDate, toDate },
    });
    const data = res.data;
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];
    return arr.map(normalizeAppt);
  },
};

/** ===== Hooks ===== */

export function useAppointmentsByDate(date, options = {}) {
  const enabled = (options.enabled ?? true) && !!date;
  return useQuery({
    queryKey: ["appointments", "byDate", date || "none"],
    queryFn: () => api.listByDate(date),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.create(payload),
    onSuccess: (res) => {
      if (res?.date) {
        qc.invalidateQueries({
          queryKey: ["appointments", "byDate", res.date],
        });
      } else {
        qc.invalidateQueries({ queryKey: ["appointments"] });
      }
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => api.update({ id, patch }),
    onSuccess: (res) => {
      if (res?.date) {
        qc.invalidateQueries({
          queryKey: ["appointments", "byDate", res.date],
        });
      }
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCheckInAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.checkIn(id),
    onSuccess: (res) => {
      if (res?.date) {
        qc.invalidateQueries({
          queryKey: ["appointments", "byDate", res.date],
        });
      }
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// Dùng trong CreateDrawer để lấy "lịch khám gần nhất"
export function useFindLastAppointment(params, options = {}) {
  const { code, name, cutoff } = params || {};
  const enabled =
    (options.enabled ?? true) && (!!code || !!name) && !!(cutoff || true);

  return useQuery({
    queryKey: ["appointments", "last", { code, name, cutoff }],
    queryFn: () => api.findLast({ code, name, cutoff }),
    enabled,
    staleTime: 60_000,
    ...options,
  });
}
export function useAppointmentsRange(fromDate, toDate, options = {}) {
  const enabled =
    (options.enabled ?? true) && !!fromDate && !!toDate;

  return useQuery({
    queryKey: ["appointments", "range", { fromDate, toDate }],
    queryFn: () => api.listRange(fromDate, toDate),
    enabled,
    staleTime: 60_000,
    ...options,
  });
}

