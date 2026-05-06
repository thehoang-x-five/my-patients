// src/components/history/HistoryDetailModal.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";
import { isServiceDept,useHistoryVisitDetail } from "../../api/history.js";

function getApiAssetOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  try {
    const url = new URL(apiBase, window.location.origin);
    return url.pathname.toLowerCase().endsWith("/api") ? url.origin : url.origin;
  } catch {
    return "";
  }
}

function normalizeAttachmentUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (/^[a-z]:\\/i.test(raw) || raw.startsWith("\\\\")) return "";

  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  if (!normalizedPath.toLowerCase().startsWith("/uploads/")) return "";

  const origin = getApiAssetOrigin();
  const encodedPath = encodeURI(normalizedPath);
  return origin ? `${origin}${encodedPath}` : encodedPath;
}

function attachmentNameFrom(raw, fallback) {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  const path = value.split(/[?#]/)[0].replace(/\\/g, "/");
  return path.split("/").filter(Boolean).pop() || fallback;
}

function parseAttachmentValue(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            id: item || `file-${index + 1}`,
            name: attachmentNameFrom(item, `Tệp ${index + 1}`),
            url: normalizeAttachmentUrl(item),
          };
        }
        if (item && typeof item === "object") {
          const rawUrl = item.url || item.href || item.path || "";
          return {
            id: item.id || item.name || item.fileName || `file-${index + 1}`,
            name:
              item.name ||
              item.fileName ||
              item.filename ||
              attachmentNameFrom(rawUrl, `Tệp ${index + 1}`),
            url: normalizeAttachmentUrl(rawUrl),
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return parseAttachmentValue(JSON.parse(trimmed));
      } catch {
        return [{ id: trimmed, name: trimmed, url: "" }];
      }
    }
    return [
      {
        id: trimmed,
        name: attachmentNameFrom(trimmed, "Tệp 1"),
        url: normalizeAttachmentUrl(trimmed),
      },
    ];
  }
  return [];
}

export default function HistoryDetailModal({ open, type, row, onClose }) {
  

  const isVisit = type === "visit";
  const isTxn = type === "txn";
 // Mã lượt khám (dùng cho API detail)
  const visitCode =
    row &&
    (row.visitCode ||
      row.code ||
      row.historyId ||
      row.maLuotKham ||
      row.MaLuotKham ||
      row.maLuot ||
      row.MaLuot ||
      null);

  // Gọi API chi tiết khi là lượt khám  modal mở
  const { data: visitDetail, isLoading: loadingDetail } =
    useHistoryVisitDetail(visitCode, {
      enabled: open && isVisit && !!visitCode,
    });

  if (!open || !row) return null;

  // Nếu đã có detail thì ưu tiên, fallback về row từ list
  const data = isVisit && visitDetail ? visitDetail : row;

  const isServiceVisit =
    isVisit &&
    (data.isServiceVisit ||
      data.isService ||
      data.type === "can_lam_sang" ||
      data.type === "service" ||
      isServiceDept(data.dept));

  const dateObj = data.date ? new Date(data.date) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString("vi-VN") : "—";
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

 

  const patientCode =
    data.id ||
    data.ptId ||
    data.maBenhNhan ||
    data.MaBenhNhan ||
    null;

  const shellSize = isVisit ? "max-w-5xl" : "max-w-xl";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={
            isVisit
              ? isServiceVisit
                ? "Chi tiết cận lâm sàng"
                : "Chi tiết khám bệnh"
              : "Chi tiết giao dịch"
          }
        >
          <motion.div
            className={`w-full ${shellSize} rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 overflow-hidden`}
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-sky-50">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  {isVisit ? (isServiceVisit ? "Cận lâm sàng" : "Khám bệnh") : "Giao dịch"}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    {data.name || data.ptName || "—"}
                  </h2>

                  {patientCode && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-600">
                      Mã BN: {patientCode}
                    </span>
                  )}

                  {isVisit && visitCode && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                      Lượt khám: {visitCode}
                    </span>
                  )}

                  {isTxn && (data.invoiceId || data.invoice) && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
                      HĐ: {data.invoiceId || data.invoice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời gian: {dateStr} • {timeStr}
                </p>
              </div>
              <Button onClick={onClose} aria-label="Đóng">
                ✕
              </Button>
            </header>

            {/* Body */}
            <div className="px-5 py-4 max-h-[70vh] overflow-x-hidden overflow-y-auto scrollbar-none">
              <div className="grid gap-4 text-sm">
                {/* 1) Thông tin BN / Giao dịch */}
                <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    <Field
                      label="Mã BN"
                      value={
                        patientCode ? (
                          <Underlined to={`/patients?pid=${patientCode}&view=all`}>
                            {patientCode}
                          </Underlined>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <Field
                      label="Họ và tên"
                      value={data.name || data.ptName || "—"}
                    />

                    {isVisit ? (
                      <>
                        <Field label="Khoa/Phòng" value={data.dept || "—"} />
                        <Field label="BS/KTV" value={data.doctor || data.technician || "—"} />
                        <Field
                          label="Loại lượt"
                          value={
                            isServiceVisit ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                Cận lâm sàng
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                                Khám lâm sàng
                              </span>
                            )
                          }
                        />
                      </>
                    ) : (
                      <>
                        <Field
                          label="Mã hoá đơn"
                          value={data.invoiceId || data.invoice || "—"}
                        />
                        <Field label="Loại" value={renderKindChip(data.kind)} />
                        <Field
                          label="Trạng thái"
                          value={renderStatusChip(data.status)}
                        />
                        <Field
                          label="Số tiền"
                          value={`${Number(
                            data.money ?? data.amount ?? 0
                          ).toLocaleString("vi-VN")} đ`}
                        />
                      </>
                    )}
                  </div>
                </section>

                {isVisit ? (
                  <>
                    {/* 2) Kết quả khám */}
                    {!isServiceVisit && (data.note ||
                      (data.examRows && data.examRows.length) ||
                      (isVisit && loadingDetail)) && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-3">
                        <b className="block mb-2">Kết quả khám</b>
                        
                        {data.note && (
                          <div className="mb-3 text-sm">
                            <span className="text-slate-500">Tóm tắt: </span>
                            <span className="font-medium">{data.note}</span>
                          </div>
                        )}
                        {(data.examRows || []).length > 0 && (
                          <div className="overflow-x-hidden rounded-lg ring-1 ring-slate-200/70">
                            <table className="w-full table-fixed text-sm">
                              <colgroup>
                                <col className="w-[8%]" />
                                <col className="w-[24%]" />
                                <col className="w-[68%]" />
                              </colgroup>
                              <thead className="text-left text-slate-500 bg-slate-50">
                                <tr>
                                  <th className="px-2 py-2">#</th>
                                  <th className="px-2 py-2">
                                    Mục khám
                                  </th>
                                  <th className="px-2 py-2">Kết quả</th>
                                </tr>
                              </thead>
                              <tbody>
                              {data.examRows.map((r, i) => (
                                  <tr
                                    key={i}
                                    className="odd:bg-slate-50/40 hover:bg-slate-100"
                                  >
                                    <td className="px-2 py-2">{i + 1}</td>
                                    <td className="px-2 py-2 font-semibold whitespace-normal break-words">
                                      {r.label || "-"}
                                    </td>
                                    <td className="px-2 py-2 whitespace-pre-wrap break-words">
                                      {r.value || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    )}

                    {/* 3) Chẩn đoán & kế hoạch */}
                    {!isServiceVisit && data.diagnosis && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">
                          Chẩn đoán & Kế hoạch điều trị
                        </b>
                        <div className="grid md:grid-cols-2 gap-3">
                          <Field
                            label="Chẩn đoán sơ bộ"
                            value={
                              data.diagnosis.pre ||
                              data.diagnosis.main ||
                              "—"
                            }
                          />
                          <Field
                            label="Chẩn đoán xác định"
                            value={
                              data.diagnosis.final ||
                              data.diagnosis.sub ||
                              "—"
                            }
                          />
                          <FieldFull
                            label="Phác đồ điều trị"
                            value={data.diagnosis.plan || "—"}
                          />
                          <FieldFull
                            label="Tư vấn & Dặn dò"
                            value={data.diagnosis.advice || "—"}
                          />
                        </div>
                      </section>
                    )}

                    {/* 4) Dịch vụ thực hiện */}
                    {(data.services || []).length > 0 && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">
                          {isServiceVisit ? "Kết quả cận lâm sàng" : "Dịch vụ thực hiện"}
                        </b>
                        <div className="overflow-x-hidden rounded-lg ring-1 ring-slate-200/70">
                          <table className="w-full table-fixed text-sm">
                            <colgroup>
                              <col className="w-[9%]" />
                              <col className="w-[20%]" />
                              <col className="w-[25%]" />
                              <col className="w-[18%]" />
                              <col className="w-[17%]" />
                              <col className="w-[11%]" />
                            </colgroup>
                            <thead className="text-left text-slate-500 bg-slate-50">
                              <tr>
                                <th className="px-2 py-2">Mã</th>
                                <th className="px-2 py-2">Tên dịch vụ</th>
                                <th className="px-2 py-2">Kết quả</th>
                                <th className="px-2 py-2">Ghi chú</th>
                                <th className="px-2 py-2">Tệp</th>
                                <th className="px-2 py-2 text-right">Giá</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.services.map((s, i) => (
                                <tr
                                  key={s.code || i}
                                  className="odd:bg-slate-50/40 hover:bg-slate-100"
                                >
                                  <td className="px-2 py-2 font-mono text-xs whitespace-normal break-words">
                                    {s.code || "-"}
                                  </td>
                                  <td className="px-2 py-2 whitespace-normal break-words">
                                    {s.name || "-"}
                                  </td>
                                  <td className="px-2 py-2 whitespace-pre-wrap break-words">
                                    {s.result || "-"}
                                  </td>
                                  <td className="px-2 py-2 whitespace-pre-wrap break-words">
                                    {s.note || "-"}
                                  </td>
                                  <td className="px-2 py-2 min-w-0">
                                    <AttachmentLinks files={s.attachments} />
                                  </td>
                                  <td className="px-2 py-2 text-right whitespace-nowrap">
                                    {Number(
                                      s.price ?? 0
                                    ).toLocaleString("vi-VN")}{" "}
                                    đ
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* 5) Đơn thuốc */}
                    {!isServiceVisit && (data.prescriptionId || data.rxId) ? (
                      <section className="rounded-xl ring-1 ring-sky-200 bg-sky-50 p-3 text-sm">
                        Có đơn thuốc:{" "}
                        <Underlined
                          to={`/prescriptions?view=${
                            data.prescriptionId || data.rxId
                          }`}
                        >
                          {data.prescriptionId || data.rxId}
                        </Underlined>
                      </section>
                    ) : null}

                    {/* Link hồ sơ BN */}
                    <div className="text-sm">
                      {patientCode && (
                        <Underlined to={`/patients?pid=${patientCode}&view=all`}>
                          Xem hồ sơ bệnh nhân
                        </Underlined>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Giao dịch: chi tiết thêm */}
                    <section className=" rounded-xl ring-1 ring-slate-200/70 p-4">
                      <b className="block mb-2">Thông tin giao dịch</b>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Ngày" value={dateStr} />
                        <Field label="Giờ" value={timeStr} />
                        <Field
                          label="Phương thức"
                          value={renderMethodChip(data.method)}
                        />
                        <Field
                          label="Nhân sự thu"
                          value={
                            data.staffName || data.nhanSuThu?.hoTen || "—"
                          }
                        />
                        <FieldFull
                          label="Nội dung"
                          value={data.content || "—"}
                        />
                      </div>
                    </section>

                    {/* Liên kết tham chiếu */}
                    {(data.examId || data.clsId || data.rxId) && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">Tham chiếu</b>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {data.examId && (
                            <div>Phiếu khám LS: {data.examId}</div>
                          )}
                          {data.clsId && (
                            <div>Phiếu CLS: {data.clsId}</div>
                          )}
                          {data.rxId && (
                            <div>Đơn thuốc: {data.rxId}</div>
                          )}
                        </div>
                      </section>
                    )}

                    <div className="text-sm">
                      {patientCode && (
                        <Underlined to={`/patients?pid=${patientCode}&view=all`}>
                          Xem hồ sơ bệnh nhân
                        </Underlined>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ========== Helpers ========== */

function renderStatusChip(status) {
  const v = (status || "").toLowerCase();
  if (v === "da_thu" || v === "done") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        Đã thu
      </span>
    );
  }
  if (v === "da_huy" || v === "cancelled") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
        Đã hủy
      </span>
    );
  }
  if (v === "bao_luu" || v === "reserved") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
        Bảo lưu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">
      Không rõ
    </span>
  );
}

function renderKindChip(kind) {
  const v = (kind || "").toLowerCase();
  if (v === "kham_lam_sang") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
        Khám lâm sàng
      </span>
    );
  }
  if (v === "can_lam_sang") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
        Cận lâm sàng
      </span>
    );
  }
  if (v === "thuoc") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 ring-1 ring-teal-200">
        Thuốc
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">
      Khác
    </span>
  );
}

function renderMethodChip(method) {
  const v = (method || "").toLowerCase();
  if (!v || v === "tien_mat") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 ring-1 ring-slate-200">
        Tiền mặt
      </span>
    );
  }
  if (v === "chuyen_khoan" || v === "transfer") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
        Chuyển khoản
      </span>
    );
  }
  if (v === "pos") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
        POS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-slate-200">
      {method}
    </span>
  );
}

function AttachmentLinks({ files }) {
  const normalized = parseAttachmentValue(files);
  if (!normalized.length) return <span className="text-slate-400">—</span>;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {normalized.map((file, index) => {
        const label = file.name || `Tệp ${index + 1}`;
        if (!file.url) {
          return (
            <span key={file.id || index} className="break-words text-slate-500">
              {label}
            </span>
          );
        }
        return (
          <span key={file.id || file.url || index} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 break-words underline underline-offset-2 text-sky-700 hover:text-sky-800"
            >
              {label}
            </a>
            <a
              href={file.url}
              download={label}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Tải
            </a>
          </span>
        );
      })}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="grid grid-cols-[140px,1fr] gap-2">
      <div className="text-slate-500">{label}:</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function FieldFull({ label, value }) {
  return (
    <div className="md:col-span-2 grid grid-cols-[140px,1fr] gap-2">
      <div className="text-slate-500">{label}:</div>
      <div className="font-medium whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function Underlined({ to, children }) {
  return (
    <Link
      to={to}
      className="underline underline-offset-2 text-sky-700 hover:text-sky-800 focus:outline-none focus:ring-2 ring-sky-300 rounded"
    >
      {children}
    </Link>
  );
}
