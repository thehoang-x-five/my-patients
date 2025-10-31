import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import React from 'react';
import PrescToolbar from "../components/prescriptions/PrescToolbar.jsx";
import StockModal from "../components/prescriptions/StockModal.jsx";
import OrdersTable from "../components/prescriptions/OrdersTable.jsx";
import StockTable from "../components/prescriptions/StockTable.jsx";
import OrderViewModal from "../components/prescriptions/OrderViewModal.jsx";
import { loadRxOrders, loadStock, saveStock } from "../data/prescriptions.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const NEAR_EXPIRY_DAYS = 30;
const daysLeft = (exp) => Math.ceil((new Date(exp) - new Date()) / 86400000);

export default function Prescriptions() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("orders");
  const [loading, setLoading] = useState(true);

  // Orders
  const [orders, setOrders] = useState([]);
  const [qOrders, setQOrders] = useState("");
  const qOrdersDef = useDeferredValue(qOrders);
  const [view, setView] = useState({ open: false, order: null });

  // Stock
  const [stock, setStock] = useState([]);
  const [qStock, setQStock] = useState("");
  const [unit, setUnit] = useState("");
  const [nearOnly, setNearOnly] = useState(false);
  const qStockDef = useDeferredValue(qStock);
  const [edit, setEdit] = useState({ open: false, item: null });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setOrders(loadRxOrders());
      setStock(loadStock());
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    const id = searchParams.get("view");
    if (!id) return;
    const found = orders.find((o) => o.id === id);
    if (found) {
      setTab("orders");
      setView({ open: true, order: found });
    }
  }, [loading, orders, searchParams]);

  const filteredOrders = useMemo(() => {
    const kw = qOrdersDef.trim().toLowerCase();
    if (!kw) return orders;
    return orders.filter((o) =>
      [o.id, o.ptId, o.ptName, o.doctor, o.diag]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [orders, qOrdersDef]);

  const filteredStock = useMemo(() => {
    const kw = qStockDef.trim().toLowerCase();
    return stock.filter((r) => {
      const okU = unit
        ? (r.unit || "").toLowerCase() === unit.toLowerCase()
        : true;
      const okKw =
        !kw || [r.code, r.name, r.usage].join(" ").toLowerCase().includes(kw);
      const okNear =
        !nearOnly || (r.exp && daysLeft(r.exp) <= NEAR_EXPIRY_DAYS);
      return okU && okKw && okNear;
    });
  }, [stock, qStockDef, unit, nearOnly]);

  function saveDrug(form) {
    setStock((prev) => {
      const idx = prev.findIndex((x) => x.code === form.code);
      const next =
        idx >= 0 ? prev.map((x, i) => (i === idx ? form : x)) : [form, ...prev];
      saveStock(next);
      return next;
    });
    setEdit({ open: false, item: null });
  }
  function removeDrug(code) {
    if (!confirm("Xóa thuốc này?")) return;
    setStock((prev) => {
      const next = prev.filter((x) => x.code !== code);
      saveStock(next);
      return next;
    });
  }
  function closeView() {
    setView({ open: false, order: null });
    const sp = new URLSearchParams(searchParams);
    sp.delete("view");
    setSearchParams(sp, { replace: true });
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Đơn thuốc"
    >
      <div
        className="mt-2 flex flex-col min-h-0
                   h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <PrescToolbar
          tab={tab}
          setTab={setTab}
          qOrders={qOrders}
          setQOrders={setQOrders}
          qStock={qStock}
          setQStock={setQStock}
          unit={unit}
          setUnit={setUnit}
          nearOnly={nearOnly}
          setNearOnly={setNearOnly}
          ordersCount={orders.length}
          stockCount={stock.length}
        />

        {/* Nội dung giãn chiếm phần còn lại */}
        <div className="mt-3 flex-1 min-h-0">
          {loading ? (
            <section className="card p-4  h-full">
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skel h-14" />
                ))}
              </div>
            </section>
          ) : (
            <AnimatePresence mode="wait">
              {tab === "orders" && (
                <motion.section
                  key="orders"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="card p-4 pt-2 h-full flex flex-col min-h-0"
                >
                  <OrdersTable
                    items={filteredOrders}
                    onView={(o) => setView({ open: true, order: o })}
                    stretch
                  />
                </motion.section>
              )}

              {tab === "stock" && (
                <motion.section
                  key="stock"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="card p-4 pt-2 h-full flex flex-col min-h-0"
                >
                  <StockTable
                    items={filteredStock}
                    onEdit={(r) => setEdit({ open: true, item: r })}
                    onRemove={(code) => removeDrug(code)}
                    nearExpiryDays={NEAR_EXPIRY_DAYS}
                    stretch
                  />
                  <StockModal
                    open={edit.open}
                    initial={edit.item}
                    onClose={() => setEdit({ open: false, item: null })}
                    onSave={saveDrug}
                  />
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <OrderViewModal open={view.open} order={view.order} onClose={closeView} />
    </motion.main>
  );
}
