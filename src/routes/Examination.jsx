// src/pages/Examination.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

import { useQueueToday, useStartExam, useFinishRemove, subscribeQueue } from "../api/queue.js";
import { useUpdatePatient } from "../api/patients.js";
import { useCreateExamOrder, useCreateDiagnosis } from "../api/examination.js";
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

  useEffect(() => {
    let off;
    (async () => { off = await subscribeQueue(qc); })();
    return () => { if (off) off(); };
  }, [qc]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => {
      const bag = [p.name, p.pid, p.id, p.doctor, p.dept].filter(Boolean).join(" ").toLowerCase();
      return bag.includes(term);
    });
  }, [patients, q]);

  const getKey = (p) => p?.id ?? p?.queueId ?? p?.pid;

  async function handleStart(p) {
    const key = getKey(p);
    if (!key) return;
    setInProgress((prev) => { const s = new Set(prev); s.add(key); return s; });
    await startMut.mutateAsync(key);
    setActive(p);
  }

  function handleBack() { setActive(null); }

  // Nếu muốn giữ callback (ExamDetail sẽ gọi các hàm này; hoặc ExamDetail tự gọi API — cả 2 đều ok)
  async function handleExportOrder(patient, payload) {
    const key = getKey(patient);
    if (!key) return;
    await finishMut.mutateAsync(key);
    setInProgress((prev) => { const s = new Set(prev); s.delete(key); return s; });

    const pid = patient?.pid || patient?.id;
    // Lưu order (server sẽ tự set status phù hợp & push queue realtime)
    await orderMut.mutateAsync({
      pid,
      services: (payload?.orderRows || []).map((r) => ({ id: r.id, note: r.note })),
      note: (payload?.orderRows || []).map((r) => r.note).filter(Boolean).join("; "),
      fromDoctor: patient?.doctor || "Bác sĩ phụ trách",
    });

    // (tuỳ backend) cập nhật trạng thái patient
    await updPatient.mutateAsync({
      pid,
      patch: { status: "Chờ tiếp nhận (dịch vụ)" },
    });

    setActive(null);
  }

  async function handleExportDiagnosis(patient, payload) {
    const key = getKey(patient);
    if (!key) return;
    await finishMut.mutateAsync(key);
    setInProgress((prev) => { const s = new Set(prev); s.delete(key); return s; });

    const pid = patient?.pid || patient?.id;

    await dxMut.mutateAsync({
      pid,
      dx: payload?.dx || {},
      rx: payload?.rxRows || [],
      services: payload?.services || (payload?.orderRows || []).map((r) => r.id),
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
        <ExamToolbar todayCount={patients.length} q={q} onSearch={setQ} hideSearch={!!active} />

        <div className="mt-3 flex-1 min-h-0">
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
      </div>
    </motion.main>
  );
}
