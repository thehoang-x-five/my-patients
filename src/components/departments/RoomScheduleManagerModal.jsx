import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import PopoverSelect from "../ui/PopoverSelect.jsx";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Thứ 2",
  Tue: "Thứ 3",
  Wed: "Thứ 4",
  Thu: "Thứ 5",
  Fri: "Thứ 6",
  Sat: "Thứ 7",
  Sun: "Chủ nhật",
};
const SHIFT_OPTIONS = [
  { value: "Sáng", time: "07:30 - 11:30" },
  { value: "Chiều", time: "13:00 - 17:00" },
  { value: "Tối", time: "17:00 - 21:00" },
];

function toDateInput(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function startOfWeek(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const diff = (7 + safeDate.getDay() - 1) % 7;
  safeDate.setHours(0, 0, 0, 0);
  safeDate.setDate(safeDate.getDate() - diff);
  return safeDate;
}

function tempAssignment(employeeId = "") {
  return {
    tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    employeeId,
  };
}

export default function RoomScheduleManagerModal({
  open,
  dept,
  dutyWeek,
  staffOptions = [],
  onClose,
  onSave,
  isPending = false,
}) {
  const [draft, setDraft] = useState([]);

  const weekStart = useMemo(
    () => startOfWeek(dutyWeek?.today || new Date()),
    [dutyWeek?.today]
  );

  useEffect(() => {
    if (!open || !dept) return;

    const groupedItems = new Map();
    (dutyWeek?.items || [])
      .filter((item) => item?.day && item?.shift && !item?.nghiTruc)
      .forEach((item) => {
        const key = `${item.day}|${item.shift}`;
        const current = groupedItems.get(key) || [];
        current.push(tempAssignment(item.maNhanVien || ""));
        groupedItems.set(key, current);
      });

    const nextDraft = DAY_ORDER.flatMap((day, dayIndex) => {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + dayIndex);

      return SHIFT_OPTIONS.map((shift) => ({
        key: `${day}|${shift.value}`,
        day,
        label: DAY_LABELS[day],
        date: toDateInput(currentDate),
        shift: shift.value,
        time: shift.time,
        assignments: groupedItems.get(`${day}|${shift.value}`) || [],
      }));
    });

    setDraft(nextDraft);
  }, [open, dept, dutyWeek, weekStart]);

  if (!open || !dept) return null;

  const draftByDay = DAY_ORDER.map((day) => ({
    day,
    label: DAY_LABELS[day],
    slots: draft.filter((item) => item.day === day),
  }));

  const updateAssignments = (slotKey, updater) => {
    setDraft((prev) =>
      prev.map((item) =>
        item.key === slotKey
          ? {
              ...item,
              assignments:
                typeof updater === "function"
                  ? updater(item.assignments)
                  : updater,
            }
          : item
      )
    );
  };

  const handleSave = () => {
    const items = draft.flatMap((slot) =>
      slot.assignments
        .filter((assignment) => assignment.employeeId)
        .map((assignment) => ({
          Ngay: slot.date,
          CaTruc: slot.shift,
          MaNhanVienTruc: assignment.employeeId,
          NghiTruc: false,
        }))
    );

    onSave?.({
      WeekStartDate: toDateInput(weekStart),
      Items: items,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.section
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-cyan-50 to-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Quản lý lịch phòng theo tuần
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Phòng {dept.room?.number || dutyWeek?.roomName || "—"}
                  {dept.name ? ` • ${dept.name}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 ring-1 ring-indigo-200">
                    Bác sĩ phụ trách: {dutyWeek?.doctorName || dept.doctorInCharge || "Chưa gán"}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-600 ring-1 ring-slate-200">
                    Tuần bắt đầu {toDateInput(weekStart).split("-").reverse().join("/")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              Mỗi ca có thể phân công nhiều nhân sự trực. Lịch bác sĩ được suy ra từ bác sĩ phụ trách phòng hiện tại.
            </div>

            <div className="mt-4 grid gap-4">
              {draftByDay.map((day) => {
                const firstDate = day.slots[0]?.date || "";
                return (
                  <section
                    key={day.day}
                    className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">
                          {day.label}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {firstDate ? firstDate.split("-").reverse().join("/") : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
                      {day.slots.map((slot) => (
                        <article
                          key={slot.key}
                          className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-semibold text-slate-900">
                                Ca {slot.shift}
                              </h5>
                              <p className="text-xs text-slate-500">{slot.time}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {slot.assignments.length || 0} người
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {slot.assignments.length > 0 ? (
                              slot.assignments.map((assignment, index) => (
                                <div
                                  key={assignment.tempId}
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex-1">
                                    <PopoverSelect
                                      name={`assignment-${slot.key}-${index}`}
                                      value={assignment.employeeId}
                                      onChange={(value) =>
                                        updateAssignments(slot.key, (current) =>
                                          current.map((item) =>
                                            item.tempId === assignment.tempId
                                              ? {
                                                  ...item,
                                                  employeeId: value,
                                                }
                                              : item
                                          )
                                        )
                                      }
                                      options={[
                                        { value: "", label: "-- Chọn nhân sự trực --" },
                                        ...staffOptions,
                                      ]}
                                      placeholder="Chọn nhân sự trực"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAssignments(slot.key, (current) =>
                                        current.filter(
                                          (item) => item.tempId !== assignment.tempId
                                        )
                                      )
                                    }
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                                    title="Gỡ nhân sự"
                                  >
                                    −
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                                Chưa phân công, ca này sẽ được xem là nghỉ.
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateAssignments(slot.key, (current) => [
                                ...current,
                                tempAssignment(),
                              ])
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                          >
                            <span className="text-base leading-none">+</span>
                            <span>Thêm nhân sự</span>
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <footer className="border-t border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                {staffOptions.length > 0
                  ? `Có ${staffOptions.length} nhân sự khả dụng để phân ca.`
                  : "Chưa có nhân sự khả dụng để phân ca."}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={onClose} className="text-sm">
                  Đóng
                </Button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px disabled:opacity-60"
                >
                  {isPending ? "Đang lưu..." : "Lưu lịch phòng"}
                </button>
              </div>
            </div>
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
