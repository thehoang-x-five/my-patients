// src/components/pharmacy/OrdersTable.jsx
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React from 'react';

export default function OrdersTable({ items = [], onView, stretch = true }) {
  const Thead = ({ children }) => (
    <thead
      className="
        sticky top-0 z-9
        bg-slate-100/75 backdrop-blur
        text-left text-[13px] font-semibold text-slate-600
        shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]
      "
    >
      <tr>{children}</tr>
    </thead>
  );

  const Th = ({ children, first, last, alignRight }) => (
    <th
      className={[
        "px-3 py-3 whitespace-nowrap",
        "bg-gradient-to-b from-violet-50 to-sky-50/30",
        "ring-1 ring-slate-200/70",
        first ? "rounded-l-xl" : "",
        last ? "rounded-r-xl" : "",
        alignRight ? "text-right" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );

  const Row = ({ i, children }) => (
    <motion.tr
      key={i}
      exit={{ opacity: 0, y: -6 }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      whileHover={{ y: -2 }}
      className="
        group
        odd:bg-slate-50/40
        hover:bg-violet-100/50
        focus-within:bg-violet-50/60
        transition
        shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]
      "
    >
      {children}
    </motion.tr>
  );

  const Td = ({ children, first, last, right }) => (
    <td
      className={[
        "px-3 py-2 align-top text-[13px] text-slate-700",
        "group-hover:bg-white/70",
        first ? "pl-3 rounded-l-lg" : "",
        last ? "pr-3 rounded-r-lg" : "",
        right ? "text-right tabular-nums" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );

  return (
    <div
      className={`${
        stretch ? "flex-1 min-h-0" : ""
      } overflow-x-auto overflow-y-auto scrollbar-none`}
      role="region"
      aria-label="Đơn thuốc"
    >
      <table className="min-w-full">
        <Thead>
          <Th first>Ngày</Th>
          <Th>Mã đơn</Th>
          <Th>Mã BN</Th>
          <Th>Tên BN</Th>
          <Th>Bác sĩ</Th>
          <Th>Chẩn đoán</Th>
          <Th alignRight>Tiền thuốc</Th>
          <Th>Trạng thái</Th>
          <Th last className="w-16">
            Xem
          </Th>
        </Thead>
        <tbody>
          <AnimatePresence initial={false}>
            {items.map((o, i) => {
              const isDone = o.status === "done";
              return (
                <Row key={o.id} i={i}>
                  <Td first>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                      {new Date(o.at).toLocaleString("vi-VN")}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono font-semibold">{o.id}</span>
                  </Td>
                  <Td className="font-mono">{o.ptId}</Td>
                  <Td>{o.ptName}</Td>
                  <Td>{o.doctor || "—"}</Td>
                  <Td className="text-slate-600">{o.diag || "—"}</Td>
                  <Td right>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-violet-200 bg-violet-50 text-violet-700 font-semibold">
                      {Number(o.total || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 text-xs font-bold ${
                        isDone
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                      title={isDone ? "Đã phát" : "Chờ phát"}
                    >
                      {isDone ? "● Đã phát" : "● Chờ phát"}
                    </span>
                  </Td>
                  <Td last>
                    <Button
                      className="!px-2 hover:-translate-y-px transition"
                      aria-label="Xem đơn"
                      title="Xem đơn"
                      onClick={() => onView?.(o)}
                    >
                      👁
                    </Button>
                  </Td>
                </Row>
              );
            })}
            {!items.length && (
              <tr>
                <td
                  colSpan="9"
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có đơn phù hợp.
                </td>
              </tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
