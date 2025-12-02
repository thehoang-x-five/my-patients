// src/components/appointments/ApptDetailModal.jsx
// [FIXED 2025-11-22] Normalize fields + check-in logic with BE. UI unchanged.
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { APPT_STATUS, APPT_STATUS_LABEL } from "../../api/appointments.js";
import { useUIStore } from "../stores/appStore";

function Badge({ status }) {
  const label = APPT_STATUS_LABEL[status] || "—";

  const clsMap = {
    [APPT_STATUS.DA_XAC_NHAN]:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    [APPT_STATUS.DANG_CHO]:
      "bg-amber-50 text-amber-700 border-amber-200",
    [APPT_STATUS.DA_CHECKIN]:
      "bg-sky-50 text-sky-700 border-sky-200",
    [APPT_STATUS.DA_HUY]:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`badge ${
        clsMap[status] || "bg-slate-100 text-slate-700 border-slate-200"
      } transition-colors`}
    >
      {label}
    </span>
  );
}

export default function ApptDetailModal({
  open,
  appt,
  onClose,
  onUpdate,
  onCheckIn,
}) {

 
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: 30,
    note: "",
  });

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setForm({
      date: appt?.date || "",
      time: appt?.time || "08:00",
      duration: appt?.duration || 30,
      note: appt?.note || "",
    });
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, appt, onClose]);

  if (!open || !appt) return null;

  const doUpdate = (patch) => onUpdate?.({ id: appt.id, ...patch });

  const saveReschedule = (e) => {
    e?.preventDefault?.();
    doUpdate({
      date: form.date,
      time: form.time,
      duration: Number(form.duration || 30),
      note: form.note,
    });
    setEditing(false);
  };

  // ===== Chuẩn hoá field theo normalize + 12 vấn đề đã fix
  const statusCode = appt.status;
  const patientName = appt.patientName || appt.patient || "";
  const patientCode = appt.patientCode || appt.code || appt.pid || "";
  const doctorName = appt.doctorName || appt.doctor || "";
  const deptName = appt.deptName || appt.dept || "";
  const apptType = appt.apptType || appt.type || "";
  const checkedIn = appt.checkedIn ?? (statusCode === APPT_STATUS.DA_CHECKIN);
  const canCheckIn = statusCode === APPT_STATUS.DA_XAC_NHAN && !checkedIn;
  const isFollowup = apptType === "Tái khám";
  const pid = appt.pid || patientCode || "";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết lịch hẹn"
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "tween", duration: 0.22 }}
              className={[
                "w-[min(880px,100%)] max-h-[88vh] overflow-auto scrollbar-none bg-white rounded-2xl",
                "ring-1 ring-violet-200/80 shadow-2xl",
              ].join(" ")}
            >
              <header
                className={[
                  "flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white",
                  "bg-gradient-to-r from-violet-50/60 to-fuchsia-50/60",
                ].join(" ")}
              >
                <div>
                  <div className="text-lg font-extrabold text-black-800">
                    Chi tiết lịch hẹn
                  </div>
                  <div className="text-slate-500 text-sm">
                    {patientName} • {patientCode || "—"} • {apptType}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={appt.status} />
                
                  {/* Link hồ sơ chỉ khi tái khám */}
                  {isFollowup && pid && (
                    <Link
                      to={`/patients?pid=${encodeURIComponent(pid)}`}
                      onClick={() => {
                        const ui = useUIStore.getState();
                        ui.setHighlightPid(pid);
                      }}
                      className="btn btn-outline hover:!border-violet-300 hover:!bg-violet-50 hover:!text-violet-700 transition-colors"
                    >
                      Mở hồ sơ BN
                    </Link>
                  )}
                  <button
                    className="w-9 h-9 grid place-items-center rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                    onClick={onClose}
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>
              </header>

              <div className="p-5 grid gap-3">
                <section className="rounded-xl ring-1 ring-violet-200/80 p-3 bg-white hover:bg-violet-50/40 hover:ring-violet-300 transition-colors">
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <b className="text-slate-800">Bệnh nhân:</b> {patientName}
                    </div>
                    <div>
                      <b className="text-slate-800">Mã BN:</b>{" "}
                      {patientCode || <i className="text-slate-400">—</i>}
                    </div>
                    <div>
                      <b className="text-slate-800">SĐT:</b>{" "}
                      {appt.phone || <i className="text-slate-400">—</i>}
                    </div>
                    <div>
                      <b className="text-slate-800">Bác sĩ:</b>{" "}
                      {doctorName || <i className="text-slate-400">—</i>}
                    </div>
                    <div>
                      <b className="text-slate-800">Khoa:</b>{" "}
                      {deptName || <i className="text-slate-400">—</i>}
                    </div>
                    <div>
                      <b className="text-slate-800">Ngày:</b> {appt.date}
                    </div>
                    <div>
                      <b className="text-slate-800">Giờ:</b> {appt.time}
                    </div>
                    <div className="md:col-span-2 max-w-[1000px] break-words">
                      <b className="text-slate-800">Ghi chú:</b>{" "}
                      {appt.note || <i className="text-slate-400">—</i>}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl ring-1 ring-violet-200/80 p-3 bg-white">
                  <div className="flex items-center justify-between">
                  {appt.status !== APPT_STATUS.DA_CHECKIN ? (
                    <b className="text-violet-800">Thao tác</b>):(<p className="text-violet-800 ml-auto mr-auto text-center" > --- Đã Check-in: Không thể thao tác--- </p>)}
                
                    {!editing ? (
                      <div className="flex gap-2 flex-wrap">
                        {appt.status !== APPT_STATUS.DA_XAC_NHAN && appt.status !== APPT_STATUS.DA_CHECKIN &&(
                          <button
                            onClick={() =>
                              doUpdate({ status: APPT_STATUS.DA_XAC_NHAN })
                            }
                            className="px-3 py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition"
                          >
                            Xác nhận
                          </button>
                        )}
                        {appt.status !== APPT_STATUS.DANG_CHO && appt.status !== APPT_STATUS.DA_CHECKIN &&(
                          <button
                            onClick={() =>
                              doUpdate({ status: APPT_STATUS.DANG_CHO })
                            }
                            className="px-3 py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition"
                          >
                            Đánh dấu chờ
                          </button>
                        )}
                        {appt.status !== APPT_STATUS.DA_HUY && appt.status !== APPT_STATUS.DA_CHECKIN &&(
                          <button
                            onClick={() =>
                              doUpdate({ status: APPT_STATUS.DA_HUY })
                            }
                            className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition"
                          >
                            Hủy lịch
                          </button>
                        )}

                        {onCheckIn && canCheckIn && (
                          <button
                            onClick={() => onCheckIn(appt)
                                            }
                            className="px-3 py-2 rounded-xl text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:brightness-105 shadow-sm hover:shadow transition"
                          >
                            Check-in
                          </button>
                        )}
 {appt.status !== APPT_STATUS.DA_CHECKIN && (
                        <button
                          onClick={() => setEditing(true)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                        >
                          Đổi lịch
                        </button> )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={saveReschedule}
                          className="px-3 py-2 rounded-xl text-white bg-violet-600 hover:bg-violet-700 transition shadow-sm"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    )}
                  </div>

                  {editing && (
                    <form
                      onSubmit={saveReschedule}
                      className="grid md:grid-cols-4 gap-3 mt-3"
                    >
                      <label className="text-sm">
                        Ngày
                        <input
                          type="date"
                          className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-violet-200/80 focus:ring-2 focus:ring-violet-400 outline-none transition"
                          value={form.date}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, date: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="text-sm">
                        Giờ
                        <input
                          type="time"
                          className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-violet-200/80 focus:ring-2 focus:ring-violet-400 outline-none transition"
                          value={form.time}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, time: e.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="text-sm md:col-span-4">
                        Ghi chú
                        <textarea
                          rows={2}
                          className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-violet-200/80 focus:ring-2 focus:ring-violet-400 outline-none transition"
                          value={form.note}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, note: e.target.value }))
                          }
                        />
                      </label>
                    </form>
                  )}
                </section>
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
