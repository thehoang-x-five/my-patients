// src/pages/Patients.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PatientsToolbar from "../components/patients/PatientsToolbar.jsx";
import PatientsTable from "../components/patients/PatientsTable.jsx";
import PatientsFilterPopover from "../components/patients/PatientsFilterPopover.jsx";
import PatientModal from "../components/patients/PatientModal.jsx";

import { usePatientsList, useCreatePatient, useUpdatePatient } from "../api/patients";
import { useUIStore } from "../components/stores/uiStore.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export const STATUSES = {
  WAIT_INTAKE: "Chờ tiếp nhận",
  WAIT_EXAM: "Chờ khám",
  WAIT_PROC: "Chờ xử lý",
  SCHEDULED_APPT: "Hẹn khám",
  SCHEDULED_FUP: "Hẹn tái khám",
  DONE: "Hoàn thành",
};

export default function Patients() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const nav = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

  const [filter, setFilter] = useState({ keyword: "", status: "Tất cả" });
  const [modal, setModal] = useState({ open: false, mode: "view", patient: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

  const highlightPid = useUIStore((s) => s.highlightPid);
  const flashAddAt = useUIStore((s) => s.flashAddAt);
  const clearHighlight = useUIStore((s) => s.clearHighlight);
  const ackFlashAdd = useUIStore((s) => s.ackFlashAdd);

  // load from API
  const { data: items = [] } = usePatientsList({
    keyword: filter.keyword || undefined,
    status: filter.status === "Tất cả" ? undefined : filter.status,
  });
  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updatePatient } = useUpdatePatient();

  // query-open modal
  useEffect(() => {
    const pid = sp.get("pid");
    const action = sp.get("action");
    const defaultCode = sp.get("defaultCode") || "";
    const defaultName = sp.get("defaultName") || "";
    const focus = sp.get("focus") === "true";
    if (pid && focus) {
      const p = items.find(x => x.id === pid || x.pid === pid);
      if (p) setModal({ open: true, mode: "view", patient: p });
    } else if (action === "add") {
      setModal({ open: true, mode: "add", patient: { id: defaultCode || "", name: defaultName || "", status: STATUSES.WAIT_INTAKE } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, items]);

  useEffect(() => {
    if (!highlightPid) return;
    const t = setTimeout(() => clearHighlight(), 5000);
    return () => clearTimeout(t);
  }, [highlightPid, clearHighlight]);

  useEffect(() => {
    if (!flashAddAt) return;
    const btn = document.getElementById("patients-add-btn");
    if (btn) {
      try { btn.focus(); } catch {}
      btn.classList.add("flash-once");
      const t = setTimeout(() => { btn.classList.remove("flash-once"); ackFlashAdd(); }, 5000);
      return () => { clearTimeout(t); try { btn.classList.remove("flash-once"); } catch {} };
    } else {
      ackFlashAdd();
    }
  }, [flashAddAt, ackFlashAdd]);

  // filter client phụ (keyword đã filter từ server)
  const filtered = useMemo(() => {
    let arr = items;
    if (filter.status && filter.status !== "Tất cả") {
      const target = filter.status.trim().toLowerCase();
      arr = arr.filter(p => (p.status || "").trim().toLowerCase() === target);
    }
    return arr;
  }, [items, filter]);

  const counts = useMemo(() => {
    const s = (x) => (x.status || "").toLowerCase();
    const is = (p, labels) => labels.some(l => s(p) === l.toLowerCase());
    const done = items.filter(p => s(p) === "hoàn thành").length;
    const waitExam = items.filter(p => is(p, ["Chờ khám", "Chờ khám (dịch vụ)"])).length;
    const waitProc = items.filter(p => is(p, ["Chờ xử lý", "Chờ xử lý (dịch vụ)"])).length;
    const waitIntake = items.filter(p => is(p, ["Chờ tiếp nhận", "Chờ tiếp nhận (dịch vụ)"])).length;
    return { done, waitExam, waitProc, waitIntake };
  }, [items]);

  function handleAction(type, p) {
    if (type === "view") setModal({ open: true, mode: "view", patient: p });
    else if (type === "edit") setModal({ open: true, mode: "edit", patient: p });
    else if (type === "intake") setModal({ open: true, mode: "exam", patient: p });
    else if (type === "process") setModal({ open: true, mode: "process", patient: p });
  }

  async function handleSave(patch, mode) {
    if (mode === "add") {
      await createPatient(patch);
      setModal({ open: false, mode: "view", patient: null });
      nav(`/patients?pid=${encodeURIComponent(patch.id)}&focus=true`);
    } else {
      await updatePatient({ id: patch.id, patch });
      setModal({ open: false, mode: "view", patient: null });
    }
  }
  async function handleMutatePatient(pid, patch) {
    await updatePatient({ id: pid, patch });
  }

  function resetFilters(){ setFilter({ keyword: "", status: "Tất cả" }); }
  function openFilter(){ setFilterAnchor(filterBtnRef.current || null); setFilterOpen(true); }

  return (
    <motion.main initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="px-4 pb-3 pt-1 min-h-0 overflow-hidden" role="main" aria-label="Bệnh nhân">
      <div className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]" style={{ "--topbar-h": `${topbar}px` }}>
        <PatientsToolbar
          counts={counts}
          onAdd={() => setModal({ open: true, mode: "add", patient: { status: STATUSES.WAIT_INTAKE } })}
          onOpenFilter={openFilter}
          onResetFilters={resetFilters}
          filterBtnRef={filterBtnRef}
        />
        <div className="mt-3 flex-1 min-h-0">
          <PatientsTable items={filtered} onAction={handleAction} stretch highlightPid={highlightPid} />
        </div>
      </div>

      <PatientsFilterPopover open={filterOpen} onClose={()=>setFilterOpen(false)} values={filter} setValues={setFilter} anchorEl={filterAnchor || filterBtnRef.current} />

      <AnimatePresence>
        {modal.open && (
          <PatientModal
            open={modal.open}
            mode={modal.mode}
            patient={modal.patient}
            onClose={() => setModal({ open: false, mode: "view", patient: null })}
            onSave={handleSave}
            onMutatePatient={handleMutatePatient}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
