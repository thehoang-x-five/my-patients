import React from 'react';
import { motion } from "framer-motion";
import { Card, Stagger, StaggerItem } from "../ui/Supports.jsx";

export default function ActivityCard({ items = [] ,maxBodyClass = "max-h-[340px] overflow-y-auto pr-1 scrollbar-none",}) {
  // nhận sẵn 5 mục từ Overview; nếu không, tự cắt 5 mục
  const rows = items.slice(0, 5);

  return (
    <Card title="Hoạt động gần đây" tone="emerald" className="h-full">
    <div className={`flex flex-col gap-2 p-1 ${maxBodyClass}`}>
    {rows.map((it, i) => (
          
            <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[12px_1fr_auto] items-center gap-3 rounded-xl p-2 py-3.5
                         ring-1 ring-slate-200/70 hover:ring-emerald-200
                         hover:bg-emerald-50/60 transition"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 shadow-[0_0_0_3px_rgba(56,189,248,.18)]" />
              <div className="min-w-0">
                <div className="font-medium truncate">{it.content}</div>
              </div>
              <time className="text-slate-500 text-sm whitespace-nowrap">
                {it.at}
              </time>
            </motion.div>
        
        ))}
     </div>
    </Card>
  );
}
