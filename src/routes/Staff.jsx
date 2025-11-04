// src/pages/Staff.jsx
import React, { useEffect, useMemo, useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StaffToolbar from "../components/staff/StaffToolbar.jsx";
import StaffGrid from "../components/staff/StaffGrid.jsx";
import StaffDetail from "../components/staff/StaffDetail.jsx";
import StaffSchedule from "../components/staff/StaffSchedule.jsx";
import {
  useStaff,
  useStaffStats,
  useStaffSchedule,
  useDutyRoom,
  subscribeStaff,
} from "../api/staff";
import { useQueryClient } from "@tanstack/react-query";
import useViewportVH from "../hooks/useViewportVH.js";
import useMediaQuery from "../hooks/useMediaQuery.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Staff() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;
  const qc = useQueryClient();

  // Filters / UI
  const [role, setRole] = useState("doctor");              // doctor | nurse
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | online | offline
  const [nurseKind, setNurseKind] = useState("all");       // all | clinical | administrative
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);

  const [active, setActive] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Subscribe realtime once
  useEffect(() => {
    let off = null;
    (async () => {
      off = await subscribeStaff(qc);
    })();
    return () => off && off();
  }, [qc]);

  // Query list + stats
  const params = { role, q, status: statusFilter, nurseKind, page, pageSize };
  const qDefer = useDeferredValue(q);
  const { data, isLoading, isError, error, isFetching } = useStaff({ ...params, q: qDefer });
  const { data: stats } = useStaffStats({ role });

  const items = data?.items || [];
  const total = data?.total || items.length;

  const online = stats?.online ?? items.filter((i) => i.status === "online").length;
  const idle = stats?.idle ?? Math.max(0, (stats?.online ?? 0) + (stats?.offline ?? 0) - online);
  const depts = stats?.depts ?? new Set(items.map((i) => i.dept)).size;

  function handleReset() {
    setQ("");
    setStatusFilter("all");
    setNurseKind("all");
    setPage(1);
  }

  // Active staff extra data
  const activeId = active?.id;
  const { data: scheduleMap } = useStaffSchedule(activeId);
  const { data: duty } = useDutyRoom(activeId, todayISO());

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
        <StaffToolbar
          role={role}
          setRole={(r) => { setRole(r); setPage(1); }}
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

        <div className="mt-2.5 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={role + (qDefer || "") + statusFilter + nurseKind + page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-0"
            >
              <div className="h-full min-h-0 overflow-auto scrollbar-none">
                {isLoading ? (
                  <section className="p-4 rounded-2xl bg-white ring-1 ring-slate-200">
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  </section>
                ) : isError ? (
                  <section className="p-6 rounded-2xl bg-red-50 ring-1 ring-red-200 text-red-700">
                    Không tải được danh sách. {String(error)}
                  </section>
                ) : (
                  <>
                    <StaffGrid
                      items={items}
                      role={role}
                      onDetail={(p) => { setActive(p); setShowDetail(true); }}
                      onSchedule={(p) => { setActive(p); setShowSchedule(true); }}
                    />

                    {/* Pagination (nếu server trả total) */}
                    {total > pageSize && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={page <= 1 || isFetching}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white disabled:opacity-50"
                        >
                          ‹ Trang trước
                        </button>
                        <div className="text-sm text-slate-600">
                          Trang <b>{page}</b> / {Math.ceil(total / pageSize)}
                        </div>
                        <button
                          type="button"
                          disabled={page >= Math.ceil(total / pageSize) || isFetching}
                          onClick={() =>
                            setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
                          }
                          className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white disabled:opacity-50"
                        >
                          Trang sau ›
                        </button>
                      </div>
                    )}
                  </>
                )}
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
        schedule={scheduleMap || null}
        roomToday={duty?.today || active?.roomToday || "—"}
        weekRoom={duty?.week || null}
        onClose={() => setShowDetail(false)}
      />

      <StaffSchedule
        open={showSchedule}
        item={active}
        schedule={scheduleMap || null}
        dutyRooms={duty?.week || null}
        onClose={() => setShowSchedule(false)}
      />
    </motion.main>
  );
}
