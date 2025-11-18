// src/components/staff/StaffDetail.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "./Avatar.jsx";

const NURSE_WORK_ROLE_LABEL = {
  lam_sang: "Y tá lâm sàng",
  can_lam_sang: "Y tá cận lâm_sang",
  hanh_chinh: "Y tá hành chính",
};

const getStatusVisual = (statusRaw) => {
  const status = statusRaw || "offline";

  if (status === "online") {
    return {
      label: "online",
      className: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
    };
  }
  if (status === "pause") {
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
  let key = item.vai_tro_cong_tac;
  if (!key && item.roleType === "clinical") key = "lam_sang";
  if (!key && item.roleType === "administrative") key = "hanh_chinh";
  return NURSE_WORK_ROLE_LABEL[key] || "—";
};

export default function StaffDetail({
  open,
  item,
  role,
  schedule,   // { Mon: "Sáng", Tue: "Chiều", ... }
  roomToday,  // "Nội 101" / "Quầy tiếp nhận 1"
  onClose,
}) {
  if (!open || !item) return null;

  const apptCount =
    item?.apptCount ??
    item?.appointmentsToday ??
    item?.appts ??
    item?.appointments ??
    0;

  const certCount =
    item?.so_nam_kinh_nghiem ?? item?.years ?? 0;

  const statusView = getStatusVisual(item.status);
  const managedRooms = item.managedRooms || [];

  const isDoctor = role === "doctor";
  const isNurse = role === "nurse";

  const roleLabel = isDoctor
    ? "Bác sĩ"
    : isNurse
    ? "Y tá"
    : "Nhân sự y tế";

  const nurseWorkRole = isNurse ? getNurseWorkRole(item) : null;

  // Số ca trực tuần này cho Y tá: đếm ca != "Nghỉ" / "—"
  const weeklyShiftCount =
    isNurse && schedule
      ? Object.values(schedule).filter(
          (s) => s && s !== "Nghỉ" && s !== "—"
        ).length
      : 0;

  function Tile({ label, value }) {
    return (
      <div className="rounded-lg ring-1 ring-slate-200 p-2 bg-white hover:bg-teal-50 transition">
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900 truncate">
          {value}
        </div>
      </div>
    );
  }

  function StatTile({ label, value }) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="rounded-xl p-3 border border-teal-200 bg-teal-50 hover:bg-teal-50/80 hover:border-teal-300 transition"
      >
        <div className="text-xs text-teal-700">{label}</div>
        <div className="text-lg font-semibold text-teal-900">
          {value}
        </div>
      </motion.div>
    );
  }

  const Card = ({ children, className = "" }) => (
    <motion.section
      whileHover={{ y: -2, scale: 1.002 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-200 hover:shadow ${className}`}
    >
      {children}
    </motion.section>
  );

  // ===== JSX =====
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

          {/* Wrapper */}
          <motion.div
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Modal */}
            <motion.section
              initial={{ y: 14, scale: 0.985, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.985, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <header className="sticky top-0 z-10 backdrop-blur-sm bg-gradient-to-r from-teal-50/80 to-cyan-50/80 border-b border-slate-200 p-4 flex items-start gap-3">
                <Avatar item={item} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-slate-900 truncate">
                        {item.name}
                      </h2>
                      <p className="text-xs text-slate-500 truncate">
                        {item.degree ? item.degree + " • " : ""}
                        {item.dept || "Chưa gán khoa"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${statusView.className}`}
                      >
                        Trạng thái: {statusView.label}
                      </span>
                    </div>
                  </div>
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

              {/* BODY */}
              <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-3">
                  {/* Cột trái: hành chính + chuyên môn + kỹ năng */}
                  <section className="space-y-3">
                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        Thông tin hành chính
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Tile label="Họ tên" value={item.name} />
                        <Tile
                          label="Mã nhân viên"
                          value={item.ma_nhan_vien || "—"}
                        />
                        <Tile
                          label="Khoa"
                          value={item.dept || "Chưa gán khoa"}
                        />
                        <Tile label="Vai trò" value={roleLabel} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        Chuyên môn
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Tile label="Học vị" value={item.degree || "—"} />
                        <Tile
                          label="Chuyên khoa"
                          value={
                            (item.specialties || []).join(", ") || "—"
                          }
                        />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        Kỹ năng
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.skills && item.skills.length > 0
                          ? item.skills
                          : ["—"]
                        ).map((s, i) => (
                          <span
                            key={s + i}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] text-teal-700 bg-teal-50 ring-1 ring-teal-200 hover:bg-teal-100 hover:ring-teal-300 transition"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </section>

                  {/* Cột phải: liên hệ + thống kê + phòng/bàn trực hôm nay */}
                  <section className="space-y-3">
                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        Liên hệ
                      </h3>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div>
                          Email:{" "}
                          <a
                            className="text-teal-700 hover:underline"
                            href={
                              item.email
                                ? `mailto:${item.email}`
                                : "#"
                            }
                          >
                            {item.email || "—"}
                          </a>
                        </div>
                        <div>
                          SĐT:{" "}
                          <a
                            className="text-teal-700 hover:underline"
                            href={
                              item.phone
                                ? `tel:${item.phone}`
                                : "#"
                            }
                          >
                            {item.phone || "—"}
                          </a>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        Thống kê nhanh
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <StatTile
                          label="Số năm KN"
                          value={certCount}
                        />
                        {isDoctor ? (
                          <StatTile
                            label="Lịch hẹn hôm nay"
                            value={apptCount}
                          />
                        ) : isNurse ? (
                          <StatTile
                            label="Số ca trực tuần này"
                            value={weeklyShiftCount}
                          />
                        ) : (
                          <StatTile
                            label="Lịch hẹn hôm nay"
                            value={apptCount}
                          />
                        )}
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xs font-semibold text-slate-700 mb-2">
                        {isDoctor
                          ? "Phòng khám phụ trách"
                          : isNurse
                          ? "Phòng / bàn trực hôm nay"
                          : "Phòng / bàn"}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 text-xs text-slate-700">
                        {isDoctor && (item.doctorRoom || roomToday) && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:ring-teal-300 transition">
                            PK: {item.doctorRoom || roomToday}
                          </span>
                        )}

                        {isNurse && (roomToday || managedRooms.length) ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:ring-teal-300 transition">
                            {roomToday || managedRooms[0] || "—"}
                          </span>
                        ) : null}

                        {!isDoctor && !isNurse && (
                          (managedRooms.length ? managedRooms : ["—"]).map(
                            (r, i) => (
                              <span
                                key={r + i}
                                className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:ring-teal-300 transition"
                              >
                                {r}
                              </span>
                            )
                          )
                        )}
                      </div>
                    </Card>
                  </section>
                </div>
              </div>

              {/* FOOTER */}
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
