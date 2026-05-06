import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Avatar from "../ui/Avatar.jsx";
import {
  formatDisplayText,
  formatNurseTypeLabel,
  formatRoleLabel,
  formatWorkStatusLabel,
} from "../../utils/textFormatters.js";
import { getDemoPublicImage } from "../../utils/demoPublicImages.js";

const STATUS_BADGE = {
  dang_cong_tac: {
    label: "Đang công tác",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  tam_nghi: {
    label: "Tạm nghỉ",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  nghi_viec: {
    label: "Nghỉ việc",
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
  khoa: {
    label: "Đã khóa",
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
  hoat_dong: {
    label: "Hoạt động",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

function StatusBadge({ status }) {
  const info = STATUS_BADGE[status] || {
    label: formatWorkStatusLabel(status, "—"),
    cls: "bg-slate-50 text-slate-500 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${info.cls}`}
    >
      {formatWorkStatusLabel(status, info.label || "—")}
    </span>
  );
}

function getDisplayNurseType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "ls") return "Lâm sàng";
  if (raw === "cls") return "Cận lâm sàng";
  if (raw === "hanhchinh") return "Hành chính";
  return formatNurseTypeLabel(value, "—");
}

function getWorkStatusCode(item = {}) {
  const raw = String(item.trangThaiCongTac || item.TrangThaiCongTac || "").trim();
  if (raw) return raw;

  const presence = String(item.status || "").trim().toLowerCase();
  if (presence === "online") return "dang_cong_tac";
  if (presence === "pause") return "tam_nghi";
  if (presence === "offline") return "nghi_viec";
  return presence || "dang_cong_tac";
}

const WORK_STATUS_ACTIONS = [
  { value: "dang_cong_tac", label: "Đang công tác", className: "text-emerald-700 hover:bg-emerald-50" },
  { value: "tam_nghi", label: "Tạm nghỉ", className: "text-amber-700 hover:bg-amber-50" },
  { value: "nghi_viec", label: "Nghỉ việc", className: "text-red-700 hover:bg-red-50" },
];

function ActionMenu({
  item,
  onEdit,
  onLock,
  onUnlock,
  onResetPw,
  onDetail,
  onSchedule,
  onWorkStatusChange,
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const isLocked =
    item.trangThai === "khoa" ||
    item.trangThaiTaiKhoan === "khoa" ||
    item.statusAccount === "khoa";
  const currentWorkStatus = getWorkStatusCode(item);

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = 224;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const desiredLeft = rect.right - menuWidth;
    const desiredTop = rect.bottom + 8;

    setMenuPos({
      left: Math.max(12, Math.min(desiredLeft, viewportWidth - menuWidth - 12)),
      top: Math.max(12, Math.min(desiredTop, viewportHeight - 12 - 340)),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleWindowChange = () => updateMenuPosition();
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const renderPortalMenu = () => {
    if (!open || typeof document === "undefined") return null;

    return createPortal(
      <>
        <div className="fixed inset-0 z-[120]" onClick={() => setOpen(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.14 }}
          className="fixed z-[130] w-56 rounded-2xl bg-white py-1.5 shadow-2xl ring-1 ring-slate-200"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-teal-50"
            onClick={() => {
              onDetail?.(item);
              setOpen(false);
            }}
          >
            <span>Chi tiết</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-sky-700 hover:bg-sky-50"
            onClick={() => {
              onEdit?.(item);
              setOpen(false);
            }}
          >
            <span>Sửa thông tin</span>
          </button>
          {onSchedule ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-violet-700 hover:bg-violet-50"
              onClick={() => {
                onSchedule?.(item);
                setOpen(false);
              }}
            >
              <span>Lịch làm</span>
            </button>
          ) : null}
          {onWorkStatusChange ? (
            <div className="my-1 border-t border-slate-100 pt-1">
              <div className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Trạng thái làm việc
              </div>
              {WORK_STATUS_ACTIONS.filter((action) => action.value !== currentWorkStatus).map((action) => (
                <button
                  key={action.value}
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] ${action.className}`}
                  onClick={() => {
                    onWorkStatusChange?.(item, action.value);
                    setOpen(false);
                  }}
                >
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          ) : null}
          {isLocked ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                onUnlock?.(item);
                setOpen(false);
              }}
            >
              <span>Mở khóa</span>
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
              onClick={() => {
                onLock?.(item);
                setOpen(false);
              }}
            >
              <span>Khóa tài khoản</span>
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-amber-700 hover:bg-amber-50"
            onClick={() => {
              onResetPw?.(item);
              setOpen(false);
            }}
          >
            <span>Reset mật khẩu</span>
          </button>
        </motion.div>
      </>,
      document.body
    );
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100"
          title="Thao tác"
        >
          ⋯
        </button>
      </div>
      {renderPortalMenu()}
    </>
  );
}

export default function StaffTable({
  items = [],
  showAuth = false,
  adminMode = false,
  onDetail,
  onEdit,
  onLock,
  onUnlock,
  onResetPw,
  onSchedule,
  onWorkStatusChange,
}) {
  if (!items.length) {
    return (
      <section className="flex min-h-[320px] h-full items-center justify-center rounded-2xl bg-white text-sm text-slate-500 ring-1 ring-slate-200/60">
        Không tìm thấy nhân sự phù hợp.
      </section>
    );
  }

  const showAdminAccountColumns = showAuth && adminMode;
  const showMedicalStaffColumns = !showAdminAccountColumns;

  return (
    <div className="overflow-auto scrollbar-none rounded-xl bg-white ring-1 ring-slate-200/80">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2.5 font-semibold">
              {showAdminAccountColumns ? "Tài khoản admin" : "Nhân viên"}
            </th>
            {showAdminAccountColumns ? (
              <th className="px-3 py-2.5 font-semibold">Email</th>
            ) : (
              <th className="px-3 py-2.5 font-semibold">Khoa</th>
            )}
            {showAdminAccountColumns ? (
              <th className="px-3 py-2.5 font-semibold">Mã nhân viên</th>
            ) : (
              <th className="px-3 py-2.5 font-semibold">Chức vụ</th>
            )}
            <th className="px-3 py-2.5 font-semibold">SĐT</th>
            {showAuth && (
              <>
                <th className="px-3 py-2.5 font-semibold">Tên đăng nhập</th>
                <th className="px-3 py-2.5 font-semibold">Vai trò</th>
                {!showAdminAccountColumns && (
                  <th className="px-3 py-2.5 font-semibold">Loại YT</th>
                )}
                <th className="px-3 py-2.5 font-semibold">Trạng thái TK</th>
              </>
            )}
            <th className="px-3 py-2.5 font-semibold">
              TT công tác
            </th>
            {showAuth && <th className="w-12 px-3 py-2.5 font-semibold" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <motion.tr
              key={item.id || item.maNhanVien || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="group transition-colors hover:bg-teal-50/40"
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar src={getDemoPublicImage(item)} item={item} size={32} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">
                      {formatDisplayText(item.name || item.hoTen, "—")}
                    </div>
                    {(showMedicalStaffColumns ? item.email : item.maNhanVien || item.ma_nhan_vien) && (
                      <div className="truncate text-[11px] text-slate-400">
                        {showMedicalStaffColumns
                          ? item.email
                          : item.maNhanVien || item.ma_nhan_vien}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {showAdminAccountColumns ? (
                <>
                  <td className="px-3 py-2.5 text-slate-600">
                    {formatDisplayText(item.email, "—")}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.maNhanVien || item.ma_nhan_vien || "—"}
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2.5 text-slate-600">
                    {formatDisplayText(
                      item.dept || item.tenKhoa || item.departmentName || item.maKhoa,
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-slate-600">
                    {formatDisplayText(item.position || item.chucVu, "—")}
                  </td>
                </>
              )}

              <td className="px-3 py-2.5 text-slate-600">
                {item.phone || item.dienThoai || "—"}
              </td>

              {showAuth && (
                <>
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700">
                      {item.username || item.tenDangNhap || "—"}
                    </code>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
                      {formatRoleLabel(item.role || item.vaiTro, "—")}
                    </span>
                  </td>
                  {!showAdminAccountColumns && (
                    <td className="px-3 py-2.5 text-[12px] text-slate-500">
                      {getDisplayNurseType(item.nurseType || item.loaiYTa)}
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={
                        item.trangThaiTaiKhoan ||
                        item.trangThai ||
                        item.statusAccount ||
                        "hoat_dong"
                      }
                    />
                  </td>
                </>
              )}

              <td className="px-3 py-2.5">
                <StatusBadge
                  status={item.status || item.trangThaiCongTac || "dang_cong_tac"}
                />
              </td>

              {showAuth && (
                <td className="px-3 py-2.5">
                  <ActionMenu
                    item={item}
                    onDetail={onDetail}
                    onEdit={onEdit}
                    onSchedule={onSchedule}
                    onLock={onLock}
                    onUnlock={onUnlock}
                    onResetPw={onResetPw}
                    onWorkStatusChange={onWorkStatusChange}
                  />
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
