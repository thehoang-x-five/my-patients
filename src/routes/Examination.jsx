import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import QueueFilterPopover from "../components/exam/QueueFilterPopover.jsx";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

import {
  useQueueToday,
  useStartExam,
  useFinishRemove,
  subscribeQueue,
} from "../api/queue.js";
import { useUpdatePatient } from "../api/patients.js";
import {
  useCreateExamOrder,
  useCreateDiagnosis,
} from "../api/examination.js";
import { useQueryClient } from "@tanstack/react-query";

export default function Examination() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();
  const { data: patients = [] } = useQueueToday();
  const startMut = useStartExam();
  const finishMut = useFinishRemove();
  const updPatient = useUpdatePatient();
  const orderMut = useCreateExamOrder();
  const dxMut = useCreateDiagnosis();

  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const [inProgress, setInProgress] = useState(() => new Set());

  // Filter theo nguồn (walkin / appointment / service_return) + loại lượt (ls / cls)
  const [filter, setFilter] = useState({ source: "all", kind: "all" });
  const [filterOpen, setFilterOpen] = useState(false);

  const waitingCount = useMemo(
    () => patients.filter((p) => p.trang_thai === "cho_goi").length,
    [patients]
  );

  useEffect(() => {
    let off;
    (async () => {
      off = await subscribeQueue(qc);
    })();
    return () => {
      if (off) off();
    };
  }, [qc]);

  const filtered = useMemo(() => {
    let arr = [...patients];
    const { source, kind } = filter;

    if (source !== "all") {
      arr = arr.filter(
        (p) => (p.nguon || p.source || "walkin") === source
      );
    }

    if (kind !== "all") {
      arr = arr.filter((p) => {
        const qt = p.loai_hang_doi || p.queueType || p.visitType;
        const isCLS = qt === "can_lam_sang" || qt === "cls";
        return kind === "cls" ? isCLS : !isCLS;
      });
    }

    const term = q.trim().toLowerCase();
    if (term) {
      arr = arr.filter((p) => {
        const bag = [p.name, p.pid, p.id, p.doctor, p.dept, p.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return bag.includes(term);
      });
    }

    return arr;
  }, [patients, filter, q]);

  const getKey = (p) => p?.id ?? p?.queueId ?? p?.pid;

  async function handleStart(p) {
    const key = getKey(p);
    if (!key) return;
    setInProgress((prev) => {
      const s = new Set(prev);
      s.add(key);
      return s;
    });
    await startMut.mutateAsync(key);
    setActive(p);
  }

  function handleBack() {
    setActive(null);
  }

  // Gọi khi LS xuất phiếu khám (chỉ định CLS)
  async function handleExportOrder(patient, payload) {
    const key = getKey(patient);
    if (!key) return;

    await finishMut.mutateAsync(key);
    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });

    const pid = patient?.pid || patient?.id;

    await orderMut.mutateAsync({
      pid,
      services: (payload?.orderRows || []).map((r) => ({
        id: r.id,
        note: r.note,
      })),
      note: (payload?.orderRows || [])
        .map((r) => r.note)
        .filter(Boolean)
        .join("; "),
      fromDoctor: patient?.doctor || "Bác sĩ phụ trách",
    });

    // Cập nhật trạng thái bệnh nhân (tùy backend, ở đây chỉ ví dụ)
    await updPatient.mutateAsync({
      pid,
      patch: { status: "Chờ tiếp nhận (dịch vụ)" },
    });

    setActive(null);
  }

  // Gọi khi LS xuất phiếu chẩn đoán hoặc CLS "Hoàn tất CLS"
  async function handleExportDiagnosis(patient, payload) {
    const key = getKey(patient);
    if (!key) return;

    await finishMut.mutateAsync(key);
    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });

    const pid = patient?.pid || patient?.id;

    await dxMut.mutateAsync({
      pid,
      dx: payload?.dx || {},
      rx: payload?.rxRows || [],
      services:
        payload?.services || (payload?.orderRows || []).map((r) => r.id),
    });

    setActive(null);
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Khám bệnh - Hàng chờ"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
       {!active && (
  <ExamToolbar
    todayCount={patients.length}
    waitingCount={waitingCount}
    q={q}
    onSearch={setQ}
    hideSearch={false}
    onOpenFilter={() => setFilterOpen(true)}
    onReset={() => {
      // reset giống Patients: xóa search + đưa filter về mặc định
      setQ("");
      setFilter({ source: "all", kind: "all" });
    }}
  />
)}
        <div className="mt-2 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="h-full min-h-0"
              >
                <ExamDetail
                  patient={active}
                  onBack={handleBack}
                  onExportOrder={handleExportOrder}
                  onExportDiagnosis={handleExportDiagnosis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="h-full min-h-0"
              >
                <PatientTable
                  items={filtered}
                  onStart={handleStart}
                  inProgress={inProgress}
                  stretch
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popover lọc (nguồn + loại lượt) giống Patients */}
        <QueueFilterPopover
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          values={filter}
          setValues={setFilter}
        />
      </div>
    </motion.main>
  );
}
