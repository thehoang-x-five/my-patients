import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "../../utils/textFormatters.js";

function getDaysOverdue(baseDate) {
  const now = new Date();
  const created = new Date(baseDate);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function getOverdueBadge(days, mode) {
  if (days < 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        {days} ngày
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
          mode === "reserved"
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : "bg-amber-50 text-amber-700 ring-amber-200"
        }`}
      >
        {days} ngày
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
        mode === "reserved"
          ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      {days} ngày
    </span>
  );
}

function renderKindChip(kind) {
  const value = String(kind || "").toLowerCase();

  if (value === "kham_lam_sang") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
        Khám LS
      </span>
    );
  }

  if (value === "can_lam_sang") {
    return (
      <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
        CLS
      </span>
    );
  }

  if (value === "thuoc") {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
        Thuốc
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
      Khác
    </span>
  );
}

function getRowTone(daysOverdue, index, mode) {
  if (mode === "reserved") {
    if (daysOverdue > 30) {
      return "bg-cyan-50/30 hover:bg-cyan-50/52 focus-within:bg-cyan-50/62";
    }

    if (daysOverdue >= 7) {
      return "bg-sky-50/28 hover:bg-sky-50/50 focus-within:bg-sky-50/60";
    }

    return [
      index % 2 === 0 ? "bg-transparent" : "bg-slate-50/38",
      "hover:bg-sky-50/35 focus-within:bg-sky-50/50",
    ].join(" ");
  }

  if (daysOverdue > 30) {
    return "bg-rose-50/24 hover:bg-rose-50/48 focus-within:bg-rose-50/58";
  }

  if (daysOverdue >= 7) {
    return "bg-amber-50/24 hover:bg-amber-50/48 focus-within:bg-amber-50/58";
  }

  return [
    index % 2 === 0 ? "bg-transparent" : "bg-slate-50/38",
    "hover:bg-amber-50/38 focus-within:bg-amber-50/50",
  ].join(" ");
}

const headerClass =
  "sticky top-0 z-10 whitespace-nowrap px-3 py-3 bg-white/80 backdrop-blur bg-gradient-to-b from-amber-50/55 to-slate-50/45 ring-1 ring-slate-200/70";

const cellClass =
  "px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/72";

export default function UnpaidInvoicesTable({
  items = [],
  loading = false,
  mode = "unpaid",
  onView,
  canProcess = false,
  stretch = false,
}) {
  const isReserved = mode === "reserved";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <span className="text-sm text-slate-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-5xl">{isReserved ? "🧾" : "📋"}</div>
          <div className="mb-1 text-base font-semibold text-slate-700">
            {isReserved ? "Chưa có hóa đơn bảo lưu" : "Không có hóa đơn chưa thu"}
          </div>
          <div className="text-sm text-slate-500">
            {isReserved
              ? "Các ca bỏ về sau thanh toán sẽ xuất hiện tại đây"
              : "Tất cả hóa đơn đang được xử lý xong"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`scrollbar-none px-4 pt-0 pb-0 ${
        stretch
          ? "h-full flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none"
          : "overflow-x-auto scrollbar-none"
      }`}
    >
      <table className="min-w-full table-fixed">
        <thead className="text-left text-[13px] font-semibold text-slate-600 shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]">
          <tr>
            <th className={`${headerClass} rounded-l-xl`}>Mã HĐ</th>
            <th className={headerClass}>
              {isReserved ? "Thời gian xử lý" : "Thời gian"}
            </th>
            <th className={headerClass}>Bệnh nhân</th>
            <th className={headerClass}>Loại</th>
            <th className={headerClass}>Nội dung</th>
            <th className={`${headerClass} text-right`}>Số tiền</th>
            <th className={`${headerClass} text-center`}>
              {isReserved ? "Đang giữ" : "Quá hạn"}
            </th>
            <th className={`${headerClass} rounded-r-xl text-right`}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice, index) => {
            const createdAt =
              invoice.NgayTao ??
              invoice.ngayTao ??
              invoice.ThoiGian ??
              invoice.thoiGian;
            const handledAt =
              invoice.ThoiGianXuLy ??
              invoice.thoiGianXuLy ??
              createdAt;
            const daysOverdue = getDaysOverdue(handledAt);

            return (
              <motion.tr
                key={invoice.MaHoaDon ?? invoice.maHoaDon ?? index}
                whileHover={{ y: -2 }}
                className={`group transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)] ${getRowTone(
                  daysOverdue,
                  index,
                  mode
                )}`}
              >
                <td className={`${cellClass} whitespace-nowrap`}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_rgba(14,165,233,.14)] ${
                        isReserved ? "bg-sky-500" : "bg-amber-500"
                      }`}
                    />
                    {invoice.MaHoaDon ?? invoice.maHoaDon}
                  </span>
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  {formatDateTime(handledAt)}
                </td>
                <td className={cellClass}>
                  <div className="font-medium">
                    {invoice.TenBenhNhan ?? invoice.tenBenhNhan ?? "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {invoice.MaBenhNhan ?? invoice.maBenhNhan ?? "—"}
                  </div>
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  {renderKindChip(invoice.LoaiDotThu ?? invoice.loaiDotThu ?? "")}
                </td>
                <td className={cellClass}>
                  {invoice.NoiDung ?? invoice.noiDung ?? "—"}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-right`}>
                  <span
                    className={`font-semibold ${
                      isReserved ? "text-sky-700" : "text-amber-700"
                    }`}
                  >
                    {formatCurrency(invoice.SoTien ?? invoice.soTien ?? 0)}
                  </span>
                </td>
                <td className={`${cellClass} whitespace-nowrap text-center`}>
                  {getOverdueBadge(daysOverdue, mode)}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-right`}>
                  <button
                    onClick={() => onView?.(invoice)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:-translate-y-px hover:shadow ${
                      isReserved
                        ? "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {isReserved ? "Xem giữ tiền" : canProcess ? "Xử lý" : "Xem"}
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
