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
      {children}
    </thead>
  );

  const Th = ({ children, first, last }) => (
    <th
      className={`px-3 py-2 whitespace-nowrap ${
        first ? "rounded-tl-xl" : ""
      } ${last ? "rounded-tr-xl text-right" : ""}`}
    >
      {children}
    </th>
  );

  const Td = ({ children, first, last, left }) => (
    <td
      className={`px-3 py-2 align-top text-[13px] text-slate-700 ${
        first ? "whitespace-nowrap" : ""
      } ${last ? "text-right whitespace-nowrap" : ""} ${
        left ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );

  const Row = ({ children, i }) => (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.01 }}
      className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
    >
      {children}
    </motion.tr>
  );

  const renderStatusChip = (status) => {
    const v = (status || "").toLowerCase();
    if (v === "da_thu" || v === "done") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          Đã thu
        </span>
      );
    }
    if (v === "da_huy" || v === "cancelled") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
          Đã hủy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">
        Không rõ
      </span>
    );
  };

  const renderKindChip = (kind) => {
    const v = (kind || "").toLowerCase();
    if (v === "kham_lam_sang") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          Khám lâm sàng
        </span>
      );
    }
    if (v === "can_lam_sang") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
          Cận lâm sàng
        </span>
      );
    }
    if (v === "thuoc") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          Thuốc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">
        Khác
      </span>
    );
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN");
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={wrapperCls}>
      {tab === "visits" ? (
        <table className="min-w-full">
          <Thead>
            <Th first>Ngày</Th>
            <Th>Mã BN</Th>
            <Th>Họ và tên</Th>
            <Th>Khoa/Phòng</Th>
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
                    {formatDate(r.date)}
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
            <Th>Giờ</Th>
            <Th>Mã BN</Th>
            <Th>Họ và tên</Th>
            <Th>Loại</Th>
            <Th>Nội dung</Th>
            <Th>Số tiền</Th>
            <Th>Trạng thái</Th>
            <Th>Mã HĐ</Th>
            <Th last>Chi tiết</Th>
          </Thead>
          <tbody>
            {rows.map((r, i) => (
              <Row key={`${r.invoiceId || r.id}-${i}`} i={i}>
                <Td first>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                    {formatDate(r.date)}
                  </span>
                </Td>
                <Td>{formatTime(r.date)}</Td>
                <Td>{r.id}</Td>
                <Td>{r.name}</Td>
                <Td>{renderKindChip(r.kind || r.type)}</Td>
                <Td>
                  <span className="text-slate-600">{r.content}</span>
                </Td>
                <Td left>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    {Number(r.amount ?? r.money ?? 0).toLocaleString("vi-VN")}đ
                  </span>
                </Td>
                <Td>{renderStatusChip(r.status)}</Td>
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
                  colSpan="10"
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
