import React, { useEffect, useMemo, useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StaffToolbar from "../components/staff/StaffToolbar.jsx";
import StaffGrid from "../components/staff/StaffGrid.jsx";
import StaffDetail from "../components/staff/StaffDetail.jsx";
import StaffSchedule from "../components/staff/StaffSchedule.jsx";
import { DOCTORS, NURSES, SCHEDULE } from "../data/staff.js";
import useViewportVH from "../hooks/useViewportVH.js";
import useMediaQuery from "../hooks/useMediaQuery.js";

export default function Staff() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  // state chính
  const [role, setRole] = useState("doctor");          // doctor | nurse
  const [q, setQ] = useState("");                      // từ khóa (nằm trong popover)
  const [statusFilter, setStatusFilter] = useState("all"); // all | online | offline
  const [nurseKind, setNurseKind] = useState("all");   // all | clinical | administrative
  const [items, setItems] = useState(DOCTORS);
  const [active, setActive] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // mở/đóng panel lọc
  const [filterOpen, setFilterOpen] = useState(false);

  // đổi tab role
  useEffect(() => {
    setItems(role === "doctor" ? DOCTORS : NURSES);
    setActive(null);
    setShowDetail(false);
    setShowSchedule(false);
  }, [role]);

  // reset filter
  function handleReset() {
    setQ("");
    setStatusFilter("all");
    setNurseKind("all");
  }

  // lọc mượt
  const qDefer = useDeferredValue(q);
  const filtered = useMemo(() => {
    const term = qDefer.trim().toLowerCase();
    let list = items;

    if (statusFilter !== "all") {
      list = list.filter((p) =>
        statusFilter === "online" ? p.status === "online" : p.status !== "online"
      );
    }
    if (role === "nurse" && nurseKind !== "all") {
      list = list.filter((p) =>
        nurseKind === "administrative"
          ? p.roleType === "administrative"
          : p.roleType !== "administrative"
      );
    }

    if (!term) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.managedRooms || []).some((r) => r.toLowerCase().includes(term)) ||
        (p.managedDepartments || []).some((d) => d.toLowerCase().includes(term)) ||
        (p.email || "").toLowerCase().includes(term) ||
        (p.phone || "").toLowerCase().includes(term)
    );
  }, [items, qDefer, statusFilter, nurseKind, role]);

  const online = items.filter((i) => i.status === "online").length;
  const idle = items.length - online;
  const depts = new Set(items.map((i) => i.dept)).size;

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-4 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Nhân sự"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* TOPBAR: Reset + Lọc (kế bên) + Vai trò (ngoài cùng bên phải) */}
        <StaffToolbar
          role={role}
          setRole={setRole}
          q={q}
          setQ={setQ}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          nurseKind={nurseKind}
          setNurseKind={setNurseKind}
          online={online}
          idle={idle}
          deptsCount={depts}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          onReset={handleReset}
        />

        {/* CONTENT */}
        <div className="mt-2.5 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={role + qDefer + statusFilter + nurseKind}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-0"
            >
              <div className="h-full min-h-0 overflow-auto scrollbar-none">
                <StaffGrid
                  items={filtered}
                  role={role}
                  onDetail={(p) => {
                    setActive(p);
                    setShowDetail(true);
                  }}
                  onSchedule={(p) => {
                    setActive(p);
                    setShowSchedule(true);
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      <StaffDetail
        open={showDetail}
        item={active}
        role={role}
        onClose={() => setShowDetail(false)}
      />
      <StaffSchedule
        open={showSchedule}
        item={active}
        schedule={active ? SCHEDULE[active.id] : null}
        onClose={() => setShowSchedule(false)}
      />
    </motion.main>
  );
}
