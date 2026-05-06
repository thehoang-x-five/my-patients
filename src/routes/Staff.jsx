// src/pages/Staff.jsx
// Week 4 — Staff page dùng chung cho mọi vai trò
// Admin: toggle Card↔Table, thấy auth fields, có admin actions (khóa/mở/reset)
// Non-admin: chỉ Cards HR, read-only
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useDeferredValue,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import StaffToolbar from "../components/staff/StaffToolbar.jsx";
import StaffFilterPopover from "../components/staff/StaffFilterPopover.jsx";
import StaffGrid from "../components/staff/StaffGrid.jsx";
import StaffTable from "../components/staff/StaffTable.jsx";
import StaffDetail from "../components/staff/StaffDetail.jsx";
import StaffSchedule from "../components/staff/StaffSchedule.jsx";
import StaffScheduleManagerModal from "../components/staff/StaffScheduleManagerModal.jsx";
import ViewToggle from "../components/staff/ViewToggle.jsx";
import AdminStaffFormModal from "../components/staff/AdminStaffFormModal.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import PromptModal from "../components/ui/PromptModal.jsx";

import useMediaQuery from "../hooks/useMediaQuery.js";
import useViewportVH from "../hooks/useViewportVH.js";
import { useAuthStore } from "../components/stores/appStore.js";
import { useUI } from "../context/UIContext.jsx";

import {
  useStaff,
  useStaffStats,
  useDutyRoom,
  useStaffSchedule,
  useUpdateStaffDutyWeek,
  subscribeStaff,
  useDepartments,
  useStaffDetailQuery,
} from "../api/staff.js";
import { useRoomCatalog } from "../api/departments.js";

import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useLockUnlockAccount,
  useResetPassword,
} from "../api/admin.js";

import {
  canToggleStaffView,
  canViewStaffAuth,
  canLockUnlockStaff,
  canResetStaffPassword,
  isAdmin as checkIsAdmin,
} from "../utils/permissions.js";

const WORK_STATUS_LABELS = {
  dang_cong_tac: "đang công tác",
  tam_nghi: "tạm nghỉ",
  nghi_viec: "nghỉ việc",
};

export default function Staff() {
  const TABLE_PAGE_SIZE = 15;
  const CARD_PAGE_SIZE = 12;

  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userIsAdmin = checkIsAdmin(user);
  const { lang } = useUI();
  const staffUi = useMemo(
    () => ({
      addStaff: lang === "en" ? "Add staff" : "Thêm nhân viên",
      pageTitle: lang === "en" ? "Staff" : "Nhân sự",
    }),
    [lang]
  );

  // ====== VIEW MODE (Card / Table) — chỉ admin toggle ======
  const [viewMode, setViewMode] = useState(() =>
    userIsAdmin ? "table" : "card"
  ); // "card" | "table"

  // ====== FILTER STATE ======
  const [role, setRole] = useState(() => (userIsAdmin ? "all" : "doctor"));
  const [filters, setFilters] = useState({
    keyword: "",
    status: "all",
    dept: "",
    nurseType: "all",
  });
  const [page, setPage] = useState(1);

  const deferredKeyword = useDeferredValue(filters.keyword);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const resetAllFilters = useCallback(() => {
    setRole(userIsAdmin ? "all" : "doctor");
    setFilters({
      keyword: "",
      status: "all",
      dept: "",
      nurseType: "all",
    });
    setPage(1);
  }, [userIsAdmin]);

  // ====== MODAL STATE ======
  const [active, setActive] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [lockTarget, setLockTarget] = useState(null);
  const [workStatusTarget, setWorkStatusTarget] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);

  const openDetail = (item) => {
    setActive(item);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  const openSchedule = (item) => {
    setActive(item);
    setShowSchedule(true);
  };
  const closeSchedule = () => setShowSchedule(false);

  const openCreate = () => {
    setEditUser(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditUser(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditUser(null);
  };

  // ====== DATA: STAFF LIST (non-admin) ======
  const apiRole =
    role === "doctor"
      ? "bac_si"
      : role === "nurse"
        ? "y_ta"
        : role === "technician"
          ? "ky_thuat_vien"
          : role === "adminRole"
            ? "admin"
            : "";

  const apiStatus =
    filters.status === "all"
      ? undefined
      : filters.status === "online"
        ? "dang_cong_tac"
        : filters.status === "pause"
          ? "tam_nghi"
          : filters.status === "offline"
            ? "nghi_viec"
            : undefined;

  const apiNurseKind =
    role === "nurse" && filters.nurseType !== "all"
      ? filters.nurseType
      : undefined;

  const apiDept = filters.dept || undefined;
  const isAdminRoleView = userIsAdmin && role === "adminRole";
  const effectiveViewMode = isAdminRoleView ? "table" : viewMode;
  const pageSize =
    effectiveViewMode === "table" ? TABLE_PAGE_SIZE : CARD_PAGE_SIZE;

  // Non-admin: dùng staff API bình thường
  const { data: staffData, isLoading: staffLoading } = useStaff({
    role: apiRole,
    q: deferredKeyword || undefined,
    status: apiStatus,
    nurseKind: apiNurseKind,
    dept: apiDept,
    page,
    pageSize,
  });

  // Admin: dùng admin API khi ở table view → lấy thêm auth fields
  const adminFilter = useMemo(
    () => ({
      q: deferredKeyword || undefined,
      vaiTro: apiRole || undefined,
      loaiYTa: apiNurseKind,
      trangThai: apiStatus,
      maKhoa: apiDept,
      page,
      pageSize,
    }),
    [deferredKeyword, apiRole, apiNurseKind, apiStatus, apiDept, page, pageSize]
  );

  const isTableAdmin = userIsAdmin && effectiveViewMode === "table";

  const { data: adminData, isLoading: adminLoading } = useAdminUsers(
    adminFilter,
    { enabled: isTableAdmin }
  );

  // Chọn data source theo mode
  const items = useMemo(() => {
    if (isTableAdmin) {
      return adminData?.items || [];
    }
    return staffData?.Items ?? staffData?.items ?? [];
  }, [isTableAdmin, adminData, staffData]);

  const isLoading = isTableAdmin ? adminLoading : staffLoading;
  const activeData = isTableAdmin ? adminData : staffData;
  const totalItems =
    activeData?.TotalItems ??
    activeData?.totalItems ??
    items.length;
  const currentPage =
    activeData?.Page ??
    activeData?.page ??
    page;
  const currentPageSize =
    activeData?.PageSize ??
    activeData?.pageSize ??
    pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / Math.max(currentPageSize || pageSize, 1))
  );

  // ====== STATS ======
  const { data: statsRes } = useStaffStats({
    role: apiRole,
    status: apiStatus,
    nurseKind: apiNurseKind,
    dept: apiDept,
  });
  const online = statsRes?.online ?? 0;
  const pause = statsRes?.idle ?? 0;
  const deptsCount = statsRes?.depts ?? 0;

  const offline = useMemo(() => {
    if (typeof statsRes?.offline === "number") return statsRes.offline;
    let count = 0;
    for (const s of items) {
      const v = (s.status || s.trangThai || "").toString().toLowerCase();
      if (v === "offline") count++;
    }
    return count;
  }, [statsRes, items]);

  const total = online + pause + offline;
  const stats = useMemo(
    () => ({ total, online, pause, offline, depts: deptsCount }),
    [total, online, pause, offline, deptsCount]
  );

  // ====== MASTER DATA: KHOA ======
  const { data: depsData } = useDepartments();
  const { data: roomCatalogRes } = useRoomCatalog(
    { page: 1, pageSize: 200 },
    { enabled: userIsAdmin }
  );
  const departments = useMemo(() => {
    if (Array.isArray(depsData)) return depsData;
    if (Array.isArray(depsData?.data)) return depsData.data;
    return [];
  }, [depsData]);
  const roomCatalog = roomCatalogRes?.items || [];

  const localizedRoleTabs = useMemo(
    () =>
      userIsAdmin
        ? [
          { key: "all", label: lang === "en" ? "All" : "Tất cả" },
          { key: "doctor", label: lang === "en" ? "Doctors" : "Bác sĩ" },
          { key: "nurse", label: lang === "en" ? "Nurses" : "Y tá" },
          {
            key: "technician",
            label: lang === "en" ? "Technicians" : "KTV",
          },
          { key: "adminRole", label: "Admin" },
        ]
        : [
          { key: "doctor", label: lang === "en" ? "Doctors" : "Bác sĩ" },
          { key: "nurse", label: lang === "en" ? "Nurses" : "Y tá" },
          {
            key: "technician",
            label: lang === "en" ? "Technicians" : "KTV",
          },
        ],
    [lang, userIsAdmin]
  );

  const roleTabs = useMemo(
    () =>
      userIsAdmin
        ? [
          { key: "all", label: "Tất cả" },
          { key: "doctor", label: "Bác sĩ" },
          { key: "nurse", label: "Y tá" },
          { key: "technician", label: "KTV" },
          { key: "adminRole", label: "Admin" },
        ]
        : [
          { key: "doctor", label: "Bác sĩ" },
          { key: "nurse", label: "Y tá" },
          { key: "technician", label: "KTV" },
        ],
    [userIsAdmin]
  );

  // ====== LỊCH TRỰC + LỊCH LÀM VIỆC ======
  const activeId =
    active?.id ?? active?.maNhanSu ?? active?.maNhanVien ?? null;
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const { data: activeStaffDetail } = useStaffDetailQuery(activeId, {
    enabled: userIsAdmin && showSchedule && !!activeId,
  });

  const { data: duty } = useDutyRoom(activeId, todayStr);
  const { data: sched } = useStaffSchedule(activeId);

  const scheduleMap = useMemo(() => {
    if (!sched?.week) return null;
    const map = {};
    for (const row of sched.week) map[row.day] = row.shift;
    return map;
  }, [sched]);

  const dutyRoomsMap = useMemo(() => {
    if (!duty?.week) return null;
    const map = {};
    for (const row of duty.week) {
      const key = row.day;
      if (!key) continue;
      map[key] = row.tenPhong || row.maPhong || "—";
    }
    return map;
  }, [duty]);

  // ====== ADMIN ACTIONS (mutations) ======
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateUserStatus = useUpdateUserStatus();
  const lockUnlock = useLockUnlockAccount();
  const resetPw = useResetPassword();
  const updateStaffDutyWeek = useUpdateStaffDutyWeek();

  const handleCreate = useCallback(
    (payload) => {
      createUser.mutate(payload, {
        onSuccess: () => {
          toast.success("Tạo nhân viên thành công");
          closeForm();
        },
        onError: (error) => {
          toast.error(error?.message || "Không thể tạo nhân viên");
        },
      });
    },
    [createUser]
  );

  const handleEdit = useCallback(
    (payload) => {
      if (!editUser?.id && !editUser?.maNhanVien) return;

      updateUser.mutate(
        {
          id: editUser.id || editUser.maNhanVien,
          data: payload,
        },
        {
          onSuccess: () => {
            toast.success("Cập nhật nhân viên thành công");
            closeForm();
          },
          onError: (error) => {
            toast.error(error?.message || "Không thể cập nhật nhân viên");
          },
        }
      );
    },
    [editUser, updateUser]
  );

  const handleLock = useCallback(
    (item) => {
      if (!item) return;
      setLockTarget(item);
    },
    []
  );

  const confirmLock = useCallback(() => {
    if (!lockTarget) return;
    lockUnlock.mutate({
      id: lockTarget.id || lockTarget.maNhanVien,
      data: { TrangThai: "khoa" },
    }, {
      onSuccess: () => {
        toast.success("Đã khóa tài khoản");
        setLockTarget(null);
      },
      onError: (error) => toast.error(error?.message || "Không thể khóa tài khoản"),
    });
  },
    [lockTarget, lockUnlock]
  );

  const handleUnlock = useCallback(
    (item) => {
      lockUnlock.mutate({
        id: item.id || item.maNhanVien,
        data: { TrangThai: "hoat_dong" },
      }, {
        onSuccess: () => toast.success("Đã mở khóa tài khoản"),
        onError: (error) => toast.error(error?.message || "Không thể mở khóa tài khoản"),
      });
    },
    [lockUnlock]
  );

  const handleWorkStatusChange = useCallback((item, nextStatus) => {
    if (!item || !nextStatus) return;
    setWorkStatusTarget({ item, nextStatus });
  }, []);

  const confirmWorkStatusChange = useCallback(() => {
    const item = workStatusTarget?.item;
    const nextStatus = workStatusTarget?.nextStatus;
    if (!item || !nextStatus) return;

    updateUserStatus.mutate(
      {
        id: item.id || item.maNhanVien,
        data: { TrangThaiCongTac: nextStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Đã chuyển trạng thái làm việc sang ${WORK_STATUS_LABELS[nextStatus] || nextStatus}`);
          setWorkStatusTarget(null);
        },
        onError: (error) => toast.error(error?.message || "Không thể cập nhật trạng thái làm việc"),
      }
    );
  }, [updateUserStatus, workStatusTarget]);

  const handleResetPw = useCallback(
    (item) => {
      if (!item) return;
      setResetPasswordTarget(item);
    },
    []
  );

  const submitResetPw = useCallback(
    (newPw) => {
      if (!resetPasswordTarget) return;
      const nextPassword = String(newPw || "").trim();
      if (!nextPassword) return;
      resetPw.mutate({
        id: resetPasswordTarget.id || resetPasswordTarget.maNhanVien,
        data: { MatKhauMoi: nextPassword },
      }, {
        onSuccess: () => {
          toast.success("Đặt lại mật khẩu thành công");
          setResetPasswordTarget(null);
        },
        onError: (error) => toast.error(error?.message || "Không thể đặt lại mật khẩu"),
      });
    },
    [resetPasswordTarget, resetPw]
  );

  const handleSaveSchedule = useCallback(
    (payload) => {
      const staffId = active?.id || active?.maNhanSu || active?.maNhanVien;
      if (!staffId) return;

      updateStaffDutyWeek.mutate(
        { id: staffId, data: payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật lịch làm thành công");
            closeSchedule();
          },
          onError: (error) => {
            toast.error(
              error?.message ||
              "Không thể cập nhật lịch làm"
            );
          },
        }
      );
    },
    [active, closeSchedule, updateStaffDutyWeek]
  );

  // ====== REALTIME ======
  useEffect(() => {
    const off = subscribeStaff(qc);
    return () => {
      if (typeof off === "function") off();
    };
  }, [qc]);

  useEffect(() => {
    if (!userIsAdmin) return;
    setViewMode((prev) => (prev === "card" || prev === "table" ? prev : "table"));
    setRole((prev) => prev || "all");
  }, [userIsAdmin]);

  useEffect(() => {
    if (isAdminRoleView) {
      setViewMode("table");
      setShowSchedule(false);
    }
  }, [isAdminRoleView]);

  useEffect(() => {
    setPage(1);
  }, [role, filters.keyword, filters.status, filters.dept, filters.nurseType, effectiveViewMode]);

  useEffect(() => {
    if (!isLoading && page > totalPages) {
      setPage(totalPages);
    }
  }, [isLoading, page, totalPages]);

  // ====== RENDER ======
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label={staffUi.pageTitle}
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* Toolbar: stats + filter + tabs + toggle */}
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <StaffToolbar
              stats={stats}
              onOpenFilter={() => setFilterOpen(true)}
              onResetFilters={resetAllFilters}
              filterBtnRef={filterBtnRef}
            />
          </div>

          {(canToggleStaffView(user) || userIsAdmin) && (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {canToggleStaffView(user) && !isAdminRoleView && (
                <ViewToggle mode={viewMode} onChange={setViewMode} />
              )}

              {userIsAdmin && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-px"
                >
                  <span className="text-base leading-none">+</span>
                  <span>{staffUi.addStaff}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content: Grid hoặc Table */}
        <div className="card mt-2.5 p-1 pt-0 flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                viewMode +
                "|" +
                role +
                "|" +
                (filters.keyword || "") +
                "|" +
                filters.status +
                "|" +
                filters.dept +
                "|" +
                filters.nurseType
              }
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex-1 min-h-0"
            >
              <div className="h-full min-h-0 overflow-auto scrollbar-none">
                {effectiveViewMode === "table" && canViewStaffAuth(user) ? (
                  <StaffTable
                    items={items}
                    showAuth={canViewStaffAuth(user)}
                    adminMode={isAdminRoleView}
                    onDetail={openDetail}
                    onSchedule={isAdminRoleView ? undefined : openSchedule}
                    onEdit={openEdit}
                    onLock={canLockUnlockStaff(user) ? handleLock : undefined}
                    onUnlock={
                      canLockUnlockStaff(user) ? handleUnlock : undefined
                    }
                    onWorkStatusChange={
                      userIsAdmin ? handleWorkStatusChange : undefined
                    }
                    onResetPw={
                      canResetStaffPassword(user) ? handleResetPw : undefined
                    }
                  />
                ) : (
                  <StaffGrid
                    items={items}
                    role={role}
                    loading={isLoading}
                    onDetail={openDetail}
                    onSchedule={openSchedule}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {totalItems > 0 && (
            <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={currentPageSize}
                showWhenSinglePage
                onPageChange={setPage}
                className="px-4 py-3"
              />
            </div>
          )}
        </div>
      </div>

      {/* Popover filter */}
      <StaffFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterBtnRef}
        role={role}
        setRole={setRole}
        roleOptions={localizedRoleTabs}
        values={filters}
        setValues={setFilters}
        departments={departments}
        onReset={resetAllFilters}
      />

      {/* Modal chi tiết */}
      <StaffDetail
        open={showDetail}
        item={active}
        role={role}
        schedule={scheduleMap || null}
        roomToday={
          duty?.today?.tenPhong ||
          duty?.today?.tenPhongHoacBanHomNay ||
          duty?.today?.maPhong ||
          null
        }
        weekRoom={dutyRoomsMap || null}
        onClose={closeDetail}
      />

      {/* Modal lịch trực */}
      {userIsAdmin ? (
        <StaffScheduleManagerModal
          open={showSchedule}
          item={activeStaffDetail || active}
          today={sched?.today || todayStr}
          weekItems={sched?.week || []}
          rooms={roomCatalog}
          onClose={closeSchedule}
          onSave={handleSaveSchedule}
          isPending={updateStaffDutyWeek.isPending}
        />
      ) : (
        <StaffSchedule
          open={showSchedule}
          item={active}
          schedule={scheduleMap || null}
          dutyRooms={dutyRoomsMap || null}
          onClose={closeSchedule}
        />
      )}

      <AdminStaffFormModal
        open={showForm}
        initial={editUser}
        isEdit={!!editUser}
        onClose={closeForm}
        onSubmit={editUser ? handleEdit : handleCreate}
        isPending={createUser.isPending || updateUser.isPending}
        departments={departments}
      />

      <ConfirmModal
        open={!!workStatusTarget}
        onClose={() => setWorkStatusTarget(null)}
        onConfirm={confirmWorkStatusChange}
        title="Cập nhật trạng thái làm việc"
        message={
          workStatusTarget
            ? `Chuyển "${workStatusTarget.item?.name || workStatusTarget.item?.hoTen || workStatusTarget.item?.username}" sang trạng thái ${WORK_STATUS_LABELS[workStatusTarget.nextStatus] || workStatusTarget.nextStatus}?`
            : "Cập nhật trạng thái làm việc?"
        }
        confirmText="Cập nhật"
        cancelText="Hủy"
        tone={workStatusTarget?.nextStatus === "nghi_viec" ? "danger" : "warning"}
        isPending={updateUserStatus.isPending}
      />

      <ConfirmModal
        open={!!lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={confirmLock}
        title="Xác nhận khóa tài khoản"
        message={
          lockTarget
            ? `Khóa tài khoản "${lockTarget.name || lockTarget.username}"?`
            : "Khóa tài khoản này?"
        }
        confirmText="Khóa tài khoản"
        cancelText="Hủy"
        tone="warning"
        isPending={lockUnlock.isPending}
      />

      <PromptModal
        open={!!resetPasswordTarget}
        title="Đặt lại mật khẩu"
        message={
          resetPasswordTarget
            ? `Nhập mật khẩu mới cho "${resetPasswordTarget.name || resetPasswordTarget.username}".`
            : ""
        }
        value=""
        placeholder="Nhập mật khẩu mới"
        confirmText="Đặt lại"
        cancelText="Hủy"
        isPending={resetPw.isPending}
        onClose={() => setResetPasswordTarget(null)}
        onConfirm={submitResetPw}
      />
    </motion.main>
  );
}
