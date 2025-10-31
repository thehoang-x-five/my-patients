import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "./Avatar.jsx";
import { DUTY_ROOM } from "../../data/staff.js";

const dayKey = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

export default function StaffCard({ item, role, onDetail, onSchedule }) {
  const online = item.status === "online";
  const apptCount =
    item?.apptCount ?? item?.appointmentsToday ?? item?.appts ?? item?.appointments ?? 0;

  const today = dayKey();
  const roomToday = DUTY_ROOM?.[item.id]?.[today] ?? "—";
  const isAdminNurse = role === "nurse" && item.roleType === "administrative";

  const primaryLabel = isAdminNurse
    ? "Đơn vị phụ trách"
    : role === "doctor"
    ? "Lịch hẹn hôm nay"
    : "Phòng phụ trách";

  const primaryValue = isAdminNurse
    ? (item.managedDepartments?.length || 0)
    : role === "doctor"
    ? apptCount
    : (item.rooms ?? (item.managedRooms?.length || 0));

  const todayLabel = isAdminNurse ? "Bàn hôm nay" : "Phòng hôm nay";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className="group rounded-2xl bg-white ring-1 ring-slate-200/90 shadow-sm transition p-4 hover:shadow-xl hover:ring-sky-200 hover:bg-gradient-to-b hover:from-white hover:to-sky-50"
    >
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={item.name} />
          <div>
            <b className="block leading-5 text-slate-900 break-words max-w-[140px]">{item.name}</b>
            <div className="text-slate-500 text-xs">{item.dept}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-full text-xs font-bold ring-1 bg-sky-50 text-sky-700 ring-sky-200"
            title={todayLabel}
          >
            📍 {roomToday}
          </span>
          
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ring-1 ${
              online
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {online ? "Đang làm việc" : "Tạm nghỉ"}
          </span>
        </div>
      </header>

      <ul className="mt-3 text-sm text-slate-700">
        <li><span className="text-slate-500">Mã:</span> <b>{item.id}</b></li>
        <li className="truncate">
          <span className="text-slate-500">Email:</span>{" "}
          <a className="text-sky-700 hover:underline" href={`mailto:${item.email}`}>{item.email}</a>
        </li>
        <li>
          <span className="text-slate-500">SĐT:</span>{" "}
          <a className="text-sky-700 hover:underline" href={`tel:${item.phone}`}>{item.phone}</a>
        </li>
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl ring-1 ring-slate-200 p-2 bg-white/60 group-hover:bg-sky-50 transition">
          <div className="text-slate-500 text-xs">{primaryLabel}</div>
          <div className="text-xl font-extrabold text-slate-900">{primaryValue}</div>
        </div>
        <div className="rounded-xl ring-1 ring-slate-200 p-2 bg-white/60 group-hover:bg-sky-50 transition">
          <div className="text-slate-500 text-xs">{todayLabel}</div>
          <div className="text-xl font-extrabold text-slate-900">{roomToday}</div>
        </div>
      </div>

      <footer className="mt-3 flex items-center justify-between">
        <Button
          className="bg-gradient-to-tr from-sky-100 via-cyan-100 to-sky-50 !py-1 !px-2"
          onClick={() => onDetail?.(item)}
          aria-label="Xem chi tiết nhân sự"
        >
          Xem chi tiết
        </Button>
        <div className="flex items-center gap-2">
          <a className="inline-flex items-center justify-center rounded-xl ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 px-2 py-1" href={`tel:${item.phone}`} title="Gọi" aria-label="Gọi">📞</a>
          <a className="inline-flex items-center justify-center rounded-xl ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 px-2 py-1" href={`mailto:${item.email}`} title="Email" aria-label="Email">✉️</a>
          <Button variant="outline" className="!py-1 !px-2" onClick={() => onSchedule?.(item)} title="Lịch" aria-label="Xem lịch">📅</Button>
        </div>
      </footer>
    </motion.article>
  );
}
