// src/components/patients/PatientViewMode.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx"; // từ /patients -> /ui
import { ANIMATION_CONFIG, StatusPill } from "./Shared.jsx";
import { mapTodayStatusLabel, mapGenderLabel, mapVisitTypeLabel } from "../../api/patients";

export default function PatientViewMode({
  patient,
  visits,
  transactions,
  patientExtras,
  // mới: callback tạo lịch hẹn từ màn view
  handleCreateAppointmentFromView,
}) {
  // ===== 1. Map DTO BE -> field hiển thị =====
  const patientId =
    patient?.MaBenhNhan ||
    patient?.maBenhNhan ||
    patient?.id ||
    "";

  const name =
    patient?.nameFormatted ||
    patient?.HoTen ||
    patient?.hoTen ||
    patient?.name ||
    "—";

  const rawDob =
    patient?.NgaySinh ||
    patient?.ngaySinh ||
    patient?.dob;
  let dobText = "—";
  if (rawDob) {
    const d = new Date(rawDob);
    dobText = isNaN(d.getTime())
      ? String(rawDob)
      : d.toLocaleDateString("vi-VN");
  }

  const gender =
    patient?.gender ||
    mapGenderLabel(patient?.GioiTinh || patient?.gioiTinh || patient?.gender) ||
    "—";

  const phone =
    patient?.DienThoai ||
    patient?.dienThoai ||
    patient?.phone ||
    "—";

  const email =
    patient?.Email ||
    patient?.email ||
    "—";

  const address =
    patient?.DiaChi ||
    patient?.diaChi ||
    patient?.address ||
    "—";

  // Trạng thái trong ngày (BE: TrangThaiHomNay)
  const todayStatus =
    patient?.statusLabel ||
    mapTodayStatusLabel(patient?.TrangThaiHomNay || patient?.trangThaiHomNay || patient?.status) ||
    "";

  // BMI nếu sau này có chiều cao / cân nặng
  const height =
    patient?.heightCm ||
    patient?.chieuCaoCm ||
    patient?.ChieuCaoCm;
  const weight =
    patient?.weightKg ||
    patient?.canNangKg ||
    patient?.CanNangKg;

  let bmiBlock = null;
  if (height && weight) {
    const h = Number(height);
    const w = Number(weight);
    if (h > 0 && w > 0) {
      const m = h / 100;
      const bmi = (w / (m * m)).toFixed(1);
      bmiBlock = (
        <div className="mt-3 pt-3 border-t border-emerald-100">
          <Chip tone="emerald" dot="teal" className="text-xs">
            BMI: {bmi}
          </Chip>
        </div>
      );
    }
  }

  const safePatientExtras = patientExtras || [];
  const safeVisits = visits || [];
  const safeTransactions = transactions || [];

  return (
    <motion.div {...ANIMATION_CONFIG} className="space-y-3">
      {/* HEADER – thông tin bệnh nhân + trạng thái + nút tạo lịch hẹn */}
      <div className="flex items-start gap-3 pt-2">
        <motion.div
          whileHover={{ y: -3, scale: 1.03 }}
          className="w-10 h-10 rounded-3xl ring-2 ring-emerald-200 bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center font-black text-lg text-emerald-700 shadow-sm"
        >
          BN
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="flex-1 rounded-2xl p-4 bg-gradient-to-br from-white to-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm"
        >
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="font-extrabold text-lg text-slate-900">
                {name}
              </div>
              <div className="text-sm text-slate-600">
                {patientId || "—"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {dobText} • {gender}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-slate-700">{phone}</div>
              <div className="text-sm text-slate-700">{email}</div>
              <div className="text-xs text-slate-500 mt-1">
                {address}
              </div>
            </div>
          </div>

          {bmiBlock}

          {safePatientExtras.length > 0 && (
            <div className="mt-3 pt-3 border-emerald-100 border-t">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Thông tin bổ sung
              </div>
              <div className="flex flex-wrap gap-1.5">
                {safePatientExtras.map((ex, i) => (
                  <Chip key={i} tone="slate" className="text-xs">
                    {ex.label || ex.key}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex flex-col items-end gap-2">
          <StatusPill s={todayStatus} />
          <button
            type="button"
            onClick={handleCreateAppointmentFromView}
            disabled={!handleCreateAppointmentFromView}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-gradient-to-tr from-teal-100 to-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Tạo lịch hẹn cho bệnh nhân này"
            id="patient-create-appt-btn"
          >
            Tạo lịch hẹn
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lịch sử khám – map từ PatientVisitSummaryDto (Date, Dept, Doctor, Note, Type, By) */}
        <motion.section
          whileHover={{ y: -2 }}
          className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900">Lịch sử khám</h4>
            <Chip tone="emerald" dot="emerald" className="text-xs">
              {safeVisits.length}
            </Chip>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
            {safeVisits.length ? (
              safeVisits.map((v, i) => {
                // Prefer normalized display fields from FE; fallback to BE shapes
                const dateText = v.dateLabel || v.date || v.Date || v.ngay || v.Ngay || "";
                const deptText = v.dept || v.Dept || v.khoa || v.Khoa || "";
                const doctorText = v.doctor || v.Doctor || v.bacSi || v.BacSi || "";
                const noteText = v.note || v.Note || v.ghiChu || v.GhiChu || "";
                const typeText = v.typeLabel || mapVisitTypeLabel(v.type || v.Type) || "—";
                const byText = v.by || v.By || v.nguoiLap || v.NguoiLap || "—";

                return (
                  <motion.div
                    key={`${dateText}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl p-3 bg-emerald-50/50 ring-1 ring-emerald-100/50 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-900">
                          {dateText}
                        </div>
                        <div className="text-xs text-slate-600">
                          {deptText}
                          {deptText && doctorText ? " • " : ""}
                          {doctorText}
                        </div>
                        <div className="text-xs text-slate-700 mt-1 whitespace-pre-wrap line-clamp-2">
                          {noteText}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Chip tone="slate" className="text-xs px-2 py-0.5">
                            {typeText}
                          </Chip>
                          <span className="text-xs text-slate-500">
                            {byText}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("app:navigate", {
                              detail: {
                                to: `/visits/${patientId}`,
                              },
                            })
                          )
                        }
                        className="shrink-0 w-7 h-7 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold shadow-sm hover:shadow transition"
                      >
                        →
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </motion.section>

        {/* Giao dịch – map từ PatientTransactionSummaryDto (Date, Item, Amount, Status) */}
        <motion.section
          whileHover={{ y: -2 }}
          className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900">Giao dịch</h4>
            <Chip tone="cyan" dot="cyan" className="text-xs">
              {safeTransactions.length}
            </Chip>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
            {safeTransactions.length ? (
              safeTransactions.map((t, i) => {
                const dateText =
                  t.date || t.Date || t.ngay || t.Ngay || "";
                const itemText =
                  t.item || t.Item || t.noiDung || t.NoiDung || "";
                const amountVal =
                  t.amount || t.Amount || t.soTien || t.SoTien || 0;
                const statusText = t.statusLabel || t.status || t.Status || t.trangThai || t.TrangThai || "";

                return (
                  <motion.div
                    key={`${t.ref || t.Ref || i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl p-3 bg-cyan-50/50 ring-1 ring-cyan-100/50 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          {dateText}
                        </div>
                        <div className="text-xs text-slate-700">
                          {itemText}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-emerald-700 tabular-nums">
                            {Number(amountVal || 0).toLocaleString("vi-VN")}đ
                          </span>
                          <Chip
                            tone="amber"
                            dot="amber"
                            className="text-xs px-2 py-0.5"
                          >
                            {statusText}
                          </Chip>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("app:navigate", {
                              detail: {
                                to: `/transactions/${patientId}`,
                              },
                            })
                          )
                        }
                        className="shrink-0 w-7 h-7 rounded-lg border border-cyan-300 bg-white hover:bg-cyan-50 flex items-center justify-center text-cyan-600 text-xs font-bold shadow-sm hover:shadow transition"
                      >
                        →
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Chưa có giao dịch
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* Khối pendingProcess cũ đã bỏ để tránh lệ thuộc field không có trong PatientDetailDto */}
    </motion.div>
  );
}
