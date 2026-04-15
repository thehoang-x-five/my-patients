import React, { useEffect } from "react";

/**
 * PrintExamTicket
 * In phiếu tiếp nhận/khám (hoặc dịch vụ) bằng iframe ẩn để chỉ in đúng nội dung phiếu.
 *
 * Props:
 *  - show: boolean
 *  - patient: {id, name, gender, dob, phone, address}
 *  - exam:   { type, dept, room, symptoms, note }
 *  - booking:{ date, time, price, doctor, dept }
 *  - isServiceIntake: boolean
 *  - totalServiceFee: number
 *  - services?: Array<string | {name:string, room?:string, price?:number, note?:string}>
 *  - feePaid?: boolean   -> true: đã thu, false: chưa thu, undefined: suy luận theo từng flow cũ
 *  - onAfterPrint?: () => void
 */
export default function PrintExamTicket({
  show = false,
  patient = {},
  exam = {},
  booking = {},
  isServiceIntake = false,
  totalServiceFee = 0,
  services = [],
  feePaid,
  clsSummary = null,
  creatorName = "",
  onAfterPrint,
}) {
  useEffect(() => {
    if (!show) return;

    const fmt = (n) => (Number(n || 0) || 0).toLocaleString("vi-VN");
    const ds = new Date().toLocaleString("vi-VN");

    // Chuẩn hóa dịch vụ: cho phép truyền string hoặc object
    const normServices = (Array.isArray(services) ? services : []).map((it) => {
      if (typeof it === "string") {
        return { name: it, room: `Phòng ${it}`, price: 0, note: "", technician: "" };
      }
      // Extract technician name from various possible field names
      const technician = 
        it?.technician ||
        it?.TenKyThuatVien ||
        it?.tenKyThuatVien ||
        it?.TenKyThuatVienThucHien ||
        it?.tenKyThuatVienThucHien ||
        it?.TenNhanSuThucHien ||
        it?.tenNhanSuThucHien ||
        it?.kyThuatVien ||
        it?.KyThuatVien ||
        it?.TenKTV ||
        it?.tenKTV ||
        "";
      
      // Debug log to see what data we're receiving
      console.log("[PrintExamTicket] Service item:", it);
      console.log("[PrintExamTicket] Extracted technician:", technician);
      
      return {
        name: it?.name ?? "",
        room: it?.room ?? (it?.name ? `Phòng ${it.name}` : ""),
        price: Number(it?.price || 0),
        note: it?.note || "",
        technician: technician,
      };
    });

    // Chuẩn hóa kết quả CLS tổng hợp (nếu có, cho phiếu LS)
    const normalizeClsSummary = () => {
      if (isServiceIntake) return [];
      const parseMaybeJson = (val) => {
        if (typeof val !== "string") return val;
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      };
      const summary = parseMaybeJson(clsSummary);
      const pickArr = (...candidates) => {
        for (const cand of candidates) {
          const parsed = parseMaybeJson(cand);
          if (Array.isArray(parsed)) return parsed;
          if (parsed?.Items && Array.isArray(parsed.Items)) return parsed.Items;
          if (parsed?.items && Array.isArray(parsed.items)) return parsed.items;
        }
        return [];
      };
      const arr = pickArr(
        summary,
        summary?.KetQua,
        summary?.ketQua,
        summary?.Items,
        summary?.items
      );
      return arr.map((rs, idx) => {
        const serviceName =
          rs.TenDichVu ||
          rs.tenDichVu ||
          rs.DichVu ||
          rs.dichVu ||
          rs?.ChiTietDichVu?.DichVuYTe?.TenDichVu ||
          rs.MaDichVu ||
          rs.maDichVu ||
          `Dịch vụ #${idx + 1}`;
        const resultText =
          rs.NoiDungKetQua ||
          rs.noiDungKetQua ||
          rs.KetQua ||
          rs.ketQua ||
          rs.Result ||
          rs.result ||
          rs.GhiChu ||
          rs.ghiChu ||
          "(Chưa có)";
        const staffName =
          rs.TenKyThuatVienThucHien ||
          rs.tenKyThuatVienThucHien ||
          rs.TenNhanSuThucHien ||
          rs.tenNhanSuThucHien ||
          rs.NguoiThucHien ||
          rs.nguoiThucHien ||
          rs.NguoiLap ||
          rs.nguoiLap ||
          "";
        const timeRaw =
          rs.ThoiGianTao ||
          rs.thoiGianTao ||
          rs.ThoiGian ||
          rs.thoiGian ||
          "";
        const attachmentsRaw =
          rs.TepDinhKem ||
          rs.tepDinhKem ||
          rs.Attachments ||
          rs.attachments ||
          [];
        const attachments = Array.isArray(attachmentsRaw)
          ? attachmentsRaw
          : typeof attachmentsRaw === "string"
          ? [attachmentsRaw]
          : [];
        let timeText = "(Chưa có)";
        if (timeRaw) {
          const d = new Date(timeRaw);
          if (!isNaN(d.getTime())) {
            timeText = d.toLocaleString("vi-VN");
          }
        }
        return { serviceName, resultText, staffName, timeText, attachments };
      });
    };
    const clsSummaryRows = normalizeClsSummary();

    const feeLabel = isServiceIntake ? "Tổng phí dịch vụ" : "Phí khám";
    const feeAmount = isServiceIntake ? totalServiceFee : (booking?.price || 0);
    const hasFee = feeAmount > 0;
    const resolvedFeePaid =
      typeof feePaid === "boolean" ? feePaid : hasFee;
    const feeStatusHtml = !hasFee
      ? '<span class="muted">Không thu</span>'
      : resolvedFeePaid
        ? '<span class="badge badge-paid">ĐÃ THU</span>'
        : '<span class="badge badge-deferred">CHƯA THU</span>';
    const showFeeRow = hasFee && feePaid !== undefined;
    
    // Check if any service has a technician to conditionally show the column
    const hasAnyTechnician = normServices.some(s => s.technician);

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
      .meta{ text-align:right; color:#64748b; font-size:12px; margin-bottom:12px; }
      table{ width:100%; border-collapse:collapse; font-size:14px; }
      th,td{ border:1px solid #000; padding:8px; vertical-align:top; }
      th{ background:#ecfeff; text-align:left; }
      .block{ margin-top:14px; }
      .badge{ display:inline-block; padding:2px 8px; border-radius:999px; font-weight:700; font-size:12px; }
      .badge-paid{ border:1px solid #a7f3d0; background:#ecfdf5; color:#064e3b; }
      .badge-deferred{ border:1px solid #fde68a; background:#fffbeb; color:#92400e; }
      .fee{ color:#065f46; font-weight:800; }
      .muted{ color:#6b7280; }
      .signline{ margin-top:28px; font-weight:600; color:#334155; }
      .dots{ display:inline-block; vertical-align:middle; border-bottom:1px dotted #334155; min-width:280px; height:0; margin-left:8px; }
      .creator{ margin-left:10px; font-weight:700; color:#0f172a; }
      .chk{ display:inline-block; width:14px; height:14px; border:1px solid #000; margin-left:8px; vertical-align:middle; }
      @page { margin: 16mm; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="meta">In lúc: ${ds}</div>
      <h1 class="title ">${isServiceIntake ? "PHIẾU KHÁM DỊCH VỤ" : "PHIẾU TIẾP NHẬN KHÁM"}</h1>

      <!-- Thông tin BN -->
      <table style="margin-top: 6px;">
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

      <!-- Khối thông tin phiếu -->
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
                  <tr>
                    <th>Tổng phí</th>
                    <td><span class="fee">${fmt(feeAmount)}đ</span></td>
                    <th>Trạng thái phí</th>
                    <td>${feeStatusHtml}</td>
                  </tr>
                `
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
                    <td>${feeStatusHtml}</td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      ${
        isServiceIntake
          ? `
      <!-- Bảng dịch vụ (có cột Phòng, Ghi chú, Phí từng DV) -->
      <div class="block">
        <table>
          <thead>
            <tr>
              <th style="width:${hasAnyTechnician ? '25%' : '33%'}">Dịch vụ</th>
              <th style="width:${hasAnyTechnician ? '16%' : '22%'}">Phòng</th>
              ${hasAnyTechnician ? '<th style="width:18%">Kỹ thuật viên</th>' : ''}
              <th style="width:${hasAnyTechnician ? '21%' : '25%'}">Ghi chú</th>
              <th style="width:15%">Phí</th>
              <th style="width:5%"></th>
            </tr>
          </thead>
          <tbody>
            ${
              normServices.length
                ? normServices.map((s) =>
                    `<tr>
                       <td>${safe(s.name)}</td>
                       <td>${safe(s.room || '—')}</td>
                       ${hasAnyTechnician ? `<td>${safe(s.technician || '—')}</td>` : ''}
                       <td>${safe(s.note || '—')}</td>
                       <td>${s.price ? `<b>${fmt(s.price)} đ</b>` : '—'}</td>
                       <td><span class="chk "></span></td>
                     </tr>`
                     
                  ).join("")
                : `<tr><td colspan="${hasAnyTechnician ? '6' : '5'}" class="muted">Không có dịch vụ</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <div class="block">
        <table>
          <tbody>
            <tr>
              <th style="width:22%">Ghi chú chung</th>
              <td>${safe(exam?.note || "—")}</td>
            </tr>
          </tbody>
        </table>
      </div>
      `
          : `
      <div class="block">
        <table><tbody>
          <tr>
            <th style="width:22%">${/tái khám/i.test(exam?.type || "") ? "Ghi chú" : "Triệu chứng"}</th>
            <td>${
              /tái khám/i.test(exam?.type || "")
                ? safe(exam?.note || "—")
                : safe(exam?.symptoms || "—")
            }</td>
          </tr>
        </tbody></table>
      </div>

      ${ showFeeRow
        ? `<div class="block">
             <table><tbody>
               <tr>
                 <th style="width:22%">${feeLabel}</th>
                 <td><span class="fee">${fmt(feeAmount)}đ</span></td>
               </tr>
             </tbody></table>
          </div>`
        : "" }

      ${
        clsSummaryRows.length
          ? `<div class="block">
               <table>
                 <thead>
                   <tr>
                     <th style="width:28%">Dịch vụ CLS</th>
                     <th style="width:32%">Kết quả</th>
                     <th style="width:15%">Người thực hiện</th>
                     <th style="width:13%">Thời gian</th>
                     <th style="width:12%">Tệp đính kèm</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${clsSummaryRows
                     .map(
                       (r) => `<tr>
                         <td>${safe(r.serviceName)}</td>
                         <td>${safe(r.resultText)}</td>
                         <td>${safe(r.staffName || "")}</td>
                         <td>${safe(r.timeText || "")}</td>
                        <td>${safe((Array.isArray(r.attachments) ? r.attachments : []).join(", "))}</td>
                       </tr>`
                     )
                     .join("")}
                 </tbody>
               </table>
             </div>`
          : ""
      }
      `
      }

      <!-- Chữ ký -->
      <div class="signline">
        Người lập phiếu: ${creatorName ? `<span class="creator">${safe(creatorName)}</span>` : ""}
      </div>
    </div>
  </body>
</html>`;

    // tạo iframe ẩn & in
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
        const after = () => {
          w.removeEventListener?.("afterprint", after);
          destroy();
        };
        w.addEventListener?.("afterprint", after);
        w.focus();
        w.print();
        setTimeout(after, 2000);
      }, 50);
    };

    // gán onload trước rồi nạp nội dung
    iframe.onload = onLoad;
    iframe.srcdoc = html;

    return () => { try { document.body.removeChild(iframe); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return null;
}

function safe(v) {
  if (v == null) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
