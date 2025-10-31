import { updateOne, STATUSES } from "./patients.js";
export const SERVICE_STATUSES = {
  WAIT_INTAKE_SVC: "Chờ tiếp nhận (dịch vụ)",
    WAIT_EXAM_SVC: "Chờ khám (dịch vụ)",
    WAIT_PROC_SVC: "Chờ xử lý (dịch vụ)",
  };
  export function markServiceOrder(
      pid,
      { items = [], note = "", fromDoctor = "", dispatched = false } = {}
    ) {
      const safeItems = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
      updateOne(pid, {
        status: dispatched ? SERVICE_STATUSES.WAIT_EXAM_SVC : SERVICE_STATUSES.WAIT_INTAKE_SVC,
        serviceOrder: {
          items: safeItems,
          note,
          fromDoctor,
          dispatched,
          at: new Date().toISOString(),
        },
      });
    }

export function markServiceDispatched(pid) {
  updateOne(pid, (prev) => {
    const so = prev?.serviceOrder || {};
    return {
      status: SERVICE_STATUSES.WAIT_EXAM_SVC,
      serviceOrder: { ...so, dispatched: true, at: new Date().toISOString() },
    };
  });
}

export function markServiceDone(pid) {
  updateOne(pid, (prev) => ({
    status: SERVICE_STATUSES.WAIT_PROC_SVC,
    serviceOrder: { ...(prev?.serviceOrder||{}), doneAt: new Date().toISOString() },
  }));
}

export function markWaitDoctorReview(pid) {
  updateOne(pid, (prev) => ({
    status: STATUSES.WAIT_EXAM,
    serviceOrder: { ...(prev?.serviceOrder||{}), backToDoctorAt: new Date().toISOString() },
  }));
}
