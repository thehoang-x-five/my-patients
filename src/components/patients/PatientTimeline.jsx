// src/components/patients/PatientTimeline.jsx
// Tab Lịch sử khám — Timeline hiển thị các sự kiện y tế
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Chip from "../ui/Chip.jsx";
import { formatStatus } from "../../utils/textFormatters.js";

const EVENT_CONFIG = {
  kham_lam_sang: { label: "Khám lâm sàng", tone: "emerald", dot: "emerald" },
  xet_nghiem: { label: "Xét nghiệm", tone: "cyan", dot: "cyan" },
  can_lam_sang: { label: "Cận lâm sàng", tone: "cyan", dot: "cyan" },
  chan_doan_hinh_anh: { label: "Chẩn đoán hình ảnh", tone: "violet", dot: "violet" },
  don_thuoc: { label: "Đơn thuốc", tone: "teal", dot: "teal" },
  thanh_toan: { label: "Thanh toán", tone: "amber", dot: "amber" },
  workflow: { label: "Hoạt động", tone: "amber", dot: "amber" },
};

const STATUS_LABEL = {
  hoan_tat: "Hoàn tất",
  dang_thuc_hien: "Đang thực hiện",
  da_huy: "Đã hủy",
};

const DOT_CLASS = {
  emerald: "bg-emerald-500",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
};

export default function PatientTimeline({ visits = [], highlightItems = false, patientId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const nav = useNavigate();

  const events = useMemo(() => {
    return visits.map((v, i) => {
      const typeRaw =
        v.type ||
        v.Type ||
        v.eventType ||
        v.EventType ||
        v._raw?.LoaiLuot ||
        v._raw?.loaiLuot ||
        v._raw?.eventType ||
        v._raw?.EventType ||
        "kham_lam_sang";
      const eventType = typeRaw.includes("service") || typeRaw.includes("can_lam_sang") ? "xet_nghiem" : typeRaw;
      const config = EVENT_CONFIG[eventType] || EVENT_CONFIG.kham_lam_sang;
      return {
        id: v.id || v.Id || v.maLuotKham || v.maPhieuKham || v.ref || `event-${i}`,
        date:
          v.date ||
          v.dateLabel ||
          v.time ||
          v.timestamp ||
          v.createdAt ||
          v._raw?.ThoiGianBatDau ||
          v._raw?.thoiGianBatDau ||
          v._raw?.createdAt,
        eventType,
        config,
        typeLabel: v.typeLabel || config.label,
        doctor: v.doctor || v.by || v.actorName || "—",
        department: v.dept || v.department || "—",
        room: v._raw?.TenPhong || v._raw?.tenPhong || "",
        status: v.status || v._raw?.TrangThai || v._raw?.trangThai || "",
        diagnosis: v._raw?.ChanDoanCuoi || v._raw?.chanDoanCuoi || "",
        note: v.note || v.message || v.description || v._raw?.GhiChu || "",
        ref: v.ref || v.maPhieuKham || "",
        vitalSigns: v._raw?.SinhHieuTruocKham || v._raw?.sinhHieuTruocKham || "",
        _raw: v._raw || v,
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [visits]);

  const filtered = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((e) => e.eventType === filterType);
  }, [events, filterType]);

  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Chưa có lịch sử sự kiện y tế.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-800">
          Tổng: {events.length} sự kiện y tế
        </div>
        <div className="text-xs text-slate-400">
          {events.length > 0 && `Gần nhất: ${formatDate(events[0]?.date)}`}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <FilterBtn
          active={filterType === "all"}
          onClick={() => setFilterType("all")}
          label={`Tất cả (${events.length})`}
        />
        {Object.entries(EVENT_CONFIG).map(([key, cfg]) => {
          const count = events.filter((e) => e.eventType === key).length;
          if (count === 0) return null;
          return (
            <FilterBtn
              key={key}
              active={filterType === key}
              onClick={() => setFilterType(key)}
              label={`${cfg.label} (${count})`}
            />
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300 via-slate-300 to-transparent" />

        <div className="space-y-3">
          {filtered.map((event, idx) => {
            const statusLabel =
              STATUS_LABEL[event.status] || formatStatus(event.status, "");
            const isHighlighted = highlightItems && idx < 3;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative"
              >
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-4 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    DOT_CLASS[event.config.tone] || "bg-slate-400"
                  } ${isHighlighted ? "animate-pulse" : ""}`}
                />

                {/* Card */}
                <motion.div
                  whileHover={{ y: -1 }}
                  onClick={() =>
                    nav(
                      `/history?tab=${
                        event.eventType === "thanh_toan" ? "transactions" : "visits"
                      }&pid=${patientId || ""}&highlight=${event.id}`
                    )
                  }
                  className={`rounded-2xl p-4 ring-1 shadow-sm cursor-pointer transition-all duration-300 ${
                    isHighlighted
                      ? "ring-emerald-400 bg-emerald-50/80 shadow-emerald-100"
                      : "ring-slate-200/60 bg-white hover:bg-emerald-50/60 hover:ring-emerald-300 hover:shadow-md"
                  }`}
                  role="link"
                  title="Bấm để xem chi tiết lịch sử này"
                >
                  {/* Row 1: Type + Doctor + Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Chip tone={event.config.tone} dot={event.config.dot} className="text-xs shrink-0">
                        {event.typeLabel}
                      </Chip>
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {event.doctor}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(event.date)}</span>
                  </div>

                  {/* Row 2: Department + Status (always visible) */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {event.department && event.department !== "—" && (
                      <span className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Khoa:</span> {event.department}
                      </span>
                    )}
                    {event.room && (
                      <span className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Phòng:</span> {event.room}
                      </span>
                    )}
                    {statusLabel && (
                      <Chip
                        tone={event.status === "hoan_tat" ? "emerald" : event.status === "da_huy" ? "rose" : "amber"}
                        className="text-xs px-2 py-0.5"
                      >
                        {statusLabel}
                      </Chip>
                    )}
                  </div>

                  {/* Row 3: Diagnosis (always visible if exists) */}
                  {event.diagnosis && (
                    <div className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Chẩn đoán:</span>{" "}
                      {event.diagnosis}
                    </div>
                  )}

                  {/* Row 4: Note preview (always visible if exists) */}
                  {event.note && (
                    <div className="mt-1.5 text-xs text-slate-500 italic truncate">
                      {event.note}
                    </div>
                  )}

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedId === event.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          <DetailRow label="Mã lượt khám" value={event.id} />
                          <DetailRow label="Mã phiếu" value={event.ref} />
                          {event.vitalSigns && <DetailRow label="Sinh hiệu" value={formatVitalSigns(event.vitalSigns)} />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Không có sự kiện nào phù hợp bộ lọc.
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 min-w-[100px] font-medium">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

function formatVitalSigns(raw) {
  if (!raw) return "";
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const parts = [];
    if (obj.nhiet_do) parts.push(`Nhiệt độ: ${obj.nhiet_do}°C`);
    if (obj.huyet_ap) parts.push(`HA: ${obj.huyet_ap}`);
    if (obj.mach) parts.push(`Mạch: ${obj.mach}`);
    if (obj.nhip_tho) parts.push(`Nhịp thở: ${obj.nhip_tho}`);
    return parts.join(" • ") || String(raw);
  } catch {
    return String(raw);
  }
}
