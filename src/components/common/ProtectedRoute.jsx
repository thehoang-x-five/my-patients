// src/components/common/ProtectedRoute.jsx
// Tầng 2: Route Guard — chặn truy cập URL trực tiếp nếu không có quyền
// Dùng trong main.jsx để wrap routes cần phân quyền

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/appStore.js';
import { TAB_VISIBILITY } from '../../utils/permissions.js';

/**
 * Route guard cho phân quyền tầng 2.
 * @param {string} permKey - Key trong TAB_VISIBILITY (ví dụ: 'appointments', 'userManagement')
 * @param {React.ReactNode} children - Component con sẽ render nếu có quyền
 * @param {string} [redirectTo='/'] - URL redirect khi không có quyền
 */
export default function ProtectedRoute({ permKey, children, redirectTo = '/' }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Chưa đăng nhập → redirect login (App.jsx đã handle, nhưng double-check)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền tab
  const checker = TAB_VISIBILITY[permKey];
  if (checker && !checker(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
