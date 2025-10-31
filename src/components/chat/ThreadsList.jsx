import React from 'react';
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useMediaQuery from "../../hooks/useMediaQuery";

function Chip({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-slate-200/80 bg-white ${className}`}
    >
      {children}
    </span>
  );
}

function RoleSegment({ role, setRole }) {
  const items = [
    { k: "all", label: "Tất cả" },
    { k: "patient", label: "Bệnh nhân" },
    { k: "nurse", label: "Y tá" },
    { k: "doctor", label: "Bác sĩ" },
  ];
  return (
    <div
      className="relative isolate w-full rounded-2xl ring-1 ring-slate-200/80 bg-white p-1"
      role="tablist"
      aria-label="Lọc theo vai trò"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map((it) => {
          const active = role === it.k;
          return (
            <button
              key={it.k}
              role="tab"
              aria-selected={active}
              onClick={() => setRole(it.k)}
              className={`relative h-9 rounded-xl font-semibold transition-colors ${
                active ? "text-sky-700" : "text-slate-700"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="rolePill"
                  className="absolute inset-0 rounded-xl bg-sky-50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onClick = (e) =>
      ref.current && !ref.current.contains(e.target) && onClose?.();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [onClose, ref]);
}

function ThreadContextMenu({
  open,
  x,
  y,
  thread,
  onClose,
  onPin,
  onUnread,
  onArchive,
  onDelete,
}) {
  const ref = useRef(null);
  useOutsideClose(ref, onClose);
  const entries = [
    {
      id: "pin",
      label: thread?.pinned ? "Bỏ ghim" : "Ghim hội thoại",
      icon: "📌",
      click: () => onPin?.(thread.id),
    },
    {
      id: "unread",
      label: thread?.unread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc",
      icon: thread?.unread ? "✅" : "●",
      click: () => onUnread?.(thread.id),
    },
    {
      id: "archive",
      label: thread?.archived ? "Bỏ lưu trữ" : "Lưu trữ",
      icon: "🗄️",
      click: () => onArchive?.(thread.id),
    },
    { id: "sep", separator: true },
    {
      id: "copy",
      label: "Sao chép tên",
      icon: "📋",
      click: () => navigator.clipboard.writeText(thread?.name || ""),
    },
    {
      id: "delete",
      label: "Xoá khỏi danh sách",
      icon: "🗑️",
      danger: true,
      click: () => onDelete?.(thread.id),
    },
  ];
  const style = {
    left: Math.min(x, window.innerWidth - 260),
    top: Math.min(y, window.innerHeight - 240),
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.ul
          ref={ref}
          role="menu"
          initial={{ opacity: 0, scale: 0.98, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="fixed z-[80] min-w-[220px] max-w-[260px] rounded-xl bg-white ring-1 ring-slate-200/80 shadow-2xl p-1 overflow-hidden"
          style={style}
        >
          {entries.map((it, idx) =>
            it.separator ? (
              <li key={idx} className="my-1 h-px bg-slate-100" />
            ) : (
              <li key={it.id}>
                <button
                  role="menuitem"
                  onClick={() => {
                    it.click?.();
                    onClose?.();
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${
                    it.danger ? "text-rose-600 hover:text-rose-700" : ""
                  }`}
                >
                  <span className="w-5 text-center">{it.icon}</span>
                  <span>{it.label}</span>
                </button>
              </li>
            )
          )}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

export default function ThreadsList({
  items = [],
  activeId,
  onPick,
  onOpenFilter,
  q,
  setQ,
  role,
  setRole,
  filterAnchorRef,
  onTogglePin,
  onToggleUnread,
  onToggleArchive,
  onDeleteThread,
}) {
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, thread: null });
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  function openMenu(e, t) {
    e.preventDefault();
    setMenu({ open: true, x: e.clientX, y: e.clientY, thread: t });
  }

  return (
    <aside className="card p-3 flex flex-col min-h-0 h-full overflow-visible">
      {/* Sticky controls */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-xl">
        <div ref={filterAnchorRef} className="flex items-center gap-1.5 pt-1">
          <div className="relative flex-1 min-w-0">
            <input
              value={q}
              aria-label="Tìm kiếm"
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên / nội dung…"
              className="w-full rounded-xl px-3 py-1.5 pl-2 pr-5 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onOpenFilter}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-tr from-sky-50 to-sky-100 px-2.5 py-2 text-sm font-semibold text-white shadow-soft hover:-translate-y-px active:translate-y-0 transition "
            aria-haspopup="dialog"
            title="Lọc & Tìm kiếm"
          >
            <img src="/loc.png" alt="Lọc" className="w-5 h-5" />
          </button>
          <button
            className="btn btn-primary w-10 hover:-translate-y-0.5"
            title="Tạo hội thoại mới"
          >
            +
          </button>
        </div>
        <div className="mt-2 mb-2">
          <RoleSegment role={role} setRole={setRole} />
        </div>
      </div>

      {/* List */}
      <div className="mt-1 p-1 *:flex-1 min-h-0 overflow-auto space-y-2 scrollbar-none">
        {items.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => onPick?.(t.id)}
            onContextMenu={(e) => openMenu(e, t)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full text-left rounded-xl ring-1 p-2 transition ${
              activeId === t.id
                ? "bg-sky-50 ring-sky-200"
                : "bg-white hover:bg-gradient-to-b  hover:from-white hover:bg-slate-100/90 ring-slate-200/80 hover:-translate-y-0.5 hover:ring-sky-200 hover:shadow-soft  transition "
            }`}
            title="Nhấp chuột phải để mở menu"
          >
            <div className="flex items-start gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center font-bold">
                {t.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <b className="truncate">{t.name}</b>
                  <span className="text-xs text-slate-500">{t.lastAt}</span>
                </div>
                <div className="text-slate-500 text-sm truncate">
                  {t.snippet}
                </div>
                <div className="mt-1 flex gap-2">
                  <Chip className="text-slate-600">{t.channel}</Chip>
                  {t.unread && (
                    <Chip className="!bg-rose-50 !text-rose-700 ring-rose-200">
                      Chưa đọc
                    </Chip>
                  )}
                  {t.pinned && (
                    <Chip className="!bg-amber-50 !text-amber-700 ring-amber-200">
                      Ghim
                    </Chip>
                  )}
                  {t.archived && (
                    <Chip className="!bg-slate-50 !text-slate-600 ring-slate-200">
                      Lưu trữ
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
        {!items.length && (
          <div className="text-slate-500 text-sm">Không có hội thoại.</div>
        )}
      </div>

      <ThreadContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        thread={menu.thread || {}}
        onClose={() => setMenu((s) => ({ ...s, open: false }))}
        onPin={onTogglePin}
        onUnread={onToggleUnread}
        onArchive={onToggleArchive}
        onDelete={onDeleteThread}
      />
    </aside>
  );
}
