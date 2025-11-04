// src/api/examination.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "./http";

/** ===== REST ===== */
export const getExamTemplates   = () => get("/examination/templates");
export const getDepartments     = () => get("/examination/departments");
export const getDoctors         = () => get("/examination/doctors");
export const getExtraFields     = () => get("/examination/extra-fields");
export const getExamServices    = () => get("/examination/services");

// Orders & Diagnoses
export const createExamOrder    = (payload) => post("/examination/orders", payload);
/** payload: { pid, dx:{pre,final,plan,advice}, rx:[{code,name,dose,qty}], services:[ids]? } */
export const createDiagnosis    = (payload) => post("/examination/diagnoses", payload);

/** ===== React Query hooks (Server state) ===== */
const stale = 60_000; // 1 minute

export function useExamTemplates() {
  return useQuery({ queryKey: ["examTemplates"], queryFn: getExamTemplates, staleTime: stale });
}
export function useDepartments() {
  return useQuery({ queryKey: ["departments"], queryFn: getDepartments, staleTime: stale });
}
export function useDoctors() {
  return useQuery({ queryKey: ["doctors"], queryFn: getDoctors, staleTime: stale });
}
export function useExtraFields() {
  return useQuery({ queryKey: ["extraFields"], queryFn: getExtraFields, staleTime: stale });
}
export function useExamServices() {
  return useQuery({ queryKey: ["examServices"], queryFn: getExamServices, staleTime: stale });
}

/** ===== Mutations ===== */
export function useCreateExamOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExamOrder,
    onSuccess: () => {
      // Optional: invalidate queues/patients if API affects them
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useCreateDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDiagnosis,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
