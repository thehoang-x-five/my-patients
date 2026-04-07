// src/components/prescriptions/StockTable.jsx
import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";

const DEFAULT_NEAR_EXPIRY_DAYS = 30;
const LOW_STOCK_QTY = 10;

const daysLeft = (exp) => {
  if (!exp) return NaN;
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return NaN;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  return Math.ceil((d - today) / 86400000); // >0 còn hạn, <0 đã hết hạn
};

function ExpBadge({ exp }) {
  if (!exp) return <span className="text-xs text-slate-500">—</span>;
  const d = String(exp);
  let display = d;
  const parsed = new Date(d);
  if (!Number.isNaN(parsed.getTime())) {
    display = parsed.toLocaleDateString("vi-VN");
  } else if (d.length >= 10) {
    display = d.slice(0, 10);
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 ring-1 ring-slate-200 px-2 py-0.5 text-[11px] text-slate-700 tabular-nums">
      {display}
    </span>
  );
}

/**
 * Quy ước màu:
 * - hoat_dong   -> xanh lá
 * - het_han     -> đỏ (bao gồm cả raw tam_dung / paused)
 * - sap_het_han -> vàng
 * - sap_het_ton -> xanh dương
 */
function StatusBadge({ status }) {
  const raw = (status || "").toLowerCase();

  const isActive = raw === "hoat_dong" || raw === "active";
  const isExpired =
    raw === "het_han" ||
    raw === "expired" ||
    raw === "tam_dung" ||
    raw === "tam_ngung" ||
    raw === "inactive" ||
    raw === "paused";
  const isNearExp =
    raw === "sap_het_han" || raw === "near_expiry";
  const isNearOut =
    raw === "sap_het_ton" || raw === "near_out";

  let cls = "bg-slate-50 text-slate-700 ring-slate-200";
  let dot = "bg-slate-400";
  let label = status || "—";

  if (isExpired) {
    cls = "bg-rose-50 text-rose-700 ring-rose-200";
    dot = "bg-rose-500";
    label = "Hết hạn";
  } else if (isNearExp) {
    cls = "bg-amber-50 text-amber-700 ring-amber-200";
    dot = "bg-amber-500";
    label = "Sắp hết hạn";
  } else if (isNearOut) {
    cls = "bg-sky-50 text-sky-700 ring-sky-200";
    dot = "bg-sky-500";
    label = "Sắp hết tồn";
  } else if (isActive) {
    cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
    dot = "bg-emerald-500";
    label = "Hoạt động";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}
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
    className="group odd:bg-slate-50/40 hover:bg-indigo-100/40 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]"
  >
    {children}
  </motion.tr>
);

const Td = ({ children, first, last, right, classNameOverride = "" }) => (
  <td
    className={[
      "px-3 py-2.5 align-top text-[13px] leading-6 text-slate-700 group-hover:bg-white/70",
      first ? "pl-3 rounded-l-lg" : "",
      last ? "pr-3 rounded-r-lg" : "",
      right ? "text-right tabular-nums" : "",
      classNameOverride,
    ].join(" ")}
  >
    {children}
  </td>
);

/**
 * items: [{ code, name, unit, price, qty, exp, usage, lot, status }]
 */
export default function StockTable({
  items = [],
  onEdit,
  canEdit = false, // ✅ RBAC: chỉ Admin + YTHC mới sửa kho
  loading = false,
  nearExpiryDays = 30,
  stretch = false,
}) {
  const NEAR = nearExpiryDays ;

  return (
    <section
      className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft flex flex-col ${
        stretch ? "h-full min-h-0" : ""
      }`}
      aria-label="Kho thuốc"
    >
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none px-4 pb-0 pt-0">
        <table className="min-w-full table-fixed text-[13px] leading-6">
          <colgroup>
            <col style={{ width: "12%" }} /> {/* Mã thuốc */}
            <col style={{ width: "22%" }} /> {/* Tên thuốc */}
            <col style={{ width: "8%" }} /> {/* Đơn vị */}
            <col style={{ width: "22%" }} /> {/* Công dụng */}
            <col style={{ width: "10%" }} /> {/* Giá niêm yết */}
            <col style={{ width: "8%" }} /> {/* Tồn */}
            <col style={{ width: "8%" }} /> {/* HSD */}
            <col style={{ width: "6%" }} /> {/* Trạng thái */}
            <col style={{ width: "4%" }} /> {/* Thao tác */}
          </colgroup>

          <Thead>
            <Th first>Mã thuốc</Th>
            <Th>Tên thuốc</Th>
            <Th>Đơn vị</Th>
            <Th>Công dụng</Th>
            <Th right>Giá niêm yết</Th>
            <Th right>Tồn</Th>
            <Th>HSD</Th>
            <Th>Trạng thái</Th>
            <Th last right>Thao tác</Th>
          </Thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center text-slate-500"
                >
                 Không có bản ghi phù hợp.
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có bản ghi phù hợp.
                </td>
              </tr>
            ) : (
              items.map((d, i) => {
                const code = d.code || d.maThuoc || d.MaThuoc;
                const name = d.name || d.tenThuoc || d.TenThuoc;
                const unit = d.unit || d.donViTinh || d.DonViTinh;
                const qty =
                  Number(d.qty ?? d.soLuongTon ?? d.SoLuongTon ?? 0) || 0;
                const price =
                  Number(
                    d.price ??
                      d.giaNiemYet ??
                      d.GiaNiemYet ??
                      d.giaBanLe ??
                      d.GiaBanLe ??
                      0
                  ) || 0;

                const expRaw = d.exp ?? d.hanSuDung ?? d.HanSuDung;
                const usage = d.usage ?? d.congDung ?? d.CongDung;

                // Tính status chuẩn
                let statusCode =
                  (d.status ?? d.trangThai ?? d.TrangThai ?? "").toLowerCase();

                // Map các trạng thái pause -> het_han
                if (
                  statusCode === "tam_dung" ||
                  statusCode === "tam_ngung" ||
                  statusCode === "inactive" ||
                  statusCode === "paused"
                ) {
                  statusCode = "het_han";
                }

                const left = daysLeft(expRaw);

                if (!Number.isNaN(left)) {
                  if (left < 0) {
                    statusCode = "het_han";
                  } else if (left >= 0 && left <= NEAR) {
                    statusCode = "sap_het_han";
                  } else if (qty <= LOW_STOCK_QTY) {
                    statusCode = "sap_het_ton";
                  } else if (
                    !statusCode ||
                    statusCode === "active"
                  ) {
                    statusCode = "hoat_dong";
                  }
                } else if (
                  qty <= LOW_STOCK_QTY &&
                  (!statusCode ||
                    statusCode === "hoat_dong" ||
                    statusCode === "active")
                ) {
                  statusCode = "sap_het_ton";
                }

                if (!statusCode) statusCode = "hoat_dong";

                return (
                  <Row key={code || i} i={i}>
                    {/* Mã thuốc */}
                    <Td
                      first
                      classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis font-mono font-semibold"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,.25)]" />
                        {code || "—"}
                      </span>
                    </Td>

                    {/* Tên thuốc */}
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="font-semibold truncate">
                        {name || "—"}
                      </div>
                    </Td>

                    {/* Đơn vị */}
                    <Td classNameOverride="whitespace-nowrap">
                      {unit || "—"}
                    </Td>

                    {/* Công dụng */}
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="truncate">
                        {usage || "—"}
                      </div>
                    </Td>

                    {/* Giá niêm yết */}
                    <Td right classNameOverride="whitespace-nowrap">
                      {price ? (
                        <span className="font-semibold">
                          {price.toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>

                    {/* Số lượng tồn */}
                    <Td
                      right
                      classNameOverride={`whitespace-nowrap tabular-nums ${
                        qty <= 0 ? "text-rose-600 font-semibold" : ""
                      }`}
                    >
                      {qty.toLocaleString("vi-VN")}
                    </Td>

                    {/* Hạn sử dụng */}
                    <Td classNameOverride="whitespace-nowrap">
                      <ExpBadge exp={expRaw} />
                    </Td>

                    {/* Trạng thái */}
                    <Td classNameOverride="whitespace-nowrap">
                      <StatusBadge status={statusCode} />
                    </Td>

                    {/* Thao tác */}
                    <Td last right classNameOverride="whitespace-nowrap">
                      {canEdit && (
                        <Button
                          type="button"
                          className="!px-2"
                          onClick={() => onEdit?.(d)}
                        >
                          Sửa
                        </Button>
                      )}
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
