import { motion } from "framer-motion";
import React from 'react';
const VND = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function ReportsTable({ rows = [], stretch = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white ring-1 ring-slate-200/80 ${
        stretch ? "h-full flex flex-col min-h-0" : ""
      }`}
      role="region"
      aria-label="Bảng số liệu báo cáo"
    >
      <header className="px-3 py-2 border-b border-slate-200/80 shrink-0">
        <b>Bảng số liệu</b>
      </header>

      <div
        className={`${
          stretch ? "flex-1 min-h-0" : ""
        } overflow-x-auto overflow-y-auto scrollbar-none`}
      >
        <table className="min-w-full text-sm ">
          <thead className="text-left text-slate-500 sticky top-0 bg-white">
            <tr>
              <th className="px-3 py-2">Ngày</th>
              <th className="px-3 py-2 text-right">Doanh thu (đ)</th>
              <th className="px-3 py-2 text-right">Bệnh nhân mới</th>
              <th className="px-3 py-2 text-right">Tái khám</th>
              <th className="px-3 py-2 text-right">Tỷ lệ huỷ (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={r.date}
                className="odd:bg-slate-50/40 hover:bg-slate-100 transition"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01 }}
              >
                <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {VND(r.revenue)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.orders}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.revisits}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.cancelRate}
                </td>
              </motion.tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan="5"
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Chưa có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
