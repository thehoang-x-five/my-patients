import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import UnpaidInvoiceToolbar from "../components/billing/UnpaidInvoiceToolbar.jsx";
import UnpaidInvoiceFilterPopover from "../components/billing/UnpaidInvoiceFilterPopover.jsx";
import UnpaidInvoicesTable from "../components/billing/UnpaidInvoicesTable.jsx";
import UnpaidInvoiceDetailModal from "../components/billing/UnpaidInvoiceDetailModal.jsx";
import PaymentWizard from "../components/billing/PaymentWizard.jsx";
import Pagination from "../components/ui/Pagination.jsx";

import {
  useCancelInvoice,
  useSearchInvoices,
  subscribeBillingRealtime,
} from "../api/billing.js";
import { on } from "../api/realtime.js";
import { queryClient } from "../components/lib/queryClient.js";
import { TRANG_THAI_HOA_DON } from "../constants/enums.js";
import { useAuthStore } from "../components/stores/appStore.js";
import { isReceptionNurse } from "../utils/permissions.js";
import { toLocalDateTimeParam } from "../utils/dateLocal.js";

import useViewportVH from "../hooks/useViewportVH.js";
import useMediaQuery from "../hooks/useMediaQuery.js";

const INVOICE_TABS = {
  UNPAID: "unpaid",
  RESERVED: "reserved",
};

function buildAgeFilter(ageRange) {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  if (ageRange === "0-7") {
    return {
      fromTime: new Date(endOfToday.getTime() - 7 * 24 * 60 * 60 * 1000),
      toTime: endOfToday,
    };
  }

  if (ageRange === "8-30") {
    return {
      fromTime: new Date(endOfToday.getTime() - 30 * 24 * 60 * 60 * 1000),
      toTime: new Date(endOfToday.getTime() - 8 * 24 * 60 * 60 * 1000),
    };
  }

  if (ageRange === "30+") {
    return {
      fromTime: undefined,
      toTime: new Date(endOfToday.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  return { fromTime: undefined, toTime: undefined };
}

function buildAmountFilter(amountRange) {
  switch (amountRange) {
    case "0-500k":
      return { minAmount: undefined, maxAmount: 499999 };
    case "500k-1m":
      return { minAmount: 500000, maxAmount: 999999 };
    case "1m-5m":
      return { minAmount: 1000000, maxAmount: 4999999 };
    case "5m+":
      return { minAmount: 5000000, maxAmount: undefined };
    default:
      return { minAmount: undefined, maxAmount: undefined };
  }
}

function getInvoiceStatusByTab(tab) {
  return tab === INVOICE_TABS.RESERVED
    ? TRANG_THAI_HOA_DON.BAO_LUU
    : TRANG_THAI_HOA_DON.CHUA_THU;
}

function formatInvoiceStatus(status) {
  switch ((status || "").toLowerCase()) {
    case "da_thu": return "đã thu";
    case "da_huy": return "đã hủy";
    case "bao_luu": return "bảo lưu";
    case "chua_thu": return "chưa thu";
    default: return status || "không xác định";
  }
}

export default function UnpaidInvoices() {
  useViewportVH();
  const user = useAuthStore((s) => s.user);
  const canProcessInvoices = isReceptionNurse(user);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [activeTab, setActiveTab] = useState(INVOICE_TABS.UNPAID);
  const [keyword, setKeyword] = useState("");
  const [ageRange, setAgeRange] = useState("all");
  const [amountRange, setAmountRange] = useState("all");
  const [invoiceType, setInvoiceType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const filterBtnRef = useRef(null);

  const deferredKeyword = useDeferredValue(keyword);
  const ageFilter = useMemo(() => buildAgeFilter(ageRange), [ageRange]);
  const amountFilter = useMemo(() => buildAmountFilter(amountRange), [amountRange]);
  const activeStatus = useMemo(() => getInvoiceStatusByTab(activeTab), [activeTab]);

  const filter = useMemo(
    () => ({
      TrangThai: activeStatus,
      Keyword: deferredKeyword || undefined,
      FromTime: ageFilter.fromTime ? toLocalDateTimeParam(ageFilter.fromTime) : undefined,
      ToTime: ageFilter.toTime ? toLocalDateTimeParam(ageFilter.toTime) : undefined,
      MinAmount: amountFilter.minAmount,
      MaxAmount: amountFilter.maxAmount,
      LoaiDotThu: invoiceType !== "all" ? invoiceType : undefined,
      SortBy: "ThoiGian",
      SortDirection: activeTab === INVOICE_TABS.RESERVED ? "desc" : "asc",
      Page: page,
      PageSize: pageSize,
    }),
    [
      activeStatus,
      activeTab,
      ageFilter.fromTime,
      ageFilter.toTime,
      amountFilter.maxAmount,
      amountFilter.minAmount,
      deferredKeyword,
      invoiceType,
      page,
    ]
  );

  const statsFilter = useMemo(
    () => ({
      ...filter,
      Page: 1,
      PageSize: 500,
    }),
    [filter]
  );

  const { data, isLoading, error } = useSearchInvoices(filter);
  const { data: statsData } = useSearchInvoices(statsFilter, {
    staleTime: 30000,
  });

  useEffect(() => {
    if (error) {
      toast.error(`Lỗi tải dữ liệu: ${error.message || "Unknown error"}`);
    }
  }, [error]);

  // ===== REALTIME: Subscribe to InvoiceChanged SignalR events =====
  // Auto-refresh invoice list when backend broadcasts changes
  useEffect(() => {
    const unsubscribe = subscribeBillingRealtime(queryClient);
    return () => {
      unsubscribe?.();
    };
  }, []);

  // ===== REALTIME: Toast notifications for invoice changes =====
  useEffect(() => {
    const offInvoiceChanged = on("InvoiceChanged", (dto) => {
      const maHoaDon = dto?.MaHoaDon ?? dto?.maHoaDon;
      const trangThai = (dto?.TrangThai ?? dto?.trangThai ?? "").toLowerCase();
      const tenBn = dto?.TenBenhNhan ?? dto?.tenBenhNhan ?? "";
      const label = tenBn ? `${tenBn}` : `#${maHoaDon}`;

      if (trangThai === "da_huy") {
        toast.warning(`🚫 Hóa đơn ${label} đã bị hủy`, { autoClose: 5000 });
      } else if (trangThai === "da_thu") {
        toast.success(`✅ Hóa đơn ${label} đã được thanh toán`, { autoClose: 4000 });
      } else if (trangThai === "bao_luu") {
        toast.info(`🧾 Hóa đơn ${label} đã chuyển sang bảo lưu`, { autoClose: 4000 });
      } else if (trangThai === "chua_thu") {
        toast.info(`📋 Hóa đơn mới cho ${label}`, { autoClose: 4000 });
      } else {
        toast.info(`📋 Hóa đơn ${label} — ${formatInvoiceStatus(trangThai)}`, { autoClose: 4000 });
      }
    });

    return () => {
      offInvoiceChanged?.();
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedInvoice(null);
    setPaymentInvoice(null);
  }, [activeTab]);

  const items = data?.Items || data?.items || [];
  const totalItems = data?.TotalItems || data?.totalItems || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const statsItems = statsData?.Items || statsData?.items || items;
  const statsTotalItems = statsData?.TotalItems || statsData?.totalItems || totalItems;

  const stats = useMemo(() => {
    const now = new Date();
    let totalAmount = 0;
    let over7Days = 0;
    let over30Days = 0;

    statsItems.forEach((inv) => {
      const amount = inv.SoTien || inv.soTien || 0;
      totalAmount += amount;

      const referenceDate = new Date(
        inv.ThoiGianXuLy ||
          inv.thoiGianXuLy ||
          inv.NgayTao ||
          inv.ngayTao ||
          inv.ThoiGian ||
          inv.thoiGian
      );
      const daysDiff = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 7) over7Days++;
      if (daysDiff > 30) over30Days++;
    });

    return {
      total: statsTotalItems,
      totalAmount,
      over7Days,
      over30Days,
    };
  }, [statsItems, statsTotalItems]);

  const cancelInvoice = useCancelInvoice({
    onSuccess: () => {
      toast.success("Đã hủy hóa đơn");
      setSelectedInvoice(null);
    },
    onError: (err) => toast.error(err.message || "Không thể hủy hóa đơn"),
  });

  const handleOpenPayment = (invoice) => {
    if (!canProcessInvoices) {
      toast.error("Vai trò hiện tại chỉ được xem công nợ, không có quyền xử lý thanh toán.");
      return;
    }

    setPaymentInvoice(invoice);
    setSelectedInvoice(null);
  };

  const handleCancel = (invoice, reason) => {
    if (!canProcessInvoices) {
      toast.error("Vai trò hiện tại chỉ được xem công nợ, không có quyền hủy hóa đơn.");
      return;
    }

    cancelInvoice.mutate({
      maHoaDon: invoice.MaHoaDon || invoice.maHoaDon,
      lyDoHuy: reason,
    });
  };

  const handleResetFilters = () => {
    setKeyword("");
    setAgeRange("all");
    setAmountRange("all");
    setInvoiceType("all");
    setPage(1);
  };

  useEffect(() => {
    if (page > 1) setPage(1);
  }, [deferredKeyword, ageRange, amountRange, invoiceType]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="min-h-0 overflow-y-auto px-4 pb-3 pt-1 scrollbar-none"
      role="main"
    >
      <div
        className="mt-2 flex h-[calc(var(--app-dvh)-var(--topbar-h)+1px)] min-h-0 flex-col"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <div className="flex-none">
          <UnpaidInvoiceToolbar
            stats={stats}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filterBtnRef={filterBtnRef}
            onOpenFilter={() => setFilterOpen(true)}
            onResetFilters={handleResetFilters}
          />
        </div>

        <div className="mt-0 flex-1 min-h-0 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="sr-only" aria-live="polite">
              {isLoading ? "Đang tải dữ liệu..." : "Dữ liệu đã sẵn sàng"}
            </div>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                <UnpaidInvoicesTable
                  items={items}
                  loading={isLoading}
                  mode={activeTab}
                  onView={(invoice) => setSelectedInvoice(invoice)}
                  canProcess={canProcessInvoices}
                  stretch
                />
              </div>

              {totalItems > 0 && (
                <div className="flex-shrink-0 rounded-b-2xl border-t border-slate-200 bg-white">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    showWhenSinglePage
                    className="px-4 py-3"
                  />
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>

      <UnpaidInvoiceFilterPopover
        open={filterOpen}
        mode={activeTab}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterBtnRef}
        keyword={keyword}
        setKeyword={setKeyword}
        ageRange={ageRange}
        setAgeRange={setAgeRange}
        amountRange={amountRange}
        setAmountRange={setAmountRange}
        invoiceType={invoiceType}
        setInvoiceType={setInvoiceType}
        onResetFilters={handleResetFilters}
      />

      <UnpaidInvoiceDetailModal
        open={!!selectedInvoice}
        invoice={selectedInvoice}
        mode={activeTab}
        onClose={() => setSelectedInvoice(null)}
        onConfirm={
          activeTab === INVOICE_TABS.UNPAID && canProcessInvoices
            ? handleOpenPayment
            : undefined
        }
        onCancel={handleCancel}
        canProcess={canProcessInvoices}
        canCancel={activeTab === INVOICE_TABS.UNPAID && canProcessInvoices}
        isPending={cancelInvoice.isPending}
      />

      <PaymentWizard
        open={!!paymentInvoice && canProcessInvoices}
        patient={{
          MaBenhNhan:
            paymentInvoice?.MaBenhNhan ?? paymentInvoice?.maBenhNhan ?? null,
          HoTen:
            paymentInvoice?.TenBenhNhan ?? paymentInvoice?.tenBenhNhan ?? "—",
        }}
        items={
          paymentInvoice
            ? [
                {
                  name:
                    paymentInvoice.NoiDung ??
                    paymentInvoice.noiDung ??
                    "Thanh toán hóa đơn",
                  amount:
                    paymentInvoice.SoTien ?? paymentInvoice.soTien ?? 0,
                },
              ]
            : []
        }
        initialInvoice={paymentInvoice}
        allowDeferred={false}
        onClose={() => setPaymentInvoice(null)}
        onComplete={() => {
          toast.success("Đã xác nhận thanh toán");
        }}
      />
    </motion.main>
  );
}
