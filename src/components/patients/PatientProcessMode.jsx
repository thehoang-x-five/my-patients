import React from "react";
import { motion } from "framer-motion";
import { ANIMATION_CONFIG, R } from "./Shared.jsx";

// COMPONENT – Phiếu chẩn đoán cuối  đơn thuốc (dùng để in cho bệnh nhân)
export default function PatientProcessMode({
  diagnosisData,
  setDiagnosisData,
  rx,
  totalDrugAmount,
  handleFinishDoctor,
}) {
  // Hỗ trợ cả shape FinalDiagnosisDto & shape cũ (dxPrimary, dxSecondary,...)
  const diagCode =
    diagnosisData?.MaPhieuChanDoan ||
    diagnosisData?.maPhieuChanDoan ||
    diagnosisData?.diagnosisCode ||
    "";

  const examCode =
    diagnosisData?.MaPhieuKham ||
    diagnosisData?.maPhieuKham ||
    diagnosisData?.examCode ||
    "";

  const prescriptionCode =
    diagnosisData?.MaDonThuoc ||
    diagnosisData?.maDonThuoc ||
    diagnosisData?.prescriptionCode ||
    "";

  const dxPrimary =
    diagnosisData?.ChanDoanSoBo ?? diagnosisData?.dxPrimary ?? "";
  const dxFinal =
    diagnosisData?.ChanDoanCuoi ?? diagnosisData?.dxSecondary ?? "";
  const summary =
    diagnosisData?.NoiDungKham ?? diagnosisData?.summary ?? "";
  const treatmentPlan =
    diagnosisData?.PhatDoDieuTri ?? diagnosisData?.orders ?? "";
  const advice =
    diagnosisData?.LoiKhuyen ?? diagnosisData?.advice ?? "";

  // Get followup flags
  const followupFlags = diagnosisData?.followupFlags || {
    choVe: false,
    choThuocVe: false,
    taiKham: false,
  };

  // Build followup text from flags
  const followupParts = [];
  if (followupFlags.choVe) followupParts.push("Cho về");
  if (followupFlags.choThuocVe) followupParts.push("Cho thuốc về");
  if (followupFlags.taiKham) followupParts.push("Tái khám");
  const followupText = followupParts.length > 0 ? followupParts.join(", ") : "Không có nội dung";
  
  const isRevisit = followupFlags.taiKham;

  // Toggle flag handler
  const toggleFlag = (flagName) => {
    if (!setDiagnosisData) return;
    
    setDiagnosisData((prev) => {
      const prevFlags = prev.followupFlags || {
        choVe: false,
        choThuocVe: false,
        taiKham: false,
      };
      const nextFlags = { ...prevFlags, [flagName]: !prevFlags[flagName] };

      // Không cho tick cùng lúc "Cho về" + "Tái khám"
      if (flagName === "choVe" && nextFlags.choVe && nextFlags.taiKham) {
        nextFlags.taiKham = false;
      }
      if (flagName === "taiKham" && nextFlags.taiKham && nextFlags.choVe) {
        nextFlags.choVe = false;
      }

      return { ...prev, followupFlags: nextFlags };
    });
  };

  return (
    <motion.div {...ANIMATION_CONFIG} className="space-y-3">
      <motion.section
        whileHover={{ y: -2 }}
        className="rounded-2xl p-3 mt-2 mb-0 ring-1 ring-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
      >
        <h4 className="font-bold text-slate-900 mb-3">Phiếu chẩn đoán cuối</h4>

        {/* Meta: Mã phiếu / Mã khám / Mã đơn thuốc */}
        {(diagCode || examCode || prescriptionCode) && (
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {diagCode && (
              <R label="Mã phiếu chẩn đoán" value={diagCode} />
            )}
            {examCode && <R label="Mã phiếu khám" value={examCode} />}
            {prescriptionCode && (
              <R label="Mã đơn thuốc" value={prescriptionCode} />
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="md:col-span-2">
            <R label="Chẩn đoán sơ bộ" value={dxPrimary || "—"} />
          </div>
          <div className="md:col-span-2">
            <R
              label="Chẩn đoán cuối"
              value={dxFinal || "—"}
              classname="ring-emerald-200 bg-emerald-50/40"
            />
          </div>
          <div className="md:col-span-2">
            <R
              label="Nội dung khám"
              value={summary || "Không có nội dung"}
            />
          </div>
          {treatmentPlan && (
            <div className="md:col-span-2">
              <R
                label="Phác đồ điều trị / Chỉ định"
                value={treatmentPlan}
              />
            </div>
          )}
          {advice && (
            <div className="md:col-span-2">
              <R label="Lời khuyên" value={advice} />
            </div>
          )}

          {/* Hướng xử trí - Checkboxes */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold text-slate-700 mb-2">
              Hướng xử trí
            </div>
            <div className="rounded-xl px-4 py-3 ring-1 ring-orange-200 bg-yellow-50/40">
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 focus:ring-emerald-500"
                    checked={!!followupFlags.choVe}
                    onChange={() => toggleFlag("choVe")}
                  />
                  <span>Cho về</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 focus:ring-emerald-500"
                    checked={!!followupFlags.choThuocVe}
                    onChange={() => toggleFlag("choThuocVe")}
                  />
                  <span>Cho thuốc về</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 focus:ring-emerald-500"
                    checked={!!followupFlags.taiKham}
                    onChange={() => toggleFlag("taiKham")}
                  />
                  <span>Tái khám</span>
                </label>
              </div>
              {isRevisit && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="text-xs text-emerald-700 font-semibold">
                    💡 Tái khám dự kiến: Sau 7 ngày
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Đơn thuốc */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2"
        >
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Đơn thuốc
          </div>
          {rx.length === 0 ? (
            <div className="rounded-xl px-3 py-2 ring-1 ring-sky-200 bg-sky-50/40 text-[13px] text-slate-600">
              Không có đơn thuốc
            </div>
          ) : (
            <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="rounded-xl ring-1 ring-sky-200 bg-sky-50/40 overflow-hidden shadow-sm"
                        >
                          <table className="min-w-full text-sm">
                            <thead className="bg-emerald-50">
                              <tr className="text-xs font-bold text-slate-700">
                                <th className="px-3 py-2.5 text-left">#</th>
                                <th className="px-3 py-2.5 text-left">Thuốc</th>
                                <th className="px-3 py-2.5 text-left">Đơn vị</th>
                                <th className="px-3 py-2.5 text-left">Chỉ định sử dụng</th>
                                <th className="px-3 py-2.5 text-left">Số lượng</th>
                                <th className="px-3 py-2.5 text-left">Đơn giá</th>
                                <th className="px-3 py-2.5 text-left">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rx.map((r, i) => {
                                // Hỗ trợ cả shape FE (name, unit, price, qty, usage)
                                // và shape BE (TenThuoc, ChiDinhSuDung, SoLuong, DonGia, ThanhTien)
                                const name =
                                  r.TenThuoc || r.tenThuoc || r.name || "—";
                                const unit = r.DonViTinh || r.donViTinh || r.unit || "—";
                                const usage =
                                  r.ChiDinhSuDung ||
                                  r.chiDinhSuDung ||
                                  r.usage ||
                                  "—";
                                const qty =
                                  r.SoLuong ?? r.soLuong ?? r.qty ?? "—";
                                const unitPriceRaw =
                                  r.DonGia ?? r.donGia ?? r.price ?? null;
                                const unitPriceText =
                                  unitPriceRaw != null
                                    ? `${Number(unitPriceRaw).toLocaleString("vi-VN")}đ`
                                    : "—";
                                const lineTotalRaw =
                                  r.ThanhTien ??
                                  r.thanhTien ??
                                  (unitPriceRaw != null && qty
                                    ? Number(unitPriceRaw) * Number(qty)
                                    : null);
                                const lineTotalText =
                                  lineTotalRaw != null
                                    ? `${Number(lineTotalRaw).toLocaleString("vi-VN")}đ`
                                    : "—";
            
                                return (
                                  <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 + i * 0.08 }}
                                    className="border-t border-slate-100 hover:bg-emerald-50/30 transition"
                                  >
                                    <td className="px-3 py-2">{i + 1}</td>
                                    <td className="px-3 py-2">{name}</td>
                                    <td className="px-3 py-2">{unit}</td>
                                    <td className="px-3 py-2 whitespace-pre-wrap">
                                      {usage}
                                    </td>
                                    <td className="px-3 py-2">{qty}</td>
                                    <td className="px-3 py-2">{unitPriceText}</td>
                                    <td className="px-3 py-2 font-semibold">
                                      {lineTotalText}
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </motion.div>
          )}
          <div className="mt-2 text-right text-sm">
            Tổng tiền thuốc:{" "}
            <b className="tabular-nums">
              {totalDrugAmount.toLocaleString("vi-VN")}đ
            </b>
          </div>
        </motion.div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-200">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinishDoctor}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            Hoàn tất & thu phí
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
}
