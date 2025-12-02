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

  // -------- Query dữ liệu --------
  const { data, isLoading, isError } = useNotifications({
    params: {
      tab,
    },
  });

  const items = useMemo(
    () => {
            if (!data) return [];
            // PagedResult từ API: { items, totalItems, page, pageSize }
            if (Array.isArray(data.items)) return data.items;
            // Fallback cũ: data.data hoặc array trần
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data)) return data;
            return [];
          },
    [data]
    
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Fallback filter client-side (khi BE chưa hỗ trợ)
    // Fallback filter client-side (khi BE chưa hỗ trợ đầy đủ)
    const filtered = useMemo(() => {
      // copy tránh mutate trực tiếp
      let list = Array.isArray(items) ? [...items] : [];
  
      // Tab: unread / today
      if (tab === "unread") {
        list = list.filter((n) => !n.read);
      } else if (tab === "today") {
        list = list.filter((n) => {
          if (!n.createdAt) return false;
          const d = new Date(n.createdAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      }
  
      // Keyword
      const kw = (deferredKeyword || "").trim().toLowerCase();
      if (kw) {
        list = list.filter((n) => {
          const haystack = [
            n.title,
            n.message,
            n.description,
            n.patientName,
            n.fromStaff,
            n.fromDept,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(kw);
        });
      }
  
      // Filter type (system / appointment / patient / pharmacy / billing)
      if (filters.type && filters.type !== "all") {
        const t = filters.type.toLowerCase();
        const th = t==="appointment"?"lich_hen": t==="patient"?"benh_nhan":t==="pharmacy"?"nha_thuoc":t==="system"?"he_thong":t==="result"?"result":t==="reminder"?"reminder":"thanh_toan";
        list = list.filter((n) => (n.type || "").toLowerCase() === th);
      }
  
     
      if (filters.priority && filters.priority !== "all") {
        const p = filters.priority.toLowerCase(); // "high" | "normal"
        list = list.filter((n) => normalizePriority(n.priority) === p);
      }
  
      // Sort: ưu tiên cao trước, rồi mới tới thời gian mới nhất
      const priorityMode = "high-first";

      const priorityRank = (p) => {
        const v = normalizePriority(p);
        if (v === "high") return 0;
        if (v === "normal") return 1;
        return 2;
      };
      list.sort((a, b) => {
        if (priorityMode === "high-first") {
          const pa = priorityRank(a.priority);
          const pb = priorityRank(b.priority);
          if (pa !== pb) return pa - pb;
        }
  
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  
      return list;
    }, [items, tab, today, deferredKeyword, filters.type, filters.priority]);

 
 
    const stats = useMemo(() => {
      if (!Array.isArray(filtered)) {
        return { total: 0, unread: 0, today: 0, priorityHigh: 0 };
      }
  
      // Tính theo danh sách đã lọc ở FE (tab + keyword + type + priority)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
  
      let total = 0;
      let unread = 0;
      let today = 0;
      let priorityHigh = 0;
  
      for (const n of filtered) {
        total += 1;
        if (!n.read) unread += 1;
  
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        if (createdAt && createdAt >= start && createdAt <= end) {
          today += 1;
        }
  
        if (normalizePriority(n.priority) === "high") {
          priorityHigh += 1;
        }
      }
  
      return { total, unread, today, priorityHigh };
    }, [filtered]);
  
  


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
        <div className="card mt-3 flex-1 min-h-0">
          {isLoading ? (
            <section className="h-full p-6 rounded-2xl bg-white  text-sm text-slate-500 min-h-[320px] flex items-center justify-center">
             Đang tải dữ liệu thông báo.
            </section>
          ) : isError ? (
            <section className="h-full p-6 rounded-2xl bg-white  text-sm text-slate-600 min-h-[320px] flex items-center justify-center">
             Không có bản ghi phù hợp.
            </section>
          ) : (
            <NotificationList
              items={filtered}
              onOpenDetail={(item) => setDetail({ open: true, item })}
              stretch
            />
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
