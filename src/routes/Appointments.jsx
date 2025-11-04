import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ApptToolbar from "../components/appointments/ApptToolbar.jsx";
import ApptList from "../components/appointments/ApptList.jsx";
import ApptCalendar from "../components/appointments/ApptCalendar.jsx";
import DayPanel from "../components/appointments/DayPanel.jsx";
import CreateDrawer from "../components/appointments/CreateDrawer.jsx";
import ApptDetailModal from "../components/appointments/ApptDetailModal.jsx";
import {
  useAppointmentsByDate,
  useCreateAppointment,
  useUpdateAppointment,
  useCheckInAppointment,
} from "../api/appointments";
import { useUIStore } from "../components/stores/uiStore";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { toast } from "react-toastify";

const RECEPTION_HOURS = { start: 6, end: 17 };
const isWithinReceptionHours = () => {
  const h = new Date().getHours();
  return h >= RECEPTION_HOURS.start && h < RECEPTION_HOURS.end;
};
const mm = (t) => {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
};

export default function Appointments() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const TODAY = new Date().toISOString().slice(0, 10);
  const [view, setView] = useState("list");
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

  // today list
  const { data: todayItems = [], isLoading } = useAppointmentsByDate(TODAY);
  const itemsByDate = {};
  (todayItems || []).forEach((a) => {
    (itemsByDate[a.date] ||= []).push(a);
  });

  // fetch items for selected panel date on demand
  const { data: panelItems = [] } = useAppointmentsByDate(panelDate, { enabled: !!panelDate });

  // reactive clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const counts = useMemo(
    () => ({
      today: todayItems.length,
      pending: todayItems.filter((a) => a.status === "Đang chờ").length,
      done: todayItems.filter((a) => a.status === "Đã xác nhận").length,
      cancel: todayItems.filter((a) => a.status === "Đã hủy").length,
    }),
    [todayItems]
  );

  function ensureMonthVisible(ymd) {
    const d = new Date(ymd);
    if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  const { mutateAsync: createAppt } = useCreateAppointment();
  const { mutateAsync: updateAppt } = useUpdateAppointment();
  const { mutateAsync: checkInAppt } = useCheckInAppointment();

  function openDetail(appt) {
    setDetailAppt(appt);
    setDetailOpen(true);
  }
  function closeDetail() {
    setDetailOpen(false);
    setDetailAppt(null);
  }

  async function addApptFromForm(fd) {
    if (!isWithinReceptionHours()) {
      toast.warn(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`);
      return;
    }
    // normalize payload (support CreateDrawer raw FormData)
    const isPayload = fd && ("patient" in fd || "time" in fd);
    let patient_name, patient_code, date, start, duration, type, doctor, department, note;
    if (isPayload) {
      patient_name = fd.patient?.trim() || "";
      patient_code = fd.code?.trim() || "";
      date = fd.date;
      start = fd.time || fd.start;
      duration = fd.duration;
      type = fd.type;
      doctor = fd.doctor;
      department = fd.dept || fd.department;
      note = fd.note || "";
    } else {
      ({ patient_name, patient_code, date, start, duration, type, doctor, department, note } = fd);
    }
    const newItem = {
      patient: patient_name,
      code: patient_code,
      date,
      time: start,
      duration: parseInt(duration || 30, 10),
      type,
      doctor,
      dept: department,
      note,
    };

    // basic clash check on client (optional; server should validate)
    const sameDay = todayItems.filter((x) => x.date === date && (doctor ? x.doctor === doctor : true));
    const clash = sameDay.find((x) => {
      const sa = mm(x.time),
        ea = sa + (x.duration || 30);
      const sb = mm(newItem.time),
        eb = sb + (newItem.duration || 30);
      return sa < eb && sb < ea;
    });

    const created = await createAppt({ ...newItem, status: clash ? "Đang chờ" : "Đã xác nhận" });
    if (date === TODAY) {
      setView("list");
      setPanelDate(null);
    } else {
      ensureMonthVisible(date);
      setPanelDate(date);
      setView("cal");
      setNewId(created?.id);
    }
    setDrawerOpen(false);
    setCreateDate("");
    toast[clash ? "warn" : "success"](clash ? `Trùng lịch với ${clash.patient} (${clash.time}).` : "Đã tạo lịch hẹn.");
  }

  async function handleCheckIn(appt) {
    if (!appt || appt.status === "Đã hủy") return;
    if (appt.checkedIn) {
      toast.warn("Bệnh nhân đã check-in trước đó.");
      return;
    }
    await checkInAppt(appt.id);
    const pid = appt.code || appt.pid || null;
    if (pid) useUIStore.getState().setHighlightPid(pid);
    else useUIStore.getState().flashAdd();
    toast.success("Đã check-in.");
    closeDetail();
  }

  const formatTime = (date) => date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <ApptToolbar
          view={view}
          setView={setView}
          onOpenCreate={() => {
            if (!isWithinReceptionHours()) {
              toast.warn(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`);
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
            <ApptList items={todayItems} loading={isLoading} error={null} onDetail={openDetail} onCheckIn={handleCheckIn} stretch />
          ) : (
            <div className="h-full min-h-0 p-0.5 overflow-auto scrollbar-none">
              <ApptCalendar
                month={month}
                itemsByDate={itemsByDate}
                onPrev={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                onNext={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
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
        items={panelItems}
        onClose={() => {
          setPanelDate(null);
          setNewId(null);
        }}
        onOpenDetail={openDetail}
        onCreate={
          panelDate
            ? () => {
                if (!isWithinReceptionHours()) {
                  toast.warn(`Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`);
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

      <CreateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={addApptFromForm} defaultDate={createDate || TODAY} />

      <ApptDetailModal
        open={detailOpen}
        appt={detailAppt}
        onClose={closeDetail}
        onUpdate={(patch) => useUpdateAppointment().mutateAsync({ id: patch.id, patch })}
        onCheckIn={handleCheckIn}
      />
    </motion.main>
  );
}
