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
  getStock,
  upsertStockItem,
  subscribePharmacy,
} from "../api/pharmacy.js";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePrescStore } from "../components/stores/prescriptionStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const NEAR_EXPIRY_DAYS = 90;
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
  let raw = (r.status ?? r.trangThai ?? r.TrangThai ?? "").toLowerCase();
  const exp = r.exp ?? r.hanSuDung ?? r.HanSuDung;
  const qty = getQty(r);
  const left = daysLeft(exp);

  // Map các trạng thái BE kiểu "pause" → "het_han"
  if (
    raw === "tam_dung" ||
    raw === "tam_ngung" ||
    raw === "inactive" ||
    raw === "paused"
  ) {
    raw = "het_han";
  }

  // Ưu tiên theo hạn dùng
  if (!Number.isNaN(left)) {
    if (left < 0) return "het_han"; // đã hết hạn
    if (left >= 0 && left <= NEAR_EXPIRY_DAYS) return "sap_het_han"; // sắp hết hạn
  }

  // Nếu chưa gần hết hạn → xét lượng tồn
  if (qty <= LOW_STOCK_QTY) return "sap_het_ton";

  // Còn lại: hoạt động / hết hạn theo raw
  if (raw === "het_han" || raw === "expired") return "het_han";

  return "hoat_dong";
};

export default function Prescriptions() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

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

  // Lần đầu vào trang: đảm bảo filter kho hiển thị tất cả
  const initFiltersRef = useRef(false);
  useEffect(() => {
    if (initFiltersRef.current) return;
    initFiltersRef.current = true;
    setQStock("");
    setUnit("");
    setStockStatus("all");
  }, [setQStock, setUnit, setStockStatus]);

  // ===== Queries =====
  const ordersQuery = useQuery({
    queryKey: ["rxOrders"],
    queryFn: getRxOrders,
    staleTime: 30_000,
  });

  const stockQuery = useQuery({
    queryKey: ["rxStock"],
    queryFn: getStock,
    staleTime: 30_000,
  });

  const loadingOrders = ordersQuery.isLoading;
  const loadingStock = stockQuery.isLoading;
  const loadingBoth = loadingOrders && loadingStock;

  const orders = ordersQuery.data || [];
  const stock = stockQuery.data || [];

  // ===== Stats đơn thuốc =====
  const ordersCreatedCount = useMemo(
    () =>
      orders.filter((o) => {
        const raw = (o.rawStatus || "").toLowerCase();
        if (raw) return raw === "da_ke";
        const st = (o.status || "").toLowerCase();
        return st === "da_ke";
      }).length,
    [orders]
  );

  const ordersPendingCount = useMemo(
    () =>
      orders.filter((o) => {
        const raw = (o.rawStatus || "").toLowerCase();
        const st = (o.status || "").toLowerCase();
        return (
          raw === "cho_phat" ||
          (!raw && (st === "pending" || st === "cho_phat"))
        );
      }).length,
    [orders]
  );

  const ordersDoneCount = useMemo(
    () =>
      orders.filter((o) => {
        const raw = (o.rawStatus || "").toLowerCase();
        const st = (o.status || "").toLowerCase();
        return (
          raw === "da_phat" ||
          (!raw && (st === "done" || st === "da_phat"))
        );
      }).length,
    [orders]
  );

  // ===== Stats kho thuốc (theo status chuẩn) =====
  const stockActiveCount = useMemo(
    () => stock.filter((r) => getDrugStatusCode(r) === "hoat_dong").length,
    [stock]
  );

  const stockExpiredCount = useMemo(
    () => stock.filter((r) => getDrugStatusCode(r) === "het_han").length,
    [stock]
  );

  const stockNearExpiryCount = useMemo(
    () => stock.filter((r) => getDrugStatusCode(r) === "sap_het_han").length,
    [stock]
  );

  const stockNearOutCount = useMemo(
    () => stock.filter((r) => getDrugStatusCode(r) === "sap_het_ton").length,
    [stock]
  );

  // ===== Realtime =====
  useEffect(() => {
    const off = subscribePharmacy((evt) => {
      switch (evt?.type) {
        case "rx_order_updated":
          qc.invalidateQueries({ queryKey: ["rxOrders"] });
          break;
        case "stock_upserted":
        case "stock_deleted":
          qc.invalidateQueries({ queryKey: ["rxStock"] });
          break;
        default:
          break;
      }
    });
    return off;
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

  // ===== Filter đơn thuốc =====
  const filteredOrders = useMemo(() => {
    const kw = qOrdersDef.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    return orders.filter((o) => {
      const textOk =
        !kw ||
        [o.id, o.ptId, o.ptName, o.doctor, o.diag]
          .join(" ")
          .toLowerCase()
          .includes(kw);

      const raw = (o.rawStatus || "").toLowerCase();
      const st = (o.status || "").toLowerCase();
      let statusOk = true;

      if (orderStatus === "Đã kê") {
        statusOk = raw === "da_ke" || (!raw && st === "da_ke");
      } else if (orderStatus === "Chờ phát") {
        statusOk =
          raw === "cho_phat" ||
          (!raw && (st === "pending" || st === "cho_phat"));
      } else if (orderStatus === "Đã phát") {
        statusOk =
          raw === "da_phat" ||
          (!raw && (st === "done" || st === "da_phat"));
      }

      let rangeOk = true;
      if (orderRange !== "Tất cả") {
        if (!o.at) rangeOk = false;
        else {
          const d = new Date(o.at);
          if (Number.isNaN(d.getTime())) {
            rangeOk = false;
          } else if (orderRange === "Hôm nay") {
            rangeOk = d >= startOfToday && d < endOfToday;
          } else {
            const diffDays = Math.floor((now - d) / 86400000);
            if (orderRange === "7 ngày") rangeOk = diffDays <= 7;
            else if (orderRange === "30 ngày") rangeOk = diffDays <= 30;
          }
        }
      }

      return textOk && statusOk && rangeOk;
    });
  }, [orders, qOrdersDef, orderStatus, orderRange]);

  // ===== Filter kho thuốc =====
  const filteredStock = useMemo(() => {
    if (!stock || !stock.length) return [];
    const kw = (qStockDef || "").trim().toLowerCase();

    return stock.filter((r) => {
      const textOk =
        !kw ||
        [r.code, r.name, r.usage]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(kw);

      const unitOk = unit
        ? (r.unit || r.donViTinh || "")
            .toLowerCase()
            .includes(unit.toLowerCase())
        : true;

      const statusCode = getDrugStatusCode(r);
      const qty = getQty(r);

      let statusOk = true;
      switch (stockStatus) {
        case "hoat_dong":
          statusOk = statusCode === "hoat_dong";
          break;
        case "het_han":
          statusOk = statusCode === "het_han";
          break;
        case "sap_het_han":
          statusOk = statusCode === "sap_het_han";
          break;
        case "sap_het_ton":
          statusOk = statusCode === "sap_het_ton" || qty <= LOW_STOCK_QTY;
          break;
        default:
          statusOk = true; // all
      }

      return textOk && unitOk && statusOk;
    });
  }, [stock, qStockDef, unit, stockStatus]);

  // ===== Mutations (upsert kho) =====
  const mUpsert = useMutation({
    mutationFn: upsertStockItem,
    onMutate: async (form) => {
      await qc.cancelQueries({ queryKey: ["rxStock"] });
      const prev = qc.getQueryData(["rxStock"]) || [];
      const idx = prev.findIndex((x) => x.code === form.code);
      const optimistic =
        idx >= 0
          ? prev.map((x, i) => (i === idx ? { ...x, ...form } : x))
          : [form, ...prev];
      qc.setQueryData(["rxStock"], optimistic);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["rxStock"], ctx.prev);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["rxStock"] }),
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
            ordersCount={orders.length}
            ordersCreatedCount={ordersCreatedCount}
            ordersPendingCount={ordersPendingCount}
            ordersDoneCount={ordersDoneCount}
            // thống kê kho
            stockCount={stock.length}
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

            {loadingBoth ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-sm text-indigo-500/80">
                  Đang tải dữ liệu đơn thuốc & kho…
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {tab === "orders" ? (
                  <motion.section
                    key="orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card flex-1 min-h-0 overflow-auto"
                  >
                    <OrdersTable
                      items={filteredOrders}
                      loading={loadingOrders}
                      onView={(order) =>
                        setView({ open: true, order })
                      }
                    />
                  </motion.section>
                ) : (
                  <motion.section
                    key="stock"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card flex-1 min-h-0 overflow-auto"
                  >
                    <StockTable
                      items={filteredStock}
                      loading={loadingStock}
                      onEdit={(row) =>
                        setEdit({ open: true, item: row })
                      }
                      nearExpiryDays={NEAR_EXPIRY_DAYS}
                      stretch
                    />
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
            )}
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
