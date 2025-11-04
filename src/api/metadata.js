import { http } from "./http";
import { useQuery } from "@tanstack/react-query";

/** Metadata cho Appt CreateDrawer, v.v. */
export const getDepartmentsMeta = async () =>
  (await http.get("/metadata/departments")).data; // [{id,name,rooms[],doctors[]}]

export const getDoctorQueueByDept = async (dept) =>
  (await http.get("/metadata/doctor-queue", { params: { dept } })).data;

export function useDepartments() {
  return useQuery({
    queryKey: ["metadata", "departments"],
    queryFn: getDepartmentsMeta,
  });
}

export function useDoctorQueueByDept(dept, options = {}) {
  return useQuery({
    queryKey: ["metadata", "doctor-queue", dept],
    queryFn: () => getDoctorQueueByDept(dept),
    enabled: !!dept && (options.enabled ?? true),
  });
}
