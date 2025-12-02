// src/components/auth/AuthLayout.jsx
// Layout chung: nền gradient, wrapper, grid 2 bên.

import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({ left, right }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-sky-100 to-violet-200 text-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* BG blobs cyan + đỏ siêu nhạt */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-72 h-72 bg-cyan-300/25 blur-3xl rounded-full" />
        <div className="absolute bottom-[-120px] right-[-80px] w-80 h-80 bg-rose-300/20 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_65%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-6 md:gap-8"
      >
        {left}
        {right}
      </motion.main>
    </div>
  );
}
