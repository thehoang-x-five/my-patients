import React from "react";
import { motion } from "framer-motion";
import { Card, Badge } from "../ui/Supports.jsx";

/**
 * Card "Dịch vụ sắp thực hiện" — dùng cho vai trò CLS / KTV.
 * Thay thế AppointmentsCard ở ô bên trái Dashboard.
 */
export default function UpcomingServicesCard({
  rows = [],
  loading = false,
  error = null,
  maxBodyClass = "max-h-none overflow-y-auto pr-1 scrollbar-none",
}) {
  const statusMap = {
    da_lap: { label: "Chờ thực hiện", tone: "info" },
    dang_thuc_hien: { label: "Đang làm", tone: "warning" },
    da_hoan_tat: { label: "Hoàn tất", tone: "ok" },
    da_huy: { label: "Đã hủy", tone: "danger" },
  };

  return (
    <Card
      title="Dịch vụ sắp thực hiện"
      ariaLabel="Dịch vụ CLS sắp thực hiện hôm nay"
      className="h-full"
    >
      <div className={`flex flex-col gap-2 p-1 ${maxBodyClass}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
            Đang tải…
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p className="text-2xl mb-1">🔬</p>
            <p>Chưa có dịch vụ nào sắp tới</p>
          </div>
        ) : (
          rows.map((r, i) => {
            const st = statusMap[r.status] || statusMap.da_lap;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative flex items-center justify-between p-2 rounded-xl
                           bg-white ring-1 ring-slate-200/80 hover:bg-emerald-50/50 transition
                           before:absolute before:inset-y-1.5 before:left-1.5 before:w-1.5 before:rounded
                           before:bg-emerald-400"
              >
                <div className="flex items-center gap-2 px-2 min-w-0 flex-1">
                  <div className="truncate pl-2">
                    <b className="truncate">{r.service}</b> ·{" "}
                    <span className="text-slate-500">{r.patient}</span>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <time className="text-sm text-slate-600 whitespace-nowrap">
                    {r.at}
                  </time>
                  {r.hasResult && (
                    <button
                      className="text-[12px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 
                                 hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap"
                      title="Xem kết quả"
                    >
                      📄 Kết quả
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}
