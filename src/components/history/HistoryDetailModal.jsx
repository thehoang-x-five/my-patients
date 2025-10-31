import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";
import { isServiceDept } from "../../data/history.js";

export default function HistoryDetailModal({ open, type, row, onClose }) {
  if (!row) return null;
  const isVisit = type === "visit";
  const isServiceVisit =
    isVisit && (row.type === "service" || isServiceDept(row.dept));

  // Kích thước modal: nhỏ hơn cho giao dịch
  const shellSize = isVisit ? "max-w-4xl" : "max-w-xl";

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
          aria-label={isVisit ? "Chi tiết khám bệnh" : "Chi tiết giao dịch"}
        >
          <motion.div
            className={`w-full ${shellSize} rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80`}
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur rounded-t-2xl">
              <div>
                <h3 className="text-lg font-extrabold">
                  {isVisit ? "Chi tiết khám bệnh" : "Chi tiết giao dịch"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lúc:{" "}
                  {row.date
                    ? new Date(row.date).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <Button onClick={onClose} aria-label="Đóng">
                ✕
              </Button>
            </header>

            {/* Body: cuộn trong khung */}
            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto scrollbar-none">
              <div className="grid gap-5">
                {/* 1) Thông tin BN */}
                <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                  <div className="grid lg:grid-cols-2 gap-4 text-sm">
                    <Field
                      label="Mã BN"
                      value={
                        <Underlined to={`/patients?pid=${row.id || row.ptId}`}>
                          {row.id || row.ptId || "—"}
                        </Underlined>
                      }
                    />
                    <Field
                      label="Họ và tên"
                      value={row.name || row.ptName || "—"}
                    />
                    {isVisit ? (
                      <>
                        <Field label="Khoa" value={row.dept || "—"} />
                        <Field label="Bác sĩ" value={row.doctor || "—"} />
                      </>
                    ) : (
                      <>
                        <Field label="Nội dung" value={row.content || "—"} />
                        <Field
                          label="Số tiền"
                          value={`${Number(
                            row.money ?? row.amount ?? 0
                          ).toLocaleString("vi-VN")} đ`}
                        />
                      </>
                    )}
                  </div>
                </section>

                {isVisit ? (
                  <>
                    {/* 2) Kết quả khám */}
                    {(row.note || (row.examRows && row.examRows.length)) && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">Kết quả khám</b>
                        {row.note && (
                          <div className="mb-3 text-sm">
                            <span className="text-slate-500">Tóm tắt: </span>
                            <span className="font-medium">{row.note}</span>
                          </div>
                        )}
                        {(row.examRows || []).length > 0 && (
                          <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200/70">
                            <table className="min-w-full text-sm">
                              <thead className="text-left text-slate-500 bg-slate-50">
                                <tr>
                                  <th className="px-3 py-2 w-12">#</th>
                                  <th className="px-3 py-2 w-56">Mục khám</th>
                                  <th className="px-3 py-2">Kết quả</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.examRows.map((r, i) => (
                                  <tr key={i} className="odd:bg-slate-50/40">
                                    <td className="px-3 py-2">{i + 1}</td>
                                    <td className="px-3 py-2 font-semibold">
                                      {r.label || "-"}
                                    </td>
                                    <td className="px-3 py-2">
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

                    {/* 3) Kết quả dịch vụ */}
                    {(row.services || []).length > 0 && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">Kết quả dịch vụ</b>
                        <ul className="divide-y divide-slate-100">
                          {row.services.map((s, i) => (
                            <li
                              key={s.code || i}
                              className="py-2 flex items-start justify-between gap-4"
                            >
                              <div className="font-medium">{s.name}</div>
                              <div className="text-sm text-slate-600">
                                {s.result || "—"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* 4) Chẩn đoán & Điều trị */}
                    {row.diagnosis && (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-4">
                        <b className="block mb-2">Chẩn đoán & Điều trị</b>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <Field
                            label="Chẩn đoán sơ bộ"
                            value={row.diagnosis.pre || "—"}
                          />
                          <Field
                            label="Chẩn đoán xác định"
                            value={row.diagnosis.final || "—"}
                          />
                          <FieldFull
                            label="Phác đồ điều trị"
                            value={row.diagnosis.plan || "—"}
                          />
                          <FieldFull
                            label="Tư vấn & Dặn dò"
                            value={row.diagnosis.advice || "—"}
                          />
                        </div>
                      </section>
                    )}

                    {/* 5) Đơn thuốc */}
                    {isServiceVisit ? (
                      <section className="rounded-xl ring-1 ring-amber-200 bg-amber-50 p-3 text-amber-800">
                        Lần khám dịch vụ không phát sinh đơn thuốc.
                      </section>
                    ) : row.prescriptionId ? (
                      <section className="rounded-xl ring-1 ring-sky-200 bg-sky-50 p-3 text-sm">
                        Có đơn thuốc:{" "}
                        <Underlined
                          to={`/prescriptions?view=${row.prescriptionId}`}
                        >
                          {row.prescriptionId}
                        </Underlined>
                        <div className="text-xs text-slate-500">
                          Bấm để mở chi tiết trong mục Đơn thuốc
                        </div>
                      </section>
                    ) : (
                      <section className="rounded-xl ring-1 ring-slate-200/70 p-3 text-sm">
                        Không thấy thông tin đơn thuốc.
                      </section>
                    )}

                    {/* Link hồ sơ BN */}
                    <div className="text-sm">
                      <Underlined to={`/patients?pid=${row.id || row.ptId}`}>
                        Xem hồ sơ bệnh nhân
                      </Underlined>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Giao dịch */}
                    {(row.drugsFee != null || row.rxId) && (
                      <section className="rounded-xl ring-1 ring-emerald-200 bg-emerald-50 p-3 text-sm">
                        Phí đơn thuốc:{" "}
                        <b>
                          {Number(row.drugsFee || 0).toLocaleString("vi-VN")} đ
                        </b>
                        {row.rxId && (
                          <>
                            {" "}
                            • Mã đơn:{" "}
                            <Underlined to={`/prescriptions?view=${row.rxId}`}>
                              {row.rxId}
                            </Underlined>
                          </>
                        )}
                      </section>
                    )}

                    <section className="rounded-xl ring-1 ring-slate-200/70 p-4 grid md:grid-cols-2 gap-3 text-sm">
                      <Field
                        label="Mã hoá đơn"
                        value={row.invoiceId || row.invoice || "—"}
                      />
                      <Field
                        label="Trạng thái"
                        value={
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 text-xs bg-emerald-50 text-emerald-700 ring-emerald-200">
                            Hoàn tất
                          </span>
                        }
                      />
                    </section>

                    <div className="text-sm">
                      <Underlined to={`/patients?pid=${row.id || row.ptId}`}>
                        Xem hồ sơ bệnh nhân
                      </Underlined>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur rounded-b-2xl">
              <Button onClick={onClose}>Đóng</Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Sub components ---------- */
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
