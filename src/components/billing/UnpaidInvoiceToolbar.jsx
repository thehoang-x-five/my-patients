import React from "react";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";

const TAB_META = {
  unpaid: {
    totalLabel: "Tổng HĐ",
    amountLabel: "Tổng công nợ",
    age7Label: "Quá 7 ngày",
    age30Label: "Quá 30 ngày",
  },
  reserved: {
    totalLabel: "Tổng bảo lưu",
    amountLabel: "Tổng tiền giữ",
    age7Label: "Bảo lưu > 7 ngày",
    age30Label: "Bảo lưu > 30 ngày",
  },
};

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200 shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-sky-200 hover:text-sky-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function UnpaidInvoiceToolbar({
  stats,
  activeTab = "unpaid",
  onTabChange,
  filterBtnRef,
  onOpenFilter,
  onResetFilters,
}) {
  const { total, totalAmount, over7Days, over30Days } = stats;
  const labels = TAB_META[activeTab] || TAB_META.unpaid;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Chip dot={activeTab === "reserved" ? "sky" : "slate"}>
        {labels.totalLabel}:&nbsp;<b>{total}</b>
      </Chip>
      <Chip dot={activeTab === "reserved" ? "sky" : "amber"}>
        {labels.amountLabel}:&nbsp;<b>{(totalAmount / 1000000).toFixed(1)}M</b>
      </Chip>
      <Chip dot={activeTab === "reserved" ? "cyan" : "orange"}>
        {labels.age7Label}:&nbsp;<b>{over7Days}</b>
      </Chip>
      <Chip dot={activeTab === "reserved" ? "sky" : "rose"}>
        {labels.age30Label}:&nbsp;<b>{over30Days}</b>
      </Chip>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200 shadow-sm">
          <TabButton
            active={activeTab === "unpaid"}
            onClick={() => onTabChange?.("unpaid")}
          >
            Chưa thu
          </TabButton>
          <TabButton
            active={activeTab === "reserved"}
            onClick={() => onTabChange?.("reserved")}
          >
            Bảo lưu
          </TabButton>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-slate-200 hover:ring-amber-400"
          title="Làm mới bộ lọc"
        >
          ⟳
        </button>
        <Button
          ref={filterBtnRef}
          type="button"
          onClick={onOpenFilter}
          data-popover-anchor="unpaid-filter"
          className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[13px] shadow-sm ring-1 ring-amber-200 hover:ring-amber-400"
        >
          <span className="text-amber-600">🔍</span>
          Lọc
        </Button>
      </div>
    </div>
  );
}
