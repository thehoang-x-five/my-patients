import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import { useUI } from "../../context/UIContext.jsx";
import {
  STATUSES,
  getAccountStatusLabel,
  getGenderLabel,
  getTodayStatusLabel,
  normalizeTodayStatusCode,
  useUpdatePatientStatus,
} from "../../api/patients.js";
import { useServicesOverview } from "../../api/examination.js";
import { formatDisplayText, normalizeEnumKey } from "../../utils/textFormatters.js";

function getAccount(patient) {
  return (
    patient?.trang_thai_tai_khoan ??
    patient?.accountStatus ??
    patient?.account?.status ??
    ""
  );
}

function getTodayStatusCode(patient) {
  return normalizeTodayStatusCode(
    patient?.trang_thai_hom_nay_code ??
    patient?.trang_thai_hom_nay ??
    patient?.statusCode ??
    patient?.todayStatus ??
    patient?.status ??
    ""
  );
}

function getStatusDate(patient) {
  return patient?.ngay_trang_thai ?? patient?.statusDate ?? "";
}

function getVitals(patient) {
  return patient?.sinh_hieu ?? patient?.vitals ?? "";
}

function getStatusTone(code) {
  if (!code) {
    return {
      badge: "bg-slate-50 text-slate-700 ring-slate-200",
      dot: "bg-slate-400",
    };
  }

  if (code === STATUSES.DONE) {
    return {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (code === STATUSES.CANCELLED) {
    return {
      badge: "bg-rose-50 text-rose-700 ring-rose-200",
      dot: "bg-rose-500",
    };
  }

  if (
    code === STATUSES.WAIT_EXAM ||
    code === STATUSES.WAIT_EXAM_SVC ||
    code === STATUSES.WAIT_INTAKE ||
    code === STATUSES.WAIT_INTAKE_SVC ||
    code === STATUSES.WAIT_PROC ||
    code === STATUSES.WAIT_PROC_SVC
  ) {
    return {
      badge: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    };
  }

  if (code === STATUSES.IN_EXAM || code === STATUSES.IN_EXAM_SVC) {
    return {
      badge: "bg-cyan-50 text-cyan-800 ring-cyan-200",
      dot: "bg-cyan-500",
    };
  }

  return {
    badge: "bg-slate-50 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  };
}

function StatusBadge({ status, lang }) {
  const code = normalizeEnumKey(status);
  const tone = getStatusTone(code);
  const label = getTodayStatusLabel(code || status, lang) || "—";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${tone.badge}`}
    >
      <i className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}

function AccountBadge({ status, lang }) {
  const code = normalizeEnumKey(status);
  const label = getAccountStatusLabel(code || status, lang) || "—";
  const cls =
    code === "da_xoa"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : code === "khong_hoat_dong"
      ? "bg-slate-50 text-slate-700 ring-slate-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}
    >
      {label}
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
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full px-1.5 pr-2 text-[11px] font-extrabold ring-1 ring-slate-200/70 ${colors[seed]}`}
    >
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
      "sticky top-0 z-10 whitespace-nowrap px-3 py-3",
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
      "group odd:bg-slate-50/40 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)] hover:bg-emerald-100/50 focus-within:bg-teal-50/60",
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
      first ? "rounded-l-lg pl-3" : "",
      last ? "rounded-r-lg pr-3" : "",
      right ? "text-right tabular-nums" : "",
      classNameOverride,
    ].join(" ")}
  >
    {children}
  </td>
);

function safeCssEscape(value) {
  const text = String(value ?? "");
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(text);
  return text.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
}

function formatDateDisplay(value, lang = "vi") {
  if (!value) return "—";
  const text = String(value).trim();
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(lang === "en" ? "en-GB" : "vi-VN");
  }
  return text;
}

export default function PatientsTable({
  items = [],
  onAction,
  onStatusChange,
  stretch = false,
  highlightPid = null,
  canEditPatient = true,
  canCreateExam = true,
  canProcessPatient = true,
  canCancelPatientFlow = true,
}) {
  const { lang } = useUI();

  useServicesOverview({ loaiDichVu: "kham_lam_sang" }, { enabled: true });

  const updatePatientStatus = useUpdatePatientStatus();
  const [confirmBoVe, setConfirmBoVe] = useState({ open: false, name: "", id: null });

  const t =
    lang === "en"
      ? {
          region: "Patient list",
          patientCode: "Patient ID",
          fullName: "Full name",
          dob: "Date of birth",
          gender: "Gender",
          contact: "Contact",
          status: "Status",
          actions: "Actions",
          empty: "No matching records.",
          vitals: "Vitals",
          services: "Services",
          startToday: "Start today",
          startTodaySuccess: "Today's care flow has started for the patient.",
          startTodayError: "Unable to start today's care flow. Please try again.",
          view: "View patient",
          edit: "Edit patient",
          createExam: "Create exam sheet",
          processDiagnosis: "Process and diagnose",
          returnHome: "Cancel visit",
          returnHomeTitle: "Cancel today's visit",
          returnHomeMessage: (name) =>
            `Patient "${name}" will be moved to the cancelled status. Unpaid invoices will be cancelled, and paid invoices will be moved to reserve. Do you want to continue?`,
          returnHomeConfirm: "Confirm cancel",
          returnHomeSuccess: "Patient has been moved to cancelled status.",
          returnHomeError: "Unable to update patient status. Please try again.",
        }
      : {
          region: "Danh sách bệnh nhân",
          patientCode: "Mã BN",
          fullName: "Họ và tên",
          dob: "Ngày sinh",
          gender: "Giới tính",
          contact: "Liên hệ",
          status: "Trạng thái",
          actions: "Thao tác",
          empty: "Không có bản ghi phù hợp.",
          vitals: "Sinh hiệu",
          services: "Dịch vụ",
          startToday: "Bắt đầu hôm nay",
          startTodaySuccess: "Đã bắt đầu lượt xử lý hôm nay cho bệnh nhân.",
          startTodayError: "Không thể bắt đầu lượt xử lý hôm nay. Vui lòng thử lại.",
          view: "Xem bệnh nhân",
          edit: "Sửa bệnh nhân",
          createExam: "Lập phiếu khám",
          processDiagnosis: "Xử lý và chẩn đoán",
          returnHome: "Bỏ về",
          returnHomeTitle: "Xác nhận bỏ về",
          returnHomeMessage: (name) =>
            `Bệnh nhân "${name}" sẽ được chuyển sang trạng thái bỏ về. Hóa đơn chưa thu sẽ bị hủy, còn hóa đơn đã thu sẽ chuyển sang bảo lưu. Bạn có chắc chắn?`,
          returnHomeConfirm: "Xác nhận bỏ về",
          returnHomeSuccess: "Đã chuyển bệnh nhân sang trạng thái bỏ về.",
          returnHomeError: "Không thể cập nhật trạng thái bỏ về. Vui lòng thử lại.",
        };

  const handleStartToday = (patient) => {
    if (!patient) return;
    const id = patient.id ?? patient.pid;
    if (!id) return;

    if (typeof onStatusChange === "function") {
      onStatusChange(id, STATUSES.WAIT_INTAKE, {
        successMessage: t.startTodaySuccess,
        errorMessage: t.startTodayError,
      });
      return;
    }

    updatePatientStatus.mutate({ id, status: STATUSES.WAIT_INTAKE });
  };

  useEffect(() => {
    if (!highlightPid) return;
    const rafId = window.requestAnimationFrame(() => {
      const row = document.querySelector(`tr[data-pid="${safeCssEscape(highlightPid)}"]`);
      if (row?.scrollIntoView) {
        try {
          row.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          // ignore scroll errors
        }
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [highlightPid, items]);

  function handleIntakeSmart(patient) {
    const status = normalizeEnumKey(getTodayStatusCode(patient) || "");
    const isServiceWait =
      status === STATUSES.WAIT_INTAKE_SVC || status === STATUSES.WAIT_EXAM_SVC;

    onAction?.("intake", patient, { isServiceWait });
  }

  return (
    <>
      <section
        className={`overflow-hidden bg-white shadow-soft ${
          stretch ? "flex h-full min-h-0 flex-col pt-2" : "mt-3 pt-2"
        }`}
        role="region"
        aria-label={t.region}
      >
        <div
          className={`scrollbar-none p-4 pt-0 pb-0 ${
            stretch ? "min-h-0 flex-1 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"
          }`}
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
              <Th first>{t.patientCode}</Th>
              <Th>{t.fullName}</Th>
              <Th>{t.dob}</Th>
              <Th>{t.gender}</Th>
              <Th>{t.contact}</Th>
              <Th>{t.status}</Th>
              <Th last>{t.actions}</Th>
            </Thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                items.map((patient, index) => {
                  const statusCode = getTodayStatusCode(patient) || "";
                  const accountCode = normalizeEnumKey(getAccount(patient) || "");
                  const statusDate = getStatusDate(patient);
                  const hasTodayStatus = !!statusCode;
                  const accountActive = accountCode === "hoat_dong" || accountCode === "active" || accountCode === "1";
                  const vitals = getVitals(patient);
                  const service = patient.serviceOrder;
                  const hasServiceOrder =
                    !!service &&
                    Array.isArray(service.items) &&
                    service.items.length > 0;
                  const serviceDispatched = !!service?.dispatched;

                  const isWaitIntake =
                    statusCode === STATUSES.WAIT_INTAKE ||
                    statusCode === STATUSES.WAIT_INTAKE_SVC;
                  const isWaitProcService = statusCode === STATUSES.WAIT_PROC_SVC;
                  const isWaitProc = statusCode === STATUSES.WAIT_PROC;

                  let showExamBtn = false;
                  let showProcessBtn = false;

                  if (accountActive && hasTodayStatus) {
                    if (isWaitIntake || isWaitProcService) {
                      showExamBtn = true;
                    } else if (isWaitProc) {
                      showProcessBtn = true;
                    }
                  }

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
                    (patient.id === highlightPid || patient.pid === highlightPid);

                  const patientId = patient.id ?? patient.pid ?? "—";
                  const patientName =
                    formatDisplayText(
                      patient.nameFormatted || patient.name || patient.ho_ten || patient.hoTen,
                      patient.name || patient.ho_ten || patient.hoTen || "—",
                      lang
                    ) || "—";
                  const genderLabel =
                    getGenderLabel(
                      patient.gender || patient.sex || patient.gioi_tinh || patient.gioiTinh,
                      lang
                    ) || "—";
                  const serviceLabel = hasServiceOrder
                    ? service.items
                        .map((item) => formatDisplayText(item, item, lang))
                        .join(", ")
                    : "";

                  return (
                    <Row
                      key={patientId || index}
                      i={index}
                      pulse={!!pulse}
                      data-pid={patientId !== "—" ? patientId : ""}
                    >
                      <Td
                        first
                        classNameOverride="overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        <span className="font-mono font-semibold">{patientId}</span>
                      </Td>

                      <Td classNameOverride="max-w-0 overflow-hidden">
                        <div className="flex min-w-0 items-start gap-2">
                          <InitialAvatar name={patientName} id={patientId} />
                          <div className="min-w-0 max-w-full">
                            <div className="truncate font-semibold">{patientName}</div>
                            {vitals && (
                              <div className="mt-0.5 truncate text-[12px] text-slate-600">
                                <b>{t.vitals}:</b> {String(vitals)}
                              </div>
                            )}
                            {hasServiceOrder && (
                              <div className="mt-0.5 truncate text-[12px] text-amber-700">
                                <b>{t.services}:</b> {serviceLabel}
                                {service.note ? ` • ${service.note}` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </Td>

                      <Td classNameOverride="overflow-hidden text-ellipsis whitespace-nowrap">
                        {formatDateDisplay(
                          patient.dob || patient.birthDate || patient.ngay_sinh,
                          lang
                        )}
                      </Td>

                      <Td classNameOverride="overflow-hidden text-ellipsis whitespace-nowrap">
                        {genderLabel}
                      </Td>

                      <Td classNameOverride="max-w-0">
                        <div className="truncate overflow-hidden">
                          {patient.phone || patient.dien_thoai || patient.contact?.phone || "—"}
                        </div>
                        <div className="truncate overflow-hidden text-xs text-slate-500">
                          {patient.email || patient.contact?.email || "—"}
                        </div>
                      </Td>

                      <Td classNameOverride="overflow-hidden text-ellipsis whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <AccountBadge status={accountCode} lang={lang} />

                          {hasTodayStatus ? (
                            <div className="flex items-center gap-2">
                              <StatusBadge status={statusCode} lang={lang} />
                              {statusDate && (
                                <span className="text-[11px] tabular-nums text-slate-500">
                                  {String(statusDate).slice(0, 10)}
                                </span>
                              )}
                            </div>
                          ) : (
                            accountActive &&
                            canEditPatient && (
                              <button
                                type="button"
                                onClick={() => handleStartToday(patient)}
                                className="inline-flex self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                {t.startToday}
                              </button>
                            )
                          )}
                        </div>
                      </Td>

                      <Td last classNameOverride="whitespace-nowrap">
                        <div className="flex flex-nowrap items-center gap-2">
                          <Button
                            className="!px-2"
                            onClick={() => onAction?.("view", patient)}
                            title={t.view}
                            aria-label={t.view}
                          >
                            👁️
                          </Button>

                          {canEditPatient && (
                            <Button
                              className="!px-2"
                              onClick={() => onAction?.("edit", patient)}
                              title={t.edit}
                              aria-label={t.edit}
                            >
                              ✎
                            </Button>
                          )}

                          {accountActive && (showExamBtn || showProcessBtn) && (
                            <span className="grow" />
                          )}

                          {accountActive && showExamBtn && canCreateExam && (
                            <button
                              onClick={() => handleIntakeSmart(patient)}
                              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-gradient-to-tr from-teal-100 to-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              {t.createExam}
                            </button>
                          )}

                          {accountActive && showProcessBtn && canProcessPatient && (
                            <button
                              onClick={() => onAction?.("process", patient)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-gradient-to-tr from-rose-100 to-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-900 shadow transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              {t.processDiagnosis}
                            </button>
                          )}

                          {accountActive &&
                            hasTodayStatus &&
                            canCancelPatientFlow &&
                            statusCode !== STATUSES.DONE &&
                            statusCode !== STATUSES.CANCELLED && (
                              <button
                                onClick={() => {
                                  setConfirmBoVe({
                                    open: true,
                                    name: patientName || patientId || t.region,
                                    id: patientId !== "—" ? patientId : null,
                                  });
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                                title={t.returnHome}
                              >
                                ✕ {t.returnHome}
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

      <ConfirmModal
        open={confirmBoVe.open}
        onClose={() => setConfirmBoVe({ open: false, name: "", id: null })}
        onConfirm={() => {
          if (!confirmBoVe.id) return;

          if (typeof onStatusChange === "function") {
            onStatusChange(confirmBoVe.id, STATUSES.CANCELLED, {
              successMessage: t.returnHomeSuccess,
              errorMessage: t.returnHomeError,
            });
            return;
          }

          updatePatientStatus.mutate({
            id: confirmBoVe.id,
            status: STATUSES.CANCELLED,
          });
        }}
        title={t.returnHomeTitle}
        message={t.returnHomeMessage(confirmBoVe.name)}
        confirmText={t.returnHomeConfirm}
        cancelText={lang === "en" ? "Cancel" : "Không"}
        tone="danger"
      />
    </>
  );
}
