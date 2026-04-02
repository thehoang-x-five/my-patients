// src/components/prescriptions/OrdersTable.jsx
import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { useCancelPrescription } from "../../api/pharmacy.js";
import { toast } from "sonner";

function StatusBadge({ s }) {
    const raw = (s || "").toLowerCase().trim();
  
    let type = "other";
    let label = s || "—";
  
    if (raw == "da_ke" || /đã kê|da ke/.test(raw)) {
      type = "created";
      label = "Đã kê";
    } else if (
      raw == "cho_phat" ||
      /chờ phát|cho phat|pending|đang chờ/.test(raw)
    ) {
      type = "pending";
      label = "Chờ phát";
    } else if (
      raw == "da_phat" ||
      /đã phát|da phat|done/.test(raw)
    ) {
      type = "done";
      label = "Đã phát";
    } else if (raw == "huy" || /hủy|huy/.test(raw)) {
      type = "cancelled";
      label = "Đã huỷ";
    }
  
    let cls = "bg-slate-50 text-slate-700 ring-slate-200";
    let dot = "bg-slate-400";
  
    if (type === "done") {
      cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
      dot = "bg-emerald-500";
    } else if (type === "pending") {
      cls = "bg-amber-50 text-amber-700 ring-amber-200";
      dot = "bg-amber-500";
    } else if (type === "created") {
      cls = "bg-sky-50 text-sky-700 ring-sky-200";
      dot = "bg-sky-500";
    } else if (type === "cancelled") {
      cls = "bg-rose-50 text-rose-700 ring-rose-200";
      dot = "bg-rose-500";
    }
  
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  }
const Thead = ({ children }) => (
  <thead className="text-left text-[13px] font-semibold text-slate-600 shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]">
    <tr>{children}</tr>
  </thead>
);

const Th = ({ children, first, last, right }) => (
  <th
    className={[
      "sticky top-0 z-10 px-3 py-3 whitespace-nowrap",
      "bg-white/80 backdrop-blur",
      "bg-gradient-to-b from-indigo-50 to-slate-50/40",
      "ring-1 ring-slate-200/70",
      first ? "rounded-l-xl" : "",
      last ? "rounded-r-xl" : "",
      right ? "text-right" : "",
    ].join(" ")}
  >
    {children}
  </th>
);

const Row = ({ i, children, ...rest }) => (
  <motion.tr
    {...rest}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.015 }}
    whileHover={{ y: -2 }}
    className="group odd:bg-slate-50/40 hover:bg-indigo-100/50 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]"
  >
    {children}
  </motion.tr>
);

const Td = ({ children, first, last, right, classNameOverride = "" }) => (
  <td
    className={[
      "px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/70",
      first ? "pl-3 rounded-l-lg" : "",
      last ? "pr-3 rounded-r-lg" : "",
      right ? "text-right tabular-nums" : "",
      classNameOverride,
    ].join(" ")}
  >
    {children}
  </td>
);

export default function OrdersTable({
  items = [],
  onView,
  loading = false,
}) {
  const cancelMut = useCancelPrescription({
    onSuccess: () => toast.success("Đã hủy đơn thuốc"),
    onError: (err) => toast.error(err.message || "Hủy thất bại"),
  });

  return (
    <section
      className="pt-2 bg-white rounded-2xl overflow-hidden shadow-soft h-full flex flex-col min-h-0"
      aria-label="Danh sách đơn thuốc"
    >
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none px-4 pb-0 pt-0">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col style={{ width: "15%" }} /> 
            <col style={{ width: "15%" }} /> 
            <col style={{ width: "13%" }} /> 
            <col style={{ width: "17%" }} />
            <col style={{ width: "10%" }} /> 
            <col style={{ width: "13%" }} /> 
            <col style={{ width: "10%" }} />
            <col style={{ width: "7%" }} /> 
          </colgroup>

          <Thead>
            <Th first>Mã đơn</Th>
            <Th>Bệnh nhân</Th>
            <Th>Bác sĩ kê</Th>
            <Th>Chẩn đoán</Th>
            <Th>Tổng tiền</Th>
            <Th>Thời gian</Th>
            <Th>Trạng thái</Th>
            <Th last right>Thao tác</Th>
          </Thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-slate-500"
                >
                 Không có bản ghi phù hợp.
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-slate-500"
                >
                 Không có bản ghi phù hợp.
                </td>
              </tr>
            ) : (
              items.map((o, i) => {
                const rawAt = o.at || o.createdAt || o.time;
                let displayAt = "—";
                if (rawAt) {
                  const d = new Date(rawAt);
                  if (!Number.isNaN(d.getTime())) {
                    const timeStr = d.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
                    const dateStr = d.toLocaleDateString("vi-VN");
                    displayAt = `${timeStr} ${dateStr}`;
                  } else {
                    displayAt = String(rawAt);
                  }
                }

                const total =
                  Number(o.total || o.tongTienDon || 0) || 0;
                const status =
                  o.statusLabel || o.status || o.trangThai || "";

                return (
                  <Row key={o.id || o.code || i} i={i}>
                    {/* Mã đơn + dot */}
                    <Td
                      first
                      classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis font-mono font-semibold"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                        {o.id || o.code || "—"}
                      </span>
                    </Td>

                    {/* Bệnh nhân */}
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="font-semibold truncate">
                        {o.ptName || o.patientName || "—"}
                      </div>
                      <div className="text-[12px] text-slate-500 truncate">
                        {o.ptId || o.patientId || "—"}
                      </div>
                    </Td>

                    {/* Bác sĩ */}
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate">
                        {o.doctor || o.doctorName || "—"}
                      </div>
                    </Td>

                    {/* Chẩn đoán */}
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate">
                        {o.diag || o.chuanDoan || "—"}
                      </div>
                    </Td>

                    {/* Tổng tiền */}
                    <Td classNameOverride="whitespace-nowrap">
                      {total ? (
                        <span className="font-semibold">
                          {total.toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>

                    {/* Thời gian */}
                    <Td classNameOverride="whitespace-nowrap text-[12px] text-slate-600">
                      {displayAt}
                    </Td>

                    {/* Trạng thái */}
                    <Td classNameOverride="whitespace-nowrap">
                      <StatusBadge s={status} />
                    </Td>

                    {/* Thao tác */}
                    <Td last right classNameOverride="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {status === "cho_phat" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Hủy đơn thuốc này?")) {
                                cancelMut.mutate(o.id || o.code);
                              }
                            }}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Hủy
                          </button>
                        )}
                        <Button
                          type="button"
                          className="!px-2"
                          onClick={() => onView?.(o)}
                          title="Xem chi tiết đơn"
                        >
                          👁️
                        </Button>
                      </div>
                    </Td>
                  </Row>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
