import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import PopoverSelect from "../ui/PopoverSelect.jsx";
import { formatDisplayText } from "../../utils/textFormatters.js";
import {
  ADMIN_NURSE_POSITION,
  isAdministrativeNurseStaff,
} from "../../utils/staffRoleUtils.js";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Thứ 2",
  Tue: "Thứ 3",
  Wed: "Thứ 4",
  Thu: "Thứ 5",
  Fri: "Thứ 6",
  Sat: "Thứ 7",
  Sun: "Chủ nhật",
};
const SHIFT_OPTIONS = ["Sáng", "Chiều", "Tối"];

function normalizeShiftLabel(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (["sang", "sáng", "sÃ¡ng"].includes(lower)) return SHIFT_OPTIONS[0];
  if (["chieu", "chiều", "chiá»u"].includes(lower)) return SHIFT_OPTIONS[1];
  if (["toi", "tối", "tá»‘i"].includes(lower)) return SHIFT_OPTIONS[2];
  return raw;
}

function extractShiftLabels(value) {
  if (!value) return [];
  return String(value)
    .split(/[+·,;/]/)
    .map((item) => normalizeShiftLabel(item))
    .filter((item) => SHIFT_OPTIONS.includes(item));
}

function uniqueShifts(values) {
  const result = [];
  values.forEach((value) => {
    if (value && !result.includes(value)) result.push(value);
  });
  return result;
}

function toDateInput(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(value) {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  const diff = (7 + safe.getDay() - 1) % 7;
  safe.setHours(0, 0, 0, 0);
  safe.setDate(safe.getDate() - diff);
  return safe;
}

function roleSupportsSchedule(role) {
  const raw = String(role || "").toLowerCase().trim();
  return (
    raw === "bac_si" ||
    raw === "doctor" ||
    raw === "y_ta" ||
    raw === "ky_thuat_vien" ||
    raw === "kythuatvien"
  );
}

function normalizeRoomType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "phong_kham" || raw === "phong_kham_ls") return "phong_kham_ls";
  if (raw === "phong_dich_vu" || raw === "phong_cls") return "phong_cls";
  return raw;
}

function getEditableRoomType(rawRole, item) {
  const role = String(rawRole || "").trim().toLowerCase();
  if (role === "bac_si" || role === "doctor") return "phong_kham_ls";
  if (role === "ky_thuat_vien" || role === "kythuatvien") return "phong_cls";
  if (role !== "y_ta") return null;

  const nurseType = String(
    item?.loaiYTa || item?.nurseType || item?.loai_y_ta || ""
  )
    .trim()
    .toLowerCase();

  if (
    nurseType === "ls" ||
    nurseType === "lam_sang" ||
    nurseType === "y_ta_lam_sang"
  ) {
    return "phong_kham_ls";
  }
  if (
    nurseType === "cls" ||
    nurseType === "can_lam_sang" ||
    nurseType === "y_ta_can_lam_sang"
  ) {
    return "phong_cls";
  }
  return null;
}

function getFixedDoctorRoom(item, rooms) {
  const fixedRoomId =
    item?.maPhongPhuTrach ||
    item?.MaPhongPhuTrach ||
    item?.doctorRoomId ||
    "";
  const fixedRoomName =
    item?.tenPhongPhuTrach ||
    item?.TenPhongPhuTrach ||
    item?.doctorRoomName ||
    "";

  if (fixedRoomId || fixedRoomName) {
    return {
      value: fixedRoomId || fixedRoomName,
      label: formatDisplayText(fixedRoomName || fixedRoomId, fixedRoomId || "—"),
    };
  }

  const doctorId =
    item?.maNhanVien || item?.maNhanSu || item?.id || item?.MaNhanVien || "";
  if (!doctorId) return null;

  const room = (Array.isArray(rooms) ? rooms : []).find(
    (entry) =>
      (entry?.MaBacSiPhuTrach || entry?.maBacSiPhuTrach || "") === doctorId
  );

  if (!room?.MaPhong && !room?.TenPhong) return null;

  return {
    value: room.MaPhong || room.TenPhong,
    label: `${formatDisplayText(room.TenPhong, room.MaPhong || "—")}${
      room.TenKhoa ? ` • ${formatDisplayText(room.TenKhoa, room.TenKhoa)}` : ""
    }`,
  };
}

function getFixedTechnicianRoom(item, rooms) {
  const fixedRoomId =
    item?.maPhongPhuTrach ||
    item?.MaPhongPhuTrach ||
    "";
  const fixedRoomName =
    item?.tenPhongPhuTrach ||
    item?.TenPhongPhuTrach ||
    item?.clsRoomName ||
    "";

  if (fixedRoomId || fixedRoomName) {
    return {
      value: fixedRoomId || fixedRoomName,
      label: formatDisplayText(fixedRoomName || fixedRoomId, fixedRoomId || "—"),
    };
  }

  const technicianId =
    item?.maNhanVien || item?.maNhanSu || item?.id || item?.MaNhanVien || "";
  if (!technicianId) return null;

  const room = (Array.isArray(rooms) ? rooms : []).find(
    (entry) =>
      (entry?.MaKTVPhuTrach || entry?.maKTVPhuTrach || "") === technicianId
  );

  if (!room?.MaPhong && !room?.TenPhong) return null;

  return {
    value: room.MaPhong || room.TenPhong,
    label: `${formatDisplayText(room.TenPhong, room.MaPhong || "—")}${
      room.TenKhoa ? ` • ${formatDisplayText(room.TenKhoa, room.TenKhoa)}` : ""
    }`,
  };
}

export default function StaffScheduleManagerModal({
  open,
  item,
  today,
  weekItems = [],
  rooms = [],
  onClose,
  onSave,
  isPending = false,
}) {
  const [draft, setDraft] = useState([]);
  const [validationMessage, setValidationMessage] = useState("");

  const rawRole = item?.role || item?.vaiTro || item?.VaiTro || "";
  const isAdminNurse = isAdministrativeNurseStaff(item, rawRole);
  const canEditSchedule = roleSupportsSchedule(rawRole) || isAdminNurse;
  const isDoctor = ["bac_si", "doctor"].includes(
    String(rawRole || "").trim().toLowerCase()
  );
  const isTechnician = ["ky_thuat_vien", "kythuatvien", "technician"].includes(
    String(rawRole || "").trim().toLowerCase()
  );
  const editableRoomType = useMemo(
    () => getEditableRoomType(rawRole, item),
    [rawRole, item]
  );
  const weekStartDate = useMemo(() => startOfWeek(today), [today]);
  const fixedDoctorRoom = useMemo(
    () => (isDoctor ? getFixedDoctorRoom(item, rooms) : null),
    [isDoctor, item, rooms]
  );
  const fixedTechnicianRoom = useMemo(
    () => (isTechnician ? getFixedTechnicianRoom(item, rooms) : null),
    [isTechnician, item, rooms]
  );
  const fixedAssignedRoom = isDoctor ? fixedDoctorRoom : isTechnician ? fixedTechnicianRoom : null;

  const roomOptions = useMemo(
    () => {
      if (isDoctor || isTechnician) {
        return fixedAssignedRoom ? [fixedAssignedRoom] : [];
      }

      return (
      (Array.isArray(rooms) ? rooms : [])
        .filter((room) => room?.MaPhong && room?.TrangThai !== "tam_dung")
        .filter((room) => {
          if (!editableRoomType) return true;
          return (
            normalizeRoomType(room?.LoaiPhong || room?.loaiPhong) ===
            editableRoomType
          );
        })
        .map((room) => ({
          value: room.MaPhong,
          label: `${room.TenPhong}${room.TenKhoa ? ` • ${room.TenKhoa}` : ""}`,
        }))
      );
    },
    [editableRoomType, fixedAssignedRoom, isDoctor, isTechnician, rooms]
  );

  const modalTitle =
    isAdminNurse
      ? "Quản lý ca tiếp nhận"
      : isDoctor
        ? "Quản lý lịch làm bác sĩ"
        : editableRoomType === "phong_cls"
          ? "Quản lý lịch làm KTV / CLS"
          : "Quản lý lịch làm nhân sự";

  const helperText =
    isAdminNurse
      ? `Thiết lập ca làm tại ${ADMIN_NURSE_POSITION}. Vị trí cố định, chỉ cần chọn ca.`
      : isDoctor
      ? "Thiết lập ca khám theo tuần. Bác sĩ chỉ chọn ca; hệ thống luôn dùng phòng khám phụ trách cố định."
      : isTechnician
      ? "Thiết lập ca làm CLS theo tuần. KTV chỉ chọn ca; hệ thống luôn dùng phòng CLS phụ trách cố định."
      : editableRoomType === "phong_cls"
      ? "Thiết lập ca làm CLS theo tuần. KTV và y tá CLS chỉ được gán vào phòng CLS."
      : editableRoomType === "phong_kham_ls"
        ? "Thiết lập ca trực theo tuần. Y tá lâm sàng chỉ được gán vào phòng khám LS."
        : "Thiết lập ca trực theo tuần. Ngày để trống ca sẽ được xem là nghỉ.";

  useEffect(() => {
    if (!open || !item) return;

    const nextDraft = WEEK.map((day, index) => {
      const source = weekItems.find((entry) => entry?.day === day) || null;
      const sourceShifts = Array.isArray(source?.shifts) && source.shifts.length
        ? source.shifts
        : source?.shift || source?.caTruc
          ? [{
              shift: source.shift || source.caTruc,
              maPhong: source.maPhong,
              tenPhong: source.tenPhong,
            }]
          : [];
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);

      const normalizedSelectedShifts = uniqueShifts(
        sourceShifts.flatMap((s) => extractShiftLabels(s?.shift || s?.caTruc))
      );

      const firstRoomMatch = sourceShifts.find((s) => s?.maPhong);

      return {
        key: day,
        day,
        label: DAY_LABELS[day],
        date: toDateInput(date),
        shifts: normalizedSelectedShifts,
        enabled: normalizedSelectedShifts.length > 0,
        maPhong:
          firstRoomMatch?.maPhong ||
          ((isDoctor || isTechnician) && normalizedSelectedShifts.length > 0
            ? fixedAssignedRoom?.value || ""
            : ""),
      };
    });

    setDraft(nextDraft);
  }, [fixedAssignedRoom?.value, isDoctor, isTechnician, open, item, weekItems, weekStartDate]);

  if (!open || !item) return null;

  const updateRow = (key, patch) => {
    setDraft((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  const handleSave = () => {
    const normalizedDraft = draft.map((row) => ({
      ...row,
      shifts: uniqueShifts(row.shifts.flatMap((item) => extractShiftLabels(item))),
    }));
    const invalidShiftRow = normalizedDraft.find((row) => row.enabled && row.shifts.length === 0);
    if (invalidShiftRow) {
      setValidationMessage(`Vui lòng chọn ca làm cho ${invalidShiftRow.label}.`);
      return;
    }

    const invalidRow = normalizedDraft.find(
      (row) =>
        row.enabled &&
        !((isDoctor || isTechnician)
          ? fixedAssignedRoom?.value
          : isAdminNurse
            ? true
            : row.maPhong)
    );
    if (invalidRow) {
      setValidationMessage(
        isDoctor
          ? "Bác sĩ chưa có phòng khám phụ trách cố định. Hãy gán phòng khám cho bác sĩ trước khi xếp lịch."
          : isTechnician
          ? "KTV chưa có phòng CLS phụ trách cố định. Hãy gán phòng CLS cho KTV trước khi xếp lịch."
          : `Vui lòng chọn phòng cho ${invalidRow.label}.`
      );
      return;
    }

    onSave?.({
      WeekStartDate: toDateInput(weekStartDate),
      Items: normalizedDraft
        .filter((row) => row.enabled)
        .flatMap((row) => row.shifts.map((shift) => ({
          Ngay: row.date,
          CaTruc: shift,
          MaPhong: isAdminNurse
            ? row.maPhong || null
            : (isDoctor || isTechnician)
              ? fixedAssignedRoom?.value || null
              : row.maPhong,
          NghiTruc: false,
        }))),
    });
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-cyan-50 to-white px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {modalTitle}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.name || item.hoTen || item.maNhanVien}
                    {item.dept || item.tenKhoa
                      ? ` • ${item.dept || item.tenKhoa}`
                      : ""}
                  </p>
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

            <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5">
              {canEditSchedule ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                    {helperText}
                  </div>

                  <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                          <th className="px-4 py-3 text-left font-semibold">Ca trực</th>
                          <th className="px-4 py-3 text-left font-semibold">
                            {isAdminNurse
                              ? "Vị trí"
                              : editableRoomType === "phong_cls"
                              ? "Phòng CLS"
                              : "Phòng làm"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draft.map((row) => (
                          <tr key={row.key} className="bg-white">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">
                                {row.label}
                              </div>
                              <div className="text-xs text-slate-500">
                                {row.date}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {SHIFT_OPTIONS.map((shift) => {
                                  const normalizedRowShifts = uniqueShifts(
                                    row.shifts.flatMap((item) => extractShiftLabels(item))
                                  );
                                  const isSelected = normalizedRowShifts.includes(shift);
                                  return (
                                    <button
                                      key={shift}
                                      type="button"
                                      onClick={() => {
                                        const newShifts = isSelected
                                          ? normalizedRowShifts.filter((s) => s !== shift)
                                          : uniqueShifts([...normalizedRowShifts, shift]);
                                        updateRow(row.key, {
                                          shifts: newShifts,
                                          enabled: newShifts.length > 0,
                                          maPhong: newShifts.length > 0
                                            ? (isDoctor || isTechnician)
                                              ? fixedAssignedRoom?.value || ""
                                              : row.maPhong
                                            : "",
                                        });
                                      }}
                                      className={[
                                        "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border outline-none",
                                        isSelected
                                          ? "bg-teal-50 border-teal-200 text-teal-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                      ].join(" ")}
                                    >
                                      {shift}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isAdminNurse ? (
                                <div
                                  className={[
                                    "rounded-xl border px-3 py-2 text-[13px] shadow-sm",
                                    "border-teal-200 bg-teal-50 text-teal-800",
                                  ].join(" ")}
                                >
                                  {ADMIN_NURSE_POSITION}
                                </div>
                              ) : isDoctor || isTechnician ? (
                                <div
                                  className={[
                                    "rounded-xl border px-3 py-2 text-[13px] shadow-sm",
                                    row.enabled
                                      ? "border-teal-200 bg-teal-50 text-teal-800"
                                      : "border-slate-200 bg-slate-50 text-slate-400",
                                  ].join(" ")}
                                >
                                  {row.enabled
                                    ? fixedAssignedRoom?.label ||
                                      (isDoctor
                                        ? "Chưa gán phòng khám cố định"
                                        : "Chưa gán phòng CLS cố định")
                                    : "Nghỉ"}
                                </div>
                              ) : (
                                <PopoverSelect
                                  name={`room-${row.key}`}
                                  value={row.maPhong}
                                  disabled={!row.enabled}
                                  onChange={(value) =>
                                    updateRow(row.key, { maPhong: value })
                                  }
                                  options={[
                                    { value: "", label: "-- Chọn phòng --" },
                                    ...roomOptions,
                                  ]}
                                  placeholder="Chọn phòng"
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  Vai trò này hiện chưa hỗ trợ chỉnh lịch làm trực tiếp trong
                  module nhân sự.
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="btn text-sm">
                  Đóng
                </button>
                {canEditSchedule ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px disabled:opacity-60"
                  >
                    {isPending ? "Đang lưu..." : "Lưu lịch làm"}
                  </button>
                ) : null}
              </div>
            </footer>
          </motion.section>
        </motion.div>
      </AnimatePresence>

      <ConfirmModal
        open={!!validationMessage}
        onClose={() => setValidationMessage("")}
        onConfirm={() => setValidationMessage("")}
        title="Thiếu thông tin lịch làm"
        message={
          validationMessage || "Vui lòng kiểm tra lại thông tin lịch làm."
        }
        confirmText="Đã hiểu"
        tone="info"
        hideCancel
      />
    </>
  );
}
