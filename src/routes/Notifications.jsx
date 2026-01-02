// /src/pages/Notifications.jsx
import React, {
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { motion } from "framer-motion";
  import { useLocation, useNavigate } from "react-router-dom";
  
  import NotificationsToolbar from "../components/notifications/NotificationsToolbar.jsx";
  import NotificationList from "../components/notifications/NotificationList.jsx";
  import NotificationDetailModal from "../components/notifications/NotificationDetailModal.jsx";
  import NotificationsFilterPopover from "../components/notifications/NotificationsFilterPopover.jsx";
  import Pagination from "../components/ui/Pagination.jsx";
  
  import { useNotifications } from "../api/notifications.js";
  
  import useViewportVH from "../hooks/useViewportVH";
  import useMediaQuery from "../hooks/useMediaQuery";

export default function Notifications() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const location = useLocation();
  const navigate = useNavigate();
 
  const normalizePriority = (p) => {
    const v = (p || "").toLowerCase().trim();
    if (v === "high" || v === "hight" || v === "cao") return "high";    // ưu tiên cao
    if (v === "normal" || v === "thuong") return "normal";              // ưu tiên thường
    return "other";
  };
  // -------- URL state (tab + keyword) --------
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "all";
  const initialQ = searchParams.get("q") || "";

  const [tab, setTab] = useState(initialTab);
  const [filters, setFilters] = useState({
    keyword: initialQ,
    type: "all",
    priority: "all",
  });
  const [page, setPage] = useState(1);

  const deferredKeyword = useDeferredValue(filters.keyword);

  // Sync lên URL khi tab hoặc từ khóa đổi
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (tab && tab !== "all") sp.set("tab", tab);
    else sp.delete("tab");

    if (filters.keyword) sp.set("q", filters.keyword);
    else sp.delete("q");

    navigate({ search: sp.toString() }, { replace: true });
  }, [tab, filters.keyword, location.search, navigate]);

  // Map frontend filter values sang backend values
  const mapTypeToBackend = (type) => {
    if (type === "all") return null;
    const map = {
      appointment: "lich_hen",
      patient: "benh_nhan",
      pharmacy: "nha_thuoc",
      system: "he_thong",
      result: "result",
      reminder: "reminder",
      billing: "thanh_toan",
    };
    return map[type] || null;
  };

  const mapPriorityToBackend = (priority) => {
    if (priority === "all") return null;
    const map = {
      high: "cao",
      normal: "thuong",
    };
    return map[priority] || null;
  };

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [tab, filters.keyword, filters.type, filters.priority]);

  // -------- Query dữ liệu --------
  const { data, isLoading, isError } = useNotifications({
    params: {
      tab,
      page,
      keyword: deferredKeyword || undefined,
      type: mapTypeToBackend(filters.type) || undefined,
      priority: mapPriorityToBackend(filters.priority) || undefined,
      sortBy: "MucDoUuTien", // Sort by priority first
      sortDirection: "asc", // High priority first (cao = 0, thuong = 1)
    },
  });

  // Extract PagedResult
  const notificationResult = data || { Items: [], TotalItems: 0, Page: 1, PageSize: 50 };
  const items = Array.isArray(notificationResult.Items) 
    ? notificationResult.Items 
    : Array.isArray(notificationResult.items)
    ? notificationResult.items
    : [];
  const totalItems = notificationResult.TotalItems || notificationResult.totalItems || 0;
  const totalPages = Math.ceil(totalItems / 50);

  // Đã được filter và sort ở backend, không cần filter lại
  const filtered = items;

 
 
    // Stats chỉ để hiển thị UI, tính từ filtered (1 page hiện tại)
    const stats = useMemo(() => {
      if (!Array.isArray(filtered)) {
        return { total: totalItems, unread: 0, today: 0, priorityHigh: 0 };
      }
  
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
  
      let unread = 0;
      let today = 0;
      let priorityHigh = 0;
  
      for (const n of filtered) {
        if (!n.read) unread += 1;
  
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        if (createdAt && createdAt >= start && createdAt <= end) {
          today += 1;
        }
  
        if (normalizePriority(n.priority) === "high") {
          priorityHigh += 1;
        }
      }
  
      return { total: totalItems, unread, today, priorityHigh };
    }, [filtered, totalItems]);
  
  


  const [detail, setDetail] = useState({ open: false, item: null });

  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  // Subscribe realtime từ SignalR
  /*useEffect(() => {
    const off = subscribeNotifications(qc);
    return () => {
      if (typeof off === "function") off();
    };
  }, [qc]);*/

  const handleResetFilters = () =>
    setFilters({ keyword: "", type: "all", priority: "all" });

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Thông báo"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* Toolbar */}
        <NotificationsToolbar
          tab={tab}
          setTab={setTab}
          stats={stats}
          onOpenFilter={() => setOpenFilter(true)}
          onResetFilters={handleResetFilters}
          filterBtnRef={filterBtnRef}
        />

        {/* Filter popover */}
        <NotificationsFilterPopover
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          anchorEl={filterBtnRef}
          values={filters}
          setValues={setFilters}
        />

        {/* Content */}
        <div className="card mt-3 flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <section className="h-full p-6 rounded-2xl bg-white  text-sm text-slate-500 min-h-[320px] flex items-center justify-center">
             Đang tải dữ liệu thông báo.
            </section>
          ) : isError ? (
            <section className="h-full p-6 rounded-2xl bg-white  text-sm text-slate-600 min-h-[320px] flex items-center justify-center">
             Không có bản ghi phù hợp.
            </section>
          ) : (
            <>
              <div className="flex-1 min-h-0">
                <NotificationList
                  items={filtered}
                  onOpenDetail={(item) => setDetail({ open: true, item })}
                  stretch
                />
              </div>
              {totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-lg">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={50}
                    onPageChange={setPage}
                    className="px-4 py-3"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NotificationDetailModal
        open={detail.open}
        item={detail.item}
        onClose={() => setDetail({ open: false, item: null })}
      />
    </motion.main>
  );
}
