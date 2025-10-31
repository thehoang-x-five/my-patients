import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PatientsToolbar from "../components/patients/PatientsToolbar.jsx";
import PatientsTable from "../components/patients/PatientsTable.jsx";
import PatientsFilterPopover from "../components/patients/PatientsFilterPopover.jsx";
import PatientModal from "../components/patients/PatientModal.jsx";

import {
  listPatients,
  addOne,
  updateOne,
  STATUSES,
  findById,
} from "../data/patients.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Patients() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const nav = useNavigate();
  const loc = useLocation();
  const { search, state } = loc;
  const sp = new URLSearchParams(search);

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ keyword: "", status: "Tất cả" });

  const [modal, setModal] = useState({ open: false, mode: "view", patient: null });

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // highlight row
  const [highlightPid, setHighlightPid] = useState(null);

  // Load data
  useEffect(() => { setItems(listPatients()); }, []);

  // Search/Filter
  const filtered = useMemo(() => {
    let arr = items;
    const kw = (filter.keyword).trim().toLowerCase();
    if (kw) {
      arr = arr.filter(p =>
        [p.id, p.pid, p.code, p.name, p.phone, p.email].filter(Boolean)
          .some(s => String(s).toLowerCase().includes(kw))
      );
    }
    if (filter.status && filter.status !== "Tất cả") {
      const target = filter.status.toLowerCase();
      arr = arr.filter(p => (p.status || "").toLowerCase() === target);
    }
    return arr;
  }, [items, filter]);

  // Counters
  const counts = useMemo(() => {
    const s = (x) => (x.status || "").toLowerCase();
    const is = (p, labels) => labels.some(l => s(p) === l.toLowerCase());
    const done = items.filter(p => s(p) === "hoàn thành").length;
    const waitExam = items.filter(p => is(p, ["Chờ khám", "Chờ khám (dịch vụ)"])).length;
    const waitProc = items.filter(p => is(p, ["Chờ xử lý", "Chờ xử lý (dịch vụ)"])).length;
    const waitIntake = items.filter(p => is(p, ["Chờ tiếp nhận", "Chờ tiếp nhận (dịch vụ)"])).length;
    return { done, waitExam, waitProc, waitIntake };
  }, [items]);

  // Open modal via query
  useEffect(() => {
    const pid = sp.get("pid");
    const action = sp.get("action");
    const defaultCode = sp.get("defaultCode") || "";
    const defaultName = sp.get("defaultName") || "";
    const focus = sp.get("focus") === "true";
    if (pid && focus) {
      const p = findById(pid);
      if (p) {
        setHighlightPid(pid);
        setModal({ open: true, mode: "view", patient: p });
      }
    } else if (action === "add") {
      const draft = {
        id: defaultCode || "",
        name: defaultName || "",
        status:STATUSES.WAIT_INTAKE, // fallback an toàn
      };
      setModal({ open: true, mode: "add", patient: draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Nhận điều hướng từ Check-in
  useEffect(() => {
    if (state?.focusAddNew) {
      const btn = document.getElementById("patients-add-btn");
      if (btn) {
        try { btn.focus(); } catch {}
        btn.classList.add("flash-once");
        const t = setTimeout(() => btn.classList.remove("flash-once"), 5000);
        nav(".", { replace: true, state: null });
        return () => clearTimeout(t);
      } else {
        nav(".", { replace: true, state: null });
      }
    }

    if (state?.highlightPid) {
      setHighlightPid(state.highlightPid);
      const t2 = setTimeout(() => { nav(".", { replace: true, state: null }); }, 0);
      return () => clearTimeout(t2);
    }
  }, [state, nav]);

  // tắt highlight sau 5s
  useEffect(() => {
    if (!highlightPid) return;
    const t = setTimeout(() => setHighlightPid(null), 5000);
    return () => clearTimeout(t);
  }, [highlightPid]);

  // Actions from table
  function handleAction(type, p) {
    if (type === "view") setModal({ open: true, mode: "view", patient: p });
    else if (type === "edit") setModal({ open: true, mode: "edit", patient: p });
    else if (type === "intake") setModal({ open: true, mode: "exam", patient: p });
    else if (type === "process") setModal({ open: true, mode: "process", patient: p });
  }

  // Mutations from modal
  function handleSave(patch, mode) {
    if (mode === "add") {
      const created = addOne(patch);
      setItems(listPatients());
      setModal({ open: false, mode: "view", patient: null });
      nav(`/patients?pid=${encodeURIComponent(created.id)}&focus=true`);
    } else {
      updateOne(patch.id, patch);
      setItems(listPatients());
      setModal({ open: false, mode: "view", patient: null });
    }
  }
  function handleMutatePatient(pid, patch) {
    updateOne(pid, patch);
    setItems(listPatients());
  }

  // Reset filters
  function resetFilters() {
    setFilter({ keyword: "", status: "Tất cả" });
  }
  function openFilter() {
        const anchor = filterBtnRef.current || null;
        setFilterAnchor(anchor);
        setFilterOpen(true);
      }

     // click ra ngoài / ESC để đóng
 
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Bệnh nhân"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <PatientsToolbar
          counts={counts}
          onAdd={() => setModal({ open: true, mode: "add", patient: { status: STATUSES.WAIT_INTAKE } })}
          onOpenFilter={openFilter}
          onResetFilters={resetFilters}
          filterBtnRef={filterBtnRef}
        />

        <div className="mt-3 flex-1 min-h-0">
          <PatientsTable
            items={filtered}
            onAction={handleAction}
            stretch
            highlightPid={highlightPid}
          />
        </div>
      </div>

      <PatientsFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={filter}
        setValues={setFilter}
        anchorEl={filterAnchor || filterBtnRef.current}
      />

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
