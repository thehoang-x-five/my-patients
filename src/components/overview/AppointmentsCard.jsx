import React from 'react';
import { motion } from "framer-motion";
import { Card, Badge, Empty } from "../ui/Supports.jsx";

export default function AppointmentsCard({
  rows = [],
  loading = false,
  error = null,
  maxBodyClass = "max-h-[340px] overflow-y-auto pr-1 scrollbar-none",
}) {
  return (
    <Card
      title="Lịch hẹn sắp tới (hôm nay)"
     
      ariaLabel="Lịch hẹn sắp tới"
      className="h-full"
    >
      {loading && <div className="skel h-36" />}
      {error && <div className="text-rose-600">{error}</div>}
      {!loading && !rows.length && (
        <Empty
          title="Chưa có lịch hẹn"
          subtitle="Bạn có thể tạo lịch hẹn mới"
        />
      )}

      <div className={`flex flex-col gap-2 p-1 ${maxBodyClass}`}>
        {rows.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="relative flex items-center justify-between p-2  rounded-xl
                       bg-white ring-1 ring-slate-200/80 hover:bg-emerald-50/50 transition
                       before:absolute before:inset-y-1.5 before:left-1.5 before:w-1.5 before:rounded
                       before:bg-sky-400"
          >
            <div className="flex items-center gap-2 px-2 min-w-0 ">
              
              <div className="truncate pl-2">
                <b className="truncate">{r.patient}</b> ·{" "}
                <span className="text-slate-500">{r.service}</span>
              </div>
              <Badge tone={r.statusTone || "info"}>{r.status}</Badge>
            </div>
            <time className="text-sm text-slate-600 whitespace-nowrap">
              {r.at}
            </time>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
