import React, { useEffect } from "react";

/**
 * PrintExamTicket
 * In phiếu tiếp nhận/khám (hoặc dịch vụ) bằng iframe ẩn để chỉ in đúng nội dung phiếu.
 *
 * Props:
 *  - show: boolean
 *  - printedBy?: string               -> tên người in, hiển thị ở chân phiếu
 *  - patient: {id, name, gender, dob, phone, address}
 *  - exam:   { type, dept, room, symptoms, note }
 *  - booking:{ date, time, price, doctor, dept }
 *  - isServiceIntake: boolean
 *  - totalServiceFee: number
 *  - services?: Array<string|{name:string, room?:string, price?:number}>
 *  - feePaid?: boolean   -> nếu undefined và price=0 thì ẩn toàn bộ dòng phí
 *  - onAfterPrint?: () => void
 */
export default function PrintExamTicket({
  show = false,
  printedBy = (window?.APP_USER && (window.APP_USER.fullName || window.APP_USER.name)) || "—",
  patient = {},
  exam = {},
  booking = {},
  isServiceIntake = false,
  totalServiceFee = 0,
  services = [],
  feePaid,
  onAfterPrint,
}) {
  useEffect(() => {
    if (!show) return;

    const nfmt = (n) => (Number(n || 0) || 0).toLocaleString("vi-VN");
    const ds = new Date().toLocaleString("vi-VN");

    const feeLabel = isServiceIntake ? "Tổng phí dịch vụ" : "Phí khám";
    const feeAmount = isServiceIntake ? totalServiceFee : (booking?.price || 0);
    const showFeeRow = feeAmount > 0 && feePaid !== undefined;

    // Chuẩn hóa services thành {name, room, price}
    const rows = (services || []).map((s) => {
      if (typeof s === "string") return { name: s, room: "", price: undefined };
      return { name: s?.name || "", room: s?.room || "", price: s?.price };
    });

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Phiếu khám</title>
    <style>
      :root { --c-main:#0f766e; --c-ac:#10b981; --c-text:#0f172a; }
      html,body{ margin:0; padding:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--c-text); }
      .wrap{ padding:24px; }
      .title{ text-align:center; color:var(--c-main); font-weight:800; font-size:20px; margin:0 0 8px; }
      .subtitle{ text-align:center; color:#475569; font-weight:600; margin:0 0 12px; }
      .meta{ text-align:right; color:#64748b; font-size:12px; margin-bottom:12px; }
      table{ width:100%; border-collapse:collapse; font-size:14px; }
      th,td{ border:1px solid #000; padding:8px; vertical-align:top; }
      th{ background:#ecfeff; text-align:left; }
      .block{ margin-top:14px; }
      .badge{ display:inline-block; border:1px solid #a7f3d0; background:#ecfdf5; color:#064e3b; padding:2px 8px; border-radius:999px; font-weight:700; font-size:12px; }
      .fee{ color:#065f46; font-weight:800; }
      .muted{ color:#6b7280; }
      .footer{ display:flex; justify-content:space-between; align-items:flex-end; margin-top:24px; }
      .sign{ text-align:center; color:#334155; flex:0 0 260px; }
      @page { margin: 16mm; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="meta">In lúc: ${ds}</div>
      <h1 class="title">${isServiceIntake ? "PHIẾU KHÁM DỊCH VỤ" : "PHIẾU TIẾP NHẬN KHÁM"}</h1>
      <h2 class="subtitle">HealthCare Clinic</h2>

      <!-- Thông tin bệnh nhân -->
      <table>
        <tbody>
          <tr>
            <th style="width:22%">Họ và tên</th>
            <td style="width:28%">${safe(patient.name)}</td>
            <th style="width:18%">Mã BN</th>
            <td style="width:32%">${safe(patient.id || patient.pid || "-")}</td>
          </tr>
          <tr>
            <th>Ngày sinh</th>
            <td>${safe(patient.dob || "-")}</td>
            <th>Giới tính</th>
            <td>${safe(patient.gender || "-")}</td>
          </tr>
          <tr>
            <th>Điện thoại</th>
            <td>${safe(patient.phone || "-")}</td>
            <th>Địa chỉ</th>
            <td>${safe(patient.address || "-")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Thông tin chung -->
      <div class="block">
        <table>
          <tbody>
            <tr>
              <th style="width:22%">Loại khám</th>
              <td style="width:28%">${safe(exam?.type || "Khám thường")}</td>
              <th style="width:18%">Ngày/Giờ</th>
              <td style="width:32%">${safe(booking?.date || "-")} • ${safe(booking?.time || "-")}</td>
            </tr>
            ${
              isServiceIntake
                ? `
                <!-- DỊCH VỤ: thay Khoa/Phòng/Bác sĩ bằng Tổng phí + Trạng thái phí -->
                <tr>
                  <th>Tổng phí</th>
                  <td><span class="fee">${nfmt(feeAmount)}đ</span></td>
                  <th>Trạng thái phí</th>
                  <td>${feeAmount > 0 ? '<span class="badge">ĐÃ THU</span>' : '<span class="muted">Không thu</span>'}</td>
                </tr>`
                : `
                <tr>
                  <th>Khoa</th>
                  <td>${safe(exam?.dept || booking?.dept || "-")}</td>
                  <th>Phòng</th>
                  <td>${safe(exam?.room || "-")}</td>
                </tr>
                <tr>
                  <th>Bác sĩ</th>
                  <td>${safe(booking?.doctor || "-")}</td>
                  <th>Trạng thái phí</th>
                  <td>${feeAmount > 0 ? '<span class="badge">ĐÃ THU</span>' : '<span class="muted">Không thu</span>'}</td>
                </tr>`
            }
          </tbody>
        </table>
      </div>

      ${
        isServiceIntake
          ? `
      <!-- Bảng dịch vụ: thêm Phòng (mặc định "Phòng + tên dịch vụ") và Phí từng loại -->
      <div class="block">
        <table>
          <thead>
            <tr>
              <th style="width:46%">Dịch vụ</th>
              <th style="width:24%">Phòng</th>
              <th style="width:30%">Ghi chú / Khác</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map((r) => {
                      const room = r.room && r.room.trim() ? r.room : ("Phòng " + (r.name || "").trim());
                      const price = (r.price != null) ? ` • Phí: <b class="fee">${nfmt(r.price)}đ</b>` : "";
                      return `<tr>
                        <td>${safe(r.name)}${price}</td>
                        <td>${safe(room)}</td>
                        <td></td>
                      </tr>`;
                    })
                    .join("")
                : `<tr><td colspan="3" class="muted">Không có dịch vụ</td></tr>`
            }
          </tbody>
        </table>
      </div>`
          : ""
      }

      ${
        !isServiceIntake
          ? `
      <div class="block">
        <table>
          <tbody>
            <tr>
              <th style="width:22%">${/tái khám/i.test(exam?.type || "") ? "Ghi chú" : "Triệu chứng"}</th>
              <td>${safe(/tái khám/i.test(exam?.type || "") ? (exam?.note || "—") : (exam?.symptoms || "—"))}</td>
            </tr>
          </tbody>
        </table>
      </div>`
          : ""
      }

      ${
        showFeeRow
          ? `
      <div class="block">
        <table>
          <tbody>
            <tr>
              <th style="width:22%">${feeLabel}</th>
              <td><span class="fee">${nfmt(feeAmount)}đ</span> ${feePaid ? '<span class="badge" style="margin-left:8px">ĐÃ THU</span>' : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>`
          : ""
      }

      <!-- Footer: chỉ Người lập phiếu + Người in -->
      <div class="footer">
        <div class="sign">
          <div class="muted">Người lập phiếu</div>
          <div style="height:64px"></div>
          <div>.......................................</div>
        </div>
        <div class="muted">Người in: <b>${safe(printedBy)}</b></div>
      </div>
    </div>
  </body>
</html>`;

    // In bằng iframe ẩn (đảm bảo chỉ in nội dung phiếu)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const destroy = () => {
      try { document.body.removeChild(iframe); } catch {}
      if (typeof onAfterPrint === "function") onAfterPrint();
    };

    const onLoad = () => {
      setTimeout(() => {
        const w = iframe.contentWindow;
        if (!w) return destroy();
        const after = () => { w.removeEventListener?.("afterprint", after); destroy(); };
        w.addEventListener?.("afterprint", after);
        w.focus();
        w.print();
        setTimeout(after, 2000);
      }, 50);
    };

    iframe.onload = onLoad;
    iframe.srcdoc = html;

    return () => { try { document.body.removeChild(iframe); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, printedBy, isServiceIntake, patient, exam, booking, totalServiceFee, services, feePaid, onAfterPrint]);

  return null;
}

function safe(v) {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
