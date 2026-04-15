import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React, { useMemo } from "react";
import {  useDepartment} from "../../api/departments.js";
import Avatar from "../ui/Avatar.jsx";
import { getDemoPublicImage } from "../../utils/demoPublicImages.js";
function isClsType(type) {
  const v = String(type || "").toLowerCase();
  return (
    v.includes("cls") ||
    v.includes("cận lâm sàng") ||
    v.includes("can_lam_sang") ||
    v.includes("dv") ||
    v.includes("dich_vu") ||
    v.includes("dịch vụ")
  );
}

function kindText(type) {
  return isClsType(type)
    ? "Phòng cận lâm sàng (CLS)"
    : "Phòng khám lâm sàng (LS)";
}


function Progress({ value = 0, max = 0 }) {
  const hasCap = Number(max) > 0;
  const pct = hasCap ? Math.min(100, Math.round((value / max) * 100)) : null;
  return (
    <div className="w-full">
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
        <div className="h-full bg-indigo-400" style={{ width: `${pct ?? 0}%` }} />
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {hasCap ? `${pct}% ( ${value}/${max} )` : "Chưa cấu hình sức chứa"}
      </div>
    </div>
  );
}

export default function DeptModal({ open, dept, onClose }) {
  const roomId = dept?.room?.id || dept?.id;

  // Lấy detail chuẩn từ BE
  const { data: detail } = useDepartment(roomId, {
    enabled: !!roomId && open,
  });

  // Ưu tiên detail (RoomDetailDto đã map sang normalizeRoomDetail), fallback card
  const view = detail || dept || {};
  const deptImage = getDemoPublicImage(view, roomId);

  const roomType =
    view.room?.type ||
    view.roomType ||
    view.loaiPhong ||
    view.loai_phong;
  const isCLS = isClsType(roomType);

  // Dịch vụ: lấy từ RoomDetailDto.DichVuTaiPhong (đã normalize -> view.services)
  const services = Array.isArray(view.services) ? view.services : [];

  const shownServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    return list.filter((s) => {
      const t =
        s.type || s.loaiDichVu || s.loai_dich_vu || s.LoaiDichVu || "";
      return isCLS ? t === "can_lam_sang" : t !== "can_lam_sang";
    });
  }, [services, isCLS]);

  if (!dept) return null;

  const waiting = view.waitingPatients || 0;
  const done = view.examinedPatients || 0;
  const totalToday = waiting + done;
  const capacity =
    view.capacityPerDay || view.room?.capacity || 0;
  const fixedStaffLabel = isCLS
    ? "KTV phụ trách (cố định)"
    : "Bác sĩ phụ trách (cố định)";
  const fixedStaffName = isCLS
    ? view.technicianInCharge || view.nurseInCharge || "—"
    : view.doctorInCharge || "—";
  const isActive =
    typeof view.room?.status === "boolean"
      ? view.room.status
      : view.status === "active" ||
        String(view.trangThai || "").toLowerCase() === "hoat_dong";


  const statusBadge = (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border 
      ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      
      {isActive ? "Hoạt động" : "Tạm dừng"}
    </span>
  );

  const Card = ({ children, className = "" }) => (
    <motion.section
      whileHover={{ y: -2, scale: 1.002 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow ${className}`}
    >
      {children}
    </motion.section>
  );

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
              className="w-[min(1120px,100%)] max-h-[86vh] overflow-auto scrollbar-none bg-white rounded-2xl border border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="sticky top-0 z-10 backdrop-blur-sm bg-gradient-to-r from-indigo-50/80 via-violet-50/80 to-emerald-50/80 border-b border-slate-200 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={deptImage} item={view} size="lg" />
                    <div className="min-w-0">
                    <h3
                        className="text-lg font-extrabold text-slate-900 truncate"
                        title={`Phòng ${view.room?.number || "—"}`}
                      >
                        Phòng {view.room?.number || "—"}
                      </h3>
                      <div className="text-slate-600 text-sm">
                        Thuộc khoa: <b>{view.deptName || view.name || "—"}</b>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-slate-700 text-xs">
                      {kindText(roomType)}
                    </span>
                    {statusBadge}
                    <Button onClick={onClose} aria-label="Đóng" className="rounded-xl">
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 pt-2 space-y-2">
                {/* Tổng quan */}
                <Card>
                  <b className="block mb-3">Tổng quan</b>
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="text-sm space-y-1">
                    <div>Khu vực: <b>{view.room?.area || "—"}</b></div>
                      <div>
                        Loại phòng:{" "}
                        <b>
                          {isCLS ? "Cận lâm sàng" : "Khám lâm sàng"}
                        </b>
                      </div>
                      <div>Số điện thoại: <b>{view.room?.phone || "—"}</b></div>
                      <div>
                        Email:{" "}
                        <b
                          className="truncate max-w-[220px]"
                          title={view.room?.email || ""}
                        >
                          {view.room?.email || "—"}
                        </b>

                   
                        
                      </div>
                      <div>Giờ làm việc: <span className="font-medium">T2–6 07:30–16:30 • T7 07:30–11:30</span></div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        {fixedStaffLabel}: <b>{fixedStaffName}</b>
                      </div>
                      {!isCLS && view.nurseInCharge ? (
                        <div>
                          Điều dưỡng phụ trách: <b>{view.nurseInCharge}</b>
                        </div>
                      ) : null}

                    </div>
                    <div>
                      <div className="text-sm mb-2">Trang thiết bị</div>
                      <div className="flex flex-wrap gap-2">
                      {(view.equipments || []).length
                          ? (view.equipments || []).map((eq, i) => (
                              <motion.span
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex h-8 items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm hover:border-indigo-200 hover:bg-indigo-50 transition"
                              >
                                {eq}
                              </motion.span>
                            ))
                          : <span className="text-sm text-slate-500">—</span>}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Năng lực ngày */}
                <Card>
                  <b className="block mb-2">Năng lực ngày</b>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { t: "Đang chờ", v: waiting },
                      { t: "Đã hoàn thành", v: done },
                      { t: "Tổng hôm nay", v: totalToday },
                    ].map(({ t, v }) => (
                      <motion.div
                        key={t}
                        whileHover={{ scale: 1.03 }}
                        className="rounded-lg p-3 border border-indigo-200 bg-indigo-50 hover:bg-indigo-50/80 hover:border-indigo-300 transition"
                      >
                        <div className="text-indigo-700 text-xs">{t}</div>
                        <div className="text-2xl font-extrabold text-indigo-800">{v}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 grid md:grid-cols-3 gap-3 items-end">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Sức chứa/ngày</div>
                      <div className="text-sm font-bold">{capacity || "—"}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-500 mb-1">Công suất đã dùng</div>
                      <Progress value={totalToday} max={capacity} />
                    </div>
                  </div>
                </Card>

                {/* Dịch vụ */}
                <Card>
                  <div className="flex items-center justify-between">
                    <b className="block">Dịch vụ tại phòng</b>
                    <span className="text-xs text-slate-500">
                      {isCLS ? "Chỉ hiển thị nhóm CLS" : "Chỉ hiển thị nhóm LS/Chuyên khoa"}
                    </span>
                  </div>
                  <div className="overflow-auto scrollbar-none mt-2">
                    <table className="min-w-[640px] w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="px-2 py-2 border-b border-slate-200 font-semibold">Mã</th>
                          <th className="px-2 py-2 border-b border-slate-200 font-semibold">Tên dịch vụ</th>
                          <th className="px-2 py-2 border-b border-slate-200 font-semibold">Loại</th>
                          <th className="px-2 py-2 border-b border-slate-200 font-semibold">Thời gian (phút)</th>
                          <th className="px-2 py-2 border-b border-slate-200 font-semibold">Đơn giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownServices.length ? (
                          shownServices.map((s) => {
                            const id = s.id || s.ma_dich_vu;
                            const name = s.name || s.ten_dich_vu;
                            const type = s.type || s.loai_dich_vu;
                            const min = s.expectedMinutes ?? s.thoi_gian_du_kien_phut ?? 0;
                            const price = s.price ?? s.don_gia ?? 0;
                            return (
                              <motion.tr
                                key={id}
                                whileHover={{ scale: 1.002, y: -1 }}
                                className="hover:bg-indigo-50/40 transition"
                              >
                                <td className="px-2 py-2 border-b border-slate-100">{id}</td>
                                <td className="px-2 py-2 border-b border-slate-100 font-medium">{name}</td>
                                <td className="px-2 py-2 border-b border-slate-100">{type === "can_lam_sang" ? "Cận lâm sàng" : "Lâm sàng"}</td>
                                <td className="px-2 py-2 border-b border-slate-100">{min}</td>
                                <td className="px-2 py-2 border-b border-slate-100">{price.toLocaleString()} đ</td>
                              </motion.tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="px-2 py-3 text-slate-500" colSpan={5}>—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
