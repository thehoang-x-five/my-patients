// src/components/patients/PatientViewMode.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import { ANIMATION_CONFIG, StatusPill } from "./Shared.jsx";
import {
  isCurrentTodayStatus,
  mapTodayStatusLabel,
  mapGenderLabel,
  mapVisitTypeLabel,
} from "../../api/patients";
import { useMedicalHistory } from "../../api/history.js";
import { formatStatus } from "../../utils/textFormatters.js";

// ===== NEW TABS =====
import PatientTimeline from "./PatientTimeline.jsx";
import PatientTransactions from "./PatientTransactions.jsx";
import PatientGenealogy from "./PatientGenealogy.jsx";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "history", label: "Lịch sử khám" },
  { key: "activity", label: "Hoạt động" },
  { key: "transactions", label: "Giao dịch" },
  { key: "genealogy", label: "Pha hệ" },
];

function visitStatusCode(visit = {}) {
  return String(
    visit.status ||
      visit.TrangThai ||
      visit.trangThai ||
      visit._raw?.TrangThai ||
      visit._raw?.trangThai ||
      ""
  ).trim().toLowerCase();
}

function isCancelledWorkflowVisit(visit) {
  const status = visitStatusCode(visit);
  return status === "da_huy" || status === "huy" || status === "cancelled";
}

function isMedicalVisit(visit) {
  if (isCancelledWorkflowVisit(visit)) return false;

  const status = visitStatusCode(visit);
  const raw = visit?._raw || {};
  return (
    status === "hoan_tat" ||
    status === "da_hoan_tat" ||
    status === "hoan_thanh" ||
    Boolean(visit?.note || raw?.Note || raw?.note) ||
    Boolean(raw?.MaPhieuChanDoanCuoi || raw?.maPhieuChanDoanCuoi) ||
    Boolean(raw?.MaDonThuoc || raw?.maDonThuoc) ||
    Boolean(raw?.MaPhieuTongHopCls || raw?.maPhieuTongHopCls)
  );
}

function asCancelledActivity(visit) {
  return {
    ...visit,
    type: "workflow",
    eventType: "workflow",
    typeLabel: "Bỏ về / quá hạn",
    status: visitStatusCode(visit) || "da_huy",
    note: visit?.note || "Workflow đã được hủy do bỏ về hoặc quá hạn.",
  };
}

export default function PatientViewMode({
  patient,
  visits,
  transactions,
  patientExtras,
  handleCreateAppointmentFromView,
  allPatients,
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [highlightTab, setHighlightTab] = useState(false);
  const highlightTimerRef = useRef(null);

  // Chuyển tab kèm hiệu ứng highlight (giống khi checkin -> link sang trang bệnh nhân)
  const switchTabWithHighlight = useCallback((tabKey) => {
    setActiveTab(tabKey);
    setHighlightTab(true);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightTab(false), 2500);
  }, []);

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

  const patientId = patient?.MaBenhNhan || patient?.maBenhNhan || patient?.id || "";
  const name = patient?.nameFormatted || patient?.HoTen || patient?.hoTen || patient?.name || "—";
  const { data: medicalHistory } = useMedicalHistory(
    patientId,
    { limit: 50 },
    { enabled: !!patientId }
  );

  const rawDob = patient?.NgaySinh || patient?.ngaySinh || patient?.dob;
  let dobText = "—";
  if (rawDob) {
    const d = new Date(rawDob);
    dobText = isNaN(d.getTime()) ? String(rawDob) : d.toLocaleDateString("vi-VN");
  }

  const gender = patient?.gender || mapGenderLabel(patient?.GioiTinh || patient?.gioiTinh || patient?.gender) || "—";
  const phone = patient?.DienThoai || patient?.dienThoai || patient?.phone || "—";
  const email = patient?.Email || patient?.email || "—";
  const address = patient?.DiaChi || patient?.diaChi || patient?.address || "—";
  const todayStatusDate =
    patient?.NgayTrangThai ||
    patient?.ngayTrangThai ||
    patient?.ngay_trang_thai ||
    patient?.statusDate ||
    "";
  const rawTodayStatus =
    patient?.TrangThaiHomNay ||
    patient?.trangThaiHomNay ||
    patient?.trang_thai_hom_nay_code ||
    patient?.statusCode ||
    "";
  const todayStatus = isCurrentTodayStatus(todayStatusDate)
    ? mapTodayStatusLabel(rawTodayStatus) || patient?.statusLabel || patient?.status || ""
    : "";
  const todayStatusText = todayStatus || "Chưa bắt đầu hôm nay";

  const height = patient?.heightCm || patient?.chieuCaoCm || patient?.ChieuCaoCm;
  const weight = patient?.weightKg || patient?.canNangKg || patient?.CanNangKg;

  let bmiBlock = null;
  if (height && weight) {
    const h = Number(height);
    const w = Number(weight);
    if (h > 0 && w > 0) {
      const m = h / 100;
      const bmi = (w / (m * m)).toFixed(1);
      bmiBlock = (
        <div className="mt-3 pt-3 border-t border-emerald-100">
          <Chip tone="emerald" dot="teal" className="text-xs">BMI: {bmi}</Chip>
        </div>
      );
    }
  }

  const safePatientExtras = patientExtras || [];
  const safeVisits = visits || [];
  const safeTransactions = transactions || [];
  const medicalVisits = safeVisits.filter(isMedicalVisit);
  const cancelledWorkflowEvents = safeVisits
    .filter(isCancelledWorkflowVisit)
    .map(asCancelledActivity);
  const mongoActivityEvents = medicalHistory?.events?.length > 0 ? medicalHistory.events : [];
  const safeActivityEvents =
    mongoActivityEvents.length > 0
      ? [...mongoActivityEvents, ...cancelledWorkflowEvents]
      : cancelledWorkflowEvents;

  return (
    <motion.div {...ANIMATION_CONFIG} className="space-y-3">
      {/* HEADER */}
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
              <div className="font-extrabold text-lg text-slate-900">{name}</div>
              <div className="text-sm text-slate-600">{patientId || "—"}</div>
              <div className="text-xs text-slate-500 mt-1">{dobText} • {gender}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm text-slate-700">{phone}</div>
              <div className="text-sm text-slate-700">{email}</div>
              <div className="text-xs text-slate-500 mt-1">{address}</div>
            </div>
          </div>
          {bmiBlock}
        </motion.div>

        <div className="flex flex-col items-end gap-2">
          <StatusPill s={todayStatusText} />
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

      {/* ===== TAB BAR ===== */}
      <div className="flex gap-1 border-b border-emerald-200/50 pb-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === tab.key
                ? "bg-white text-emerald-700 ring-1 ring-emerald-200 shadow-sm -mb-px"
                : "text-slate-500 hover:text-slate-700 hover:bg-emerald-50/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <AnimatePresence mode="wait">
        {activeTab === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {safePatientExtras.length > 0 && (
              <motion.section whileHover={{ y: -2 }} className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm">
                <div className="text-xs font-semibold text-slate-600 mb-2">Thông tin bổ sung</div>
                <div className="flex flex-wrap gap-1.5">
                  {safePatientExtras.map((ex, i) => (
                    <Chip key={i} tone="slate" className="text-xs">
                      {ex.label || ex.key}: {ex.value}
                    </Chip>
                  ))}
                </div>
              </motion.section>
            )}

            <div className="grid lg:grid-cols-2 gap-4 mt-3">
              {/* Lịch sử khám rút gọn */}
              <motion.section whileHover={{ y: -2 }} className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900">Lịch sử khám</h4>
                  <div className="flex items-center gap-2">
                    <Chip tone="emerald" dot="emerald" className="text-xs">{medicalVisits.length}</Chip>
                    {medicalVisits.length > 0 && (
                      <button onClick={() => switchTabWithHighlight("history")} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition hover:underline">
                        Xem tất cả →
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
                  {medicalVisits.length ? (
                    medicalVisits.slice(0, 5).map((v, i) => {
                      const dateText = v.dateLabel || v.date || v.Date || v.ngay || v.Ngay || "";
                      const deptText = v.dept || v.department || v.Dept || v.khoa || v.Khoa || "";
                      const doctorText = v.doctor || v.Doctor || v.bacSi || v.BacSi || "";
                      const typeText = v.typeLabel || mapVisitTypeLabel(v.type || v.Type) || "—";
                      return (
                        <motion.div key={`${dateText}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-xl p-3 bg-emerald-50/50 ring-1 ring-emerald-100/50 hover:shadow-sm transition">
                          <div className="font-semibold text-sm text-slate-900">{dateText}</div>
                          <div className="text-xs text-slate-600">{deptText}{deptText && doctorText ? " • " : ""}{doctorText}</div>
                          <Chip tone="slate" className="text-xs px-2 py-0.5 mt-1">{typeText}</Chip>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">Chưa có dữ liệu</div>
                  )}
                </div>
              </motion.section>

              {/* Giao dịch rút gọn */}
              <motion.section whileHover={{ y: -2 }} className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900">Giao dịch</h4>
                  <div className="flex items-center gap-2">
                    <Chip tone="cyan" dot="cyan" className="text-xs">{safeTransactions.length}</Chip>
                    {safeTransactions.length > 0 && (
                      <button onClick={() => switchTabWithHighlight("transactions")} className="text-xs text-cyan-600 hover:text-cyan-800 font-medium transition hover:underline">
                        Xem tất cả →
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
                  {safeTransactions.length ? (
                    safeTransactions.slice(0, 5).map((t, i) => {
                      const dateText = t.date || t.Date || t.ngay || t.Ngay || "";
                      const itemText = t.item || t.Item || t.noiDung || t.NoiDung || "";
                      const amountVal = t.amount || t.Amount || t.soTien || t.SoTien || 0;
                      const statusText = formatStatus(
                        t.statusLabel || t.status || t.Status || t.trangThai || t.TrangThai || "",
                        "—"
                      );
                      return (
                        <motion.div key={`${t.ref || t.Ref || i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-xl p-3 bg-cyan-50/50 ring-1 ring-cyan-100/50 hover:shadow-sm transition">
                          <div className="text-sm font-semibold text-slate-900">{dateText}</div>
                          <div className="text-xs text-slate-700">{itemText}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-emerald-700 tabular-nums">
                              {Number(amountVal || 0).toLocaleString("vi-VN")}đ
                            </span>
                            <Chip tone="amber" dot="amber" className="text-xs px-2 py-0.5">{statusText}</Chip>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">Chưa có giao dịch</div>
                  )}
                </div>
              </motion.section>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`rounded-2xl p-4 ring-1 shadow-sm transition-all duration-500 ${
              highlightTab ? "ring-emerald-400 bg-emerald-50/60 shadow-emerald-200/50" : "ring-emerald-200/50 bg-white"
            }`}>
            <PatientTimeline visits={medicalVisits} highlightItems={highlightTab} patientId={patientId} />
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`rounded-2xl p-4 ring-1 shadow-sm transition-all duration-500 ${
              highlightTab ? "ring-amber-400 bg-amber-50/60 shadow-amber-200/50" : "ring-emerald-200/50 bg-white"
            }`}>
            <PatientTimeline visits={safeActivityEvents} highlightItems={highlightTab} patientId={patientId} />
          </motion.div>
        )}

        {activeTab === "transactions" && (
          <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`rounded-2xl p-4 ring-1 shadow-sm transition-all duration-500 ${
              highlightTab ? "ring-cyan-400 bg-cyan-50/60 shadow-cyan-200/50" : "ring-emerald-200/50 bg-white"
            }`}>
            <PatientTransactions transactions={safeTransactions} highlightItems={highlightTab} patientId={patientId} />
          </motion.div>
        )}

        {activeTab === "genealogy" && (
          <motion.div key="genealogy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }} className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm">
            <PatientGenealogy patientId={patientId} allPatients={allPatients || []} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
