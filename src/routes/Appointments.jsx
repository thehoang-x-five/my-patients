// src/pages/Appointments.jsx
// [FIXED 2025-11-22] Sync appointment status + check-in & queue logic with BE. UI/layout unchanged.
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  useUpdateAppointmentStatus,
  useCheckInAppointment,
  APPT_STATUS,
  useAppointmentsRange,
  subscribeAppointments,
} from "../api/appointments.js";
import { useUIStore, useAuthStore } from "../components/stores/appStore";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { toast } from "react-toastify";
import { getFollowupContext, clearFollowupContext } from "../utils/followupContext.js";
import { canManageReception } from "../utils/permissions.js";

const RECEPTION_HOURS = { start: 0, end: 24 };
const isWithinReceptionHours = () => {
  const h = new Date().getHours();
  return h >= RECEPTION_HOURS.start && h < RECEPTION_HOURS.end;
};
const mm = (t) => {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
};
const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function Appointments() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;
  const navigate = useNavigate();

  // ✅ Check permissions
  const user = useAuthStore((s) => s.user);
  const hasReceptionPermission = canManageReception(user);

  const TODAY = toYMD(new Date());
  const [view, setView] = useState("list");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const monthStartStr = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), 1);
    return toYMD(d);
  }, [month]);

  const monthEndStr = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return toYMD(d);
  }, [month]);

  const [panelDate, setPanelDate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);
  const [newId, setNewId] = useState(null);

  // ✅ Follow-up context detection
  const [hasFollowupContext, setHasFollowupContext] = useState(false);
  const [followupContextData, setFollowupContextData] = useState(null);

  // ✅ Ref to prevent duplicate useEffect execution
  const hasProcessedFollowupRef = React.useRef(false);

  // ✅ Log component mount for debugging
  React.useEffect(() => {
    console.log('[Appointments] Component mounted');
    return () => {
      console.log('[Appointments] Component unmounted');
    };
  }, []);

  // Check for follow-up context on mount
  useEffect(() => {
    // ✅ Guard: Prevent duplicate execution
    if (hasProcessedFollowupRef.current) {
      console.log("[Appointments] Follow-up already processed, skipping");
      return;
    }
    
    const context = getFollowupContext();
    if (context) {
      // ✅ Check if already notified
      if (context.notified) {
        console.log("[Appointments] Follow-up context already notified, skipping toast");
        setHasFollowupContext(true);
        setFollowupContextData(context);
        
        // Still trigger flash animation even if already notified
        const uiStore = useUIStore.getState();
        uiStore.flashApptCreate();
        
        hasProcessedFollowupRef.current = true;
        return;
      }
      
      // ✅ First time showing notification
      setHasFollowupContext(true);
      setFollowupContextData(context);
      console.log("[Appointments] Follow-up context detected:", context);
      
      // Show toast ONCE
      toast.info(`Vui lòng tạo lịch hẹn tái khám cho bệnh nhân: ${context.patientName}`);
      
      // Mark as notified
      const { markFollowupNotified } = require("../utils/followupContext.js");
      markFollowupNotified();
      
      // Trigger flash animation
      const uiStore = useUIStore.getState();
      uiStore.flashApptCreate();
      
      // Mark as processed
      hasProcessedFollowupRef.current = true;
    }
  }, []); // ✅ Empty deps - run only once on mount

  // today list
  const { data: todayItems = [], isLoading } = useAppointmentsByDate(TODAY);

  // Chỉ dùng cho hiển thị list – ẩn các lịch đã huỷ
  const visibleTodayItems = useMemo(
    () => todayItems.filter((a) => a.status !== APPT_STATUS.DA_HUY),
    [todayItems]
  );

  // Lịch của cả tháng hiện tại (cho calendar)
  // ✅ Only fetch when in calendar view to reduce unnecessary calls
  const { data: monthItems = [] } = useAppointmentsRange(
    monthStartStr,
    monthEndStr,
    { enabled: !!monthStartStr && !!monthEndStr && view === "cal" }
  );

  const queryClient = useQueryClient();

  // Realtime: lắng nghe AppointmentChanged từ SignalR
  useEffect(() => {
    let off;
    (async () => {
      try {
        off = await subscribeAppointments(queryClient);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("subscribeAppointments error", err);
      }
    })();

    return () => {
      if (typeof off === "function") off();
    };
  }, [queryClient]);

  const itemsByDate = useMemo(() => {
    const map = {};
    (monthItems || []).forEach((a) => {
      if (!a?.date) return;
      if (a.status === APPT_STATUS.DA_HUY) return; // ẩn lịch đã huỷ ở Panel
      (map[a.date] ||= []).push(a);
    });
    return map;
  }, [monthItems]);

  const panelItems = panelDate ? itemsByDate[panelDate] || [] : [];

  const counts = useMemo(
    () => ({
      today: todayItems.length,
      pending: todayItems.filter((a) => a.status === APPT_STATUS.DANG_CHO)
        .length,
      confirmed: todayItems.filter(
        (a) => a.status === APPT_STATUS.DA_XAC_NHAN
      ).length,
      checkedIn: todayItems.filter(
        (a) => a.status === APPT_STATUS.DA_CHECKIN
      ).length,
      cancel: todayItems.filter((a) => a.status === APPT_STATUS.DA_HUY).length,
    }),
    [todayItems]
  );



  function ensureMonthVisible(ymd) {
    const d = new Date(ymd);
    if (
      d.getFullYear() !== month.getFullYear() ||
      d.getMonth() !== month.getMonth()
    ) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  const { mutateAsync: createAppt, } = useCreateAppointment();
  const { mutateAsync: updateAppt } = useUpdateAppointment();
  const { mutateAsync: updateApptStatus } = useUpdateAppointmentStatus();
  const { mutateAsync: checkInAppt } = useCheckInAppointment();

  // ===== Prefill & highlight “Tạo lịch hẹn” khi điều hướng từ PatientModal
  const apptPrefill = useUIStore((s) => s.apptPrefill);
  const flashApptCreateAt = useUIStore((s) => s.flashApptCreateAt);
  const ackFlashApptCreate = useUIStore((s) => s.ackFlashApptCreate);
  const clearApptPrefill = useUIStore((s) => s.clearApptPrefill);

  // When the Create Drawer is opened as a result of a patient->appointments flow
  // (flashApptCreateAt set) we want the drawer to receive the prefill once,
  // and then clear the prefill so subsequent opens don't auto-fill or highlight.
  useEffect(() => {
    if (!drawerOpen) return;
    if (!apptPrefill) return;
    if (!flashApptCreateAt) return;

    // Allow CreateDrawer to read the prop and fill the form first,
    // then clear store after a delay to ensure form is filled
    const t = setTimeout(() => {
      try {
        clearApptPrefill();
      } catch {}
      try {
        ackFlashApptCreate();
      } catch {}
    }, 500); // Tăng thời gian để đảm bảo form đã điền xong

    return () => clearTimeout(t);
  }, [drawerOpen, apptPrefill, flashApptCreateAt, clearApptPrefill, ackFlashApptCreate]);

  const clearIfAnyPrefill = () => {
    if (useUIStore.getState().apptPrefill) clearApptPrefill();
  };

  useEffect(() => {
    if (!flashApptCreateAt) return;
    const btn = document.getElementById("appt-create-btn");
    if (btn) {
      try {
        btn.focus();
      } catch {}
      btn.classList.add("flash-once");
      const t = setTimeout(() => {
        btn.classList.remove("flash-once");
        ackFlashApptCreate();
      }, 5000);
      return () => {
        clearTimeout(t);
        try {
          btn.classList.remove("flash-once");
        } catch {}
      };
    } else {
      ackFlashApptCreate();
    }
  }, [flashApptCreateAt, ackFlashApptCreate]);

  // ✅ Clear prefill nếu rời trang / unmount (chuyển route)
  useEffect(() => {
    const onBeforeUnload = () => clearIfAnyPrefill();
    window.addEventListener("pagehide", onBeforeUnload);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onBeforeUnload);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearIfAnyPrefill();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // ✅ Clear prefill nếu thực hiện hành động khác (mở chi tiết, đổi view, chọn ngày…)
  function openDetail(appt) {
    clearIfAnyPrefill();
    setDetailAppt(appt);
    setDetailOpen(true);
  }
  function closeDetail() {
    setDetailOpen(false);
    setDetailAppt(null);
  }

  async function addApptFromForm(fd) {
    if (!isWithinReceptionHours()) {
      toast.warn(
        `Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`
      );
      return;
    }
    // Cho phép cả FormData lẫn plain object, map về field chuẩn hoá theo api/appointments
    const isFormData =
      typeof FormData !== "undefined" && fd instanceof FormData;
  
    let patientName,
      patientCode,
      phone,
      date,
      time,
      duration,
      typeRaw,
      doctorName,
      deptName,
      note;
  
    if (isFormData) {
      patientName =
        (fd.get("patient_name") || fd.get("patient") || "").toString().trim();
      patientCode =
        (fd.get("patient_code") || fd.get("code") || "").toString().trim();
      phone = (fd.get("phone") || "").toString().trim();
      date = fd.get("date");
      // form đặt name="start"
      time = fd.get("time") || fd.get("start");
      duration = fd.get("duration");
      typeRaw = fd.get("type");
      doctorName = fd.get("doctor");
      deptName = fd.get("dept") || fd.get("department");
      note = fd.get("note");
    } else if (fd && typeof fd === "object") {
      // object từ CreateDrawer: { patient_name, patient_code, phone, date, start, type, department, doctor, note }
      patientName =
        fd.patient_name?.trim() ||
        fd.patientName?.trim() ||
        fd.patient?.trim() ||
        "";
      patientCode =
        fd.patient_code?.trim() ||
        fd.patientCode?.trim() ||
        fd.code?.trim() ||
        "";
      phone = fd.phone?.trim() || "";
      date = fd.date;
      time = fd.time || fd.start;
      duration = fd.duration;
      typeRaw = fd.type;
      doctorName = fd.doctor;
      deptName = fd.dept || fd.department;
      note = fd.note;
    }
  
    // Chuẩn hoá & validate theo DTO BE
    patientName = (patientName || "").trim();
    patientCode = (patientCode || "").trim();
    phone = (phone || "").trim();
    date = (date || "").trim();
    time = (time || "").trim();
    deptName = (deptName || "").trim();
    doctorName = (doctorName || "").trim();
  
    if (!patientName || !date || !time) {
      toast.error("Vui lòng nhập đủ tên, ngày và giờ hẹn.");
      return;
    }
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!deptName) {
      toast.error("Vui lòng chọn khoa khám.");
      return;
    }
    if (!doctorName) {
      toast.error("Vui lòng chọn bác sĩ khám.");
      return;
    }
  
    // Map giá trị select "new" / "follow_up" thành label hiển thị chuẩn
    const apptType =
      typeRaw === "new"
        ? "Khám mới"
        : typeRaw === "follow_up"
        ? "Tái khám"
        : typeRaw || "Khám mới";
  
    const durationMinutes = Number.parseInt(duration || 30, 10) || 30;
  
    const newItem = {
      patientName,
      patientCode,
      phone,
      date,
      time,
      apptType,
      doctorName,
      deptName,
      note,
      duration: durationMinutes,
    };
  
    // ❌ KHÔNG check trùng SĐT / giờ ở FE nữa
    // ✅ Gửi thẳng lên BE với trạng thái muốn tạo (ở đây là đã xác nhận)
    let created;
    try {
      created = await createAppt({
        ...newItem,
        status: APPT_STATUS.DA_XAC_NHAN,
      });
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        
        "Không thể tạo lịch hẹn. Vui lòng thử lại.";
      toast.error(msg);
      return;
    }
    toast.success("Đã tạo lịch hẹn thành công.");
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
    clearApptPrefill(); // ✅ dọn sau khi lưu
    
    // ✅ Clear follow-up context after successful appointment creation
    if (hasFollowupContext) {
      clearFollowupContext();
      setHasFollowupContext(false);
      setFollowupContextData(null);
      console.log("[Appointments] Follow-up context cleared after appointment creation");
    }
  }
  

  async function handleCheckIn(appt) {
    if (!appt) return;

    // Không xử lý lịch đã hủy
    if (appt.status === APPT_STATUS.DA_HUY) return;

    const status = appt.status;
    const checkedIn = appt.checkedIn ?? (status === APPT_STATUS.DA_CHECKIN);

    if (checkedIn) {
      toast.warn("Bệnh nhân đã check-in trước đó.");
      return;
    }

    const pid = appt.patientCode || appt.pid || appt.code || null;

    const name = appt.patientName || appt.patient || "";

    // Xác định loại hẹn (khám mới hay tái khám)
    const apptTypeRaw = appt.apptType || appt.loaiHen || appt.LoaiHen || appt.type || "";
    const apptTypeStr = String(apptTypeRaw).toLowerCase();
    const isKhamMoi = 
      apptTypeStr === "kham_moi" || 
      apptTypeStr.includes("mới") || 
      apptTypeStr.includes("new") ||
      (!apptTypeStr.includes("tái") && !apptTypeStr.includes("tai_kham") && !apptTypeStr.includes("follow"));

    try {
      // ❌ KHÔNG enqueue queue ở đây nữa
      // ✅ Chỉ cập nhật trạng thái lịch hẹn -> đã check-in
      await checkInAppt(appt.id);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể check-in lịch hẹn. Vui lòng thử lại.";
      toast.error(msg);
      return;
    }

    // Nếu là khám mới và không có mã BN: chỉ flash nút add, không mở sẵn tab
    if (isKhamMoi && !pid) {
      const store = useUIStore.getState();
      store.setPatientPrefill({ name });
      store.flashAdd();
      navigate(`/patients`); // Chỉ chuyển trang, không có query params
      // ❌ REMOVED: toast.info() - will be shown in Patients.jsx to prevent duplicate
      closeDetail();
      return;
    }

    // Nếu là tái khám và có mã BN: chỉ highlight dòng bệnh nhân, không mở sẵn tab
    if (!isKhamMoi && pid) {
      useUIStore.getState().setPatientPrefill({ name });
      useUIStore.getState().setHighlightPid(pid);
      navigate(`/patients`); // Chỉ chuyển trang, không có query params
      // ❌ REMOVED: toast.success() - will be shown in Patients.jsx to prevent duplicate
      closeDetail();
      return;
    }

    // Trường hợp khác: giữ logic cũ (fallback)
    if (!pid) {
      const store = useUIStore.getState();
      store.setPatientPrefill({ name });
      store.flashAdd();
      navigate(`/patients`);
      // ❌ REMOVED: toast.info() - will be shown in Patients.jsx to prevent duplicate
      closeDetail();
    } else {
      useUIStore.getState().setPatientPrefill({ name });
      useUIStore.getState().setHighlightPid(pid);
      navigate(`/patients`);
      // ❌ REMOVED: toast.success() - will be shown in Patients.jsx to prevent duplicate
      closeDetail();
    }
  }

  const formatTime = (date) =>
    date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

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
          setView={(v) => {
            setView(v);
            clearIfAnyPrefill();
          }} // ✅ đổi view cũng hủy prefill
          onOpenCreate={hasReceptionPermission ? () => {
            if (!isWithinReceptionHours()) {
              toast.warn(
                `Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`
              );
              return;
            }
            setCreateDate(panelDate || TODAY);
            setDrawerOpen(true);
            
            // ✅ Acknowledge flash animation
            if (flashApptCreateAt) {
              ackFlashApptCreate();
            }
            
            // ✅ Lưu thông tin follow-up vào localStorage để CreateDrawer đọc
            if (hasFollowupContext && followupContextData) {
              try {
                localStorage.setItem("appt-prefill", JSON.stringify({
                  patient: followupContextData.patientName,
                  code: followupContextData.patientId,
                  type: "follow_up",
                  doctor: followupContextData.doctorName,
                  date: panelDate || TODAY,
                }));
                console.log("[Appointments] Saved prefill to localStorage");
              } catch (err) {
                console.error("[Appointments] Failed to save prefill:", err);
              }
            }
          } : undefined}
          counts={counts}
          withinReception={isWithinReceptionHours()}
          timeLabel={formatTime(currentTime)}
          receptionHours={RECEPTION_HOURS}
          flashApptCreateAt={flashApptCreateAt}
        />

        <div className="mt-3 flex-1 min-h-0">
          {view === "list" ? (
            <ApptList
              items={visibleTodayItems}
              loading={isLoading}
              error={null}
              onDetail={openDetail}
              onCheckIn={hasReceptionPermission ? handleCheckIn : undefined}
              onCreate={hasReceptionPermission ? () => {
                setCreateDate(TODAY);
                setDrawerOpen(true);
              } : undefined}
            />
          ) : (
            <div className="h-full min-h-0 p-0.5 overflow-auto scrollbar-none">
              <ApptCalendar
                month={month}
                itemsByDate={itemsByDate}
                onPrev={() => {
                  setMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                  );
                  clearIfAnyPrefill();
                }}
                onNext={() => {
                  setMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                  );
                  clearIfAnyPrefill();
                }}
                onPickDay={(d) => {
                  clearIfAnyPrefill();
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
        dateLabel={
          panelDate ? `${panelDate.split("-").reverse().join("/")}` : ""
        }
        items={panelItems}
        onClose={() => {
          setPanelDate(null);
          setNewId(null);
          clearIfAnyPrefill(); // ✅ đóng panel → clear
        }}
        onOpenDetail={(a) => {
          clearIfAnyPrefill();
          openDetail(a);
        }} // ✅ mở chi tiết → clear
        onCreate={
          hasReceptionPermission && panelDate
            ? () => {
                if (!isWithinReceptionHours()) {
                  toast.warn(
                    `Tiếp nhận từ ${RECEPTION_HOURS.start}h đến ${RECEPTION_HOURS.end}h`
                  );
                  return;
                }
                setCreateDate(panelDate);
                setDrawerOpen(true);
              }
            : undefined
        }
        onCheckIn={hasReceptionPermission ? handleCheckIn : undefined}
        highlightId={newId}
      />

      <CreateDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          clearApptPrefill(); // ✅ dọn prefill khi tự đóng
          
          // ✅ Clear follow-up context after closing drawer
          if (hasFollowupContext) {
            clearFollowupContext();
            setHasFollowupContext(false);
            setFollowupContextData(null);
          }
        }}
        onSubmit={addApptFromForm}
        defaultDate={createDate || TODAY}
      />

      <ApptDetailModal
        open={detailOpen}
        appt={detailAppt}
        onClose={() => {
          clearIfAnyPrefill();
          closeDetail();
        }}
        onUpdate={hasReceptionPermission ? async (patch) => {
          if (!patch?.id) return;
         
          // Lấy bản hiện tại
          /*const current =
            detailAppt && detailAppt.id === patch.id
              ? detailAppt
              : todayItems.find((a) => a.id === patch.id) ||
                (monthItems || []).find((a) => a.id === patch.id) ||
                null;
        
          const merged = current ? { ...current, ...patch } : patch;*/
        
          // ❌ KHÔNG check trùng ở FE nữa – để BE xử lý
        
          // ✅ Optimistic update trong modal
        
        
          // Nếu chỉ đổi trạng thái → dùng endpoint /status
          const isStatusOnly =
            Object.prototype.hasOwnProperty.call(patch, "status") &&
            !patch.date &&
            !patch.time &&
            !patch.duration &&
            !patch.note;
        
          let updated;
          try {
            updated = isStatusOnly
              ? await updateApptStatus({ id: patch.id, status: patch.status })
              : await updateAppt({ id: patch.id, patch });
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              "Không thể cập nhật lịch hẹn. Vui lòng thử lại.";
            toast.error(msg);
            return;
          }

          // Sync lại với dữ liệu từ BE (trường hợp BE chuẩn hoá khác)
          /*if (updated) {
            setDetailAppt((cur) =>
              cur && cur.id === updated.id ? { ...cur, ...updated } : cur
            );
          }*/
          setDetailAppt((cur) =>
            cur && cur.id === patch.id ? { ...cur, ...patch } : cur
          );
          toast.success("Đã cập nhật lịch hẹn.");
        } : undefined}
        onCheckIn={hasReceptionPermission ? handleCheckIn : undefined}
      />
    </motion.main>
  );
}
