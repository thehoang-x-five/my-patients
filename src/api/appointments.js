import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const getAppointments = async (date) => {
  const { data } = await http.get("/appointments", { params: { date } });
  return data;
};

// Tìm lần hẹn gần nhất theo code/name và ngày cutoff (YYYY-MM-DD)
export const findLastAppointment = async (params) => {
  const { data } = await http.get("/appointments/last", { params });
  return data;
};

export const createAppointment = async (payload) => {
  const { data } = await http.post("/appointments", payload);
  return data;
};

export const updateAppointment = async ({ id, patch }) => {
  const { data } = await http.patch(`/appointments/${id}`, patch);
  return data;
};

export const checkInAppointment = async (id) => {
  const { data } = await http.post(`/appointments/${id}/check-in`);
  return data; // trả về queue item + appt updated
};

/* ========= Hooks ========= */
export function useAppointmentsByDate(date, options = {}) {
  return useQuery({
    queryKey: ["appointments", date],
    queryFn: () => getAppointments(date),
    // Cho phép bật/tắt khi xem DayPanel theo ngày
    enabled: options.enabled ?? (date !== null && date !== undefined),
    ...options,
  });
}

export function useFindLastAppointment(params, options = {}) {
  return useQuery({
    queryKey: ["appointments", "last", params],
    queryFn: () => findLastAppointment(params),
    enabled: options.enabled ?? true,
    ...options,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (res?.date) qc.invalidateQueries({ queryKey: ["appointments", res.date] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (res?.date) qc.invalidateQueries({ queryKey: ["appointments", res.date] });
    },
  });
}

export function useCheckInAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checkInAppointment,
    onSuccess: (_res) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      // highlight pid sẽ làm qua Zustand UI store (không thuộc server state)
    },
  });
}
