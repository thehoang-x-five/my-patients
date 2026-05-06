import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";

function StatusBadge({ s }) {
  const raw = String(s || "").toLowerCase().trim();

  let type = "other";
  let label = s || "—";

  if (raw === "da_ke" || /đã kê|da ke/.test(raw)) {
    type = "pending";
    label = "Chờ phát";
  } else if (raw === "cho_phat" || /chờ phát|cho phat|pending|đang chờ/.test(raw)) {
    type = "pending";
    label = "Chờ phát";
  } else if (raw === "da_phat" || /đã phát|da phat|done/.test(raw)) {
    type = "done";
    label = "Đã phát";
  } else if (raw === "huy" || /hủy|huy/.test(raw)) {
    type = "cancelled";
    label = "Đã hủy";
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
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
      "sticky top-0 z-10 whitespace-nowrap px-3 py-3",
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

const Row = React.forwardRef(({ i, children, className = "", ...rest }, ref) => (
  <motion.tr
    {...rest}
    ref={ref}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.015 }}
    whileHover={{ y: -2 }}
    className={[
      "group odd:bg-slate-50/40 shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)] transition hover:bg-indigo-100/50",
      className,
    ].join(" ")}
  >
    {children}
  </motion.tr>
));

const Td = ({ children, first, last, right, classNameOverride = "" }) => (
  <td
    className={[
      "px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/70",
      first ? "rounded-l-lg pl-3" : "",
      last ? "rounded-r-lg pr-3" : "",
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
  onCancel,
  onDispense,
  canCancel = false,
  canDispense = false,
  loading = false,
  highlightId = null,
}) {
  const rowRefs = useRef({});
  const highlightKey = String(highlightId || "").trim().toLowerCase();

  useEffect(() => {
    if (!highlightId || loading) return;
    const key = String(highlightId).trim().toLowerCase();
    const row = rowRefs.current[key];
    if (!row) return;

    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, loading, items]);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white pt-2 shadow-soft"
      aria-label="Danh sách đơn thuốc"
    >
      <div className="scrollbar-none flex-1 min-h-0 overflow-x-auto overflow-y-auto px-4 pb-0 pt-0">
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
            <Th last right>
              Thao tác
            </Th>
          </Thead>

          <tbody>
            {loading || !items.length ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
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

                const total = Number(o.total || o.tongTienDon || 0) || 0;
                const status = o.statusLabel || o.status || o.trangThai || "";
                const canCancelRow =
                  canCancel &&
                  onCancel &&
                  /^(da_ke|cho_phat)$/i.test(o.status || o.trangThai || "");
                // BE tạo đơn với trạng thái "da_ke"; "cho_phat" chủ yếu từ seed/legacy.
                // Phát thuốc (PUT .../status → da_phat) chấp nhận từ cả hai trạng thái trước khi đã phát.
                const canDispenseRow =
                  canDispense &&
                  onDispense &&
                  /^(da_ke|cho_phat)$/i.test(o.status || o.trangThai || "");
                const invoiceStatus = String(
                  o.invoiceStatus ||
                    o.invoice?.TrangThai ||
                    o.invoice?.status ||
                    ""
                )
                  .toLowerCase()
                  .trim();
                const needsDrugPayment =
                  total > 0 && invoiceStatus !== "da_thu";

                const orderCode = String(o.id || o.code || "").trim();
                const orderKey = orderCode.toLowerCase();
                const isHighlight = !!highlightKey && orderKey === highlightKey;

                return (
                  <Row
                    key={o.id || o.code || i}
                    i={i}
                    ref={(node) => {
                      if (orderKey) rowRefs.current[orderKey] = node;
                    }}
                    data-highlight-id={orderCode || undefined}
                    data-order-id={orderCode || undefined}
                    className={isHighlight ? "flash-emerald-once z-10" : ""}
                  >
                    <Td
                      first
                      classNameOverride="overflow-hidden text-ellipsis whitespace-nowrap font-mono font-semibold"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                        {o.id || o.code || "—"}
                      </span>
                    </Td>

                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate font-semibold">
                        {o.ptName || o.patientName || "—"}
                      </div>
                      <div className="truncate text-[12px] text-slate-500">
                        {o.ptId || o.patientId || "—"}
                      </div>
                    </Td>

                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate">{o.doctor || o.doctorName || "—"}</div>
                    </Td>

                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate">{o.diag || o.chuanDoan || "—"}</div>
                    </Td>

                    <Td classNameOverride="whitespace-nowrap">
                      {total ? (
                        <span className="font-semibold">{total.toLocaleString("vi-VN")} đ</span>
                      ) : (
                        "—"
                      )}
                    </Td>

                    <Td classNameOverride="whitespace-nowrap text-[12px] text-slate-600">
                      {displayAt}
                    </Td>

                    <Td classNameOverride="whitespace-nowrap">
                      <StatusBadge s={status} />
                    </Td>

                    <Td last right classNameOverride="whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          iconOnly
                          onClick={() => onView?.(o)}
                          title="Xem chi tiết đơn"
                          aria-label="Xem chi tiết đơn"
                        >
                          👁️
                        </Button>

                        {canCancelRow && (
                          <Button
                            type="button"
                            iconOnly
                            className="!text-rose-600 hover:!bg-rose-50"
                            onClick={() => onCancel?.(o)}
                            title="Hủy đơn thuốc"
                            aria-label="Hủy đơn thuốc"
                          >
                            ✕
                          </Button>
                        )}

                        {canDispenseRow && (
                          <Button
                            type="button"
                            className="!px-2 !text-emerald-700 hover:!bg-emerald-50"
                            onClick={() => onDispense?.(o)}
                            title={
                              needsDrugPayment
                                ? "Thu tiền thuốc trước khi phát"
                                : "Phát thuốc"
                            }
                          >
                            {needsDrugPayment ? "Thu tiền" : "Phát"}
                          </Button>
                        )}
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
