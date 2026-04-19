import React from "react";
import { motion } from "framer-motion";
import { ANIMATION_CONFIG, R } from "./Shared.jsx";
import { formatVietnameseText } from "../../utils/textFormatters.js";

function normalizeAttachments(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            id: `file-${index + 1}`,
            name: item,
            url: "",
          };
        }

        if (item && typeof item === "object") {
          return {
            id: item.id || item.name || item.fileName || `file-${index + 1}`,
            name:
              item.name ||
              item.fileName ||
              item.filename ||
              item.url ||
              `Tệp ${index + 1}`,
            url: item.url || item.href || item.path || "",
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
        return normalizeAttachments(JSON.parse(trimmed));
      } catch {
        return [
          {
            id: trimmed,
            name: trimmed,
            url: "",
          },
        ];
      }
    }

    return [
      {
        id: trimmed,
        name: trimmed,
        url: "",
      },
    ];
  }

  return [];
}

function formatDateTime(value) {
  if (!value) return "Không có nội dung";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("vi-VN");
}

export default function PatientProcessMode({
  isSvcProcessing = false,
  diagnosisData,
  setDiagnosisData,
  rx,
  totalDrugAmount,
  handleFinishDoctor,
  svcResults = [],
  clsSummary = null,
  serviceProcessMeta = null,
  processingServiceReturn = false,
  handleServiceReturnToDoctor,
}) {
  const serviceRows = React.useMemo(() => {
    if (!Array.isArray(svcResults) || !svcResults.length) return [];
    return svcResults.map((row, idx) => ({
      id: row.id || row.maKetQua || row.maChiTietDv || `${idx}`,
      service:
        row.service ||
        row.serviceName ||
        row.tenDichVu ||
        row.TenDichVu ||
        `Dịch vụ ${idx + 1}`,
      result:
        row.result ||
        row.resultText ||
        row.noiDungKetQua ||
        row.NoiDungKetQua ||
        row.ketQua ||
        row.KetQua ||
        row.note ||
        "Chưa có kết quả",
      note: row.note || row.ghiChu || "",
      technician:
        row.technician ||
        row.staffName ||
        row.tenKyThuatVien ||
        row.TenKyThuatVien ||
        row.tenNhanSuThucHien ||
        row.TenNhanSuThucHien ||
        "",
      timeText: row.timeText || row.thoiGian || row.ThoiGian || "",
      attachments: normalizeAttachments(row.attachments),
    }));
  }, [svcResults]);

  if (isSvcProcessing) {
    const summaryCode =
      serviceProcessMeta?.maPhieuTongHop ||
      serviceProcessMeta?.MaPhieuTongHop ||
      "";
    const clsOrderCode =
      serviceProcessMeta?.maPhieuKhamCls ||
      serviceProcessMeta?.MaPhieuKhamCls ||
      "";
    const clinicalCode =
      serviceProcessMeta?.maPhieuKham ||
      serviceProcessMeta?.MaPhieuKham ||
      diagnosisData?.MaPhieuKham ||
      diagnosisData?.maPhieuKham ||
      "";
    const statusText = formatVietnameseText(
      serviceProcessMeta?.trangThai ||
        serviceProcessMeta?.TrangThai ||
      "cho_xu_ly"
    );
    const summaryNote =
      serviceProcessMeta?.ghiChu ||
      serviceProcessMeta?.GhiChu ||
      clsSummary?.GhiChu ||
      clsSummary?.ghiChu ||
      "Đã có đủ kết quả CLS, chờ y tá hành chính xử lý để trả bệnh nhân về bác sĩ chỉ định.";

    return (
      <motion.div {...ANIMATION_CONFIG} className="space-y-3">
        <motion.section
          whileHover={{ y: -2 }}
          className="rounded-2xl p-3 mt-2 mb-0 ring-1 ring-cyan-200/60 bg-gradient-to-br from-cyan-50/50 to-white shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="font-bold text-slate-900">
              Phiếu tổng hợp kết quả CLS
            </h4>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {statusText || "Chờ xử lý"}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <R label="Mã phiếu khám" value={clinicalCode || "-"} />
            <R label="Mã phiếu tổng hợp" value={summaryCode || "-"} />
            <R label="Mã phiếu CLS" value={clsOrderCode || "-"} />
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <R
              label="Thời gian xử lý"
              value={formatDateTime(
                serviceProcessMeta?.thoiGianXuLy ||
                  serviceProcessMeta?.ThoiGianXuLy
              )}
            />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Ghi chú tổng hợp
              </div>
              <div className="rounded-xl px-3 py-2 ring-1 ring-emerald-200/60 bg-white text-[13px] text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto scrollbar-none pr-2 break-all">
                {summaryNote || "Không có nội dung"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">
              Kết quả dịch vụ đã trả về
            </div>

            {!serviceRows.length ? (
              <div className="rounded-xl px-3 py-3 ring-1 ring-slate-200 bg-slate-50 text-[13px] text-slate-600">
                Chưa có kết quả CLS để hiển thị.
              </div>
            ) : (
              <div className="rounded-xl ring-1 ring-cyan-200 bg-white overflow-hidden shadow-sm max-h-[26rem] overflow-y-auto scrollbar-none">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[54%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="bg-cyan-50/80">
                    <tr className="text-xs font-bold text-slate-700">
                      <th className="px-3 py-2.5 text-left align-top">Dịch vụ</th>
                      <th className="px-3 py-2.5 text-left align-top">KTV/Nhân sự</th>
                      <th className="px-3 py-2.5 text-left align-top">Kết quả</th>
                      <th className="px-3 py-2.5 text-left align-top">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-slate-100 hover:bg-cyan-50/30 transition"
                      >
                        <td className="px-3 py-2 font-medium text-slate-900 align-top">
                          <div className="max-h-24 overflow-y-auto scrollbar-none pr-1 break-all">
                            {row.service}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700 align-top">
                          <div className="max-h-24 overflow-y-auto scrollbar-none pr-1 break-all">
                            {row.technician || "Chưa gán"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700 align-top">
                          <div className="max-h-28 overflow-y-auto scrollbar-none pr-1 whitespace-pre-wrap break-all">
                            {row.result}
                          </div>
                          {row.note && row.note !== row.result ? (
                            <div className="mt-1 text-xs text-slate-500 max-h-20 overflow-y-auto scrollbar-none pr-1 whitespace-pre-wrap break-all">
                              Ghi chú: {row.note}
                            </div>
                          ) : null}
                          {row.attachments.length ? (
                            <div className="mt-2 space-y-1 text-xs text-cyan-700">
                              <div className="font-semibold">
                                Tệp đính kèm: {row.attachments.length}
                              </div>
                              <div className="max-h-20 overflow-y-auto scrollbar-none space-y-1">
                                {row.attachments.map((file, index) => (
                                  <div
                                    key={file.id || file.name || index}
                                    className="break-all"
                                  >
                                    {file.url ? (
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline underline-offset-2 hover:text-cyan-800"
                                      >
                                        {file.name || `Tệp ${index + 1}`}
                                      </a>
                                    ) : (
                                      <span>{file.name || `Tệp ${index + 1}`}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-slate-600 align-top">
                          <div className="break-words">{row.timeText || "-"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-200">
            <motion.button
              type="button"
              whileHover={{
                scale: processingServiceReturn ? 1 : 1.02,
                y: processingServiceReturn ? 0 : -1,
              }}
              whileTap={{ scale: processingServiceReturn ? 1 : 0.98 }}
              onClick={handleServiceReturnToDoctor}
              disabled={processingServiceReturn}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processingServiceReturn
                ? "Đang trả về bác sĩ..."
                : "Xử lý và trả về bác sĩ"}
            </motion.button>
          </div>
        </motion.section>
      </motion.div>
    );
  }

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

  const dxPrimary = diagnosisData?.ChanDoanSoBo ?? diagnosisData?.dxPrimary ?? "";
  const dxFinal = diagnosisData?.ChanDoanCuoi ?? diagnosisData?.dxSecondary ?? "";

  const rawSummary = diagnosisData?.NoiDungKham ?? diagnosisData?.summary ?? "";
  const summary = rawSummary
    .split(/\s+/)
    .map((word) => {
      if (word.includes("_")) {
        return formatVietnameseText(word);
      }
      return word;
    })
    .join(" ");

  const treatmentPlan =
    diagnosisData?.PhatDoDieuTri ?? diagnosisData?.orders ?? "";
  const advice = diagnosisData?.LoiKhuyen ?? diagnosisData?.advice ?? "";

  const followupFlags = diagnosisData?.followupFlags || {
    choVe: false,
    choThuocVe: false,
    taiKham: false,
  };

  const followupParts = [];
  if (followupFlags.choVe) followupParts.push("Cho về");
  if (followupFlags.choThuocVe) followupParts.push("Cho thuốc về");
  if (followupFlags.taiKham) followupParts.push("Tái khám");
  const isRevisit = followupFlags.taiKham;

  const toggleFlag = (flagName) => {
    if (!setDiagnosisData) return;

    setDiagnosisData((prev) => {
      const prevFlags = prev.followupFlags || {
        choVe: false,
        choThuocVe: false,
        taiKham: false,
      };
      const nextFlags = { ...prevFlags, [flagName]: !prevFlags[flagName] };

      if (flagName === "choVe" && nextFlags.choVe && nextFlags.taiKham) {
        nextFlags.taiKham = false;
      }
      if (flagName === "taiKham" && nextFlags.taiKham && nextFlags.choVe) {
        nextFlags.choVe = false;
      }

      return { ...prev, followupFlags: nextFlags };
    });
  };

  void toggleFlag;
  void followupParts;

  return (
    <motion.div {...ANIMATION_CONFIG} className="space-y-3">
      <motion.section
        whileHover={{ y: -2 }}
        className="rounded-2xl p-3 mt-2 mb-0 ring-1 ring-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
      >
        <h4 className="font-bold text-slate-900 mb-3">Phiếu chẩn đoán cuối</h4>

        {(diagCode || examCode || prescriptionCode) && (
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {diagCode && <R label="Mã phiếu chẩn đoán" value={diagCode} />}
            {examCode && <R label="Mã phiếu khám" value={examCode} />}
            {prescriptionCode && (
              <R label="Mã đơn thuốc" value={prescriptionCode} />
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="md:col-span-2">
            <R label="Chẩn đoán sơ bộ" value={dxPrimary || "-"} />
          </div>
          <div className="md:col-span-2">
            <R
              label="Chẩn đoán cuối"
              value={dxFinal || "-"}
              classname="ring-emerald-200 bg-emerald-50/40"
            />
          </div>
          <div className="md:col-span-2">
            <R label="Nội dung khám" value={summary || "Không có nội dung"} />
          </div>
          {treatmentPlan && (
            <div className="md:col-span-2">
              <R label="Phác đồ điều trị / Chỉ định" value={treatmentPlan} />
            </div>
          )}
          {advice && (
            <div className="md:col-span-2">
              <R label="Lời khuyên" value={advice} />
            </div>
          )}

          <div className="md:col-span-2">
            <div className="text-sm font-semibold text-slate-700 mb-2">
              Hướng xử trí
            </div>
            <div className="rounded-xl px-4 py-3 ring-1 ring-orange-200 bg-yellow-50/40">
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 ">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600"
                    checked={!!followupFlags.choVe}
                    disabled
                    readOnly
                  />
                  <span>Cho về</span>
                </label>
                <label className="inline-flex items-center gap-2 ">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600"
                    checked={!!followupFlags.choThuocVe}
                    disabled
                    readOnly
                  />
                  <span>Cho thuốc về</span>
                </label>
                <label className="inline-flex items-center gap-2 ">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600"
                    checked={!!followupFlags.taiKham}
                    disabled
                    readOnly
                  />
                  <span>Tái khám</span>
                </label>
              </div>
              {isRevisit ? (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="text-xs text-emerald-700 font-semibold">
                    Tái khám dự kiến: Sau 7 ngày
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
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
                    const name = r.TenThuoc || r.tenThuoc || r.name || "-";
                    const unit = r.DonViTinh || r.donViTinh || r.unit || "-";
                    const usage =
                      r.ChiDinhSuDung || r.chiDinhSuDung || r.usage || "-";
                    const qty = r.SoLuong ?? r.soLuong ?? r.qty ?? "-";
                    const unitPriceRaw = r.DonGia ?? r.donGia ?? r.price ?? null;
                    const unitPriceText =
                      unitPriceRaw != null
                        ? `${Number(unitPriceRaw).toLocaleString("vi-VN")}đ`
                        : "-";
                    const lineTotalRaw =
                      r.ThanhTien ??
                      r.thanhTien ??
                      (unitPriceRaw != null && qty
                        ? Number(unitPriceRaw) * Number(qty)
                        : null);
                    const lineTotalText =
                      lineTotalRaw != null
                        ? `${Number(lineTotalRaw).toLocaleString("vi-VN")}đ`
                        : "-";

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
                        <td className="px-3 py-2 whitespace-pre-wrap">{usage}</td>
                        <td className="px-3 py-2">{qty}</td>
                        <td className="px-3 py-2">{unitPriceText}</td>
                        <td className="px-3 py-2 font-semibold">{lineTotalText}</td>
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
            Hoàn tất và thu phí
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
}
