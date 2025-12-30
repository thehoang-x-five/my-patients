// src/components/ui/Pagination.jsx
import React from "react";
import Button from "./Button.jsx";

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
  className = "",
}) {
  if (totalPages <= 1) return null; // Không hiển thị nếu chỉ có 1 trang

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  // Tính toán các trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Số trang tối đa hiển thị

    if (totalPages <= maxVisible) {
      // Hiển thị tất cả nếu <= maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị với ellipsis
      if (currentPage <= 4) {
        // Gần đầu
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Gần cuối
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
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
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Thông tin số lượng */}
      <div className="text-sm text-slate-600">
        Hiển thị <span className="font-semibold text-slate-900">{startItem}</span> -{" "}
        <span className="font-semibold text-slate-900">{endItem}</span> trong tổng số{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span> kết quả
      </div>

      {/* Nút phân trang */}
      <div className="flex items-center gap-1">
        {/* Nút Previous */}
        <Button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
          className="!px-3 !py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Trước
        </Button>

        {/* Số trang */}
        {pageNumbers.map((page, idx) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-slate-400 select-none"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              onClick={() => handlePageClick(page)}
              aria-label={`Trang ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "!px-3 !py-1.5 text-sm min-w-[2.5rem]",
                isActive
                  ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {page}
            </Button>
          );
        })}

        {/* Nút Next */}
        <Button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
          className="!px-3 !py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sau →
        </Button>
      </div>
    </div>
  );
}

