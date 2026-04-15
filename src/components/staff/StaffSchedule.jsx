import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import {
  formatDisplayText,
  formatRoleLabel,
} from "../../utils/textFormatters.js";

const Backdrop = ({ open, onClick, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center"
        onClick={onClick}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

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
const dayKey = () =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

const SHIFT_HOURS = {
  Sáng: "07:30–11:30",
  Chiều: "13:00–17:00",
  Tối: "17:00–21:00",
};

const normalizeShiftLabel = (shift) => {
  if (!shift) return null;
  const s = String(shift).trim();
  const lower = s.toLowerCase();
  if (lower === "sang" || lower === "sáng") return "Sáng";
  if (lower === "chieu" || lower === "chiều") return "Chiều";
  if (lower === "toi" || lower === "tối") return "Tối";
  if (lower === "nghi" || lower === "nghỉ") return "Nghỉ";
  return s;
};

const formatShift = (shiftRaw, startTime, endTime) => {
  if (!shiftRaw || shiftRaw === "—") return "—";
  const label = normalizeShiftLabel(shiftRaw);
  if (!label) return "—";
  if (label === "Nghỉ") return "Nghỉ";

  const toHM = (value) => {
    if (!value) return "";
    const parts = String(value).split(":");
    if (parts.length < 2) return String(value);
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  };

  const start = toHM(startTime);
  const end = toHM(endTime);
  const timeRange = start && end ? `${start}–${end}` : SHIFT_HOURS[label] || "";
  return timeRange ? `${label} (${timeRange})` : label;
};

export default function StaffSchedule({
  open,
  item,
  schedule,
  dutyRooms,
  onClose,
}) {
  if (!item) return null;
  const displayName = item.name || item.hoTen || item.maNhanVien || "Nhân sự";

  const rawRole = item.role || item.vaiTro || item.VaiTro || null;
  const isDoctor = rawRole === "bac_si" || rawRole === "doctor";
  const isTechnician =
    rawRole === "ky_thuat_vien" || rawRole === "technician";
  const thirdColumnHeader = (isDoctor || isTechnician)
    ? "Trạng thái"
    : "Phòng/Bàn";

  const modalTitle = isTechnician
    ? "Lịch làm CLS"
    : isDoctor
      ? "Lịch phòng khám"
      : "Lịch làm & phòng trực";

  const dutyByDay = {};
  if (Array.isArray(dutyRooms)) {
    for (const row of dutyRooms) {
      if (!row?.day) continue;
      dutyByDay[row.day] = row;
    }
  } else if (dutyRooms && typeof dutyRooms === "object") {
    WEEK.forEach((day) => {
      const value = dutyRooms[day];
      if (!value) return;
      dutyByDay[day] =
        typeof value === "object" ? { day, ...value } : { day, tenPhong: value };
    });
  }

  const getDayData = (day) => {
    const duty = dutyByDay[day] || {};
    const shiftRaw =
      (schedule && schedule[day]) ??
      duty.shift ??
      duty.caTruc ??
      duty.CaTruc ??
      duty.ca_truc ??
      null;

    const shiftDisplay = formatShift(
      shiftRaw,
      duty.gioBatDau ?? duty.GioBatDau,
      duty.gioKetThuc ?? duty.GioKetThuc
    );

    if (isDoctor || isTechnician) {
      const label = normalizeShiftLabel(shiftRaw);
      return {
        shiftDisplay,
        roomText: !label || label === "Nghỉ" ? "Nghỉ" : "Làm việc",
      };
    }

    return {
      shiftDisplay,
      roomText: formatDisplayText(
        duty.tenPhong ??
          duty.tenPhongHoacBanHomNay ??
          duty.TenPhong ??
          duty.maPhong,
        "—"
      ),
    };
  };

  const today = dayKey();
  const todayData = getDayData(today);

  function printSched() {
    const rowsHtml = WEEK.map((day) => {
      const { shiftDisplay, roomText } = getDayData(day);
      return `<tr><td>${DAY_LABELS[day] || day}</td><td>${shiftDisplay || "—"}</td><td>${roomText || "—"}</td></tr>`;
    }).join("");

    const html = `
      <html>
        <head>
          <title>Lịch làm - ${displayName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; color: #0f172a; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            p { margin: 0 0 8px 0; font-size: 13px; color: #475569; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 13px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            th { background: #e6fcf5; color: #134e4a; font-weight: 600; }
            tbody tr:nth-child(even) { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Lịch làm: ${displayName}</h1>
          <p>Vai trò: ${formatRoleLabel(rawRole, "Nhân sự y tế")}</p>
          <p>Khoa: ${item.dept || item.tenKhoa || "-"}</p>
          <table>
            <thead>
              <tr>
                <th>Thứ</th>
                <th>Ca & giờ</th>
                <th>${thirdColumnHeader}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = iframe.contentDocument || (win && win.document);
    if (!doc || !win) return;

    doc.open();
    doc.write(html);
    doc.close();
    win.focus();
    win.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }

  return (
    <Backdrop open={open} onClick={onClose}>
      <motion.section
        initial={{ y: 10, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.985, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              {modalTitle}
            </h2>
            <p className="text-[13px] text-slate-500">
              Nhân sự:{" "}
              <span className="font-medium text-slate-800">
                {displayName} – {formatRoleLabel(rawRole, "Nhân sự y tế")}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="text-[13px] border-slate-300 px-3 py-1.5"
              onClick={printSched}
            >
              In lịch
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="text-[13px] text-slate-500 hover:text-slate-800 px-3 py-1.5"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </header>

        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-teal-700 ring-1 ring-teal-200">
              Hôm nay: {todayData.shiftDisplay || "—"}
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-sky-700 ring-1 ring-sky-200">
              {thirdColumnHeader}: {todayData.roomText || "—"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-[13px]">
            <thead className="text-slate-500 uppercase tracking-wide text-[11px]">
              <tr className="border-b border-slate-100">
                <th className="py-2 font-semibold">Thứ</th>
                <th className="py-2 font-semibold">Ca & giờ</th>
                <th className="py-2 font-semibold">{thirdColumnHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {WEEK.map((day) => {
                const { shiftDisplay, roomText } = getDayData(day);
                const isToday = day === today;
                return (
                  <tr
                    key={day}
                    className={isToday ? "bg-teal-50/40" : "bg-white"}
                  >
                    <td className="py-3 font-medium text-slate-800">{DAY_LABELS[day] || day}</td>
                    <td className="py-3 text-slate-600">{shiftDisplay || "—"}</td>
                    <td className="py-3 text-slate-600">{roomText || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </Backdrop>
  );
}
