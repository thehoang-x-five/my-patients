// src/components/patients/PatientsTable.jsx
import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";

import {
  STATUSES,
  useUpdatePatientStatus,
  mapTodayStatusLabel,
} from "../../api/patients.js";

import { useEnqueueService, useReturnToDoctor } from "../../api/queue.js";


/* ===== Helpers normalize theo ERD ===== */
function getAccount(p) {
  return (
    p?.trang_thai_tai_khoan ??
    p?.accountStatus ??
    p?.account?.status ??
    ""
  );
}
function getTodayStatusCode(p) {
  return (
    p?.trang_thai_hom_nay_code ??
    p?.statusCode ??
    p?.trang_thai_hom_nay ??
    p?.todayStatus ??
    p?.status ??
    ""
  );
}
function getStatusDate(p) {
  return p?.ngay_trang_thai ?? p?.statusDate ?? "";
}
function getVitals(p) {
  return p?.sinh_hieu ?? p?.vitals ?? "";
}

/* ===== UI helpers ===== */
function StatusBadge({ s }) {
  const label = mapTodayStatusLabel(s);
  const low = (label || "").toLowerCase();
  const cls =
    /hoàn thành/.test(low)
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : /hẹn tái khám/.test(low)
      ? "bg-teal-50 text-teal-800 ring-teal-200"
      : /hẹn khám/.test(low)
      ? "bg-cyan-50 text-cyan-800 ring-cyan-200"
      : /(chờ (tiếp nhận|khám|xử lý) \(dịch vụ\))|chờ khám/i.test(low)
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : /chờ/.test(low)
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";
  const dot =
    /hoàn thành/.test(low)
      ? "bg-emerald-500"
      : /hẹn|dịch vụ|chờ/.test(low)
      ? "bg-amber-500"
      : "bg-slate-400";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${cls}`}>
      <i className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label || "—"}
    </span>
  );
}
function AccountBadge({ a }) {
  const low = (a || "").toLowerCase();
  const cls =
    /đã xóa|da_xoa|xoa/.test(low)
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : /không hoạt động|khong_hoat_dong/.test(low)
      ? "bg-slate-50 text-slate-700 ring-slate-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  const text =
    /đã xóa|da_xoa|xoa/.test(low)
      ? "Đã xóa"
      : /không hoạt động|khong_hoat_dong/.test(low)
      ? "Không hoạt động"
      : /hoat_dong|hoạt động|active|1/.test(low)
      ? "Hoạt động"
      : a || "—";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}>
      {text}
    </span>
  );
}

function InitialAvatar({ name = "", id = "" }) {
  const seed = (name || id || "A").charCodeAt(0) % 5;
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-emerald-100 text-emerald-700",
    "bg-cyan-100 text-cyan-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const initials = (name || id || "BN")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className={`w-7 h-7 px-1.5 pr-2 rounded-full grid place-items-center text-[11px] font-extrabold ring-1 ring-slate-200/70 ${colors[seed]}`}>
      {initials || "BN"}
    </span>
  );
}

const Thead = ({ children }) => (
  <thead className="text-left text-[13px] font-semibold text-slate-600 shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]">
    <tr>{children}</tr>
  </thead>
);

const Th = ({ children, first, last, right }) => (
  <th
    className={[
      "sticky top-0 z-10 px-3 py-3 whitespace-nowrap",
      "bg-white/80 backdrop-blur",
      "bg-gradient-to-b from-teal-50 to-slate-50/40",
      "ring-1 ring-slate-200/70",
      first ? "rounded-l-xl" : "",
      last ? "rounded-r-xl" : "",
      right ? "text-right" : "",
    ].join(" ")}
  >
    {children}
  </th>
);

const Row = ({ i, children, pulse, ...rest }) => (
  <motion.tr
    {...rest}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.02 }}
    whileHover={{ y: -2 }}
    className={[
      "group odd:bg-slate-50/40 hover:bg-emerald-100/50 focus-within:bg-teal-50/60 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]",
      pulse ? "flash-once" : "",
    ].join(" ")}
  >
    {children}
  </motion.tr>
);

const Td = ({ children, first, last, right, classNameOverride = "" }) => (
  <td
    className={[
      "px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/70",
      first ? "pl-3 rounded-l-lg" : "",
      last ? "pr-3 rounded-r-lg" : "",
      right ? "text-right tabular-nums" : "",
      classNameOverride,
    ].join(" ")}
  >
    {children}
  </td>
);

// ===== Helpers =====
function safeCssEscape(v) {
  const s = String(v ?? "");
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
}

export default function PatientsTable({
  items = [],
  onAction,
  stretch = false,
  highlightPid = null,
}) {
  // ===== mutations =====
  const enqueueServiceMut = useEnqueueService();
  const returnToDoctorMut = useReturnToDoctor();
  const updatePatientStatus = useUpdatePatientStatus();

  const handleStartToday = (p) => {
    if (!p) return;
    const id = p.id ?? p.pid;
    if (!id) return;
    // Call UpdateDailyStatus với status "cho_tiep_nhan"
    updatePatientStatus.mutate({
      id,
      status: "cho_tiep_nhan",
    });
  };

  // scroll tới dòng được highlight
  useEffect(() => {
    if (!highlightPid) return;
    const row = document.querySelector(
      `tr[data-pid="${safeCssEscape(highlightPid)}"]`
    );
    if (row && row.scrollIntoView) {
      try {
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
    }
  }, [highlightPid]);

  function handleSendService(p) {
    const list = p?.serviceOrder?.items || [];
    const note = p?.serviceOrder?.note || "";
    const pid = p.id ?? p.pid;
    if (!list.length) return;

    enqueueServiceMut.mutate({
      pid,
      name: p.name,
      services: list,
      note,
      dept: "Cận lâm sàng",
      doctor: "Khu dịch vụ",
    });
    // Cập nhật trạng thái: đã gửi dịch vụ đi
    updatePatientStatus.mutate({
      id: pid,
      status: STATUSES.WAIT_EXAM_SVC,
    });
  }

  function handleReturnToDoctor(p) {
    const pid = p.id ?? p.pid;
    if (!pid) return;
  
    const fromDoctor =
      p?.serviceOrder?.fromDoctor || p.doctor || "Bác sĩ phụ trách";
  
    // Cập nhật flow dịch vụ: đã hoàn thành dịch vụ, chờ bác sĩ xem xét
    updatePatientStatus.mutate({
      id: pid,
      status: STATUSES.WAIT_PROC,
    });
  
    // ĐẨY VỀ HÀNG ĐỢI BÁC SĨ với pid đúng
    returnToDoctorMut.mutate({
      pid,
      name: p.name,
      dept: "Phòng khám",
      doctor: fromDoctor,
      note: "Đã có kết quả dịch vụ",
    });
  }
  
  // Click "Lập phiếu khám" — logic DV / thường
  function handleIntakeSmart(p) {
    const status = String(getTodayStatusCode(p) || "").toLowerCase();
    
    // Dựa hoàn toàn vào Status Code từ API
    const isServiceWait = 
        status === STATUSES.WAIT_INTAKE_SVC || 
        status === STATUSES.WAIT_EXAM_SVC;

    // Chỉ mở modal, truyền action 'intake'. 
    // PatientModal sẽ gọi API lấy chi tiết nếu cần thiết.
    onAction?.("intake", p);
  }

  return (
    <section
      className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft ${
        stretch ? "h-full flex flex-col min-h-0" : "mt-3"
      }`}
      role="region"
      aria-label="Danh sách bệnh nhân"
    >
      <div
        className={`${
          stretch
            ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none"
            : "overflow-x-auto scrollbar-none"
        } p-4 pt-0 pb-0 `}
      >
        <table className="min-w-full table-fixed">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <Thead>
            <Th first>Mã BN</Th>
            <Th>Họ và tên</Th>
            <Th>Ngày sinh</Th>
            <Th>Giới tính</Th>
            <Th>Liên hệ</Th>
            <Th>Trạng thái</Th>
            <Th last>Thao tác</Th>
          </Thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Không có bản ghi phù hợp.
                </td>
              </tr>
            ) : (
              items.map((p, i) => {
                const statusCode = getTodayStatusCode(p) || "";
                const account = getAccount(p) || "";
                const statusDate = getStatusDate(p);

                const today = new Date().toISOString().slice(0, 10);
                const isToday =
                  statusDate && String(statusDate).slice(0, 10) === today;
                const accountActive = /hoat_dong|hoạt động|active|1/.test(
                  String(account).toLowerCase()
                );
                // Hiển thị status nếu có statusCode (không cần kiểm tra ngày)
                const hasTodayStatus = !!statusCode;

                const isWaitIntake =
                  statusCode === STATUSES.WAIT_INTAKE ||
                  statusCode === STATUSES.WAIT_INTAKE_SVC;
                const isWaitProc =
                  statusCode === STATUSES.WAIT_PROC ||
                  statusCode === STATUSES.WAIT_PROC_SVC;

                const vitals = getVitals(p);

                const service = p.serviceOrder;
                const hasServiceOrder =
                  !!service &&
                  Array.isArray(service.items) &&
                  service.items.length > 0;
                const serviceDispatched = !!service?.dispatched;

                let showExamBtn = false;
                let showProcessBtn = false;

                if (accountActive && hasTodayStatus) {
                  if (isWaitIntake) {
                    showExamBtn = true;
                  } else if (isWaitProc) {
                    showProcessBtn = true;
                  }
                }

                // nếu có service order mà chưa đẩy đi vẫn ưu tiên nút "Lập phiếu khám"
                if (
                  accountActive &&
                  hasTodayStatus &&
                  hasServiceOrder &&
                  !serviceDispatched
                ) {
                  showExamBtn = true;
                }

                const pulse =
                  highlightPid &&
                  (p.id === highlightPid || p.pid === highlightPid);

                return (
                  <Row
                    key={p.id ?? p.pid ?? i}
                    i={i}
                    pulse={!!pulse}
                    data-pid={p.id ?? p.pid ?? ""}
                  >
                    <Td
                      first
                      classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <span className="font-mono font-semibold">
                        {p.id ?? p.pid ?? "—"}
                      </span>
                    </Td>

                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="flex items-start gap-2 min-w-0">
                        <InitialAvatar
                          name={p.name || p.ho_ten}
                          id={p.id ?? p.pid}
                        />
                        <div className="min-w-0 max-w-full">
                          <div className="font-semibold truncate">
                            {p.name || p.ho_ten || "—"}
                          </div>
                          {vitals && (
                            <div className="mt-0.5 text-[12px] text-slate-600 truncate">
                              <b>Sinh hiệu:</b> {String(vitals)}
                            </div>
                          )}
                          {hasServiceOrder && (
                            <div className="mt-0.5 text-[12px] text-amber-700 truncate">
                              <b>Dịch vụ:</b> {service.items.join(", ")}
                              {service.note ? ` • ${service.note}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </Td>

                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">
                      {p.dob || p.birthDate || p.ngay_sinh || "—"}
                    </Td>

                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">
                      {p.gender || p.sex || p.gioi_tinh || "—"}
                    </Td>

                    <Td classNameOverride="max-w-0">
                      <div className="overflow-hidden truncate">
                        {p.phone ||
                          p.dien_thoai ||
                          p.contact?.phone ||
                          "—"}
                      </div>
                      <div className="text-slate-500 text-xs overflow-hidden truncate">
                        {p.email || p.contact?.email || "—"}
                      </div>
                    </Td>

                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="flex flex-col gap-1">
                        <AccountBadge a={account} />

                        {hasTodayStatus ? (
                          <div className="flex items-center gap-2">
                            <StatusBadge s={statusCode} />
                            {statusDate && (
                              <span className="text-[11px] text-slate-500 tabular-nums">
                                {String(statusDate).slice(0, 10)}
                              </span>
                            )}
                          </div>
                        ) : (
                          accountActive && (
                            <button
                              type="button"
                              onClick={() => handleStartToday(p)}
                              className="inline-flex items-center self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold
                                         border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              Start hôm nay
                            </button>
                          )
                        )}
                      </div>
                    </Td>

                    <Td last classNameOverride="whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <Button
                          className="!px-2"
                          onClick={() => onAction?.("view", p)}
                        >
                          👁️
                        </Button>
                        <Button
                          className="!px-2"
                          onClick={() => onAction?.("edit", p)}
                        >
                          ✎
                        </Button>

                        {accountActive &&
                          (showExamBtn || showProcessBtn) && <span className="grow" />}

                        {accountActive && showExamBtn && (
                          <button
                            onClick={() => handleIntakeSmart(p)}
                            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-gradient-to-tr from-teal-100 to-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
                          >
                            Lập phiếu khám
                          </button>
                        )}

                        {accountActive && showProcessBtn && (
                          <button
                            onClick={() => onAction?.("process", p)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-gradient-to-tr from-rose-100 to-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
                          >
                            Xử lý & chẩn đoán
                          </button>
                        )}
                      </div>
                    </Td>
                  </Row>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}