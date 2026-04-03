// src/components/common/ScopeBadge.jsx
// Tầng 6-7 RBAC: Hiện phạm vi dữ liệu cho user không có global scope
// Dùng trong các trang cần thông báo data scope (Overview, Reports, etc.)

import React from 'react';
import { useAuthStore } from '../stores/appStore.js';
import { hasGlobalScope, getScopeLabel } from '../../utils/permissions.js';

/**
 * Badge hiển thị data scope cho user.
 * Chỉ hiện khi user không có global scope (Admin/Y tá HC).
 * @param {string} [className] - Thêm class cho wrapper div
 */
export default function ScopeBadge({ className = '' }) {
  const user = useAuthStore((s) => s.user);

  if (hasGlobalScope(user)) return null;

  const label = getScopeLabel(user);
  if (!label) return null;

  return (
    <div className={className}>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-600/40 transition-colors">
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </span>
    </div>
  );
}
