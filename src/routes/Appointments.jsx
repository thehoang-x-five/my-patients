import React from 'react';
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ApptToolbar from "../components/appointments/ApptToolbar.jsx";
import ApptList from "../components/appointments/ApptList.jsx";
import ApptCalendar from "../components/appointments/ApptCalendar.jsx";
import DayPanel from "../components/appointments/DayPanel.jsx";
import CreateDrawer from "../components/appointments/CreateDrawer.jsx";
import ApptDetailModal from "../components/appointments/ApptDetailModal.jsx";
import Chip from "../components/ui/Chip.jsx";
import { APPOINTMENTS, DOCTORS } from "../data/appointments.js";
import { STATUSES } from "../data/patients.js";
import { enqueueFromAppointment } from "../data/queue.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

function groupByDate(appts) {
  return appts.reduce((acc, a) => ((acc[a.date] ||= []).push(a), acc), {});
}
function formatVN(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
const mm = (t) => {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
};
const overlap = (a, b) => {
  const sa = mm(a.time), ea = sa + (a.duration || 30);
  const sb = mm(b.time), eb = sb + (b.duration || 30);
  return sa < eb && sb < ea;
};

// Giờ tiếp nhận: 6h-17h
const RECEPTION_HOURS = { start: 6, end: 17 };
function isWithinReceptionHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= RECEPTION_HOURS.start && hour < RECEPTION_HOURS.end;
}

export default function Appointments() {
  const navigate = useNavigate();
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [view, setView] = useState("list");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [panelDate, setPanelDate] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);

  const [newId, setNewId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const TODAY = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(APPOINTMENTS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const itemsToday = useMemo(
    () =>
      items
        .filter((a) => a.date === TODAY)
        .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [items, TODAY]
  );

  const counts = useMemo(
    () => ({
      today: itemsToday.length,
      pending: itemsToday.filter((a) => a.status === "Đang chờ").length,
      done: itemsToday.filter((a) => a.status === "Đã xác nhận").length,
      cancel: itemsToday.filter((a) => a.status === "Đã hủy").length,
    }),
    [itemsToday]
  );

  const itemsByDate = useMemo(() => groupByDate(items), [items]);

  function openDetail(appt) {
    setDetailAppt(appt);
    setDetailOpen(true);
  }
  function closeDetail() {
    setDetailOpen(false);
    setDetailAppt(null);
  }
  function updateAppt(patch) {
    setItems((prev) =>
      prev.map((it) => (it.id === patch.id ? { ...it, ...patch } : it))
    );
    setDetailAppt((a) => (a?.id === patch.id ? { ...a, ...patch } : a));
  }

  function showToast(msg, tone = "ok") {
    clearTimeout(toastTimer.current);
    setToast({ msg, tone });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  function ensureMonthVisible(ymd) {
    const d = new Date(ymd);
    if (
      d.getFullYear() !== month.getFullYear() ||
      d.getMonth() !== month.getMonth()
    ) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  function addApptFromForm(fd) {
    // Check working hours
    if (!isWithinReceptionHours()) {
      showToast(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`, "warn");
      return;
    }

    const {
      patient_name,
      patient_code,
      date,
      start,
      duration,
      type,
      doctor,
      department,
      note,
    } = fd;

    const newItem = {
      id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      patient: patient_name,
      code: patient_code,
      date,
      time: start,
      duration: parseInt(duration, 10) || 30,
      type,
      doctor,
      dept: department,
      note,
      status: "Đã xác nhận",
      checkedIn: false,
      paid: false,
    };

    const sameDay = items.filter(
      (x) => x.date === date && (doctor ? x.doctor === doctor : true)
    );
    const clash = sameDay.find((x) => {
      const sa = mm(x.time), ea = sa + (x.duration || 30);
      const sb = mm(newItem.time), eb = sb + (newItem.duration || 30);
      return sa < eb && sb < ea;
    });

    let statusMsg = "Đã tạo lịch hẹn.";
    if (clash) {
      newItem.status = "Đang chờ";
      newItem.note = "";
      statusMsg = `Trùng lịch với ${clash.patient} (${clash.time}).`;
    }

    setItems((prev) =>
      [newItem, ...prev].sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
      )
    );

    if (date === TODAY) {
      setView("list");
      setPanelDate(null);
    } else {
      ensureMonthVisible(date);
      setPanelDate(date);
      setView("cal");
      setNewId(newItem.id);
    }

    setDrawerOpen(false);
    setCreateDate("");
    showToast(statusMsg, clash ? "warn" : "ok");
  }

  /* Check-in: đánh dấu & điều hướng */
  function handleCheckIn(appt) {
    if (!appt || appt.status === "Đã hủy") return;
    if (appt.checkedIn) {
      showToast("Bệnh nhân đã check-in trước đó.", "warn");
      return;
    }

    const isFollowup = appt.type === "Tái khám" || appt.type === "tái khám" || appt.type === "follow_up" || appt.type === "Khám định kỳ";

    // Đưa vào hàng chờ
    enqueueFromAppointment(
      {
        id: appt.id,
        date: appt.date,
        time: appt.time,
        patient: appt.patient,
        code: appt.code,
        dept: appt.dept,
        doctor: appt.doctor,
      },
      { note: appt.note || "" }
    );

    // Đánh dấu trên lịch hẹn
    updateAppt({ id: appt.id, checkedIn: true, paid: true });

    // Điều hướng sang trang bệnh nhân
    if (isFollowup && appt.code) {
      navigate(`/patients?pid=${appt.code}&focus=true&highlightId=${appt.id}`);
      showToast("Đã check-in, chuyển sang bệnh nhân.", "ok");
    } else {
      navigate(`/patients?action=add&defaultCode=${appt.code || ""}&defaultName=${appt.patient}&focus=true`);
      showToast("Đã check-in, mở thêm bệnh nhân.", "ok");
    }

    closeDetail();
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
    >
  
      {/* Content */}
      <div
         className="mt-2 flex flex-col min-h-0
         h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
style={{ "--topbar-h": `${topbar}px` }}
      >
                <ApptToolbar
          view={view}
          setView={setView}
          onOpenCreate={() => {
            if (!isWithinReceptionHours()) {
              showToast(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`, "warn");
              return;
            }
            setCreateDate(panelDate || TODAY);
            setDrawerOpen(true);
          }}
          counts={counts}
          withinReception={isWithinReceptionHours()}
          timeLabel={formatTime(currentTime)}
          receptionHours={RECEPTION_HOURS}
        />
        <div className="mt-3 flex-1 min-h-0">
          {view === "list" ? (
            <ApptList
              items={itemsToday}
              loading={loading}
              error={error}
              onDetail={openDetail}
              onCheckIn={handleCheckIn}
              stretch
            />
          ) : (
            <div className="h-full min-h-0 p-0.5 overflow-auto scrollbar-none">
              <ApptCalendar
                month={month}
                itemsByDate={itemsByDate}
                onPrev={() =>
                  setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                }
                onNext={() =>
                  setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                }
                onPickDay={(d) => {
                  setPanelDate(d);
                  setNewId(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <DayPanel
        open={!!panelDate}
        dateLabel={panelDate ? `${panelDate.split("-").reverse().join("/")}` : ""}
        items={panelDate ? itemsByDate[panelDate] || [] : []}
        onClose={() => {
          setPanelDate(null);
          setNewId(null);
        }}
        onOpenDetail={openDetail}
        onCreate={
          panelDate
            ? () => {
                if (!isWithinReceptionHours()) {
                  showToast(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`, "warn");
                  return;
                }
                setCreateDate(panelDate);
                setDrawerOpen(true);
              }
            : undefined
        }
        highlightId={newId}
        onCheckIn={handleCheckIn}
      />

      <CreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={addApptFromForm}
        doctorSuggest={DOCTORS}
        defaultDate={createDate || TODAY}
      />

      <ApptDetailModal
        open={detailOpen}
        appt={detailAppt}
        onClose={closeDetail}
        onUpdate={updateAppt}
        onCheckIn={handleCheckIn}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={[
              "fixed right-4 bottom-4 z-50 rounded-xl px-4 py-3 shadow-lg ring-1 font-semibold",
              toast.tone === "warn"
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-emerald-50 text-emerald-700 ring-emerald-200",
            ].join(" ")}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
