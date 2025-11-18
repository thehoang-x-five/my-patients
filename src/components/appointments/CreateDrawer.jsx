// src/components/appointments/CreateDrawer.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";

// ✅ Dùng API layer (TanStack Query) — KHÔNG còn data/*
import {
  useDepartments,            // GET /metadata/departments
  useDoctorQueueByDept,      // GET /metadata/doctor-queue?dept=...
} from "../../api/departments.js";

import {
  useFindLastAppointment,    // GET /appointments/last?code=...&name=...&cutoff=YYYY-MM-DD
} from "../../api/appointments.js";

export default function CreateDrawer({
  open,
  onClose,
  onSubmit,
  doctorSuggest = [],
  defaultDate,
    // ✅ Prefill từ Patients → Appointments (patient, code, type, note, dept, doctor, date, time)
  defaultValues,
}) {
  const firstFieldRef = useRef(null);
  const canEditCode = !!(defaultValues && (defaultValues.code || defaultValues.patient));
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [showDeptSelect, setShowDeptSelect] = useState(false);
  const [showDoctorSelect, setShowDoctorSelect] = useState(false);

  // chỉ còn 2 loại
  const [apType, setApType] = useState("new"); // "new" | "follow_up"

  // form state (để query lastVisit đúng yêu cầu)
  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [dateStr, setDateStr] = useState(defaultDate);
    const [startStr, setStartStr] = useState("08:00");
    const [noteStr, setNoteStr] = useState("");
    const [phone, setPhone] = useState("");
    
  // ===== Server state (TanStack Query)
  const { data: departments = [], isLoading: deptLoading } = useDepartments();
  const { data: doctorQueue = [], isLoading: docLoading } =
    useDoctorQueueByDept(selectedDept, { enabled: !!selectedDept });

  // Lần khám gần nhất theo cutoff (ngày đặt)
  const { data: lastVisit } = useFindLastAppointment(
    {
      code: (patientCode || "").trim(),
      name: (patientName || "").trim(),
      cutoff: dateStr || new Date().toISOString().slice(0, 10),
    },
    {
      // chỉ gọi khi có code hoặc name
      enabled:
        !!(patientCode && patientCode.trim()) ||
        !!(patientName && patientName.trim()),
    }
  );

  const availableDoctors = useMemo(() => {
    if (!selectedDept) return [];
    // API trả về dạng [{name, waiting, appointments, status}]
    return Array.isArray(doctorQueue) ? doctorQueue : [];
  }, [selectedDept, doctorQueue]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handleKey);

    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);

    // ==== Prefill khi mở ====
    const mapTypeToKey = (t) => {
        const s = String(t || "").toLowerCase();
        if (s === "follow_up" || /tái\s*kha|khám\s*lại/.test(s)) return "follow_up";
        return "new";
      };
      const dv = defaultValues || {};
  
      setSelectedDept(dv.dept || "");
      setSelectedDoctor(dv.doctor || "");
      setApType(mapTypeToKey(dv.type));
      setPatientName(dv.patient || "");
      setPatientCode(dv.code || "");
      setDateStr(dv.date || defaultDate);
      setStartStr(dv.time || "08:00");
      setNoteStr(dv.note || "");
      setPhone(dv.phone || dv.so_dien_thoai || "");

    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(t);
    };
  }, [open, onClose, defaultDate, defaultValues]);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    // giữ nguyên: parent sẽ normalize & map 'type'
    onSubmit?.(raw);
  }

  function handleDeptSelect(deptName) {
    setSelectedDept(deptName);
    setSelectedDoctor("");
    setShowDeptSelect(false);
  }

  function handleDoctorSelect(doctorName) {
    setSelectedDoctor(doctorName);
    setShowDoctorSelect(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Tạo lịch hẹn"
            className="fixed inset-0 z-50 p-4 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-[min(900px,100%)] max-h-[88vh] overflow-auto scrollbar-thin scrollbar-thumb-violet-200 bg-white rounded-3xl ring-1 ring-violet-200/50 shadow-2xl pointer-events-auto"
            >
              <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-50/80 via-purple-50/60 to-violet-50/80 backdrop-blur-sm border-b border-violet-100/60">
                <h3 className="text-lg font-extrabold text-slate-900">Tạo lịch hẹn</h3>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-white/90 ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 transition grid place-items-center"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  ✕
                </motion.button>
              </header>

              <form data-appt-create onSubmit={handleSubmit} className="p-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Họ tên bệnh nhân
                    <input
                      ref={firstFieldRef}
                      name="patient_name"
                      required
                      placeholder="VD: Nguyễn Văn A"
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Mã BN
                    <input
                      name="patient_code"
                      placeholder={canEditCode ? "VD: BN001" : "Không nhập"}
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition"
                      value={patientCode}
                      onChange={(e) => {
                        if (!canEditCode) return; // khóa setPatientCode khi tự mở
                        setPatientCode(e.target.value);
                      }}
                      disabled={!canEditCode}
                      readOnly={!canEditCode}
                      aria-disabled={!canEditCode}
                     />
                  
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Số điện thoại
                    <input
                      name="phone"
                      type="tel"
                      placeholder="VD: 0909 000 000"
                      className="mt-1.5 w-full rounded-xl px-3 py-2 border border-slate-200 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white transition"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Ngày
                    <input
                      type="date"
                      name="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Giờ bắt đầu
                    <input
                      type="time"
                      name="start"
                      value={startStr}
                      onChange={(e) => setStartStr(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition"
                    />
                  </label>

                 

                  <label className="text-sm font-semibold text-slate-700">
                    Loại khám
                    <select
                      name="type"
                      value={apType}
                      onChange={(e) => setApType(e.target.value)}
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition"
                      required
                    >
                      <option value="new">Khám mới</option>
                      <option value="follow_up">Tái khám</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Khoa
                    <input
                      name="department"
                      value={selectedDept}
                      readOnly
                      placeholder={deptLoading ? "Đang tải..." : "Chọn khoa..."}
                      onClick={() => setShowDeptSelect(true)}
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition cursor-pointer hover:bg-violet-50"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Bác sĩ
                    <input
                      name="doctor"
                      value={selectedDoctor}
                      readOnly
                      placeholder={
                        selectedDept
                          ? docLoading
                            ? "Đang tải..."
                            : "Chọn bác sĩ..."
                          : "Chọn khoa trước"
                      }
                      onClick={() => selectedDept && setShowDoctorSelect(true)}
                      disabled={!selectedDept}
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition cursor-pointer hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                    Ghi chú
                    <textarea
                      name="note"
                      rows="3"
                      value={noteStr}
                      onChange={(e) => setNoteStr(e.target.value)}
                      placeholder="Ví dụ: mang kết quả cũ..."
                      className="mt-1.5 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-violet-500 outline-none bg-white shadow-sm transition resize-none"
                    />
                  </label>
                </div>

                {/* Thông tin khám gần nhất khi chọn Tái khám (không dùng chip) */}
                {apType === "follow_up" && (
                  <div className="mt-4 rounded-2xl ring-1 ring-violet-200/70 bg-violet-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <b className="text-slate-900">Thông tin khám gần nhất</b>
                      {lastVisit ? (
                        <span className="text-[12px] text-slate-500">
                          {lastVisit.date} • {lastVisit.time}
                        </span>
                      ) : null}
                    </div>

                    {lastVisit ? (
                      <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <b>Bệnh nhân:</b> {lastVisit.patient}
                        </div>
                        <div>
                          <b>Mã BN:</b>{" "}
                          {lastVisit.code || <i className="text-slate-400">—</i>}
                        </div>
                        <div>
                          <b>Bác sĩ:</b> {lastVisit.doctor || "—"}
                        </div>
                        <div>
                          <b>Khoa:</b> {lastVisit.dept || "—"}
                        </div>
                        <div className="md:col-span-2 max-w-[1000px] break-words">
                          <b>Ghi chú:</b>{" "}
                          {lastVisit.note || <i className="text-slate-400">—</i>}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-slate-600">
                        Không tìm thấy bản ghi gần đây. Vui lòng nhập <b>Mã BN</b>{" "}
                        hoặc kiểm tra đúng <b>Họ tên</b>.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-200">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                  >
                    Lưu lịch hẹn
                  </motion.button>
                </div>
              </form>
            </motion.section>
          </motion.div>

          {/* Department Selection Modal */}
          {showDeptSelect && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] p-4 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.97, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-2xl ring-1 ring-violet-200 max-w-2xl w-full overflow-hidden"
                >
                  <header className="flex items-center justify-between px-6 py-4 bg-violet-50 border-b border-violet-100">
                    <h3 className="font-bold text-slate-900">Chọn khoa</h3>
                    <button
                      type="button"
                      onClick={() => setShowDeptSelect(false)}
                      className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 transition"
                    >
                      ✕
                    </button>
                  </header>

                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="space-y-2">
                      {(departments || []).map((dept) => (
                        <motion.button
                          key={dept.id || dept.name}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleDeptSelect(dept.name)}
                          className="w-full rounded-xl p-3 bg-white ring-1 ring-slate-200 hover:ring-violet-300 hover:bg-violet-50/50 transition text-left"
                        >
                          <div className="font-semibold text-slate-900">{dept.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {(dept.rooms || []).length} phòng • {(dept.doctors || []).length} bác sĩ
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Doctor Selection Modal */}
          {showDoctorSelect && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] p-4 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.97, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-2xl ring-1 ring-violet-200 max-w-4xl w-full max-h-[80vh] overflow-hidden"
                >
                  <header className="flex items-center justify-between px-6 py-4 bg-violet-50 border-b border-violet-100">
                    <h3 className="font-bold text-slate-900">Chọn bác sĩ ({selectedDept || "—"})</h3>
                    <button
                      type="button"
                      onClick={() => setShowDoctorSelect(false)}
                      className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 transition"
                    >
                      ✕
                    </button>
                  </header>

                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-73px)]">
                    <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead className="bg-violet-50">
                          <tr className="text-xs font-bold text-slate-700">
                            <th className="px-3 py-2.5 text-left">Bác sĩ</th>
                            <th className="px-3 py-2.5 text-left">Đang chờ</th>
                            <th className="px-3 py-2.5 text-left">Lịch hẹn</th>
                            <th className="px-3 py-2.5 text-left">Trạng thái</th>
                            <th className="px-3 py-2.5 text-left">Chọn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableDoctors.map((doc) => (
                            <motion.tr
                              key={doc.name}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-t border-slate-100 hover:bg-violet-50/30 transition"
                            >
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                {doc.name}
                              </td>
                              <td className="px-3 py-2.5">
                                <Chip tone="amber" dot="amber" className="text-xs">
                                  {doc.waiting ?? 0}
                                </Chip>
                              </td>
                              <td className="px-3 py-2.5">
                                <Chip tone="sky" dot="sky" className="text-xs">
                                  {doc.appointments ?? 0}
                                </Chip>
                              </td>
                              <td className="px-3 py-2.5">
                                <Chip tone="white" dot="emerald" className="text-xs">
                                  {doc.status || "—"}
                                </Chip>
                              </td>
                              <td className="px-3 py-2.5">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDoctorSelect(doc.name)}
                                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm transition"
                                >
                                  Chọn
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}

                          {availableDoctors.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                                {selectedDept ? "Không có dữ liệu bác sĩ" : "Chưa chọn khoa"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
