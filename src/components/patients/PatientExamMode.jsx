import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

import { EXTRA_FIELDS } from "../../api/examination";
import { ANIMATION_CONFIG, SERVICE_ROOMS } from "./Shared.jsx";

export default function PatientExamMode({
  form,
  exam,
  setExam,
  tplId,
  setTplId,
  tpl,
  tplList = [],
  booking,
  setBooking,
  isServiceIntake,
  isFollowupStatus,
  serviceItems,
  serviceNotes,
  setServiceNotes,
  serviceRooms,
  setServiceRooms,
  priceOfService,
  totalServiceFee,
  examExtras,
  removeExamExtra,
  pushExamExtra,
  newExamKey,
  setNewExamKey,
  newExamVal,
  setNewExamVal,
  handleDirectExam,
  handleFollowupExam,
  clsSummary,
  clsItems = [],
  clsResults = [],
  currentUser,
}) {
  // ====== 1. Mã lịch hẹn + loại hẹn + hình thức tiếp nhận ======
  const apptCode =
    booking?.appointmentCode ||
    booking?.maLichHen ||
    booking?.MaLichHen ||
    booking?.code ||
    "";

  const appointmentType =
    booking?.loaiHen || booking?.LoaiHen || booking?.appointmentType;

  const isAppointmentFollowup = appointmentType === "tai_kham";

  // Intake type:
  // - service_return: tái khám sau CLS
  // - appointment: có mã lịch hẹn
  // - walkin: đến trực tiếp
  const intakeType =
    exam?.hinhThucTiepNhan ||
    (isFollowupStatus
      ? "service_return"
      : apptCode
      ? "appointment"
      : "walkin");

  const intakeTypeLabel =
    {
      walkin: "Khám trực tiếp (walk-in)",
      appointment: "Theo lịch hẹn",
      service_return: "Tái khám sau CLS",
    }[intakeType] || intakeType;

  const isFreeExam = isFollowupStatus || isAppointmentFollowup;

  const displayFee =
    isFreeExam ? 0 : (isServiceIntake ? totalServiceFee : booking?.price) || 0;

  const createdByLabel =
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.username ||
    "";

  // ====== 2. Chuẩn bị dữ liệu bảng kết quả CLS cho lượt 2 ======
  const clsResultLines = React.useMemo(() => {
    if (Array.isArray(clsResults) && clsResults.length) return clsResults;
    if (clsSummary && Array.isArray(clsSummary.KetQua)) return clsSummary.KetQua;
    if (clsSummary && Array.isArray(clsSummary.ketQua)) return clsSummary.ketQua;
    return [];
  }, [clsResults, clsSummary]);

  const clsDisplayRows = React.useMemo(() => {
    if (!clsItems?.length && !clsResultLines?.length) return [];
    const map = new Map();

    (clsItems || []).forEach((it) => {
      const key =
        it.MaChiTietDv ||
        it.maChiTietDv ||
        it.MaDichVu ||
        it.maDichVu ||
        it.MaPhieuKhamCls ||
        Math.random().toString(36).slice(2);
      const val = map.get(key) || {};
      val.item = it;
      map.set(key, val);
    });

    (clsResultLines || []).forEach((rs) => {
      const key =
        rs.MaChiTietDv ||
        rs.maChiTietDv ||
        rs.MaDichVu ||
        rs.maDichVu ||
        rs.MaPhieuKhamCls ||
        Math.random().toString(36).slice(2);
      const val = map.get(key) || {};
      val.result = rs;
      map.set(key, val);
    });

    return Array.from(map.values());
  }, [clsItems, clsResultLines]);

  const showClsResultTable = isFollowupStatus && clsDisplayRows.length > 0;

  // Đồng bộ hinhThucTiepNhan vào state exam (parent gọi BE)
  React.useEffect(() => {
    if (!exam) return;
    if (exam.hinhThucTiepNhan === intakeType) return;
    setExam((s) => ({ ...s, hinhThucTiepNhan: intakeType }));
  }, [intakeType, exam, setExam]);

  const selectTemplates =
    (tplList && tplList.length && tplList) || (tpl ? [tpl] : []);

  const defaultExamTitle = isServiceIntake
    ? "Phiếu cận lâm sàng"
    : "Khám lâm sàng";
  const examTitle = exam?.type || tpl?.title || defaultExamTitle;
  const examTypeDisplay =
    exam?.type ||
    tpl?.title ||
    (isServiceIntake ? "Phiếu cận lâm sàng" : "(Chưa chọn loại khám)");
  const formHeading = isServiceIntake ? "Phiếu CLS" : "Phiếu khám";

  return (
    <motion.div {...ANIMATION_CONFIG} className="space-y-3">
      <motion.section
        whileHover={{ y: -2 }}
        className="rounded-2xl p-2 mt-2 mb-0 ring-1 ring-emerald-200/50 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-900">{formHeading}</h4>
          <Chip tone="emerald" dot="emerald" className="text-xs">
            {examTitle}
          </Chip>
        </div>

        {/* Thông tin tóm tắt */}
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div className="rounded-xl p-3.5 bg-emerald-50/60 ring-1 ring-emerald-100">
            <div className="text-xs text-slate-600 mb-1">Bệnh nhân</div>
            <div className="font-bold text-slate-900">{form?.name}</div>
            <div className="text-xs text-slate-600">{form?.id}</div>
          </div>
          <div className="rounded-xl p-3.5 bg-cyan-50/60 ring-1 ring-cyan-100">
            <div className="text-xs text-slate-600 mb-1">
              {isServiceIntake ? "Loại phiếu" : "Loại khám"}
            </div>
            <div className="font-bold text-slate-900">
              {examTypeDisplay}
            </div>
          </div>
          <div className="rounded-xl p-3.5 bg-amber-50/60 ring-1 ring-amber-100">
            <div className="text-xs text-slate-600 mb-1">Mức phí</div>
            <div className="font-bold text-emerald-700">
              {displayFee.toLocaleString("vi-VN")}
              {isFreeExam && (
                <span className="ml-1 text-xs text-slate-500">(Miễn phí)</span>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin intake */}
        {!isServiceIntake && (
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3.5 bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs text-slate-600 mb-1">Mã lịch hẹn</div>
              <div className="font-semibold text-slate-900">
                {apptCode || <span className="text-slate-400">(Không có)</span>}
              </div>
            </div>
            <div className="rounded-xl p-3.5 bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs text-slate-600 mb-1">
                Hình thức tiếp nhận
              </div>
              <div className="font-semibold text-slate-900">
                {intakeTypeLabel}
              </div>
            </div>
            <div className="rounded-xl p-3.5 bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs text-slate-600 mb-1">Người lập phiếu</div>
              <div className="font-semibold text-slate-900">
                {createdByLabel || (
                  <span className="text-slate-400">
                    (Tài khoản hiện tại - tự động lấy MaNguoiLap)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form chọn mẫu khám, khoa, bác sĩ, phòng, ngày giờ */}
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          {!isServiceIntake && (
            <>
              <label className="text-sm font-semibold text-slate-700">
                Mẫu khám
                <select
                  value={tplId || ""}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setTplId(newId);
                    const found =
                      selectTemplates.find((t) => t.id === newId) || tpl;
                    setExam((s) => ({
                      ...s,
                      type: found?.title || s.type || "",
                    }));
                  }}
                  className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
                >
                  {selectTemplates.length === 0 && (
                    <option value="">(Chưa có template)</option>
                  )}
                  {selectTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Chuyên khoa
                <div className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 bg-white text-left shadow-sm select-none">
                  {exam.dept || "Chưa chọn chuyên khoa"}
                </div>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Bác sĩ
                <div className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 bg-white text-left shadow-sm select-none">
                  {booking.doctor || "Chưa chọn bác sĩ"}
                </div>
              </label>
            </>
          )}
          {!isServiceIntake && (
            <label className="text-sm font-semibold text-slate-700">
              Phòng
              <div className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 bg-white text-left shadow-sm select-none">
                {exam.room || "Chưa chọn phòng"}
              </div>
            </label>
          )}
          <label className="text-sm font-semibold text-slate-700">
            Ngày
            <input
              type="date"
              value={booking.date}
              onChange={(e) =>
                setBooking((b) => ({ ...b, date: e.target.value }))
              }
              className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Giờ
            <input
              type="time"
              value={booking.time}
              onChange={(e) =>
                setBooking((b) => ({ ...b, time: e.target.value }))
              }
              className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
            />
          </label>
          {isServiceIntake && (
            <label className="text-sm font-semibold text-slate-700">
              Người lập phiếu
              <div className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 bg-white text-left shadow-sm select-none">
                {createdByLabel || (
                  <span className="text-slate-400">
                    (Tài khoản hiện tại - tự động lấy MaNguoiLap)
                  </span>
                )}
              </div>
            </label>
          )}
        </div>

        {/* Triệu chứng / ghi chú nếu không phải CLS followup */}
        {!isServiceIntake && !showClsResultTable && (
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            {isFollowupStatus ? "Ghi chú" : "Triệu chứng"}
            <textarea
              rows={2}
              value={isFollowupStatus ? exam.note : exam.symptoms}
              onChange={(e) =>
                isFollowupStatus
                  ? setExam((s) => ({ ...s, note: e.target.value }))
                  : setExam((s) => ({
                      ...s,
                      symptoms: e.target.value,
                    }))
              }
              className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition resize-none shadow-sm"
            />
          </label>
        )}

        {/* Bảng kết quả CLS (lượt 2) */}
        {showClsResultTable && (
          <div className="mt-0 mb-3 rounded-2xl p-3 ring-1 ring-sky-200 bg-sky-50/40">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900">
                Kết quả cận lâm sàng
              </h5>
              <Chip tone="sky" dot="sky" className="text-xs">
                {clsDisplayRows.length} dịch vụ
              </Chip>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-100">
                  <tr className="text-xs font-semibold text-slate-700">
                    <th className="px-3 py-2 text-left">Dịch vụ</th>
                    <th className="px-3 py-2 text-left">Kết quả</th>
                    <th className="px-3 py-2 text-left">Người thực hiện</th>
                    <th className="px-3 py-2 text-left">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {clsDisplayRows.map((row, idx) => {
                    const item = row.item || {};
                    const rs = row.result || {};
                    const serviceName =
                      item.TenDichVu ||
                      item.tenDichVu ||
                      rs.TenDichVu ||
                      rs.tenDichVu ||
                      "(Không rõ)";
                    const resultText =
                      rs.NoiDungKetQua || rs.noiDungKetQua || "(Chưa có)";
                    const staffName =
                      rs.TenNhanSuThucHien ||
                      rs.tenNhanSuThucHien ||
                      "(Chưa có)";
                    const timeRaw = rs.ThoiGianTao || rs.thoiGianTao || "";
                    let timeText = "(Chưa có)";
                    if (timeRaw) {
                      const d = new Date(timeRaw);
                      if (!isNaN(d.getTime())) {
                        timeText = d.toLocaleString("vi-VN");
                      }
                    }
                    return (
                      <tr
                        key={idx}
                        className="border-t border-slate-100 hover:bg-sky-50/50"
                      >
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {serviceName}
                        </td>
                        <td className="px-3 py-2 whitespace-pre-wrap">
                          {resultText}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {staffName}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {timeText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Intake dịch vụ (phiếu CLS) */}
        {isServiceIntake && (
          <div className="mt-0 mb-2 rounded-2xl p-3 ring-1 ring-amber-200 bg-amber-50/50">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900">Dịch vụ chỉ định</h5>
              <Chip tone="amber" dot="amber" className="text-xs">
                {serviceItems.length || 0}
              </Chip>
            </div>
            <div className="mt-2 space-y-2">
              {(serviceItems.length ? serviceItems : ["(Không có dịch vụ)"]).map(
                (sv, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-2 bg-white ring-1 ring-amber-100"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6 md:col-span-6 font-semibold text-sm truncate">
                        {sv}
                      </div>
                      <div className="col-span-3 md:col-span-3 text-sm font-bold text-emerald-700 tabular-nums">
                        {serviceItems.length
                          ? priceOfService(sv).toLocaleString("vi-VN")
                          : 0}
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <div className="w-full rounded-lg px-2 py-1.5 ring-1 ring-slate-200 bg-slate-50 text-sm text-slate-700 min-h-[34px] flex items-center">
                          {serviceRooms[idx] || "—"}
                        </div>
                      </div>
                    </div>
                    <input
                      value={serviceNotes[idx] || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setServiceNotes((s) =>
                          s.map((x, i) => (i === idx ? v : x))
                        );
                      }}
                      className="mt-2 w-full rounded-lg px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
                      placeholder={
                        serviceItems.length
                          ? "Ghi chú riêng cho dịch vụ này"
                          : "Không có nội dung"
                      }
                      disabled={!serviceItems.length}
                    />
                  </div>
                )
              )}
            </div>
            <label className="block text-sm font-semibold text-slate-700 mt-3">
              Ghi chú
              <textarea
                rows={2}
                value={exam.note}
                onChange={(e) =>
                  setExam((s) => ({ ...s, note: e.target.value }))
                }
                className="mt-2 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
                placeholder="Ghi chú chung"
              />
            </label>
            <div className="mt-3 flex items-center justify-end gap-3">
              <span className="text-sm text-slate-600">Tổng phí</span>
              <span className="text-base font-extrabold text-emerald-700">
                {totalServiceFee.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        )}

        {/* Extra info */}
        {examExtras.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 mb-4"
          >
            {examExtras.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                className="rounded-xl p-3 bg-white ring-1 ring-slate-200 flex items-center justify-between shadow-sm"
              >
                <div className="text-sm flex-1">
                  <b className="text-slate-700">
                    {EXTRA_FIELDS.find((f) => f.key === ex.key)?.label ||
                      ex.key}
                    :
                  </b>
                  <span className="ml-2 text-slate-600">{ex.value}</span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeExamExtra(i)}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold"
                >
                  x
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="flex items-end gap-2 p-3 mt-2 rounded-xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={pushExamExtra}
            className="px-2 py-1 rounded-xl border-2 border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm hover:shadow transition whitespace-nowrap"
          >
            + Thêm dòng
          </motion.button>
          <label className="text-sm flex-1">
            Loại thông tin
            <select
              value={newExamKey}
              onChange={(e) => setNewExamKey(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs transition"
            >
              {EXTRA_FIELDS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-[2]">
            Nội dung
            <input
              value={newExamVal}
              onChange={(e) => setNewExamVal(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs transition"
              placeholder="Nhập..."
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-200">
          {isFollowupStatus ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFollowupExam}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              Lập phiếu khám sau CLS (Miễn phí)
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDirectExam}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              {isServiceIntake
                ? "Lập phiếu CLS & thu phí"
                : "Lập phiếu khám & thu phí"}
            </motion.button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
