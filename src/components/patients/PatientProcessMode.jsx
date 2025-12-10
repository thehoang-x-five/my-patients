import React from "react";
import { motion } from "framer-motion";
import { ANIMATION_CONFIG, R } from "./Shared.jsx";

// COMPONENT – Phiếu chẩn đoán cuối  đơn thuốc (dùng để in cho bệnh nhân)
export default function PatientProcessMode({
  diagnosisData,
  rx,
  totalDrugAmount,
  handleFinishDoctor,
  handleFetchFinalDiagnosis,
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

  const followupText =
    diagnosisData?.HuongXuTri ?? diagnosisData?.followup ?? "";
  const isRevisit = /tái\s*khám/i.test(followupText || "");

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

          {/* Hướng xử trí  ô nhỏ "Tái khám sau 7 ngày" nếu có chỉ định tái khám */}
          <div className="md:col-span-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <R
                label="Hướng xử trí"
                value={followupText || "Không có nội dung"}
                classname={"ring-orange-200 bg-yellow-50/40"}
              />
            </div>
            {isRevisit && (
              <div className="md:w-44 rounded-xl px-3 py-2 ring-1 ring-emerald-200 bg-emerald-50/70 text-[11px] text-emerald-800 flex flex-col justify-center">
                <div className="font-semibold mb-0.5">Tái khám dự kiến</div>
                <div className="font-bold tabular-nums">Sau 7 ngày</div>
              </div>
            )}
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
          {typeof handleFetchFinalDiagnosis === "function" && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFetchFinalDiagnosis}
              className="px-4 py-3 rounded-xl bg-white text-emerald-700 font-semibold ring-1 ring-emerald-200 shadow-sm hover:bg-emerald-50 transition"
            >
              Tải chẩn đoán cuối
            </motion.button>
          )}
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
