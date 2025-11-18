// patients.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";
import { mockEnabled, mockPatientsApi } from "./mockData.js";

/** ===== Nhãn hiển thị theo ERD (trang_thai_hom_nay) ===== */
export const STATUSES = {
  WAIT_INTAKE: "Chờ tiếp nhận",
  WAIT_INTAKE_SVC: "Chờ tiếp nhận (dịch vụ)",
  WAIT_EXAM: "Chờ khám",
  WAIT_EXAM_SVC: "Chờ khám (dịch vụ)",
  WAIT_CLS: "Chờ CLS",
  IN_EXAM: "Đang khám",
  IN_EXAM_SVC: "Đang khám (dịch vụ)",
  WAIT_PROC: "Chờ xử lý",
  WAIT_PROC_SVC: "Chờ xử lý (dịch vụ)",
  SCHEDULED_APPT: "Hẹn khám",
  SCHEDULED_FUP: "Hẹn tái khám",
  DONE_EXAM: "Đã khám",
  DONE: "Hoàn thành",
};

export const ACCOUNT_STATUSES = ["hoat_dong", "khong_hoat_dong", "da_xoa"];

export const TODAY_STATUS_MAP = {
  cho_tiep_nhan: "Chờ tiếp nhận",
  cho_kham: "Chờ khám",
  cho_cls: "Chờ CLS",
  dang_kham: "Đang khám",
  dang_kham_dv: "Đang khám (dịch vụ)",
  cho_xu_ly: "Chờ xử lý",
  cho_xu_ly_dv: "Chờ xử lý (dịch vụ)",
  da_kham: "Đã khám",
  hen_tai_kham: "Hẹn tái khám",
  da_huy: "Đã hủy",
};
export function mapTodayStatusLabel(codeOrLabel) {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).toLowerCase();
  return TODAY_STATUS_MAP[low] || codeOrLabel;
}

/** ===== Low-level API (mock-aware) ===== */
export const listPatients = async (params = {}) => {
  const res = mockEnabled
    ? await mockPatientsApi.listPatients(params)
    : (await http.get("/patients", { params })).data;

  // Chuẩn hoá: luôn trả { items, total }
  if (Array.isArray(res)) {
    return { items: res, total: res.length };
  }
  if (res && Array.isArray(res.items)) {
    return res;
  }
  return { items: [], total: 0 };
};

export const getPatient = async (id) => {
  if (mockEnabled) return mockPatientsApi.getPatient(id);
  return (await http.get(`/patients/${id}`)).data;
};

export const addPatient = async (payload) => {
  if (mockEnabled) return mockPatientsApi.addPatient(payload);
  return (await http.post("/patients", payload)).data;
};

export const updatePatient = async ({ id, patch }) => {
  if (mockEnabled) return mockPatientsApi.updatePatient({ id, patch });
  return (await http.patch(`/patients/${id}`, patch)).data;
};

export const getVisits = async (id) => {
  if (mockEnabled) return mockPatientsApi.getVisits(id);
  return (await http.get(`/patients/${id}/visits`)).data;
};

export const addVisit = async (args = {}) => {
  const id = args.id ?? args.pid ?? args.code;
  const payload = args.payload ?? args.data;
  if (!id) throw new Error("Missing patient id for addVisit");
  if (!payload) throw new Error("Missing payload for addVisit");

  if (mockEnabled) return mockPatientsApi.addVisit({ id, payload });
  return (await http.post(`/patients/${id}/visits`, payload)).data;
};

export const getTransactions = async (id) => {
  if (mockEnabled) return mockPatientsApi.getTransactions(id);
  return (await http.get(`/patients/${id}/transactions`)).data;
};

export const addTransaction = async (args = {}) => {
  const id = args.id ?? args.pid ?? args.code;
  const payload = args.payload ?? args.data;
  if (!id) throw new Error("Missing patient id for addTransaction");
  if (!payload) throw new Error("Missing payload for addTransaction");

  if (mockEnabled) return mockPatientsApi.addTransaction({ id, payload });
  return (await http.post(`/patients/${id}/transactions`, payload)).data;
};

export const listAppointmentHolds = async (id) => {
  if (mockEnabled) return mockPatientsApi.listAppointmentHolds(id);
  return (await http.get(`/patients/${id}/holds`)).data;
};

export const createFollowupHold = async (args = {}) => {
  const id = args.id ?? args.pid ?? args.code;
  const payload = args.payload ?? args.data;
  if (!id) throw new Error("Missing patient id for createFollowupHold");
  if (!payload) throw new Error("Missing payload for createFollowupHold");

  if (mockEnabled) return mockPatientsApi.createFollowupHold({ id, payload });
  return (await http.post(`/patients/${id}/holds/followup`, payload)).data;
};

export const getLastVisit = async (id) => {
  if (mockEnabled) {
    const v = await mockPatientsApi.getVisits(id);
    return v.at(-1) ?? null;
  }
  return (await http.get(`/patients/${id}/last-visit`)).data;
};

export const listExamTemplates = async () => {
  if (mockEnabled) return mockPatientsApi.listExamTemplates();
  return (await http.get("/meta/exam-templates")).data;
};
export const listExtraFields = async () => {
  if (mockEnabled) return mockPatientsApi.listExtraFields();
  return (await http.get("/meta/extra-fields")).data;
};
export const listDepartments = async () => {
  if (mockEnabled) return mockPatientsApi.listDepartments();
  return (await http.get("/meta/departments")).data;
};
export const getDoctorsQueue = async () => {
  if (mockEnabled) return mockPatientsApi.getDoctorsQueue();
  return (await http.get("/meta/doctors-queue")).data;
};

/** ===== Hooks ===== */
export function usePatientsList(params = {}) {
  // Chuẩn hoá key để tránh re-render vì object ref
  const q = {
    keyword: params.keyword,
    status: params.status,
    accountStatus: params.accountStatus,
    todayOnly: params.todayOnly,
    page: params.page,
    pageSize: params.pageSize,
  };
  return useQuery({
    queryKey: ["patients", q],
    queryFn: () => listPatients(q),
    select: (res) => res?.items ?? res ?? [],
    keepPreviousData: true,
    staleTime: 10_000,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addPatient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updatePatient({ id, patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

/** (tuỳ trang khác) */
export function useExamTemplates() {
  return useQuery({
    queryKey: ["exam-templates"],
    queryFn: () => listExamTemplates(),
    staleTime: 60_000,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args) => addTransaction(args),
    onSuccess: (_res, vars) => {
      const key = vars.id ?? vars.pid ?? vars.code;
      if (!key) return;
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["transactions", key] });
    },
  });
}

/** ===== Hooks còn thiếu cho Modal & Sidebar ===== */

// 1) Queries theo BN
export function useVisits(id) {
  return useQuery({
    queryKey: ["visits", id],
    queryFn: () => getVisits(id),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useTransactions(id) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: () => getTransactions(id),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useAppointmentHolds(id) {
  return useQuery({
    queryKey: ["holds", id],
    queryFn: () => listAppointmentHolds(id),
    enabled: !!id,
    staleTime: 10_000,
  });
}

// 2) Queries metadata
export function useExtraFields() {
  return useQuery({
    queryKey: ["extra-fields"],
    queryFn: () => listExtraFields(),
    staleTime: 60_000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => listDepartments(),
    staleTime: 60_000,
  });
}

export function useDoctorsQueue() {
  return useQuery({
    queryKey: ["doctors-queue"],
    queryFn: () => getDoctorsQueue(),
    refetchInterval: 15_000, // nếu muốn realtime nhẹ
    staleTime: 10_000,
  });
}

// 3) Mutations
export function useAddVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args) => addVisit(args),
    onSuccess: (_res, vars) => {
      const key = vars.id ?? vars.pid ?? vars.code;
      if (!key) return;
      qc.invalidateQueries({ queryKey: ["visits", key] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useCreateFollowupHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args) => createFollowupHold(args),
    onSuccess: (_res, vars) => {
      const key = vars.id ?? vars.pid ?? vars.code;
      if (!key) return;
      qc.invalidateQueries({ queryKey: ["holds", key] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
