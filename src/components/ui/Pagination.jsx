// src/components/ui/Pagination.jsx
import React from "react";

/**
 * Component phân trang chung
 * @param {Object} props
 * @param {number} props.currentPage - Trang hiện tại (1-based)
 * @param {number} props.totalPages - Tổng số trang
 * @param {number} props.totalItems - Tổng số items
 * @param {number} props.pageSize - Số items mỗi trang
 * @param {Function} props.onPageChange - Callback khi đổi trang (page) => void
 * @param {string} props.className - CSS class bổ sung
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 50,
  onPageChange,
  showWhenSinglePage = false,
  className = "",
}) {
  const totalPagesSafe = Math.max(1, totalPages || 1);
  if (totalPagesSafe <= 1 && (!showWhenSinglePage || totalItems <= 0)) {
    return null;
  }

  const handlePageClick = (page) => {
    if (
      page >= 1 &&
      page <= totalPagesSafe &&
      page !== currentPage &&
      onPageChange
    ) {
      onPageChange(page);
    }
  };

  // Tính toán các trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Số trang tối đa hiển thị

    if (totalPagesSafe <= maxVisible) {
      // Hiển thị tất cả nếu <= maxVisible
      for (let i = 1; i <= totalPagesSafe; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị với ellipsis
      if (currentPage <= 4) {
        // Gần đầu
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPagesSafe);
      } else if (currentPage >= totalPagesSafe - 3) {
        // Gần cuối
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPagesSafe - 4; i <= totalPagesSafe; i++) pages.push(i);
      } else {
        // Ở giữa
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {/* Thông tin số lượng */}
      <div className="text-xs text-slate-500">
        Hiển thị <span className="font-medium text-slate-700">{startItem}</span> -{" "}
        <span className="font-medium text-slate-700">{endItem}</span> trong tổng số{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> kết quả
      </div>

      {/* Nút phân trang */}
      <div className="flex items-center gap-0.5">
        {/* Nút Previous */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
          className="px-2 py-1 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          ← Trước
        </button>

        {/* Số trang */}
        {pageNumbers.map((page, idx) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-1.5 py-1 text-xs text-slate-400 select-none"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              aria-label={`Trang ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "px-2.5 py-1 text-xs font-medium rounded-md border min-w-[2rem] transition-colors",
                isActive
                  ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
              ].join(" ")}
            >
              {page}
            </button>
          );
        })}

        {/* Nút Next */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPagesSafe}
          aria-label="Trang sau"
          className="px-2 py-1 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

