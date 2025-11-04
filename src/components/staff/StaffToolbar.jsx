import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

/* Icon button mini */
function IconBtn({ children, title, onClick, active, btnRef }) {
  return (
    <button
      ref={btnRef}
      type="button"
      title={title}
      onClick={onClick}
      className={
        "relative inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold ring-1 transition " +
        (active
          ? "bg-sky-600 text-white ring-sky-500 hover:bg-sky-700"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50")
      }
    >
      {children}
      {active && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-sky-600" />
      )}
    </button>
  );
}

/* Popover lọc – bám theo vị trí nút Lọc */
function FilterPopover({
  anchorEl,
  open,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  role,
  nurseKind,
  setNurseKind,
  onClose,
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 420 });

  useEffect(() => {
    function place() {
      if (!anchorEl) return;
      const r = anchorEl.getBoundingClientRect();
      setPos({
        top: r.bottom + 8,
        left: Math.max(12, Math.min(window.innerWidth - 12 - 420, r.right - 420)), // canh phải nút
        width: Math.min(420, window.innerWidth - 24),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorEl, open]);

  const statusTabs = useMemo(
    () => [
      ["all", "Tất cả"],
      ["online", "Đang làm"],
      ["offline", "Tạm nghỉ"],
    ],
    []
  );

  const nurseTabs = useMemo(
    () => [
      ["all", "Tất cả"],
      ["clinical", "Lâm sàng"],
      ["administrative", "Hành chính"],
    ],
    []
  );

  const statusIndex = statusTabs.findIndex(([v]) => v === statusFilter);
  const nurseIndex = nurseTabs.findIndex(([v]) => v === nurseKind);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed z-50 rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="dialog"
            aria-modal="true"
          >
            <header className="px-4 py-2 text-slate-800 font-bold">Bộ lọc</header>
            <div className="p-4 pt-2 space-y-3">
              <div>
                <div className="text-sm text-slate-600 mb-1">Từ khóa</div>
                <label className="relative block">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="🔎  Mã / Họ tên / SĐT / Email / Phòng…"
                    className="w-full rounded-xl px-3 py-2 bg-white focus:ring-2 ring-1 ring-slate-200 outline-none focus:ring-sky-400"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Xóa"
                    >
                      ✕
                    </button>
                  )}
                </label>
              </div>

              <div>
                <div className="text-sm text-slate-600 mb-1">Trạng thái</div>
                <div className="relative inline-flex rounded-xl ring-1 ring-slate-200 p-0.5">
                  <motion.div
                    layout
                    layoutId="status-switch"
                    className="absolute top-0.5 bottom-0.5 rounded-lg bg-cyan-50"
                    style={{
                      width: `${100 / statusTabs.length}%`,
                      left: statusIndex * (100 / statusTabs.length) + "%",
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                  {statusTabs.map(([val, label]) => (
                    <button
                      key={val}
                      role="tab"
                      aria-selected={statusFilter === val}
                      onClick={() => setStatusFilter(val)}
                      className={
                        "relative w-32 z-10 px-3 py-1.5 font-semibold " +
                        (statusFilter === val ? "text-cyan-700" : "text-slate-700")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {role === "nurse" && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Loại y tá</div>
                  <div className="relative inline-flex rounded-xl ring-1 ring-slate-200 p-0.5">
                    <motion.div
                      layout
                      layoutId="nurse-switch"
                      className="absolute top-0.5 bottom-0.5 rounded-lg bg-teal-50"
                      style={{
                        width: `${100 / nurseTabs.length}%`,
                        left: nurseIndex * (100 / nurseTabs.length) + "%",
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                    {nurseTabs.map(([val, label]) => (
                      <button
                        key={val}
                        role="tab"
                        aria-selected={nurseKind === val}
                        onClick={() => setNurseKind(val)}
                        className={
                          "relative w-32 z-10 px-3 py-1.5 font-semibold " +
                          (nurseKind === val ? "text-teal-700" : "text-slate-700")
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default function StaffToolbar({
  role,
  setRole,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  nurseKind,
  setNurseKind,
  online,
  idle,
  deptsCount,
  filterOpen,
  setFilterOpen,
  onReset,
}) {
  const filterBtnRef = useRef(null);

  // Vai trò – ngoài cùng bên phải
  const roleTabs = [
    ["doctor", "Bác sĩ"],
    ["nurse", "Y tá"],
  ];
  const roleIndex = roleTabs.findIndex(([v]) => v === role);

  return (
    <div className="relative flex items-center gap-2">
      {/* chips thống kê bên trái (giữ gọn) */}
      <div className="hidden sm:flex items-center gap-2">
        <Chip dot="emerald"><b>{online}</b> đang làm việc</Chip>
        <Chip dot="amber"><b>{idle}</b> tạm nghỉ</Chip>
        <Chip dot="cyan"><b>{deptsCount}</b> đơn vị</Chip>
      </div>

      {/* đẩy sang phải */}
      <div className="flex-1" />

      {/* 2 nút: Reset + Lọc – đặt KẾ thanh vai trò (bên trái) */}
      <div className="flex items-center gap-2">
        <IconBtn title="Đặt lại bộ lọc" onClick={onReset}>⟲</IconBtn>
        <IconBtn
          btnRef={filterBtnRef}
          title="Lọc"
          onClick={() => setFilterOpen((v) => !v)}
          active={filterOpen || q.trim() !== "" || statusFilter !== "all" || (role === "nurse" && nurseKind !== "all")}
        >
          🔻 Lọc
        </IconBtn>
      </div>

      {/* Thanh vai trò – ngoài cùng bên phải */}
      <div
        className="relative inline-flex rounded-xl ring-1 ring-slate-200 p-0.5"
        role="tablist"
        aria-label="Chọn vai trò"
      >
        <motion.div
          layout
          layoutId="role-switch"
          className="absolute top-0.5 bottom-0.5 rounded-lg bg-sky-50"
          style={{
            width: `${100 / roleTabs.length}%`,
            left: roleIndex * (100 / roleTabs.length) + "%",
          }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
        {roleTabs.map(([val, label]) => (
          <button
            key={val}
            role="tab"
            aria-selected={role === val}
            onClick={() => setRole(val)}
            className={
              "relative z-10 px-3 py-1.5 font-semibold " +
              (role === val ? "text-sky-700" : "text-slate-700")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Popover lọc – bám theo nút Lọc */}
      <FilterPopover
        anchorEl={filterBtnRef.current}
        open={filterOpen}
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        role={role}
        nurseKind={nurseKind}
        setNurseKind={setNurseKind}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
