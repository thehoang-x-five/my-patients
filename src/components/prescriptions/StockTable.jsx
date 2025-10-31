// src/components/pharmacy/StockTable.jsx
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React from 'react';
const daysLeft = (exp) => Math.ceil((new Date(exp) - new Date()) / 86400000);

export default function StockTable({
  items = [],
  onEdit,
  onRemove,
  nearExpiryDays = 30,
  stretch = true,
}) {
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

  const Th = ({ children, first, last, alignRight, center }) => (
    <th
      className={[
        "px-3 py-3 whitespace-nowrap",
        "bg-gradient-to-b from-violet-50 to-sky-50/30",
        "ring-1 ring-slate-200/70",
        first ? "rounded-l-xl" : "",
        last ? "rounded-r-xl" : "",
        alignRight ? "text-right" : "",
        center ? "text-center" : "",
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
        focus-within:bg-emerald-50/60
        transition
        shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]
      "
    >
      {children}
    </motion.tr>
  );

  const Td = ({ children, first, last, right, center }) => (
    <td
      className={[
        "px-3 py-2 align-top text-[13px] text-slate-700",
        "group-hover:bg-white/70",
        first ? "pl-3 rounded-l-lg" : "",
        last ? "pr-3 rounded-r-lg" : "",
        right ? "text-right tabular-nums" : "",
        center ? "text-center" : "",
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
      aria-label="Tồn kho"
    >
      <table className="min-w-full">
        <Thead>
          <Th first>Mã</Th>
          <Th>Tên thuốc</Th>
          <Th center>Đơn vị</Th>
          <Th alignRight>Giá (đ)</Th>
          <Th>Công dụng</Th>
          <Th alignRight>Số lượng</Th>
          <Th>Hạn dùng</Th>
          <Th>Trạng thái</Th>
          <Th last>Thao tác</Th>
        </Thead>
        <tbody>
          <AnimatePresence initial={false}>
            {items.map((r, i) => {
              const d = r.exp ? daysLeft(r.exp) : null;
              const status =
                d == null
                  ? "—"
                  : d <= 0
                  ? "Hết hạn"
                  : d <= 7
                  ? "Cảnh báo"
                  : d <= nearExpiryDays
                  ? "Gần hết hạn"
                  : "OK";
              const badge =
                status === "OK"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : status === "Hết hạn"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : status === "Gần hết hạn"
                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                  : "bg-slate-50 text-slate-700 ring-slate-200";

              return (
                <Row key={r.code} i={i}>
                  <Td first>
                    <span className="font-mono font-semibold">{r.code}</span>
                  </Td>
                  <Td>
                    <div className="font-semibold">{r.name}</div>
                    {r.lot && (
                      <div className="text-xs text-slate-500">Lô: {r.lot}</div>
                    )}
                  </Td>
                  <Td center>{r.unit}</Td>
                  <Td right>{Number(r.price || 0).toLocaleString("vi-VN")}</Td>
                  <Td className="text-slate-600">{r.usage}</Td>
                  <Td right>{r.qty ?? "—"}</Td>
                  <Td className="whitespace-nowrap">
                    {r.exp ? new Date(r.exp).toLocaleDateString("vi-VN") : "—"}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 text-xs font-bold ${badge}`}
                      title={
                        d == null
                          ? "Không rõ hạn dùng"
                          : d <= 0
                          ? "Đã hết hạn"
                          : `Còn ${d} ngày`
                      }
                    >
                      {status}
                      {d > 0 ? ` • ${d}` : ""}
                    </span>
                  </Td>
                  <Td last>
                    <div className="flex items-center gap-2">
                      <Button
                        className="hover:-translate-y-px transition"
                        onClick={() => onEdit?.(r)}
                        title="Sửa"
                      >
                        Sửa
                      </Button>
                      <Button
                        className="!px-2 hover:-translate-y-px transition"
                        aria-label="Xóa"
                        title="Xóa"
                        onClick={() => onRemove?.(r.code)}
                      >
                        ✕
                      </Button>
                    </div>
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
                  Không có thuốc phù hợp.
                </td>
              </tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
