// src/components/staff/StaffSchedule.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";

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
  if (!s) return null;
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

  const toHM = (t) => {
    if (!t) return "";
    const str = String(t);
    const parts = str.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return str;
  };

  const start = toHM(startTime);
  const end = toHM(endTime);

  let timeRange = "";
  if (start && end) {
    timeRange = `${start}–${end}`;
  } else {
    const hours = SHIFT_HOURS[label];
    if (hours) timeRange = hours;
  }

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

  const rawRole = item.role || item.vaiTro || item.VaiTro || null;
    const isDoctor = rawRole === "bac_si" || rawRole === "doctor";
    const isNurse = rawRole === "y_ta" || rawRole === "nurse";
    const thirdColumnHeader = isDoctor ? "Trạng thái" : "Phòng/Bàn";
  // Chuẩn hóa dutyRooms (api trả về mảng week) -> map theo thứ
  const dutyByDay = {};
  if (dutyRooms) {
    if (Array.isArray(dutyRooms)) {
      for (const row of dutyRooms) {
        if (!row) continue;
        const day = row.day || row.Thu || row.thu;
        if (!day) continue;
        dutyByDay[day] = row;
      }
    } else if (typeof dutyRooms === "object") {
      WEEK.forEach((d) => {
        const value = dutyRooms[d];
        if (value == null) return;
        if (typeof value === "object") {
          dutyByDay[d] = { day: d, ...value };
        } else {
          dutyByDay[d] = { day: d, tenPhong: value };
        }
      });
    }
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

    const start =
      duty.gioBatDau ??
      duty.gio_bat_dau ??
      duty.gioBD ??
      duty.gio_bd ??
      duty.GioBatDau ??
      null;
    const end =
      duty.gioKetThuc ??
      duty.gio_ket_thuc ??
      duty.gioKT ??
      duty.gio_kt ??
      duty.GioKetThuc ??
      null;

    const shiftDisplay = formatShift(shiftRaw, start, end);

    let roomText = "—";
    if (isDoctor) {
      // Bác sĩ: cột thứ 3 hiển thị trạng thái làm việc
      const label = normalizeShiftLabel(shiftRaw);
      if (!label || label === "Nghỉ") roomText = "Nghỉ";
      else roomText = "Làm việc";
    } else {
      // Y tá / điều dưỡng: cột thứ 3 là phòng/bàn
      const name =
        duty.tenPhong ??
        duty.tenPhongHoacBanHomNay ??
        duty.tenBan ??
        duty.TenPhong ??
        duty.TenPhongHoacBanHomNay ??
        duty.maPhong ??
        null;
      roomText = name || "—";
    }

    return { shiftDisplay, roomText };
  };

  const today = dayKey();
  const todayData = getDayData(today);
  const shiftToday = todayData.shiftDisplay || "—";
  const roomToday = todayData.roomText || "—";

  // In lịch KHÔNG mở tab mới: dùng iframe ẩn
  function printSched() {
    const rowsHtml = WEEK.map((d) => {
      const { shiftDisplay, roomText } = getDayData(d);
      const shift = shiftDisplay || "—";
      const third = roomText || "—";
      return `<tr>
        <td>${d}</td>
        <td>${shift}</td>
        <td>${third}</td>
      </tr>`;
    }).join("");

    const html = `
      <html>
        <head>
          <title>Lịch trực - ${item.name}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 16px;
              color: #0f172a;
            }
            h1 {
              font-size: 20px;
              margin: 0 0 4px 0;
            }
            p {
              margin: 0 0 8px 0;
              font-size: 13px;
              color: #475569;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 8px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background: #e6fcf5;
              color: #134e4a;
              font-weight: 600;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            @media print {
              body {
                padding: 8px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Lịch trực: ${item.name}</h1>
          <p>Khoa: ${item.dept || "-"}</p>
          <table>
            <thead>
              <tr>
                <th>Thứ</th>
                <th>Ca &amp; giờ</th>
                <th>${thirdColumnHeader}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
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

    win.document.open();
    win.document.write(html);
    win.document.close();

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
        {/* HEADER (Sticky) */}
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Lịch trực &amp; bàn trực
            </h2>
            <p className="text-xs text-slate-500">
              Nhân sự:{" "}
              <span className="font-medium text-slate-800">
                {item.name} – {item.position}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-300"
              onClick={printSched}
            >
              In lịch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-800"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </header>

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 text-sm">
          <Card className ="border-0">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
              <span className="text-sm">
                Hôm nay:{" "}
                <b className="font-semibold text-teal-700">
                  {today}
                </b>{" "}
                • Ca:{" "}
                <b className="font-semibold text-teal-700">
                  {shiftToday}
                </b>{" "}
                • {thirdColumnHeader}:{" "}
                <b className="font-semibold text-teal-700">
                  {roomToday}
                </b>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 hover:text-slate-800"
                onClick={printSched}
              >
                In
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-none text-xs rounded-lg border border-slate-200">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 w-16">
                      Thứ
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Ca &amp; giờ
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 w-32">
                      {thirdColumnHeader}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {WEEK.map((d) => {
                    const isToday = d === today;
                    const { shiftDisplay, roomText } = getDayData(d);
                    const shift = shiftDisplay || "—";
                    const third = roomText || "—";

                    return (
                      <motion.tr
                        key={d}
                        whileHover={{ scale: 1.002, y: -1 }}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${
                          isToday
                            ? "bg-teal-50"
                            : "hover:bg-teal-50/40"
                        }`}
                      >
                        <td
                          className={`px-3 py-2 ${
                            isToday
                              ? "font-semibold text-teal-800"
                              : ""
                          }`}
                        >
                          {d}
                        </td>
                        <td className="px-3 py-2">
                          {shift === "—" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            shift
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {third === "—" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 ring-teal-200">
                              {third}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </motion.section>
    </Backdrop>
  );
}

// Card wrapper (giữ nguyên, nếu anh đang dùng Card riêng thì bỏ/đổi import cho đúng)
function Card({ children ,className}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}
