import React from 'react';
import Button from "../ui/Button.jsx";
import { motion } from "framer-motion";

export default function HistoryTable({ tab, rows, onEye, stretch = true }) {
  const wrapperCls = stretch
    ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none"
    : "overflow-x-auto overflow-y-auto scrollbar-none";

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

  const Th = ({ children, first, last }) => (
    <th
      className={[
        "px-3 py-3 whitespace-nowrap",
        "bg-gradient-to-b from-slate-50 to-sky-100/30",
        "ring-1 ring-slate-200/70 ",
        first ? "rounded-l-xl" : "",
        last ? "rounded-r-xl" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );

  const Row = ({ i, children }) => (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      whileHover={{ y: -2 }}
      className="
        group
        odd:bg-slate-50/40
        hover:bg-sky-100/50
        focus-within:bg-sky-50/60
        transition
        shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]
      "
    >
      {children}
    </motion.tr>
  );

  const Td = ({ children, first, last, left }) => (
    <td
      className={[
        "px-3 py-2 align-top text-[13px] text-slate-700",
        "group-hover:bg-white/60",
        first ? "pl-3 rounded-l-lg" : "",
        last ? "pr-3 rounded-r-lg" : "",
        left ? "text-left tabular-nums" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );

  return (
    <div className={wrapperCls} role="region" aria-label="Bảng lịch sử">
      {tab === "visits" ? (
        <table className="min-w-full">
          <Thead>
            <Th first>Ngày</Th>
            <Th>Mã BN</Th>
            <Th>Họ và tên</Th>
            <Th>Khoa</Th>
            <Th>Bác sĩ</Th>
            <Th>Ghi chú</Th>
            <Th last>Chi tiết</Th>
          </Thead>
          <tbody>
            {rows.map((r, i) => (
              <Row key={`${r.id}-${i}`} i={i}>
                <Td first>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(56,189,248,.25)]" />
                    {r.date}
                  </span>
                </Td>
                <Td>{r.id}</Td>
                <Td>{r.name}</Td>
                <Td>{r.dept}</Td>
                <Td>{r.doctor || "—"}</Td>
                <Td>
                  <span className="text-slate-600">{r.note || "—"}</span>
                </Td>
                <Td last>
                  <Button
                    className="!px-2 hover:-translate-y-px transition"
                    aria-label="Chi tiết"
                    onClick={() => onEye(r, "visit")}
                    title="Xem chi tiết"
                  >
                    👁
                  </Button>
                </Td>
              </Row>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan="7"
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="min-w-full">
          <Thead>
            <Th first>Ngày</Th>
            <Th>Mã BN</Th>
            <Th>Họ và tên</Th>
            <Th>Nội dung</Th>
            <Th> Số tiền</Th>
            <Th>Mã HĐ</Th>
            <Th last>Chi tiết</Th>
          </Thead>
          <tbody>
            {rows.map((r, i) => (
              <Row key={`${r.invoiceId || r.id}-${i}`} i={i}>
                <Td first>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                    {r.date}
                  </span>
                </Td>
                <Td>{r.id}</Td>
                <Td>{r.name}</Td>
                <Td>
                  <span className="text-slate-600">{r.content}</span>
                </Td>
                <Td left>
                  <span className="inline-flex items-center  rounded-full px-2 py-0.5 ring-1 ring-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                    {Number(r.money || 0).toLocaleString("vi-VN")}đ
                  </span>
                </Td>
                <Td>{r.invoiceId || "—"}</Td>
                <Td last>
                  <Button
                    className="!px-2 hover:-translate-y-px transition"
                    aria-label="Chi tiết"
                    onClick={() => onEye(r, "txn")}
                    title="Xem chi tiết"
                  >
                    👁
                  </Button>
                </Td>
              </Row>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan="7"
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
