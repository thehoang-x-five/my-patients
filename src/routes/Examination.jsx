import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import { addListener, getQueue, startExam, finishAndRemove } from "../data/queue.js";
import { updateOne } from "../data/patients.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Examination() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const [inProgress, setInProgress] = useState(() => new Set());

  const pickId = (p) => p?.id ?? p?.pid;

  useEffect(() => {
    setPatients(getQueue());
    const off = addListener((q) => setPatients(q));
    return off;
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => {
      const bag = [p.name, p.pid, p.id, p.doctor, p.dept].filter(Boolean).join(" ").toLowerCase();
      return bag.includes(term);
    });
  }, [patients, q]);

  function handleStart(p) {
    const key = pickId(p);
    if (!key) return;
    setInProgress((prev) => { const s = new Set(prev); s.add(key); return s; });
    startExam(key);
    setActive(p);
  }

  function handleBack() { setActive(null); }

  // Xuất phiếu khám → CHỜ TIẾP NHẬN (DỊCH VỤ) + ghi serviceOrder & pendingServiceResults
  function handleExportOrder(patient, payload) {
    if (!patient) return;
    const key = pickId(patient);
    if (!key) return;

    finishAndRemove(key);
    setInProgress((prev) => { const s = new Set(prev); s.delete(key); return s; });

    const pid = pickId(patient);
    const orderRows = payload?.orderRows || [];
    const items = orderRows.map(r => r.serviceName);
    const noteCombined = orderRows.map(r => r.note).filter(Boolean).join("; ");

    updateOne(pid, {
      status: "Chờ tiếp nhận (dịch vụ)",
      serviceOrder: {
        items,
        note: noteCombined || "",
        fromDoctor: patient.doctor || "Bác sĩ phụ trách",
        dept: "Cận lâm sàng",
        dispatched: false, // chưa vào quầy dịch vụ
      },
      pendingServiceResults: orderRows.map(r => ({
        id: r.id,
        name: r.serviceName,
        status: r.status || "Chưa có kết quả",
        result: r.result || "",
        note: r.note || "",
      })),
      lastExamVersion: payload?.meta?.version,
      lastExamAt: payload?.meta?.examAt,
    });
    try { window.dispatchEvent(new CustomEvent("patients:changed", { detail:{ pid } })); } catch {}
    setActive(null);
  }

  // Xuất phiếu chẩn đoán → CHỜ XỬ LÝ hoặc CHỜ XỬ LÝ (DỊCH VỤ) tuỳ nơi đang khám
  function handleExportDiagnosis(patient, payload) {
    if (!patient) return;
    const key = pickId(patient);
    if (!key) return;

    finishAndRemove(key);
    setInProgress((prev) => { const s = new Set(prev); s.delete(key); return s; });

    const pid = pickId(patient);
    const nextStatus = (patient.tag === "service") ? "Chờ xử lý (dịch vụ)" : "Chờ xử lý";

    updateOne(pid, {
      status: nextStatus,
      pendingProcess: {
        ...payload,
        services: payload?.services || (payload?.orderRows || []).map(r => r.serviceName),
      },
      lastExamVersion: payload?.meta?.version,
      lastExamAt: payload?.meta?.examAt,
    });
    try { window.dispatchEvent(new CustomEvent("patients:changed", { detail:{ pid } })); } catch {}
    
    setActive(null);
  }

  return (
    <>
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
    </>
  );
}
