import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { enqueueService, enqueueReturnToDoctor } from "../../data/queue.js";
import { markServiceDispatched, markServiceDone, markWaitDoctorReview } from "../../data/patientFlow.js";
import { addTransaction } from "../../data/patients.js";
import { EXAM_TEMPLATES } from "../../data/examination.js";
import React, { useEffect, useMemo } from "react";
function StatusBadge({ s }) {
  const low = (s || "").toLowerCase();
  const cls =
    /hoàn thành/.test(low) ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
    /hẹn tái khám/.test(low) ? "bg-teal-50 text-teal-800 ring-teal-200" :
        /hẹn khám/.test(low) ? "bg-cyan-50 text-cyan-800 ring-cyan-200" :
        /(chờ (tiếp nhận|khám|xử lý) \(dịch vụ\))|chờ khám/i.test(low) ? "bg-amber-50 text-amber-700 ring-amber-200" :
    /chờ/.test(low) ? "bg-amber-50 text-amber-700 ring-amber-200" :
    "bg-slate-50 text-slate-700 ring-slate-200";
  const dot =
    /hoàn thành/.test(low) ? "bg-emerald-500" :
    /hẹn|dịch vụ|chờ/.test(low) ? "bg-amber-500" :
    "bg-slate-400";
    
  return <span className={`inline-flex  items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${cls}`}><i className={`w-1.5  h-1.5 rounded-full ${dot}`} />{s || "—"}</span>;
}
function InitialAvatar({ name = "", id = "" }) {
  const seed = (name || id || "A").charCodeAt(0) % 5;
  const colors = ["bg-teal-100 text-teal-700","bg-emerald-100 text-emerald-700","bg-cyan-100 text-cyan-700","bg-rose-100 text-rose-700","bg-amber-100 text-amber-700"];
  const initials = (name || id || "BN").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  return <span className={`w-7 h-7 px-1.5 pr-2 rounded-full grid place-items-center text-[11px] font-extrabold ring-1 ring-slate-200/70 ${colors[seed]}`}>{initials || "BN"}</span>;
}
const Thead = ({ children }) => (
    <thead className="text-left text-[13px] font-semibold text-slate-600 shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]">
      <tr>{children}</tr>
    </thead>
  );
  const Th = ({ children, first, last, right }) => (
    <th
      className={[
        "sticky top-0 z-10 px-3 py-3 whitespace-nowrap",
        "bg-white/80 backdrop-blur",
        "bg-gradient-to-b from-teal-50 to-slate-50/40",
        "ring-1 ring-slate-200/70",
        first ? "rounded-l-xl" : "",
        last ? "rounded-r-xl" : "",
        right ? "text-right" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );
const Row = ({ i, children, pulse, ...rest }) => (
  <motion.tr
    {...rest}
    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
    whileHover={{ y: -2 }}
    className={[
      "group odd:bg-slate-50/40 hover:bg-emerald-100/50 focus-within:bg-teal-50/60 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]",
      // ⚡ đổi sang hiệu ứng giống nút "+ Thêm": dùng class .flash-once (CSS global)
      pulse ? "flash-once " : "",
    ].join(" ")}
  >
    {children}
  </motion.tr>
);
const Td = ({ children, first, last, right, classNameOverride = "" }) => (
    <td
      className={[
        "px-3 py-2 align-top text-[13px] text-slate-700 group-hover:bg-white/70",
        first ? "pl-3 rounded-l-lg" : "",
        last ? "pr-3 rounded-r-lg" : "",
        right ? "text-right tabular-nums" : "",
        classNameOverride,
     ].join(" ")}
    >
      {children}
    </td>
  );
/* ---- fee helper ---- */
function getServiceExamFee() {
  // ưu tiên template T-KHAM-DV, fallback T-KHAM-THUONG
  const list = Array.isArray(EXAM_TEMPLATES) ? EXAM_TEMPLATES : [];
  const dv = list.find(t => t?.id === "T-KHAM-DV");
  if (dv?.price) return dv.price;
  const thuong = list.find(t => t?.id === "T-KHAM-THUONG");
  return thuong?.price || 0;
}

export default function PatientsTable({ items = [], onAction, stretch = false, highlightPid = null }) {
  const safeCssEscape = (v) => {
        const s = String(v ?? "");
        if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
        return s.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
      };
  // Tự cuộn tới dòng đang highlight; hiệu ứng flash-once do CSS điều khiển
  useEffect(() => {
    if (!highlightPid) return;
    const row = document.querySelector(`tr[data-pid="${safeCssEscape(highlightPid)}"]`);
    if (row && row.scrollIntoView) {
      try { row.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
    }
  }, [highlightPid]);

  function handleSendService(p) {
    const list = p?.serviceOrder?.items || [];
    const note = p?.serviceOrder?.note || "";
    enqueueService({
      pid: p.id ?? p.pid,
      name: p.name,
      services: list,
      note,
      dept: "Cận lâm sàng",
      doctor: "Khu dịch vụ",
    });
    markServiceDispatched(p.id ?? p.pid);
  }

  function handleReturnToDoctor(p) {
    const fromDoctor = p?.serviceOrder?.fromDoctor || p.doctor || "Bác sĩ phụ trách";
    markServiceDone(p.id ?? p.pid);
    markWaitDoctorReview(p.id ?? p.pid);
    enqueueReturnToDoctor({
      pid: p.id ?? p.pid,
      name: p.name,
      dept: "Phòng khám",
      doctor: fromDoctor,
      note: "Đã có kết quả dịch vụ",
    });
  }

  // Click “Lập phiếu khám” — nếu flow dịch vụ thì: THU PHÍ + ĐẨY DỊCH VỤ; ngược lại mở intake bình thường
  function handleIntakeSmart(p) {
    const status = (p.status || "").toLowerCase();
    const service = p.serviceOrder;
    const hasServiceOrder = !!service && Array.isArray(service.items) && service.items.length > 0;
    const notDispatched = !service?.dispatched;
    const isServiceIntakeStatus = /chờ tiếp nhận \(dịch vụ\)/i.test(status);
        const isServiceDispatchable = /chờ khám \(dịch vụ\)/i.test(status) || (hasServiceOrder && notDispatched);
    
        // Trạng thái chờ tiếp nhận (dịch vụ) -> mở modal Lập phiếu khám (dịch vụ)
        if (isServiceIntakeStatus) {
          onAction?.("intake", p);
          return;
        }
    
        // Đã tới bước đẩy khu dịch vụ (đã có chỉ định & chưa dispatch, hoặc status là chờ khám (dịch vụ))
        if (isServiceDispatchable) {
      const pid = p.id ?? p.pid;
      const fee = getServiceExamFee();
      if (fee > 0) {
        addTransaction(pid, {
          date: new Date().toLocaleDateString("vi-VN"),
          item: "Phí khám dịch vụ",
          amount: fee,
          status: "Đã thu",
          ref: `FEE-DV-${Date.now()}`,
        });
      }
      // đẩy dịch vụ luôn
      handleSendService(p);
      return;
    }

    // intake bình thường
    onAction?.("intake", p);
  }

  return (
    <section className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft ${stretch ? "h-full flex flex-col min-h-0" : "mt-3"}`} role="region" aria-label="Danh sách bệnh nhân">
       <div className={`${stretch ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"} p-4 pt-0`}>
        <table className="min-w-full table-fixed">
          <colgroup>
            <col style={{width:"10%"}} />   
            <col style={{width:"22%"}} />   
            <col style={{width:"12%"}} />   
            <col style={{width:"8%"}} />  
            <col style={{width:"18%"}} />  
            <col style={{width:"14%"}} /> 
            <col style={{width:"16%"}} /> 
          </colgroup>
          <Thead>
            <Th first>Mã BN</Th><Th>Họ và tên</Th><Th>Ngày sinh</Th><Th>Giới tính</Th><Th>Liên hệ</Th><Th>Trạng thái</Th><Th last>Thao tác</Th>
          </Thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">Không có bản ghi phù hợp.</td></tr>
            ) : (
              items.map((p, i) => {
                const status = (p.status || "");
                const service = p.serviceOrder;
                const hasServiceOrder = !!service && Array.isArray(service.items) && service.items.length > 0;
                const serviceDispatched = !!service?.dispatched;

                 // Hiện nút "Lập phiếu khám" cho: chờ tiếp nhận, hẹn khám, hẹn tái khám, hoàn thành, chờ tiếp nhận (dịch vụ)
                 const showExamBtn =
                                   /^(chờ tiếp nhận|hẹn tái khám|hẹn khám|hoàn thành|chờ tiếp nhận \(dịch vụ\))$/i.test(status) ||
                                   (hasServiceOrder && !serviceDispatched);
                 
               
                const showProcessBtn = /^chờ xử lý( ?\(dịch vụ\))?$/i.test(status);
                const pulse = highlightPid && (p.id === highlightPid || p.pid === highlightPid);
                const canReturnToDoctor =
                  hasServiceOrder && serviceDispatched &&
                  /chờ xử lý \(dịch vụ\)/i.test(status);

                return (
                  <Row
                    key={p.id ?? p.pid ?? i}
                    i={i}
                    pulse={!!pulse}
                    data-pid={p.id ?? p.pid ?? ""}
                  >
                    <Td first classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="font-mono font-semibold">{p.id ?? p.pid ?? "—"}</span>
                    </Td>
                    <Td classNameOverride="max-w-0 overflow-hidden">
                      <div className="flex items-start gap-2 min-w-0">
                        <InitialAvatar name={p.name} id={p.id ?? p.pid} />
                        <div className="min-w-0 max-w-full">
                          <div className="font-semibold truncate">{p.name || "—"}</div>
                          {hasServiceOrder && (
                            <div className="mt-0.5 text-[12px] text-amber-700 truncate">
                              <b>Dịch vụ:</b> {service.items.join(", ")}{service.note ? ` • ${service.note}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">{p.dob || p.birthDate || "—"}</Td>
                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis">{p.gender || p.sex || "—"}</Td>
                    <Td classNameOverride="max-w-0">
                      <div className="overflow-hidden truncate">{p.phone || p.contact?.phone || "—"}</div>
                      <div className="text-slate-500 text-xs overflow-hidden truncate">{p.email || p.contact?.email || "—"}</div>
                    </Td>
                    <Td classNameOverride="whitespace-nowrap overflow-hidden text-ellipsis"><StatusBadge s={status} /></Td>
                    <Td last classNameOverride="whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <Button className="!px-2" onClick={() => onAction?.("view", p)}>👁️</Button>
                        <Button className="!px-2" onClick={() => onAction?.("edit", p)}>✎</Button>

                        {(showExamBtn || showProcessBtn)  && <span className="grow" />}
                        {showExamBtn && (
                          <button
                            onClick={() => handleIntakeSmart(p)}
                            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-gradient-to-tr from-teal-100 to-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
                           
                          >
                            Lập phiếu khám
                          </button>
                        )}

                        {showProcessBtn && (
                          <button
                            onClick={() => onAction?.("process", p)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-gradient-to-tr from-rose-100 to-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-900 shadow hover:shadow-md hover:-translate-y-0.5 transition">
                               Xử lý & chẩn đoán
                          </button>
                        )}

                   
                      </div>
                    </Td>
                  </Row>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
