import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ========= Shared enums (dùng chung cho UI) ========= */
export const STATUSES = {
  WAIT_INTAKE: "Chờ tiếp nhận",
  WAIT_EXAM: "Chờ khám",
  WAIT_PROC: "Chờ xử lý",
  SCHEDULED_APPT: "Hẹn khám",
  SCHEDULED_FUP: "Hẹn tái khám",
  DONE: "Hoàn thành",
};

/* ========= Core REST ========= */
export const listPatients = async (params) =>
  (await http.get("/patients", { params })).data;

export const getPatient = async (id) => (await http.get(`/patients/${id}`)).data;

export const addPatient = async (payload) =>
  (await http.post("/patients", payload)).data;

export const updatePatient = async ({ id, patch }) =>
  (await http.patch(`/patients/${id}`, patch)).data;

/* ========= React Query hooks ========= */
export function usePatients(params) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => listPatients(params),
  });
}

// Aliases để tương thích import ở các component cũ
export const usePatientsList = usePatients;

export function usePatient(id) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id),
    enabled: !!id,
  });
}

export function useAddPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

// Alias tương thích
export const useCreatePatient = useAddPatient;

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      if (res?.id) qc.invalidateQueries({ queryKey: ["patient", res.id] });
    },
  });
}

/* ========= Visits / Transactions / Holds ========= */
export const getVisits = async (id) =>
  (await http.get(`/patients/${id}/visits`)).data;

export const addVisit = async ({ id, payload }) =>
  (await http.post(`/patients/${id}/visits`, payload)).data;

export const getTransactions = async (id) =>
  (await http.get(`/patients/${id}/transactions`)).data;

export const addTransaction = async ({ id, payload }) =>
  (await http.post(`/patients/${id}/transactions`, payload)).data;

export const listAppointmentHolds = async (id) =>
  (await http.get(`/patients/${id}/holds`)).data;

export const createFollowupHold = async ({ id, payload }) =>
  (await http.post(`/patients/${id}/holds/followup`, payload)).data;

export const markAppointmentDoneForPid = async (id) =>
  (await http.post(`/patients/${id}/mark-appointments-done`)).data;

export const getLastVisit = async (id) =>
  (await http.get(`/patients/${id}/last-visit`)).data;

/* ========= Hooks compat cho PatientModal.jsx ========= */
export function useVisits(id) {
  return useQuery({
    queryKey: ["patient", id, "visits"],
    queryFn: () => getVisits(id),
    enabled: !!id,
  });
}

export function useTransactions(id) {
  return useQuery({
    queryKey: ["patient", id, "transactions"],
    queryFn: () => getTransactions(id),
    enabled: !!id,
  });
}

export function useAddVisit() {
  const qc = useQueryClient();
  return useMutation({
    // Chấp nhận cả {id,payload} và {pid,data} để tương thích
    mutationFn: (vars) => {
      const id = vars?.id ?? vars?.pid;
      const payload = vars?.payload ?? vars?.data;
      return addVisit({ id, payload });
    },
    onSuccess: (_res, vars) => {
      const id = vars?.id ?? vars?.pid;
      if (id) {
        qc.invalidateQueries({ queryKey: ["patient", id, "visits"] });
        qc.invalidateQueries({ queryKey: ["patient", id] });
      }
    },
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    // Chấp nhận cả {id,payload} và {pid,data}
    mutationFn: (vars) => {
      const id = vars?.id ?? vars?.pid;
      const payload = vars?.payload ?? vars?.data;
      return addTransaction({ id, payload });
    },
    onSuccess: (_res, vars) => {
      const id = vars?.id ?? vars?.pid;
      if (id) {
        qc.invalidateQueries({ queryKey: ["patient", id, "transactions"] });
      }
    },
  });
}

export function useAppointmentHolds(id) {
  return useQuery({
    queryKey: ["patient", id, "holds"],
    queryFn: () => listAppointmentHolds(id),
    enabled: !!id,
  });
}

export function useCreateFollowupHold() {
  const qc = useQueryClient();
  return useMutation({
    // Chấp nhận cả {id,payload} và {pid,data}
    mutationFn: (vars) => {
      const id = vars?.id ?? vars?.pid;
      const payload = vars?.payload ?? vars?.data;
      return createFollowupHold({ id, payload });
    },
    onSuccess: (_res, vars) => {
      const id = vars?.id ?? vars?.pid;
      if (id) {
        qc.invalidateQueries({ queryKey: ["patient", id, "holds"] });
      }
    },
  });
}

/* ========= Metadata (templates / extras / departments / doctors) ========= */
export const listExamTemplates = async () =>
  (await http.get("/meta/exam-templates")).data;

export function useExamTemplates() {
  return useQuery({
    queryKey: ["meta", "exam-templates"],
    queryFn: listExamTemplates,
    initialData: [],
    staleTime: 60_000,
  });
}

export const listExtraFields = async () =>
  (await http.get("/meta/extra-fields")).data;

export function useExtraFields() {
  return useQuery({
    queryKey: ["meta", "extra-fields"],
    queryFn: listExtraFields,
    initialData: [],
    staleTime: 60_000,
  });
}

export const listDepartments = async () =>
  (await http.get("/meta/departments")).data;

export function useDepartments() {
  return useQuery({
    queryKey: ["meta", "departments"],
    queryFn: listDepartments,
    initialData: [],
    staleTime: 60_000,
  });
}

// Trả về { [doctorName]: { dept, waiting, appointments, status } }
export const getDoctorsQueue = async () =>
  (await http.get("/meta/doctors-queue")).data;

export function useDoctorsQueue() {
  return useQuery({
    queryKey: ["meta", "doctors-queue"],
    queryFn: getDoctorsQueue,
    initialData: {},
    staleTime: 20_000,
  });
}
