import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button.jsx";

function InitialAvatar({ name = "", id = "" }) {
  const seed = (name || id || "A").charCodeAt(0) % 5;
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700",
  ];
  const initials = (name || id || "BN").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold ring-1 ring-slate-200/70 ${colors[seed]}`}>
      {initials || "BN"}
    </span>
  );
}

function Thead({ children }) {
  return (
    <thead className="sticky top-0 z-10 text-left text-[13px] font-semibold text-slate-700">
      <tr className="bg-gradient-to-b from-teal-50 to-white shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]">
        {children}
      </tr>
    </thead>
  );
}
function Th({ children, first, last, right }) {
  return (
    <th
      className={[
        "px-3 py-3 whitespace-nowrap",
        "bg-gradient-to-b from-teal-50 to-white",
        "ring-1 ring-slate-200/70",
        first ? "rounded-l-xl" : "",
        last ? "rounded-r-xl" : "",
        right ? "text-right" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}
function Row({ i, children }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: i * 0.02 }}
      whileHover={{ y: -2 }}
      className="group odd:bg-teal-50/35 hover:bg-teal-100/45 focus-within:bg-teal-50/60 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]"
    >
      {children}
    </motion.tr>
  );
}
function Td({ children, first, last, right }) {
  return (
    <td
      className={[
        "px-3 py-2 align-top text-[13px] text-slate-800",
        "group-hover:bg-white/70",
        first ? "pl-3 rounded-l-lg" : "",
        last ? "pr-3 rounded-r-lg" : "",
        right ? "text-right tabular-nums" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

const pillTone = {
  teal:  { wrap: "bg-teal-50 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  amber: { wrap: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rose:  { wrap: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  sky:   { wrap: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  slate: { wrap: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
};

function StatusPills({ item }) {
  const pills = [];
  if (item.tag === "serviceReturn" || /tiếp tục khám/i.test(item.status || "")) pills.push({ t: "Tiếp tục khám", tone: "teal" });
  if (item.priority === "emergency") pills.push({ t: "Khẩn", tone: "rose" });
  if (item.source === "walkin") pills.push({ t: "Walk-in", tone: "slate" });
  if (item.early) pills.push({ t: "Đến sớm", tone: "sky" });
  if (item.late) pills.push({ t: "Đến trễ", tone: "amber" });
  if (!pills.length) pills.push({ t: "Đúng giờ", tone: "teal" });

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((c, i) => (
        <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${pillTone[c.tone].wrap}`}>
          <i className={`w-1.5 h-1.5 rounded-full ${pillTone[c.tone].dot}`} />
          {c.t}
        </span>
      ))}
    </div>
  );
}

function tone(item, active) {
  if (active) return "teal";
  if (item.priority === "emergency") return "rose";
  if (item.late) return "amber";
  if (item.early) return "sky";
  return "teal";
}

function ActionButton({ active, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border ${
        active ? "border-teal-100" : "border-rose-100"
      } bg-gradient-to-tr ${
        active ? "from-teal-50 to-teal-200" : "from-rose-50 to-rose-200"
      } px-2 py-1.5 mt-0 text-sm font-semibold ${
        active ? "text-teal-900" : "text-rose-900"
      } shadow hover:shadow-md transition`}
      aria-label={active ? "Đang khám" : "Gọi vào"}
      title={active ? "Đang khám" : "Gọi vào"}
    >
      {active ? "Đang khám…" : "Gọi vào"}
    </motion.button>
  );
}

function getKey(p) {
  return p?.id ?? p?.queueId ?? p?.pid;
}

export default function PatientTable({ items = [], onStart, inProgress = new Set(), stretch = false }) {
  return (
    <section
      className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft border border-slate-200 ${stretch ? "h-full flex flex-col min-h-0" : "mt-3"}`}
      role="region"
      aria-label="Danh sách chờ khám"
    >
      <div className={`${stretch ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"} p-4 pt-0`}>
        <table className="min-w-full table-fixed">
          {/* colgroup % — KHÔNG để khoảng trắng bên trong */}
          <colgroup>
            <col style={{width:"2%"}}/><col style={{width:"4%"}}/><col style={{width:"8%"}}/><col style={{width:"16%"}}/>
            <col style={{width:"10%"}}/><col style={{width:"10%"}}/><col style={{width:"8%"}}/><col style={{width:"8%"}}/>
            <col style={{width:"12%"}}/><col style={{width:"10%"}}/><col style={{width:"12%"}}/>
          </colgroup>

          <Thead>
            <Th first />
            <Th>STT</Th>
            <Th>Mã BN</Th>
            <Th>Họ tên</Th>
            <Th>Khoa</Th>
            <Th>Bác sĩ</Th>
            <Th>Giờ hẹn</Th>
            <Th>Đến lúc</Th>
            <Th>Trạng thái</Th>
            <Th>Ghi chú</Th>
            <Th last right>Thao tác</Th>
          </Thead>

          <motion.tbody layout>
            <AnimatePresence initial={false}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-slate-500">Không có bệnh nhân chờ.</td>
                </tr>
              ) : (
                items.map((p, i) => {
                  const key = getKey(p);
                  const active = inProgress.has(key);
                  const t = tone(p, active);
                  return (
                    <Row key={key ?? i} i={i}>
                      <Td first><i className={`inline-block w-2 h-2 rounded-full ${pillTone[t].dot}`} title={t} /></Td>
                      <Td>{i + 1}</Td>
                      <Td><span className="font-mono font-semibold truncate block">{p.pid || "—"}</span></Td>
                      <Td>
                        <div className="flex items-center gap-2 min-w-0">
                          <InitialAvatar name={p.name} id={p.pid} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-slate-900">{p.name || "—"}</div>
                            {p.source === "walkin" && <div className="text-[11px] text-slate-500 truncate">Khách đến trực tiếp</div>}
                          </div>
                        </div>
                      </Td>
                      <Td><span className="truncate block">{p.dept || "—"}</span></Td>
                      <Td><span className="truncate block">{p.doctor || "—"}</span></Td>
                      <Td><span className="truncate block">{p.time || "—"}</span></Td>
                      <Td title={p.checkIn?.toLocaleString?.() || ""}>
                        <span className="truncate block">
                          {p.checkIn ? new Date(p.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </span>
                      </Td>
                      <Td><StatusPills item={p} /></Td>
                      <Td><div className="truncate text-slate-700 max-w-[10rem] break-words">{p.note || p.symptoms || "—"}</div></Td>
                      <Td last right><ActionButton active={active} onClick={() => onStart?.(p)} /></Td>
                    </Row>
                  );
                })
              )}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>
    </section>
  );
}
