import React from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/Supports.jsx";

/**
 * Card "Dịch vụ tăng mạnh" — dùng cho vai trò Admin / Y tá HC.
 * Thay thế AppointmentsCard ở ô bên trái Dashboard.
 * Hiển thị horizontal bar chart với 3 tier màu (xanh/vàng/đỏ).
 */
export default function TrendingServicesCard({
  rows = [],
  loading = false,
  error = null,
  maxBodyClass = "max-h-none overflow-y-auto pr-1 scrollbar-none",
}) {
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  // 3 tiers: top 33% = green, mid 33% = amber, bottom 33% = red
  function getTierColor(count) {
    const ratio = count / maxCount;
    if (ratio >= 0.66) return { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" };
    if (ratio >= 0.33) return { bg: "bg-amber-400", light: "bg-amber-50", text: "text-amber-700" };
    return { bg: "bg-rose-400", light: "bg-rose-50", text: "text-rose-700" };
  }

  return (
    <Card
      title="Dịch vụ tăng mạnh hôm nay"
      ariaLabel="Thống kê dịch vụ được thực hiện hôm nay"
      className="h-full"
    >
      {/* Legend */}
      <div className="flex items-center gap-4 px-2 pb-2 text-[12px] text-slate-500 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
          LS (Lâm sàng)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />
          CLS (Cận lâm sàng)
        </span>
        <span className="flex-1" />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Mạnh
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> TB
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Yếu
        </span>
      </div>

      <div className={`flex flex-col gap-2 p-1 ${maxBodyClass}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
            Đang tải…
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p className="text-2xl mb-1">📊</p>
            <p>Chưa có dịch vụ nào hôm nay</p>
          </div>
        ) : (
          rows.map((r, i) => {
            const tier = getTierColor(r.count);
            const widthPct = Math.max(8, (r.count / maxCount) * 100);
            const typeIcon = r.type === "ls" ? "🩺" : "🔬";

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 py-1"
              >
                {/* Service name */}
                <div className="w-[40%] min-w-0 flex items-center gap-2" title={r.name}>
                  <span className="text-[13px] shrink-0">{typeIcon}</span>
                  <span className="truncate text-[13px] font-medium leading-5 text-slate-700">
                    {r.name}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div className={`h-6 rounded-md ${tier.light} overflow-hidden`}>
                    <motion.div
                      className={`h-full rounded-md ${tier.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Count */}
                <span className={`text-[13px] font-bold w-9 text-right ${tier.text}`}>
                  {r.count}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}
