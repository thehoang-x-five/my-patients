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
  import { toast } from "react-toastify";
  
  import NotificationsToolbar from "../components/notifications/NotificationsToolbar.jsx";
  import NotificationList from "../components/notifications/NotificationList.jsx";
  import NotificationDetailModal from "../components/notifications/NotificationDetailModal.jsx";
  import NotificationsFilterPopover from "../components/notifications/NotificationsFilterPopover.jsx";
  import AdminNotificationComposeModal from "../components/notifications/AdminNotificationComposeModal.jsx";
  import NotificationTemplatesModal from "../components/notifications/NotificationTemplatesModal.jsx";
  import Pagination from "../components/ui/Pagination.jsx";
  
  import {
    useCreateNotification,
    useNotifications,
    useNotificationSearch,
  } from "../api/notifications.js";
  import { useAuthStore } from "../components/stores/appStore.js";
  import { isAdmin as checkIsAdmin } from "../utils/permissions.js";
  
  import useViewportVH from "../hooks/useViewportVH";
  import useMediaQuery from "../hooks/useMediaQuery";

export default function Notifications() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;
  const user = useAuthStore((s) => s.user);
  const userIsAdmin = checkIsAdmin(user);

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
  const [adminView, setAdminView] = useState("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

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

  useEffect(() => {
    setPage(1);
  }, [adminView]);

  // -------- Query dữ liệu --------
  const inboxQuery = useNotifications({
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
  const systemQuery = useNotificationSearch(
    {
      page,
      pageSize: 50,
      keyword: deferredKeyword || undefined,
      type: mapTypeToBackend(filters.type) || undefined,
      priority: mapPriorityToBackend(filters.priority) || undefined,
    },
    {
      enabled: userIsAdmin && adminView === "system",
    }
  );
  const createNotification = useCreateNotification();

  // Extract PagedResult
  const data =
    userIsAdmin && adminView === "system"
      ? {
          Items: systemQuery.data?.items || [],
          TotalItems: systemQuery.data?.totalItems || 0,
          Page: systemQuery.data?.page || page,
          PageSize: systemQuery.data?.pageSize || 50,
        }
      : inboxQuery.data;
  const isLoading =
    userIsAdmin && adminView === "system"
      ? systemQuery.isLoading
      : inboxQuery.isLoading;
  const isError =
    userIsAdmin && adminView === "system"
      ? systemQuery.isError
      : inboxQuery.isError;

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
        if (!(userIsAdmin && adminView === "system") && !n.read) unread += 1;
  
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        if (createdAt && createdAt >= start && createdAt <= end) {
          today += 1;
        }
  
        if (normalizePriority(n.priority) === "high") {
          priorityHigh += 1;
        }
      }
  
      return { total: totalItems, unread, today, priorityHigh };
    }, [adminView, filtered, totalItems, userIsAdmin]);
  
  


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

  const handleCreateNotification = (payload) => {
    createNotification.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã gửi thông báo hệ thống");
        setComposeOpen(false);
      },
      onError: (error) => {
        toast.error(error?.message || "Không thể gửi thông báo");
      },
    });
  };

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
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <NotificationsToolbar
              tab={tab}
              setTab={setTab}
              stats={stats}
              onOpenFilter={() => setOpenFilter(true)}
              onResetFilters={handleResetFilters}
              filterBtnRef={filterBtnRef}
              hideTabs={userIsAdmin && adminView === "system"}
            />
          </div>

          {userIsAdmin && (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-violet-200/80">
                {[
                  { key: "inbox", label: "Hộp thư cá nhân" },
                  { key: "system", label: "Quản trị hệ thống" },
                ].map((item) => {
                  const active = adminView === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAdminView(item.key)}
                      className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                        active
                          ? "bg-violet-50 text-violet-700"
                          : "text-slate-600 hover:text-violet-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {adminView === "system" && (
                <>
                  <button
                    type="button"
                    onClick={() => setTemplatesOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200 transition hover:bg-violet-50"
                  >
                    <span>▤</span>
                    <span>Mẫu thông báo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposeOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-violet-600 via-violet-500 to-fuchsia-500 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-px"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Soạn thông báo</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filter popover */}
        <NotificationsFilterPopover
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          anchorEl={filterBtnRef}
          values={filters}
          setValues={setFilters}
          onReset={handleResetFilters}
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
              {totalItems > 0 && (
                <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-lg">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={50}
                    onPageChange={setPage}
                    showWhenSinglePage
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

      <AdminNotificationComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleCreateNotification}
        isPending={createNotification.isPending}
      />

      <NotificationTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
    </motion.main>
  );
}
