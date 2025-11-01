import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import RxPickerModal from "./RxPickerModal.jsx";
import { EXAM_SERVICES } from "../../data/examination.js";

/* ----- LIMITS ----- */
const MAX_NOTE_LEN = 200;
const STATUS_DEFAULT = "Chưa có kết quả";
const fadeIn = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

function emptyRow() {
  return {
    id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    svcId: "",
    status: STATUS_DEFAULT, // read-only
    note: "",
  };
}

export default function ExamDetail({ patient, onBack, onExportDiagnosis, onExportOrder }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [dx, setDx] = useState({ pre: "", final: "", plan: "", advice: "" });
  const [rx, setRx] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasOrder = useMemo(() => rows.some(r => (r.svcId || "").trim()), [rows]); // vẫn dùng cho Xuất phiếu khám
  const hasDx = useMemo(() => !!(dx.pre || dx.final || dx.plan || dx.advice), [dx]); // chỉ cần chẩn đoán để xuất phiếu chẩn đoán
  

  const svcMap = useMemo(() => {
    const m = new Map();
    EXAM_SERVICES.forEach(s => m.set(s.id, s));
    return m;
  }, []);

  // Prefill khi BN đã có serviceOrder.items (luồng từ bác sĩ gửi đi)
  useEffect(() => {
    const items = patient?.serviceOrder?.items;
    if (Array.isArray(items) && items.length) {
      setRows(items.map((sid) => ({
        ...emptyRow(),
        svcId: (EXAM_SERVICES.find((s) => s.id === sid)?.id) || sid
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.serviceOrder?.items]);

  function addRow() { setRows((s) => [...s, emptyRow()]); }
  function removeRow(id) { setRows((s) => (s.length > 1 ? s.filter((r) => r.id !== id) : s)); }
  function patchRow(id, patch) { setRows((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r))); }

  function buildPayloadCommon() {
    const orderRows = rows
      .filter((r) => (r.svcId || "").trim())
      .map((r) => {
        const meta = svcMap.get(r.svcId);
        return {
          id: r.svcId,
          serviceName: meta?.name || r.svcId,
          status: r.status || STATUS_DEFAULT,
          note: r.note || "",
          result: r.result || "", // để trống ở UI bác sĩ
        };
      });

    const rxRows = rx.map((r) => ({ code: r.code, name: r.name, dose: r.dose, qty: r.qty }));

    return {
      meta: {
        examAt: new Date().toISOString(),
        dept: patient.dept || patient.department || "",
        doctor: patient.doctor || "",
        version: Date.now(),
        source: "exam",
      },
      orderRows,
      rxRows,
      dx: { ...dx },
    };
  }

  // Nút “Xuất phiếu khám” → set CHỜ TIẾP NHẬN (DỊCH VỤ) ở Patients (xử lý tại parent)
  function handleExportOrder() {
    if (!hasOrder) return;
    const payload = buildPayloadCommon();
    onExportOrder?.(patient, payload);
  }

  // Nút “Xuất phiếu chẩn đoán” → set CHỜ XỬ LÝ / CHỜ XỬ LÝ (DỊCH VỤ) (xử lý tại parent)
  function handleExportDiagnosis() {
    if (!hasDx) return;
    const payload = buildPayloadCommon();
    payload.services = payload.orderRows.map((r) => r.serviceName);
    payload.serviceResults = payload.orderRows.map((r) => ({
      id: r.id, name: r.serviceName, status: r.status, result: r.result, note: r.note,
    }));
    onExportDiagnosis?.(patient, payload);
  }

  function onPickMany(list) {
    setRx((s) => [...s, ...list.filter((n) => !s.some((x) => x.code === n.code))]);
    setPickerOpen(false);
  }
  function removeRxAt(index) { setRx((s) => s.filter((_, i) => i !== index)); }

  /* ======== TONE ======== */
  const toneRing = "ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500";
  const toneHover = "hover:bg-teal-50/50";
  const headerGrad = "from-teal-50 via-white to-teal-50/60";

  // Kết quả dịch vụ (chỉ xem) — đọc từ pendingServiceResults/serviceResults
  const serviceResults = useMemo(() => {
    const arr = patient?.pendingServiceResults || patient?.serviceResults || [];
    return Array.isArray(arr) ? arr : [];
  }, [patient]);

  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <section className="h-full min-h-0 flex flex-col">
        {/* Header */}
        <header className={`sticky top-0 z-20 bg-gradient-to-r ${headerGrad} backdrop-blur shadow-sm`}>
          <div className="flex items-start justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button onClick={onBack} aria-label="Quay lại">←</Button>
              </motion.div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{patient.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{patient.pid || patient.id}</span>
              {patient.age != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">{patient.age} tuổi</span>}
              {patient.gender && <span className="rounded-full bg-slate-100 px-2 py-0.5">{patient.gender}</span>}
              {(patient.dept || patient.department) && <span className="rounded-full bg-slate-100 px-2 py-0.5">{patient.dept || patient.department}</span>}
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{todayStr} • {timeStr}</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <motion.div {...fadeIn} className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-1 pt-3 pb-0">
          {/* Info */}
          <div className="grid md:grid-cols-2 gap-3">
            <motion.div whileHover={{ y: -1 }} className="rounded-2xl p-3 bg-white shadow-sm border border-slate-200">
              <b className="block mb-1 text-slate-900">Thông tin chi tiết</b>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <div className="text-slate-500">Ghi chú:</div>
                <div className="max-h-16 overflow-y-auto scrollbar-none break-words">{patient.note || patient.notes || "-"}</div>
                <div className="text-slate-500">Bệnh nền:</div>
                <div className="max-h-16 overflow-y-auto scrollbar-none break-words">{patient.history || "-"}</div>
                <div className="text-slate-500">Dị ứng:</div>
                <div className="max-h-16 overflow-y-auto scrollbar-none break-words">{patient.allergies || "-"}</div>
                <div className="text-slate-500">Triệu chứng:</div>
                <div className="max-h-16 overflow-y-auto scrollbar-none break-words">{patient.symptoms || "-"}</div>
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -1 }} className="rounded-2xl p-3 bg-white shadow-sm border border-slate-200">
              <b className="block mb-1 text-slate-900">Ghi chú vào khám</b>
              <div className="text-sm max-h-16 overflow-y-auto scrollbar-none break-words">{patient.note || "—"}</div>
            </motion.div>
          </div>

          {/* Phiếu khám — BỎ cột kết quả */}
          <motion.section {...fadeIn} className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200">
            <h4 className="font-extrabold mb-2 text-slate-900">Phiếu khám (Chỉ định dịch vụ)</h4>
            <div className="overflow-x-auto scrollbar-none">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                  <tr className="bg-gradient-to-b from-teal-50 to-white">
                    <th className="px-2 py-2 w-12">STT</th>
                    <th className="px-2 py-2 w-72">Dịch vụ</th>
                    <th className="px-2 py-2 w-44">Trạng thái</th>
                    <th className="px-2 py-2">Ghi chú</th>
                    <th className="px-2 py-2 w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, idx) => {
                    const svc = svcMap.get(r.svcId);
                    return (
                      <tr key={r.id} className={`align-top transition-colors ${toneHover}`}>
                        <td className="px-2 py-2 text-slate-700">{idx + 1}</td>

                        {/* Dịch vụ */}
                        <td className="px-2 py-2">
                          <select
                            value={r.svcId}
                            onChange={(e) => patchRow(r.id, { svcId: e.target.value })}
                            className={`w-full rounded-lg px-2 py-1 ${toneRing} outline-none`}
                          >
                            <option value="">— Chọn dịch vụ —</option>
                            {EXAM_SERVICES.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          {svc?.name && <div className="text-xs text-slate-500 mt-0.5">{svc.name}</div>}
                        </td>

                        {/* Trạng thái (read-only) */}
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-amber-200 bg-amber-50 text-amber-700">
                            {r.status || STATUS_DEFAULT}
                          </span>
                        </td>

                        {/* Ghi chú */}
                        <td className="px-2 py-2">
                          <textarea
                            value={r.note}
                            onChange={(e) => patchRow(r.id, { note: e.target.value.slice(0, MAX_NOTE_LEN) })}
                            title={r.note}
                            rows={2}
                            maxLength={MAX_NOTE_LEN}
                            placeholder="Ghi chú (vd: chụp tay phải, nhịn ăn 8h...)"
                            className={`w-full px-2 py-1 rounded-md ${toneRing} outline-none max-h-16 overflow-y-auto scrollbar-none break-words bg-white`}
                          />
                          <div className="text-[11px] text-slate-400 mt-0.5 text-right">
                            {r.note?.length || 0}/{MAX_NOTE_LEN}
                          </div>
                        </td>

                        {/* Xóa */}
                        <td className="px-2 py-2">
                          <Button className="!px-2" onClick={() => removeRow(r.id)} aria-label="Xóa dòng">✕</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <Button onClick={addRow}>+ Thêm dòng</Button>
              <div className="flex gap-2">
                <Button
                  className="transition-all duration-300 
                  disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
                  variant="radigan"
                  disabled={!hasOrder}
                  onClick={handleExportOrder}
                  title={!hasOrder ? "Chọn ít nhất 1 dịch vụ" : "Xuất phiếu khám (chuyển sang tiếp nhận dịch vụ)"}
                >
                  Xuất phiếu khám
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Kết quả dịch vụ — CHỈ XEM */}
          <motion.section {...fadeIn} className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200">
            <h4 className="font-extrabold mb-2 text-slate-900">Kết quả dịch vụ (chỉ xem)</h4>

            {serviceResults.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-3 text-slate-600 bg-slate-50/40">
                Chưa có kết quả dịch vụ.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                    <tr className="bg-gradient-to-b from-teal-50 to-white">
                      <th className="px-3 py-2 w-64">Loại dịch vụ</th>
                      <th className="px-3 py-2 w-40">Trạng thái</th>
                      <th className="px-3 py-2">Kết quả</th>
                      <th className="px-3 py-2 w-60">Ghi chú</th>
                      <th className="px-3 py-2 w-44">Tệp đính kèm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceResults.map((r, i) => {
                      const files = Array.isArray(r.files)
                        ? r.files
                        : Array.isArray(r.attachments) ? r.attachments
                        : (typeof r.file === "string" ? [r.file] : []);
                      return (
                        <tr key={r.id || i} className="align-top">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900 truncate">{r.name || r.serviceName || r.id || "—"}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-amber-200 bg-amber-50 text-amber-700">
                              {r.status || STATUS_DEFAULT}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="max-h-28 overflow-y-auto scrollbar-none break-words">{r.result || "—"}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="max-h-28 overflow-y-auto scrollbar-none break-words">{r.note || "—"}</div>
                          </td>
                          <td className="px-3 py-2">
                            {files && files.length ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {files.map((f, idx) => {
                                  const href = typeof f === "string" ? f : (f.url || f.href);
                                  const label = typeof f === "string" ? f.split("/").pop() : (f.name || f.filename || f.url || "Tệp");
                                  return href ? (
                                    <li key={idx}>
                                      <a href={href} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">
                                        {label}
                                      </a>
                                    </li>
                                  ) : <li key={idx} className="text-slate-500">—</li>;
                                })}
                              </ul>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>

          {/* Chẩn đoán & Điều trị */}
          <motion.section {...fadeIn} className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200">
            <h4 className="font-extrabold mb-2 text-slate-900">Chẩn đoán & Điều trị</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Chẩn đoán sơ bộ
                <input
                  value={dx.pre}
                  onChange={(e) => setDx((s) => ({ ...s, pre: e.target.value }))}
                  className="mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                />
              </label>
              <label className="text-sm">Chẩn đoán xác định
                <input
                  value={dx.final}
                  onChange={(e) => setDx((s) => ({ ...s, final: e.target.value }))}
                  className="mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                />
              </label>
              <label className="text-sm md:col-span-2">Phác đồ điều trị
                <textarea
                  rows={3}
                  value={dx.plan}
                  onChange={(e) => setDx((s) => ({ ...s, plan: e.target.value }))}
                  className="scrollbar-none mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                />
              </label>
              <label className="text-sm md:col-span-2">Tư vấn & Dặn dò
                <textarea
                  rows={3}
                  value={dx.advice}
                  onChange={(e) => setDx((s) => ({ ...s, advice: e.target.value }))}
                  className="scrollbar-none mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                />
              </label>
            </div>
          </motion.section>

          {/* Kê đơn thuốc */}
          <motion.section {...fadeIn} className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900">Kê đơn thuốc</h4>
              <Button className="btn-primary" onClick={() => setPickerOpen(true)}>Kê thuốc</Button>
            </div>

            <div className="mt-2 rounded-xl bg-white shadow-inner/10 max-h-56 overflow-y-auto scrollbar-none border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                  <tr className="bg-gradient-to-b from-teal-50 to-white">
                    <th className="px-3 py-2 w-12">STT</th>
                    <th className="px-3 py-2">Thuốc</th>
                    <th className="px-3 py-2">Liều dùng</th>
                    <th className="px-3 py-2 w-24">Số lượng</th>
                    <th className="px-3 py-2 w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rx.map((r, i) => (
                    <tr key={r.code || `${r.name}-${i}`} className={`transition-colors hover:bg-teal-50/50`}>
                      <td className="px-3 py-2 text-slate-700">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.code} • {r.unit}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.dose || ""}
                          onChange={(e) => setRx((s) => s.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))}
                          placeholder="VD: 1v x 2 lần/ngày"
                          className="w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none placeholder:text-slate-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="1" value={r.qty || ""}
                          onChange={(e) => setRx((s) => s.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                          placeholder="SL"
                          className="w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button className="!px-2" onClick={() => removeRxAt(i)} aria-label="Xóa thuốc">✕</Button>
                      </td>
                    </tr>
                  ))}
                  {!rx.length && (
                    <tr><td colSpan="5" className="px-3 py-6 text-slate-500">Chưa có thuốc. Nhấn <b>Kê thuốc</b> để thêm.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Actions */}
          <div className="px-4 pt-3 flex justify-end">
            <Button
              className="transition-all duration-300 
                  disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
              variant="radigan"
              disabled={!hasDx}
              aria-disabled={!hasDx}
              onClick={handleExportDiagnosis}
              title={!hasDx ? "Cần có chẩn đoán" : "Xuất phiếu chẩn đoán & kết thúc khám"}
            >
              Xuất phiếu chẩn đoán
            </Button>
          </div>

          <div className="h-2" />
        </motion.div>
      </section>

      {/* Rx modal */}
      <RxPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPickMany={onPickMany} />
    </>
  );
}
