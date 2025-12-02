// src/components/auth/AuthShowcasePanel.jsx
// Panel bên phải: tone trầm (dark), cyan + đỏ nhẹ, copy ít chữ, nhiều “visual”.

import React from "react";
import { motion } from "framer-motion";

export default function AuthShowcasePanel() {
  return (
    <section className="hidden md:flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-6 backdrop-blur shadow-[0_18px_48px_rgba(15,23,42,0.8)] text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/90">
            Clinic workspace
          </p>
        
        </div>
        <motion.div
          initial={{ rotate: -8 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-cyan-400/50 grid place-items-center shadow-md">
            <span className="text-xl text-cyan-300">💊</span>
          </div>
          <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-pulse" />
        </motion.div>
      </div>

      {/* 3 step chips */}
      <div className="mt-4 grid grid-cols-1 gap-3 text-[11px]">
        <motion.div
          whileHover={{
            y: -2,
            boxShadow: "0 14px 30px rgba(34,211,238,0.35)",
          }}
          className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-cyan-500/40 px-3 py-2.5 shadow-sm"
        >
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 grid place-items-center text-cyan-300 text-sm">
            1
          </div>
          <div>
            <div className="font-semibold text-slate-50">
              Hàng chờ & tiếp nhận
            </div>
            <div className="text-[11px] text-slate-300">
              Tiếp nhận bệnh nhân, xếp hàng theo phòng trong 1 bảng nhìn.
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{
            y: -2,
            boxShadow: "0 14px 30px rgba(56,189,248,0.35)",
          }}
          className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-sky-500/40 px-3 py-2.5 shadow-sm"
        >
          <div className="w-7 h-7 rounded-xl bg-sky-500/20 grid place-items-center text-sky-300 text-sm">
            2
          </div>
          <div>
            <div className="font-semibold text-slate-50">
              Khám & chỉ định
            </div>
            <div className="text-[11px] text-slate-300">
              Khám lâm sàng, tạo CLS, đơn thuốc và lưu đầy đủ lịch sử.
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{
            y: -2,
            boxShadow: "0 14px 30px rgba(248,113,113,0.35)",
          }}
          className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-rose-500/40 px-3 py-2.5 shadow-sm"
        >
          <div className="w-7 h-7 rounded-xl bg-rose-500/20 grid place-items-center text-rose-300 text-sm">
            3
          </div>
          <div>
            <div className="font-semibold text-slate-50">
              Dược & thanh toán
            </div>
            <div className="text-[11px] text-slate-300">
              Cấp phát thuốc, kho & hóa đơn gắn cùng một bệnh nhân.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Module chips */}
      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-cyan-400/50 px-3 py-1 text-cyan-200 hover:bg-slate-800 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Khám bệnh
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-sky-400/50 px-3 py-1 text-sky-200 hover:bg-slate-800 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Lịch hẹn
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-rose-400/50 px-3 py-1 text-rose-200 hover:bg-slate-800 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Dược & kho thuốc
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-emerald-400/50 px-3 py-1 text-emerald-200 hover:bg-slate-800 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Thông báo nội bộ
        </span>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">
        Đừng quên đăng xuất khi dùng máy chung.
      </p>
    </section>
  );
}
