// src/components/exam/ExamDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import RxPickerModal from "./RxPickerModal.jsx";
import {
  useExamServices,
  useCreateExamOrder,
  useCreateDiagnosis,
} from "../../api/examination.js";

const MAX_NOTE_LEN = 200;
const STATUS_DEFAULT = "Chưa có kết quả";
const fadeIn = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

function emptyRow() {
  return {
    id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    svcId: "",
    status: STATUS_DEFAULT,
    note: "",
  };
}

export default function ExamDetail({ patient, onBack, onExportDiagnosis, onExportOrder }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [dx, setDx] = useState({ pre: "", final: "", plan: "", advice: "" });
  const [rx, setRx] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: examServices = [] } = useExamServices();
  const svcMap = useMemo(() => {
    const m = new Map();
    examServices.forEach((s) => m.set(s.id, s));
    return m;
  }, [examServices]);

  // Prefill nếu có serviceOrder.items
  useEffect(() => {
    const items = patient?.serviceOrder?.items;
    if (Array.isArray(items) && items.length) {
      setRows(
        items.map((sid) => ({
          ...emptyRow(),
          svcId: sid,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.serviceOrder?.items]);

  const hasOrder = useMemo(() => rows.some((r) => (r.svcId || "").trim()), [rows]);
  const hasDx = useMemo(() => {
    const t = (v) => (v ?? "").trim();
    return !!(t(dx.pre) || t(dx.final) || t(dx.plan) || t(dx.advice));
  }, [dx]);

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
          result: r.result || "",
        };
      });

    const rxRows = rx
      .map((r) => ({
        code: r.code,
        name: r.name,
        dose: (r.dose ?? "").trim(),
        qty: Math.max(1, Number.parseInt(r.qty ?? 0, 10) || 0),
      }))
      .filter((r) => r.code && r.name && r.dose && Number.isFinite(r.qty) && r.qty > 0);

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

  // Mutations
  const orderMut = useCreateExamOrder();
  const dxMut = useCreateDiagnosis();

  async function handleExportOrder() {
    if (!hasOrder) return;
    const payload = buildPayloadCommon();
    const pid = patient?.pid || patient?.id;

    if (onExportOrder) {
      onExportOrder(patient, payload);
      return;
    }
    // Default: gọi API trực tiếp
    await orderMut.mutateAsync({
      pid,
      services: payload.orderRows.map((r) => ({ id: r.id, note: r.note })),
      note: payload.orderRows.map((r) => r.note).filter(Boolean).join("; "),
      fromDoctor: patient?.doctor || "Bác sĩ phụ trách",
    });
  }

  async function handleExportDiagnosis() {
    if (!hasDx) return;
    const payload = buildPayloadCommon();
    const pid = patient?.pid || patient?.id;
    payload.services = payload.orderRows.map((r) => r.id);

    if (onExportDiagnosis) {
      onExportDiagnosis(patient, payload);
      return;
    }
    // Default: gọi API trực tiếp
    await dxMut.mutateAsync({
      pid,
      dx,
      rx: payload.rxRows,
      services: payload.services,
    });
  }

  function onPickMany(list) {
    setRx((s) => [...s, ...list.filter((n) => !s.some((x) => x.code === n.code))]);
    setPickerOpen(false);
  }
  function removeRxAt(index) { setRx((s) => s.filter((_, i) => i !== index)); }

  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <section className="h-full min-h-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-teal-50 via-white to-teal-50/60 backdrop-blur shadow-sm">
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
          {/* Phiếu khám */}
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
                      <tr key={r.id} className="align-top transition-colors hover:bg-teal-50/50">
                        <td className="px-2 py-2 text-slate-700">{idx + 1}</td>
                        <td className="px-2 py-2">
                          <select
                            value={r.svcId}
                            onChange={(e) => patchRow(r.id, { svcId: e.target.value })}
                            className="w-full rounded-lg px-2 py-1 ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none"
                          >
                            <option value="">— Chọn dịch vụ —</option>
                            {examServices.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          {svc?.name && <div className="text-xs text-slate-500 mt-0.5">{svc.name}</div>}
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-amber-200 bg-amber-50 text-amber-700">
                            {r.status || STATUS_DEFAULT}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={r.note}
                            onChange={(e) => patchRow(r.id, { note: e.target.value.slice(0, MAX_NOTE_LEN) })}
                            title={r.note}
                            rows={2}
                            maxLength={MAX_NOTE_LEN}
                            placeholder="Ghi chú (vd: chụp tay phải, nhịn ăn 8h...)"
                            className="w-full px-2 py-1 rounded-md ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none max-h-16 overflow-y-auto scrollbar-none bg-white"
                          />
                          <div className="text-[11px] text-slate-400 mt-0.5 text-right">
                            {r.note?.length || 0}/{MAX_NOTE_LEN}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Button type="button" className="!px-2" onClick={() => removeRow(r.id)} aria-label="Xóa dòng">✕</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <Button type="button" onClick={addRow}>+ Thêm dòng</Button>
              <div className="flex gap-2">
                <Button
                  className="transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
                  variant="radigan"
                  disabled={!hasOrder || orderMut.isPending}
                  onClick={handleExportOrder}
                  title={!hasOrder ? "Chọn ít nhất 1 dịch vụ" : "Xuất phiếu khám (chuyển sang tiếp nhận dịch vụ)"}
                >
                  {orderMut.isPending ? "Đang lưu..." : "Xuất phiếu khám"}
                </Button>
              </div>
            </div>
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

          {/* Kê đơn */}
          <motion.section {...fadeIn} className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900">Kê đơn thuốc</h4>
              <Button type="button" className="btn-primary" onClick={() => setPickerOpen(true)}>Kê thuốc</Button>
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
                    <tr key={r.code || `${r.name}-${i}`} className="transition-colors hover:bg-teal-50/50">
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
                        <Button type="button" className="!px-2" onClick={() => removeRxAt(i)} aria-label="Xóa thuốc">✕</Button>
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
              className="transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
              variant="radigan"
              disabled={!hasDx || dxMut.isPending}
              aria-disabled={!hasDx || dxMut.isPending}
              onClick={handleExportDiagnosis}
              title={!hasDx ? "Cần có chẩn đoán" : "Xuất phiếu chẩn đoán & kết thúc khám"}
            >
              {dxMut.isPending ? "Đang lưu..." : "Xuất phiếu chẩn đoán"}
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
