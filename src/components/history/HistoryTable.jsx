// src/components/history/HistoryTable.jsx
import React from 'react';
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";

export default function HistoryTable({ tab, rows, onEye, stretch = true, highlightId }) {
  const wrapperCls = stretch
    ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none p-4 pt-0 pb-0 mt-2"
    : "overflow-x-auto overflow-y-auto scrollbar-none p-4";

  const Thead = ({ children }) => (
    <thead
      className="
        sticky top-0 z-10
        bg-slate-100 backdrop-blur
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

  const Td = ({ children, first, last, right }) => (
    <td
      className={`px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/60 ${
        first ? "whitespace-nowrap" : ""
      } ${last ? "text-right whitespace-nowrap" : ""} ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );

  const Row = ({ children, i, isHighlighted, dataHighlightId }) => (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02, duration: 0.2 }}
      className={`
        group
        hover:bg-sky-100/50
        focus-within:bg-sky-50/60
        transition
        shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]
        ${isHighlighted ? "flash-emerald-once z-10" : "odd:bg-slate-50/40"}
      `}
      {...(dataHighlightId ? { "data-highlight-id": dataHighlightId } : {})}
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
    if (v === "bao_luu" || v === "reserved") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          Bảo lưu
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
        <span className="w-full inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          Khám lâm sàng
        </span>
      );
    }
    if (v === "can_lam_sang") {
      return (
        <span className="w-full inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
          Cận lâm sàng
        </span>
      );
    }
    if (v === "thuoc") {
      return (
        <span className="w-full inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 ring-1 ring-teal-200">
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

  const renderVisitTypeChip = (row) => {
    const t = (row.type || "").toLowerCase();
    if (t === "service" || t === "dv" || t.includes("service")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          Khám dịch vụ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
        Khám thường
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

  const getVisitCode = (r) =>
    r.visitCode ||
    r.code ||
    r.historyId ||
    r.maLuotKham ||
    r.MaLuotKham ||
    r.maLuot ||
    r.MaLuot ||
    "—";

  const getPatientCode = (r) =>
    r.id ||
    r.ptId ||
    r.maBenhNhan ||
    r.MaBenhNhan ||
    "—";

  return (
    <div className={wrapperCls}>
      {tab === "visits" ? (
        <table className="min-w-full ">
          <Thead>
            <tr>
              <Th first>Ngày</Th>
              <Th>Giờ</Th>
              <Th>Mã lượt khám</Th>
              <Th>Mã BN</Th>
              <Th>Họ và tên</Th>
              <Th>Khoa/Phòng</Th>
              <Th>Loại lượt</Th>
              <Th>Bác sĩ</Th>
              <Th>Ghi chú</Th>
              <Th last>Chi tiết</Th>
            </tr>
          </Thead>
          <tbody>
            {rows.map((r, i) => {
              const visitCode = getVisitCode(r);
              const isHighlight = highlightId && (visitCode === highlightId || r.id === highlightId);
              return (
              <Row
                key={`${visitCode}-${i}`}
                i={i}
                isHighlighted={isHighlight}
                dataHighlightId={visitCode}
              >
                <Td first>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(56,189,248,.25)]" />
                    {formatDate(r.date)}
                  </span>
                </Td>
                <Td>{formatTime(r.date)}</Td>
                <Td>{getVisitCode(r)}</Td>
                <Td>{getPatientCode(r)}</Td>
                <Td>{r.name || r.ptName || "—"}</Td>
                <Td>{r.dept || "—"}</Td>
                <Td>{renderVisitTypeChip(r)}</Td>
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
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có bản ghi phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="min-w-full">
          <Thead>
            <tr>
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
            </tr>
          </Thead>
          <tbody>
            {rows.map((r, i) => {
              const txnCode = r.invoiceId || r.id;
              const isHighlight = highlightId && txnCode === highlightId;
              return (
              <Row
                key={`${txnCode}-${i}`}
                i={i}
                isHighlighted={isHighlight}
                dataHighlightId={txnCode}
              >
                <Td first>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,.25)]" />
                    {formatDate(r.date)}
                  </span>
                </Td>
                <Td>{formatTime(r.date)}</Td>
                <Td>{r.id || r.ptId || "—"}</Td>
                <Td>{r.name || r.ptName || "—"}</Td>
                <Td>{renderKindChip(r.kind || r.type)}</Td>
                <Td>
                  <span className="text-slate-600 max-w-[250px] break-words line-clamp-2">{r.content || "—"}</span>
                </Td>
                <Td right>
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
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-10 text-center text-slate-500"
                >
                 Không có bản ghi phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
