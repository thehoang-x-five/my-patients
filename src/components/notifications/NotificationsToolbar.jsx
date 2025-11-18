// /src/components/notifications/NotificationsToolbar.jsx
import React from "react";

export default function NotificationsToolbar({
  tab, setTab,
  query, setQuery,
  todayStats,
  onMarkAll,
  isMarkingAll
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          className={`tab ${tab === "all" ? "tab-active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả
        </button>
        <button
          className={`tab ${tab === "unread" ? "tab-active" : ""}`}
          onClick={() => setTab("unread")}
        >
          Chưa đọc{todayStats?.unread > 0 ? ` (${todayStats.unread})` : ""}
        </button>
        <button
          className={`tab ${tab === "today" ? "tab-active" : ""}`}
          onClick={() => setTab("today")}
        >
          Hôm nay{todayStats?.today > 0 ? ` (${todayStats.today})` : ""}
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm thông báo..."
          className="input w-64"
        />
        <button className="btn" onClick={onMarkAll} disabled={isMarkingAll}>
          {isMarkingAll ? "Đang đánh dấu..." : "Đánh dấu tất cả đã đọc"}
        </button>
      </div>
    </header>
  );
}