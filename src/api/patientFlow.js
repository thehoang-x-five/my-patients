import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post } from "./http";

/**
 * Đánh dấu đơn dịch vụ đã được điều phối (đẩy sang khu dịch vụ).
 * Sửa đường dẫn: bỏ tiền tố /api vì axios đã có baseURL = /api.
 * Invalidate cả patients + queue để đồng bộ realtime.
 */
export function useMarkServiceDispatched() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pid }) => post(`/patient-flow/service/dispatched`, { pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

/**
 * Đánh dấu dịch vụ hoàn thành ở khu dịch vụ.
 * Invalidate thêm "queue" để Examination/Queue nhận update.
 */
export function useMarkServiceDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pid }) => post(`/patient-flow/service/done`, { pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

/**
 * Đánh dấu chờ bác sĩ duyệt (sau khi dịch vụ xong, trả về bác sĩ chỉ định).
 */
export function useMarkWaitDoctorReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pid }) =>
      post(`/patient-flow/service/wait-doctor-review`, { pid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}
