// src/components/staff/StaffSchedule.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";

const Card = ({ children, className = "" }) => (
  <motion.section
    whileHover={{ y: -2, scale: 1.002 }}
    transition={{ duration: 0.2 }}
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-200 hover:shadow ${className}`}
  >
    {children}
  </motion.section>
);

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = () =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

const SHIFT_HOURS = {
  Sáng: "07:30–11:30",
  Chiều: "13:00–17:00",
  Tối: "17:00–21:00",
};

const formatShift = (shift) => {
  if (!shift || shift === "Nghỉ" || shift === "—") return shift || "—";
  const hours = SHIFT_HOURS[shift];
  return hours ? `${shift} (${hours})` : shift;
};

export default function StaffSchedule({
  open,
  item,
  schedule,
  dutyRooms,
  onClose,
}) {
  if (!item) return null;

  const today = dayKey();
  const roomToday = dutyRooms?.[today] ?? "—";
  const shiftToday = formatShift(schedule?.[today] ?? "—");

  // In lịch KHÔNG mở tab mới: dùng iframe ẩn
  function printSched() {
    const rowsHtml = WEEK.map((d) => {
      const shift = formatShift(schedule?.[d] ?? "—");
      const room = dutyRooms?.[d] ?? "—";
      return `<tr>
        <td>${d}</td>
        <td>${shift}</td>
        <td>${room}</td>
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
              margin-top: 12px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #e5e7eb;
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
                <th>Phòng/Bàn</th>
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

    const doc = iframe.contentWindow || iframe.contentDocument;
    const win = iframe.contentWindow;

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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Wrapper căn giữa */}
          <motion.div
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Nội dung Modal */}
            <motion.section
              initial={{ y: 14, scale: 0.985, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.985, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER (Sticky) */}
              <header className="sticky top-0 z-10 backdrop-blur-sm bg-gradient-to-r from-teal-50/80 to-cyan-50/80 border-b border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Lịch trực &amp; bàn trực
                  </h2>
                  <p className="text-xs text-slate-500">
                    {item.name} • {item.dept || "Chưa gán khoa"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  ✕
                </Button>
              </header>

              {/* BODY (Scrollable) */}
              <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 text-sm">
                <Card>
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
                      • Bàn/Phòng:{" "}
                      <b className="font-semibold text-teal-700">
                        {roomToday}
                      </b>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={printSched}
                    >
                      In lịch
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
                            Phòng/Bàn
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {WEEK.map((d) => {
                          const isToday = d === today;
                          const shift = schedule?.[d] ?? "—";
                          const room = dutyRooms?.[d] ?? "—";
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
                                {formatShift(shift)}
                              </td>
                              <td className="px-3 py-2">
                                {room === "—" ? (
                                  <span className="text-slate-400">—</span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 ring-teal-200">
                                    {room}
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

              {/* FOOTER (Sticky) */}
              <footer className="sticky bottom-0 z-10 px-4 py-3 border-t border-slate-100 flex justify-end backdrop-blur-sm bg-white/80">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Đóng
                </Button>
              </footer>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
