import React from "react";

const VND = (value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

export default function VietQRDisplay({ qr }) {
  if (!qr?.QrDataUrl && !qr?.qrDataUrl) {
    return null;
  }

  const qrImage = qr.QrDataUrl ?? qr.qrDataUrl;
  const bankName = qr.BankName ?? qr.bankName ?? "Ngân hàng";
  const accountNo = qr.AccountNo ?? qr.accountNo ?? "—";
  const accountName = qr.AccountName ?? qr.accountName ?? "—";
  const amount = qr.SoTien ?? qr.soTien ?? 0;
  const note = qr.NoiDung ?? qr.noiDung ?? "";

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
          <img
            src={qrImage}
            alt="Mã VietQR thanh toán"
            className="mx-auto h-40 w-40 object-contain"
          />
        </div>

        <div className="space-y-2 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            VietQR
          </div>
          <div className="text-base font-semibold text-slate-900">
            {bankName}
          </div>
          <div>
            <span className="font-medium text-slate-600">Số tài khoản:</span>{" "}
            {accountNo}
          </div>
          <div>
            <span className="font-medium text-slate-600">Chủ tài khoản:</span>{" "}
            {accountName}
          </div>
          <div>
            <span className="font-medium text-slate-600">Số tiền:</span>{" "}
            <span className="font-semibold text-emerald-700">{VND(amount)}</span>
          </div>
          {note && (
            <div>
              <span className="font-medium text-slate-600">Nội dung:</span>{" "}
              <span className="break-all">{note}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
