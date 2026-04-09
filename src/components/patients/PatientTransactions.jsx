// src/components/patients/PatientTransactions.jsx
// Tab Lịch sử giao dịch — Hiển thị hóa đơn tài chính bệnh nhân
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Chip from "../ui/Chip.jsx";
import {
  formatDisplayText,
  formatPaymentMethodLabel,
  formatStatus,
} from "../../utils/textFormatters.js";

const STATUS_TONES = {
  da_thu: { tone: "emerald", dot: "emerald", label: "Đã thu" },
  chua_thu: { tone: "amber", dot: "amber", label: "Chưa thu" },
  da_huy: { tone: "rose", dot: "rose", label: "Đã hủy" },
};

const PAYMENT_LABEL = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
  the: "Thẻ",
  vietqr: "VietQR",
};

export default function PatientTransactions({ transactions = [], highlightItems = false, patientId }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const nav = useNavigate();

  const sorted = useMemo(() => {
    const items = [...transactions].map((t, i) => ({
      id: t.maHoaDon || t.ref || `txn-${i}`,
      date: t.date || t.dateLabel || t._raw?.ThoiGian || t._raw?.thoiGian,
      type: t.loaiDotThu || t._raw?.LoaiDotthu || "kham_lam_sang",
      amount: t.amount || t._raw?.SoTien || 0,
      amountDue: t._raw?.SoTienPhaiTra || t._raw?.soTienPhaiTra || 0,
      method: t.phuongThucThanhToan || t._raw?.PhuongThucThanhToan || "tien_mat",
      status: t.status || t._raw?.TrangThai || "da_thu",
      content: t.item || t._raw?.NoiDung || "",
      collector: t.by || t._raw?.TenThuNgan || "—",
    }));

    return items.sort((a, b) => {
      if (sortKey === "date") {
        const da = new Date(a.date), db = new Date(b.date);
        return sortDir === "desc" ? db - da : da - db;
      }
      return sortDir === "desc" ? b.amount - a.amount : a.amount - b.amount;
    });
  }, [transactions, sortKey, sortDir]);

  const total = useMemo(
    () => sorted.filter((t) => t.status === "da_thu").reduce((s, t) => s + Number(t.amount), 0),
    [sorted]
  );

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Chưa có lịch sử giao dịch.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-2xl p-3 bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm">
        <div className="text-sm text-slate-600">
          Tổng số giao dịch: <span className="font-bold text-slate-800">{sorted.length}</span>
        </div>
        <div className="text-sm text-slate-600">
          Tổng đã thu:{" "}
          <span className="font-bold text-emerald-700">{total.toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none rounded-2xl ring-1 ring-slate-200/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Mã HĐ</th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none"
                onClick={() => toggleSort("date")}
              >
                Thời gian {sortKey === "date" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Loại</th>
              <th
                className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none"
                onClick={() => toggleSort("amount")}
              >
                Số tiền {sortKey === "amount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Phương thức</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Trạng thái</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Nội dung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t, i) => {
              const badge = STATUS_TONES[t.status] || STATUS_TONES.da_thu;
              const statusLabel = badge.label || formatStatus(t.status, "—");
              const isHighlighted = highlightItems && i < 3;
              return (
                <motion.tr
                  key={t.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => nav(`/history?tab=transactions&pid=${patientId || ""}&highlight=${t.id}`)}
                  className={`transition-all duration-300 cursor-pointer ${
                    isHighlighted
                      ? "bg-cyan-50/80 ring-1 ring-cyan-200 animate-pulse"
                      : "hover:bg-emerald-50/60 hover:shadow-sm"
                  }`}
                  role="link"
                  title="Xem giao dịch này bên lịch sử"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{t.id}</td>
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-4 py-2.5">
                    <Chip tone="slate" className="text-xs">
                      {t.type === "kham_lam_sang"
                        ? "Khám LS"
                        : t.type === "can_lam_sang"
                          ? "CLS"
                          : t.type === "thuoc"
                            ? "Thuốc"
                            : formatDisplayText(t.type, t.type || "—")}
                    </Chip>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {Number(t.amount).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                    {PAYMENT_LABEL[t.method] ||
                      formatPaymentMethodLabel(t.method, "—")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Chip tone={badge.tone} dot={badge.dot} className="text-xs">
                      {statusLabel}
                    </Chip>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">
                    {t.content || "—"}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
