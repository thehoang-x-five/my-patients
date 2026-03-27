// src/pages/Prescriptions.jsx
import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

import PrescToolbar from "../components/prescriptions/PrescToolbar.jsx";
import StockModal from "../components/prescriptions/StockModal.jsx";
import OrdersTable from "../components/prescriptions/OrdersTable.jsx";
import StockTable from "../components/prescriptions/StockTable.jsx";
import OrderViewModal from "../components/prescriptions/OrderViewModal.jsx";
import PrescFilterPopover from "../components/prescriptions/PrescFilterPopover.jsx";

import {
  getRxOrders,
  useSearchRxOrders,
  getStock,
  upsertStockItem,
  subscribePharmacy,
  searchStock,
  useSearchStock,
  useCancelPrescription,
} from "../api/pharmacy.js";
import { on } from "../api/realtime.js";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Pagination from "../components/ui/Pagination.jsx";
import { usePrescStore } from "../components/stores/appStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { toast } from "react-toastify";

const NEAR_EXPIRY_DAYS = 30;
const LOW_STOCK_QTY = 10;

const daysLeft = (exp) => {
  if (!exp) return NaN;
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
};

const getQty = (r) =>
  Number(r.qty ?? r.soLuongTon ?? r.SoLuongTon ?? 0) || 0;

// Chuẩn hoá status kho cho toàn trang
const getDrugStatusCode = (r) => {
  const raw = (r.status ?? r.trangThai ?? r.TrangThai ?? "").toLowerCase();

  // Map trực tiếp từ BE
  if (["hoat_dong", "active"].includes(raw)) return "hoat_dong";
  if (["tam_dung", "tam_ngung", "paused", "inactive"].includes(raw)) return "tam_dung";
  if (["het_han", "expired"].includes(raw)) return "het_han";
  if (["sap_het_han", "near_expiry"].includes(raw)) return "sap_het_han";
  if (["sap_het_ton", "low_stock", "near_out"].includes(raw)) return "sap_het_ton";

  // Fallback: nếu BE chưa kịp update logic, FE vẫn tự tính được
  const exp = r.exp ?? r.hanSuDung ?? r.HanSuDung;
  const qty = getQty(r);
  const left = daysLeft(exp);

  if (!Number.isNaN(left)) {
    if (left < 0) return "het_han";
    if (left >= 0 && left <= NEAR_EXPIRY_DAYS) return "sap_het_han";
  }

  if (qty <= LOW_STOCK_QTY) return "sap_het_ton";

  return "hoat_dong";
};

export default function Prescriptions() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  // === Cancel Prescription ===
  const cancelRx = useCancelPrescription({
    onSuccess: () => toast.success("Đã hủy đơn thuốc — kho thuốc đã hoàn"),
    onError: (err) => toast.error(err.message || "Không thể hủy đơn thuốc"),
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const {
    tab,
    setTab,
    qOrders,
    setQOrders,
    qStock,
    setQStock,
    unit,
    setUnit,
    nearOnly, // hiện chưa dùng nhưng giữ để không phá store
    setNearOnly,
    view,
    setView,
    edit,
    setEdit,
  } = usePrescStore();

  // filter nâng cao
  const [orderStatus, setOrderStatus] = useState("Tất cả");
  const [orderRange, setOrderRange] = useState("Tất cả");
  const [stockStatus, setStockStatus] = useState("all"); // all | hoat_dong | het_han | sap_het_han | sap_het_ton

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const qOrdersDef = useDeferredValue(qOrders);
  const qStockDef = useDeferredValue(qStock);
  const qc = useQueryClient();

  // ✅ Pagination
  const [orderPage, setOrderPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);

  // Lần đầu vào trang: đảm bảo filter kho hiển thị tất cả
  const initFiltersRef = useRef(false);
  useEffect(() => {
    if (initFiltersRef.current) return;
    initFiltersRef.current = true;
    setQStock("");
    setUnit("");
    setStockStatus("all");
  }, [setQStock, setUnit, setStockStatus]);

  // ✅ Map orderRange → fromDate/toDate
  const getOrderDateRange = () => {
    if (orderRange === "Tất cả") return { fromDate: null, toDate: null };
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
    
    if (orderRange === "Hôm nay") {
      return {
        fromDate: startOfToday.toISOString(),
        toDate: endOfToday.toISOString(),
      };
    }
    
    const days = orderRange === "7 ngày" ? 7 : orderRange === "30 ngày" ? 30 : 0;
    if (days > 0) {
      const fromDate = new Date(startOfToday.getTime() - (days - 1) * 86400000);
      return {
        fromDate: fromDate.toISOString(),
        toDate: endOfToday.toISOString(),
      };
    }
    
    return { fromDate: null, toDate: null };
  };

  const { fromDate, toDate } = getOrderDateRange();

  // ✅ Dùng searchRxOrders với filtering và pagination
  const ordersQuery = useSearchRxOrders({
    keyword: qOrdersDef || "",
    status: orderStatus,
    fromDate,
    toDate,
    page: orderPage,
    pageSize: 50,
  });

  // ✅ Dùng searchStock với phân trang
  const stockQuery = useSearchStock({
    keyword: qStockDef || "",
    status: stockStatus === "all" ? null : stockStatus,
    unit: unit || "",
    page: stockPage,
    pageSize: 50,
  });

  const loadingOrders = ordersQuery.isLoading;
  const loadingStock = stockQuery.isLoading;
  const loadingBoth = loadingOrders && loadingStock;

  // ✅ Lấy data từ PagedResult
  const ordersResult = ordersQuery.data || { Items: [], TotalItems: 0, Page: 1, PageSize: 50 };
  const orders = ordersResult.Items || [];
  const ordersTotalItems = ordersResult.TotalItems || 0;
  const ordersTotalPages = Math.ceil(ordersTotalItems / 50);
  
  // ✅ Lấy data từ PagedResult
  const stockResult = stockQuery.data || { Items: [], TotalItems: 0, Page: 1, PageSize: 50 };
  const stock = stockResult.Items || [];
  const stockTotalItems = stockResult.TotalItems || 0;
  const stockTotalPages = Math.ceil(stockTotalItems / 50);


  

  // ===== Realtime =====
  useEffect(() => {
    const off = subscribePharmacy((evt) => {
      switch (evt?.type) {
        case "rx_order_updated":
          qc.invalidateQueries({ queryKey: ["pharmacy", "rxOrders"] });
          break;
        case "stock_upserted":
        case "stock_deleted":
          qc.invalidateQueries({ queryKey: ["pharmacy", "stock"] });
          qc.invalidateQueries({ queryKey: ["pharmacy", "stock", "search"] });
          break;
        default:
          break;
      }
    });
    return off;
  }, [qc]);

  // ✅ Subscribe realtime events for Prescriptions
  useEffect(() => {
    const offPrescCreated = on('PrescriptionCreated', (presc) => {
      console.log('[Prescriptions] Đơn thuốc mới:', presc);
      qc.invalidateQueries({ queryKey: ['pharmacy', 'rxOrders'] });
      qc.invalidateQueries({ queryKey: ['pharmacy', 'rxOrders', 'search'] });
    });
    
    const offPrescUpdated = on('PrescriptionStatusUpdated', (presc) => {
      console.log('[Prescriptions] Đơn thuốc cập nhật:', presc);
      qc.invalidateQueries({ queryKey: ['pharmacy', 'rxOrders'] });
      qc.invalidateQueries({ queryKey: ['pharmacy', 'rxOrders', 'search'] });
    });
    
    const offDrugChanged = on('DrugChanged', (drug) => {
      console.log('[Prescriptions] Kho thuốc thay đổi:', drug);
      qc.invalidateQueries({ queryKey: ['pharmacy', 'stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy', 'stock', 'search'] });
    });
    
    return () => {
      offPrescCreated?.();
      offPrescUpdated?.();
      offDrugChanged?.();
    };
  }, [qc]);

  // Deep link ?view=ID
  useEffect(() => {
    if (loadingOrders) return;
    const id = searchParams.get("view");
    if (!id) return;
    const found = orders.find((o) => o.id === id);
    if (found) {
      setTab("orders");
      setView({ open: true, order: found });
    }
  }, [loadingOrders, orders, searchParams, setTab, setView]);

  // ✅ Reset orderPage khi filter thay đổi
  useEffect(() => {
    if (orderPage > 1) setOrderPage(1);
  }, [qOrdersDef, orderStatus, orderRange]);

  // ✅ Filter và sort đã được làm ở backend
  const filteredOrders = orders;

  // ✅ Filter kho thuốc - unit đã được filter ở BE (DonViTinh)
  // Keyword và status đã được filter ở BE
  // Chỉ filter ẩn thuốc tạm dừng ở FE (UI logic, không ảnh hưởng pagination)
  const filteredStock = useMemo(() => {
    if (!stock || !stock.length) return [];
  
    return stock.filter((r) => {
      const statusCode = getDrugStatusCode(r);
      // 🔒 Không hiển thị thuốc tạm dừng
      return statusCode !== "tam_dung";
    });
  }, [stock]);
  
  // ✅ Reset page khi filter thay đổi
  useEffect(() => {
    if (stockPage > 1) setStockPage(1);
  }, [qStockDef, stockStatus, unit]);

  // ===== Stats đơn thuốc + kho thuốc =====
const ordersCount = filteredOrders.length;

const ordersCreatedCount = useMemo(
  () =>
    filteredOrders.filter((o) => {
      const raw = (o.rawStatus || "").toLowerCase();
      if (raw) return raw === "da_ke";
      const st = (o.status || "").toLowerCase();
      return st === "da_ke";
    }).length,
  [filteredOrders]
);

const ordersPendingCount = useMemo(
  () =>
    filteredOrders.filter((o) => {
      const raw = (o.rawStatus || "").toLowerCase();
      const st = (o.status || "").toLowerCase();
      return (
        raw === "cho_phat" ||
        (!raw && (st === "pending" || st === "cho_phat"))
      );
    }).length,
  [filteredOrders]
);

const ordersDoneCount = useMemo(
  () =>
    filteredOrders.filter((o) => {
      const raw = (o.rawStatus || "").toLowerCase();
      const st = (o.status || "").toLowerCase();
      return (
        raw === "da_phat" ||
        (!raw && (st === "done" || st === "da_phat"))
      );
    }).length,
  [filteredOrders]
);

// ✅ Stats kho thuốc - tính từ filteredStock (sau khi filter unit)
// Lưu ý: TotalItems từ BE chỉ đúng khi không có filter unit
const stockCount = filteredStock.length;
const stockActiveCount = filteredStock.filter((r) => {
  const st = getDrugStatusCode(r);
  return st === "hoat_dong";
}).length;

const stockExpiredCount = filteredStock.filter((r) => {
  const st = getDrugStatusCode(r);
  return st === "het_han";
}).length;

const stockNearExpiryCount = filteredStock.filter((r) => {
  const st = getDrugStatusCode(r);
  return st === "sap_het_han";
}).length;

const stockNearOutCount = filteredStock.filter((r) => {
  const st = getDrugStatusCode(r);
  return st === "sap_het_ton";
}).length;
  // ===== Mutations (upsert kho) =====
  const mUpsert = useMutation({
    mutationFn: upsertStockItem,
    onSuccess: () => {
      // ✅ Invalidate queries để refresh data
      qc.invalidateQueries({ queryKey: ["pharmacy", "stock"] });
      qc.invalidateQueries({ queryKey: ["pharmacy", "stock", "search"] });
    },
  });

  const saveDrug = (form) => {
    mUpsert.mutate(form);
    setEdit({ open: false, item: null });
  };

  const closeView = () => {
    setView({ open: false, order: null });
    const sp = new URLSearchParams(searchParams);
    sp.delete("view");
    setSearchParams(sp, { replace: true });
  };

  const handleResetFilters = () => {
    setQOrders("");
    setQStock("");
    setOrderStatus("Tất cả");
    setOrderRange("Tất cả");
    setUnit("");
    setStockStatus("all");
    setNearOnly(false);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <div className="flex-none">
          <PrescToolbar
            tab={tab}
            setTab={setTab}
            // thống kê đơn
            ordersCount={ordersCount}             
            ordersCreatedCount={ordersCreatedCount}
            ordersPendingCount={ordersPendingCount}
            ordersDoneCount={ordersDoneCount}
            // thống kê kho
            stockCount={stockCount}
            stockActiveCount={stockActiveCount}
            stockExpiredCount={stockExpiredCount}
            stockNearExpiryCount={stockNearExpiryCount}
            stockNearOutCount={stockNearOutCount}
            // filter kho (đơn vị + trạng thái)
            unit={unit}
            setUnit={setUnit}
            stockStatus={stockStatus}
            setStockStatus={setStockStatus}
            // control popover
            filterBtnRef={filterBtnRef}
            onOpenFilter={() => setFilterOpen(true)}
            onResetFilters={handleResetFilters}
          />
        </div>

        <div className="mt-0 flex-1 min-h-0">
          <div className="h-full flex flex-col">
            <div className="sr-only" aria-live="polite">
              {loadingBoth ? "Đang tải dữ liệu…" : "Dữ liệu đã sẵn sàng"}
            </div>

            <AnimatePresence mode="wait">
                {tab === "orders" ? (
                  <motion.section
                    key="orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card flex-1 min-h-0 flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <OrdersTable
                        items={filteredOrders}
                        loading={loadingOrders}
                        onView={(order) =>
                          setView({ open: true, order })
                        }
                        onCancel={(order) => {
                          if (!window.confirm(`Bạn có chắc muốn hủy đơn thuốc ${order.id || order.code}? Kho thuốc sẽ được hoàn lại.`)) return;
                          cancelRx.mutate(order.id || order.code);
                        }}
                        stretch
                      />
                    </div>
                    {ordersTotalPages > 1 && (
                      <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
                        <Pagination
                          currentPage={orderPage}
                          totalPages={ordersTotalPages}
                          totalItems={ordersTotalItems}
                          pageSize={50}
                          onPageChange={setOrderPage}
                          className="px-4 py-3"
                        />
                      </div>
                    )}
                  </motion.section>
                ) : (
                  <motion.section
                    key="stock"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card h-full flex-1 min-h-0 flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <StockTable
                        items={filteredStock}
                        loading={loadingStock}
                        onEdit={(row) =>
                          setEdit({ open: true, item: row })
                        }
                        nearExpiryDays={NEAR_EXPIRY_DAYS}
                        stretch
                      />
                    </div>
                    {stockTotalPages > 1 && (
                      <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
                        <Pagination
                          currentPage={stockPage}
                          totalPages={stockTotalPages}
                          totalItems={stockTotalItems}
                          pageSize={50}
                          onPageChange={setStockPage}
                          className="px-4 py-3"
                        />
                      </div>
                    )}
                    <StockModal
                      open={edit.open}
                      item={edit.item}
                      onClose={() =>
                        setEdit({ open: false, item: null })
                      }
                      onSave={saveDrug}
                    />
                  </motion.section>
                )}
              </AnimatePresence>
          </div>
        </div>
      </div>

      <PrescFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterBtnRef}
        tab={tab}
        qOrders={qOrders}
        setQOrders={setQOrders}
        qStock={qStock}
        setQStock={setQStock}
        unit={unit}
        setUnit={setUnit}
        orderStatus={orderStatus}
        setOrderStatus={setOrderStatus}
        orderRange={orderRange}
        setOrderRange={setOrderRange}
        stockStatus={stockStatus}
        setStockStatus={setStockStatus}
        onResetFilters={handleResetFilters}
      />

      <OrderViewModal
        open={view.open}
        order={view.order}
        onClose={closeView}
      />
    </motion.main>
  );
}
