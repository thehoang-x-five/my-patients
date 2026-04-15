import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useStaffDetailQuery } from "../../api/staff.js";
import {
  formatDisplayText,
  formatPresenceStatusLabel,
  formatRoleLabel,
  formatVietnameseText,
} from "../../utils/textFormatters.js";
import { getDemoPublicImage } from "../../utils/demoPublicImages.js";

const NURSE_WORK_ROLE_LABEL = {
  lam_sang: "Y tá lâm sàng",
  can_lam_sang: "Y tá cận lâm sàng",
  hanh_chinh: "Y tá hành chính",
};

const getStatusVisual = (statusRaw) => {
  const status = statusRaw || "offline";

  if (status === "online") {
    return {
      label: formatPresenceStatusLabel("online"),
      className: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
    };
  }
  if (status === "pause") {
    return {
      label: formatPresenceStatusLabel("pause"),
      className: "bg-amber-50 text-amber-600 ring-amber-200/60",
    };
  }
  return {
    label: formatPresenceStatusLabel("offline"),
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
    if (
      s === "lam_sang" ||
      s === "y_ta_lam_sang" ||
      s === "ls" ||
      s.includes("lâm sàng")
    ) {
      key = "lam_sang";
    } else if (
      s === "can_lam_sang" ||
      s === "y_ta_can_lam_sang" ||
      s === "cls" ||
      s.includes("cận lâm")
    ) {
      key = "can_lam_sang";
    } else if (
      s === "hanh_chinh" ||
      s === "y_ta_hanh_chinh" ||
      s === "hanhchinh" ||
      s.includes("hành chính")
    ) {
      key = "hanh_chinh";
    }
  }

  if (!key && item?.roleType === "clinical") key = "lam_sang";
  if (!key && item?.roleType === "administrative") key = "hanh_chinh";

  return NURSE_WORK_ROLE_LABEL[key] || formatVietnameseText(key, "—");
};

function Tile({ label, value }) {
  return (
    <div className="rounded-lg ring-1 ring-slate-200 p-2 bg-white hover:bg-teal-50 transition">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="text-[14px] font-semibold text-slate-900 truncate">
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
      <div className="text-[13px] text-teal-700">{label}</div>
      <div className="text-[19px] font-semibold text-teal-900">{value}</div>
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

export default function StaffDetail({
  open,
  item,
  role,
  schedule,
  roomToday,
  onClose,
}) {
  const staffId =
    item?.maNhanVien ||
    item?.ma_nhan_vien ||
    item?.id ||
    item?.maNhanSu ||
    null;

  const rawRoleFromItem =
    item?.role || item?.vaiTro || item?.VaiTro || role || null;
  const isAdminUser =
    rawRoleFromItem === "admin" || rawRoleFromItem === "adminRole";

  const { data: detail } = useStaffDetailQuery(staffId, {
    enabled: open && !!staffId && !isAdminUser,
  });

  const view = detail || item;
  if (!open || !view) return null;

  const rawRole =
    view.role || view.vaiTro || rawRoleFromItem || null;
  const isDoctor = rawRole === "doctor" || rawRole === "bac_si";
  const isNurse = rawRole === "nurse" || rawRole === "y_ta";
  const isTechnician =
    rawRole === "technician" || rawRole === "ky_thuat_vien";
  const roleLabel = formatRoleLabel(rawRole, "Nhân sự y tế");

  const statusView = getStatusVisual(view.status);
  const staffImage = getDemoPublicImage(view, rawRole);

  let roomTodayText = null;
  if (typeof roomToday === "string") {
    roomTodayText = roomToday;
  } else if (roomToday && typeof roomToday === "object") {
    roomTodayText =
      roomToday.tenPhong ||
      roomToday.tenPhongHoacBanHomNay ||
      roomToday.maPhong ||
      null;
  }

  roomTodayText =
    roomTodayText ||
    view.tenPhongHoacBanHomNay ||
    view.tenPhongHomNay ||
    view.roomToday ||
    null;

  const fixedRoomText =
    view.tenPhongPhuTrach || view.clsRoom || view.doctorRoom || null;

  const appointmentCount =
    view?.apptCount ??
    view?.appointmentsToday ??
    view?.appts ??
    view?.appointments ??
    view?.soLichHenHomNay ??
    0;

  const experienceYears =
    view?.so_nam_kinh_nghiem ??
    view?.soNamKinhNghiem ??
    view?.years ??
    0;

  const weeklyShiftCount =
    (schedule
      ? Object.values(schedule).filter((s) => s && s !== "Nghỉ" && s !== "—")
        .length
      : null) ??
    view?.soCaTrucTuanNay ??
    0;

  const technicianClsToday = view?.soCaLamClsHomNay ?? 0;
  const skills =
    (Array.isArray(view.skills) && view.skills.length > 0
      ? view.skills
      : Array.isArray(view.kyNang) && view.kyNang.length > 0
        ? view.kyNang
        : []) || [];

  const specialtyText =
    Array.isArray(view.specialties) && view.specialties.length > 0
      ? view.specialties
        .map((specialty) => formatDisplayText(specialty, specialty))
        .join(", ")
      : formatDisplayText(view.chuyenKhoa, "—");

  const workRoleText = isNurse ? getNurseWorkRole(view) : roleLabel;
  const accountStatusText =
    view.trangThaiTaiKhoan ||
    view.trangThai ||
    view.statusAccount ||
    "hoat_dong";

  if (isAdminUser) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              className="fixed inset-0 z-50 grid place-items-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.section
                initial={{ y: 14, scale: 0.985, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 14, scale: 0.985, opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50/90 to-cyan-50/80 p-4 backdrop-blur-sm">
                  <Avatar src={staffImage} item={view} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-semibold text-slate-900">
                          {formatDisplayText(view.name, view.name || "—")}
                        </h2>
                        <p className="truncate text-[13px] text-slate-500">
                          {formatDisplayText(view.username || view.tenDangNhap, "Admin")}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                        Tài khoản quản trị
                      </span>
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

                <div className="flex-1 space-y-3 overflow-y-auto scrollbar-none p-4 text-[14px]">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                    <section className="space-y-3">
                      <Card>
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">
                          Thông tin tài khoản
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Tile
                            label="Họ tên"
                            value={formatDisplayText(view.name, view.name || "—")}
                          />
                          <Tile
                            label="Mã nhân viên"
                            value={view.ma_nhan_vien || view.maNhanVien || "—"}
                          />
                          <Tile
                            label="Tên đăng nhập"
                            value={view.username || view.tenDangNhap || "—"}
                          />
                          <Tile
                            label="Vai trò hệ thống"
                            value={formatRoleLabel(rawRole, "Admin")}
                          />
                          <Tile
                            label="Khoa phụ trách"
                            value={formatDisplayText(view.dept, "Không áp dụng")}
                          />
                          <Tile
                            label="Trạng thái tài khoản"
                            value={formatDisplayText(accountStatusText, accountStatusText)}
                          />
                        </div>
                      </Card>

                      <Card>
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">
                          Phạm vi quản trị
                        </h3>
                        <div className="space-y-2 text-[13px] text-slate-600">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            Tài khoản admin không dùng lịch làm, không gắn phòng cố định
                            và không hiển thị theo mẫu nhân sự y tế.
                          </div>
                          <div className="rounded-xl bg-teal-50 px-3 py-2 ring-1 ring-teal-200">
                            Dùng để quản trị tài khoản, khoa phòng, dịch vụ và vận hành hệ thống.
                          </div>
                        </div>
                      </Card>
                    </section>

                    <section className="space-y-3">
                      <Card>
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">
                          Liên hệ
                        </h3>
                        <div className="space-y-1 text-[13px] text-slate-600">
                          <div>
                            Email:{" "}
                            <a
                              className="text-teal-700 hover:underline"
                              href={view.email ? `mailto:${view.email}` : "#"}
                            >
                              {view.email || "—"}
                            </a>
                          </div>
                          <div>
                            SĐT:{" "}
                            <a
                              className="text-teal-700 hover:underline"
                              href={view.phone ? `tel:${view.phone}` : "#"}
                            >
                              {view.phone || "—"}
                            </a>
                          </div>
                        </div>
                      </Card>

                      <Card>
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">
                          Trạng thái
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Tile
                            label="Tài khoản"
                            value={formatDisplayText(accountStatusText, accountStatusText)}
                          />
                          <Tile
                            label="Công tác"
                            value={formatDisplayText(
                              view.status || view.trangThaiCongTac,
                              "Không áp dụng"
                            )}
                          />
                        </div>
                      </Card>
                    </section>
                  </div>
                </div>
              </motion.section>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ y: 14, scale: 0.985, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.985, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="sticky top-0 z-10 backdrop-blur-sm bg-gradient-to-r from-teal-50/80 to-cyan-50/80 border-b border-slate-200 p-4 flex items-start gap-3">
                <Avatar src={staffImage} item={view} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-semibold text-slate-900 truncate">
                        {formatDisplayText(view.name, view.name || "—")}
                      </h2>
                      <p className="text-[13px] text-slate-500 truncate">
                        {view.degree ? `${view.degree} • ` : ""}
                        {formatDisplayText(view.dept, "Chưa gán khoa")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${statusView.className}`}
                    >
                      Trạng thái: {statusView.label}
                    </span>
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

              <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 text-[14px]">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-3">
                  <section className="space-y-3">
                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        Thông tin hành chính
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Tile
                          label="Họ tên"
                          value={formatDisplayText(view.name, view.name || "—")}
                        />
                        <Tile
                          label="Mã nhân viên"
                          value={view.ma_nhan_vien || view.maNhanVien || "—"}
                        />
                        <Tile
                          label="Khoa"
                          value={formatDisplayText(view.dept, "Chưa gán khoa")}
                        />
                        <Tile label="Vai trò" value={workRoleText} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        Chuyên môn
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Tile label="Học vị" value={view.degree || "—"} />
                        <Tile label="Chuyên môn" value={specialtyText} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        Kỹ năng
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(skills.length ? skills : ["—"]).map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] text-teal-700 bg-teal-50 ring-1 ring-teal-200 hover:bg-teal-100 hover:ring-teal-300 transition"
                          >
                            {formatDisplayText(skill, skill)}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </section>

                  <section className="space-y-3">
                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        Liên hệ
                      </h3>
                      <div className="space-y-1 text-[13px] text-slate-600">
                        <div>
                          Email:{" "}
                          <a
                            className="text-teal-700 hover:underline"
                            href={view.email ? `mailto:${view.email}` : "#"}
                          >
                            {view.email || "—"}
                          </a>
                        </div>
                        <div>
                          SĐT:{" "}
                          <a
                            className="text-teal-700 hover:underline"
                            href={view.phone ? `tel:${view.phone}` : "#"}
                          >
                            {view.phone || "—"}
                          </a>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        Thống kê nhanh
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <StatTile label="Số năm KN" value={experienceYears} />
                        {isDoctor ? (
                          <StatTile
                            label="Lịch hẹn hôm nay"
                            value={appointmentCount}
                          />
                        ) : isTechnician ? (
                          <StatTile
                            label="Ca CLS hôm nay"
                            value={technicianClsToday}
                          />
                        ) : (
                          <StatTile
                            label="Ca trực tuần này"
                            value={weeklyShiftCount}
                          />
                        )}
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-2">
                        {isDoctor
                          ? "Phòng khám phụ trách"
                          : isTechnician
                            ? "Phòng CLS phụ trách"
                            : "Phòng / bàn hôm nay"}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 text-[13px] text-slate-700">
                        {fixedRoomText ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:ring-teal-300 transition">
                            {isTechnician ? "CLS phụ trách" : "Phụ trách"}:{" "}
                            {fixedRoomText}
                          </span>
                        ) : null}
                        {roomTodayText && roomTodayText !== fixedRoomText ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:ring-sky-300 transition">
                            Hôm nay: {roomTodayText}
                          </span>
                        ) : null}
                        {!fixedRoomText && !roomTodayText ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-slate-50 text-slate-500 ring-slate-200">
                            —
                          </span>
                        ) : null}
                      </div>
                    </Card>
                  </section>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

