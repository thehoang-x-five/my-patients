
// src/components/staff/StaffCard.jsx
import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";
const avatar=[];
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

for (let i = 1; i <= 6; i++) {
  avatar[i]="../../../public/"+i.toString()+".jpg";
}

const NURSE_WORK_ROLE_LABEL = {
  lam_sang: "Y tá lâm sàng",
  can_lam_sang: "Y tá cận lâm sàng",
  hanh_chinh: "Y tá hành chính",
};

const STAFFING_LABEL = {
  dang_cong_tac: "Đang công tác",
  tam_nghi: "Tạm nghỉ",
  nghi_viec: "Nghỉ việc",
};

const getRoomToday = (item) => {
  if (item.roomToday) return item.roomToday;
  if (item.todayRoom) return item.todayRoom;
  if (item.dutyRoomToday) return item.dutyRoomToday;

  if (Array.isArray(item.dutyRooms)) {
    const today = item.dutyRooms.find((x) => x.isToday);
    if (today?.room) return today.room;
  }

  if (item.doctorRoom) return item.doctorRoom;

  return "—";
};

const getStatusVisual = (statusRaw) => {
  const status = statusRaw || "offline";

  if (status == "online") {
    return {
      label: "online",
      className: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
    };
  }
  if (status == "pause") {
    return {
      label: "pause",
      className: "bg-amber-50 text-amber-600 ring-amber-200/60",
    };
  }
  return {
    label: "offline",
    className: "bg-slate-50 text-slate-400 ring-slate-200/60",
  };
};

const getNurseWorkRole = (item) => {
  const raw =
    item?.vai_tro_cong_tac ||
    item?.loaiYTa ||
    item?.loai_y_ta ||
    item?.nurseType ||
    item?.nurse_kind;

  let key = raw;

  if (raw) {
    const s = raw.toString().toLowerCase().trim();

    // Lâm sàng
   if (s == "lam_sang" || s == "y_ta_lam_sang" || s == "ls"|| s.includes("lâm sàng")) {
      key = "lam_sang";
    }
    // Cận lâm sàng
    else if (
      s == "can_lam_sang" ||
      s == "y_ta_can_lam_sang" ||
      s == "cls" ||
      s.includes("cận lâm")
    ) {
      key = "can_lam_sang";
    }
    // Hành chính
    else if (
      s == "hanh_chinh" ||
      s == "y_ta_hanh_chinh" ||
      s == "hanhchinh" ||
      s.includes("hành chính")
    ) {
      key = "hanh_chinh";
    }
  }

  if (!key && item?.roleType == "clinical") key = "lam_sang";
  if (!key && item?.roleType == "administrative") key = "hanh_chinh";

  return NURSE_WORK_ROLE_LABEL[key] || "—";
};
export default function StaffCard({ item, role, onDetail, onSchedule }) {
  const statusView = getStatusVisual(item.status);
  const apptCount =
    item?.apptCount ??
    item?.appointmentsToday ??
    item?.appts ??
    item?.appointments ??
    0;

  const roomToday = getRoomToday(item);
  const isAdminNurse = role == "nurse" && item.roleType == "administrative";
  const isDoctor = role == "doctor"||role == "bac_si";
  const isNurse = role == "nurse"||role == "y_ta";

  let primaryLabel;
  let primaryValue;
  let secondaryLabel;
  let secondaryValue;

  if (isDoctor) {
    primaryLabel = "Phòng phụ trách";
    primaryValue = item.doctorRoom || roomToday || "—";
    secondaryLabel = "Lịch hẹn hôm nay";
    secondaryValue = apptCount;
  }else if (isAdminNurse) {
    primaryLabel = "Vai trò công tác";
    primaryValue = getNurseWorkRole(item);
    secondaryLabel = "Bàn hôm nay";
    secondaryValue = roomToday;
  } 
  else if (isNurse) {
    primaryLabel = "Vai trò công tác";
    primaryValue = getNurseWorkRole(item);
    secondaryLabel = "Phòng hôm nay";
    secondaryValue = roomToday;
  } else {
    primaryLabel = "Phòng phụ trách";
    primaryValue = roomToday;
    secondaryLabel = "Lịch hẹn hôm nay";
    secondaryValue = apptCount;
  }
   

    const todayChipLabel = isDoctor
    ? "Phòng phụ trách"
    : isAdminNurse
    ? "Bàn hôm nay"
    : isNurse
    ? "Phòng hôm nay"
    : "Phòng";
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className="relative group rounded-2xl bg-white ring-1 ring-slate-200/90 shadow-sm hover:shadow-md hover:ring-teal-200 hover:bg-gradient-to-b hover:from-white hover:to-teal-50 transition p-4"
    >
      {/* Badges góc phải */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 transition uppercase tracking-wide ${statusView.className}`}
        >
          {statusView.label}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 bg-teal-50 text-teal-600 ring-teal-200/50 whitespace-nowrap"
          title={todayChipLabel}
        >
          📍 {roomToday}
        </span>
      </div>

      <header className="flex items-start gap-3">
        <Avatar src={avatar[randomInRange(1, 6)]} item={item} size={40} />
        <div className="flex-1 min-w-0 pr-24">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">
              {item.name}
            </h3>
            {item.degree && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
                {item.degree}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-600 flex items-center gap-1">
            <span>{item.dept || "Chưa gán khoa"}</span>
            {item.specialties?.length ? (
              <>
                <span className="text-slate-400">•</span>
                <span className="truncate text-slate-500">
                  {item.specialties.join(", ")}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <ul className="mt-3 text-xs text-slate-600 space-y-0.5">
        {item.skills?.length ? (
          <li className="flex gap-1">
            <span className="mt-0.5">✨</span>
            <span className="line-clamp-2">
              {item.skills.join(" · ")}
            </span>
          </li>
        ) : null}
        {item.email && (
          <li className="flex gap-1">
            <span>✉️</span>
            <a
              href={`mailto:${encodeURIComponent(
                String(item.email).trim()
              )}`}
              className="text-teal-600 hover:underline decoration-teal-300"
            >
              {item.email}
            </a>
          </li>
        )}
        {item.phone && (
          <li className="flex gap-1">
            <span>📞</span>
            <a
              href={`tel:${encodeURIComponent(
                String(item.phone).trim()
              )}`}
              className="text-teal-600 hover:underline decoration-teal-300"
            >
              {item.phone}
            </a>
          </li>
        )}
      </ul>

      {/* Thống kê */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl ring-1 ring-slate-100 p-2 bg-white/60 group-hover:bg-teal-50/50 group-hover:ring-teal-100 transition">
          <div className="text-slate-500 text-xs">{primaryLabel}</div>
          <div className="text-sm font-bold text-slate-900">
            {primaryValue}
          </div>
        </div>
        <div className="rounded-xl ring-1 ring-slate-100 p-2 bg-white/60 group-hover:bg-teal-50/50 group-hover:ring-teal-100 transition">
          <div className="text-slate-500 text-xs">{secondaryLabel}</div>
          <div className="text-sm font-bold text-slate-900">
            {secondaryValue}
          </div>
        </div>
      </div>

      <footer className="mt-3 flex items-center justify-between">
        <Button
          className="bg-gradient-to-tr from-teal-100 via-cyan-100 to-teal-50 text-teal-800 hover:from-teal-200 hover:via-cyan-200 hover:to-teal-100 transition !py-1 !px-3 shadow-sm ring-1 ring-teal-200/50"
          onClick={() => onDetail?.(item)}
        >
          Chi tiết
        </Button>

        <div className="flex items-center gap-1.5">
          {item.phone && (
            <a
              className="inline-flex items-center justify-center rounded-full ring-1 ring-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition px-2 py-1 text-xs font-medium"
              href={
                item.phone
                  ? `tel:${encodeURIComponent(
                      String(item.phone).trim()
                    )}`
                  : "#"
              }
            >
              Gọi
            </a>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full ring-1 ring-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition px-2 py-1 text-xs font-medium"
            onClick={() => onSchedule?.(item)}
          >
            Lịch trực
          </button>
        </div>
      </footer>
    </motion.article>
  );
}
