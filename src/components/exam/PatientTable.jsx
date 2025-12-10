import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Resolve fields that may be PascalCase, camelCase, or nested (supports dotted paths)
function fld(obj, ...paths) {
  if (!obj) return undefined;
  for (const p of paths) {
    if (!p) continue;
    const parts = String(p).split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur == null) break;
      if (Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part];
      } else {
        const alt = part.charAt(0).toLowerCase() + part.slice(1);
        if (Object.prototype.hasOwnProperty.call(cur, alt)) {
          cur = cur[alt];
        } else {
          cur = undefined;
          break;
        }
      }
    }
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

function InitialAvatar({ name = "", id = "" }) {
  const seed = (name || id || "A").charCodeAt(0) % 5;
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700",
  ];
  const initials = (name || id || "BN")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold ring-1 ring-slate-200/70 ${colors[seed]}`}
    >
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
  teal: { wrap: "bg-teal-50 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  amber: { wrap: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  rose: { wrap: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  sky: { wrap: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  slate: { wrap: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
};

function StatusBadge({ item }) {
  const status = item.TrangThai || item.trangThai || item.status || "";
  const label =
    status === "cho_goi"
      ? "Đang chờ"
      : status === "dang_thuc_hien" || status === "dang_kham"
      ? "Đang thực hiện"
      : status === "da_phuc_vu"
      ? "Đã phục vụ"
      : "Không rõ";

  let tone = pillTone.slate;
  if (status === "cho_goi") tone = pillTone.amber;
  else if (status === "dang_thuc_hien" || status === "dang_kham") tone = pillTone.teal;
  else if (status === "da_phuc_vu") tone = pillTone.sky;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone.wrap}`}>
     
      {label}
    </span>
  );
}

function SourcePills({ item }) {
  const queueType = item.LoaiHangDoi || item.loaiHangDoi || item.queueType || item.visitType;
  const isClsQueue = queueType === "can_lam_sang" || queueType === "cls";
  const source = isClsQueue ? null : item.Nguon || item.nguon || item.source;
  const pills = [];

  if (isClsQueue) {
    pills.push(
      <span
        key="type-cls"
        className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold px-2 py-0.5"
      >
        CLS
      </span>
    );
  } else {
    pills.push(
      <span
        key="type-ls"
        className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5"
      >
        Khám LS
      </span>
    );
  }

  if (source === "appointment") {
    pills.push(
      <span
        key="src-appt"
        className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5"
      >
        Hẹn khám
      </span>
    );
  } else if (source === "walkin") {
    pills.push(
      <span
        key="src-walkin"
        className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5"
      >
        Walk-in
      </span>
    );
  } else if (source === "service_return") {
    pills.push(
      <span
        key="src-return"
        className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5"
      >
        Trở từ dịch vụ
      </span>
    );
  }

  return <div className="flex flex-wrap items-center gap-1.5">{pills}</div>;
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
      {active ? "Đang khám" : "Gọi vào"}
    </motion.button>
  );
}
function getKey(p) {
  return (
    p?.MaHangDoi ??
    p?.maHangDoi ??
    p?.queueId ??
    p?.id ??
    p?.pid ??
    null
  );
}

export default function PatientTable({ items = [], onStart, inProgress = new Set(), stretch = false }) {
  return (
    <section
      className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft ${stretch ? "h-full flex flex-col min-h-0" : "mt-3"}`}
      role="region"
      aria-label="Danh sách chờ khám"
    >
      <div className={`${stretch ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"} p-4 pt-0`}>
        <table className="min-w-full table-fixed">
          <colgroup>
            <col style={{ width: "2%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>

          <Thead>
            <Th first />
            <Th>STT</Th>
            <Th>Mã BN</Th>
            <Th>Họ tên</Th>
            <Th>Khoa</Th>
            <Th>Nhân sự</Th>
            <Th>Giờ hẹn</Th>
            <Th>Đến lúc</Th>
            <Th>Nguồn</Th>
            <Th>Trạng thái</Th>
            <Th>Ghi chú</Th>
            <Th last right>Thao tác</Th>
          </Thead>

          <motion.tbody layout>
            <AnimatePresence initial={false}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-10 text-center text-slate-500">
                    Không có bệnh nhân chờ.
                  </td>
                </tr>
              ) : (
                items.map((p, i) => {
                  const key = getKey(p);
                  const active = inProgress.has(key);
                  const t = tone(p, active);
                  const queueType = p.LoaiHangDoi || p.loaiHangDoi || p.queueType || p.visitType;
                  const isClsQueue = /can_lam_sang|cls/i.test(queueType || "");
                  const sourceVal = isClsQueue
                    ? null
                    : fld(
                        p,
                        "Nguon",
                        "nguon",
                        "source",
                        "HinhThucTiepNhan",
                        "hinhThucTiepNhan",
                        "LoaiHen",
                        "loaiHen"
                      );

                  // Resolve patient display values depending on queue type (LS vs CLS)
                  const patientId = fld(p, "MaBenhNhan", "maBenhNhan", "pid", "id");
                  const patientName =
                    fld(
                      p,
                      "TenBenhNhan",
                      "PhieuKhamLsFull.TenBenhNhan",
                      "PhieuKhamLsFull.HoTen",
                      "PhieuKhamLs.TenBenhNhan",
                      "PhieuKhamClsFull.TenBenhNhan",
                      "PhieuKhamClsFull.HoTen",
                      "PhieuKhamCls.TenBenhNhan",
                      "HoTen",
                      "name"
                    ) || "";

                  const deptName = fld(
                    p,
                    "TenKhoa",
                    "PhieuKhamLsFull.TenKhoa",
                    "PhieuKhamClsFull.TenKhoa",
                    "dept",
                    "department"
                  );

                  let doctorName;
                  if (isClsQueue) {
                    doctorName =
                      fld(
                        p,
                        "TenYTaThucHien",
                        "PhieuKhamClsItem.TenYTaThucHien",
                        "PhieuKhamClsFull.TenYTaThucHien",
                        "PhieuKhamClsFull.TenNguoiLap",
                        "PhieuKhamCls.TenNguoiLap"
                      ) ||
                      (() => {
                        const list = p?.PhieuKhamClsFull?.ListItemDV || p?.PhieuKhamCls?.ListItemDV || [];
                        if (Array.isArray(list) && list.length) {
                          return (
                            list[0]?.TenYTaThucHien ||
                            list[0]?.TenNguoiLap ||
                            list[0]?.NguoiLap ||
                            ""
                          );
                        }
                        return "";
                      })();
                  } else {
                    doctorName = fld(
                      p,
                      "TenBacSiKham",
                      "PhieuKhamLsFull.TenBacSiKham",
                      "PhieuKhamLs.TenBacSiKham",
                      "PhieuKhamLs.TenBacSi",
                      "TenBacSi",
                      "doctor"
                    );
                  }

                  // Appointment time: prefer explicit timestamp fields, otherwise combine NgayLap+GioLap when present
                  let apptTimeRaw = null;
                  if (!isClsQueue) {
                    apptTimeRaw = fld(p, "ThoiGianLichHen", "thoiGianLichHen", "time");
                    if (!apptTimeRaw) {
                      const ngayLap = fld(p, "PhieuKhamLs.NgayLap", "PhieuKhamLsFull.NgayLap");
                      const gioLap = fld(p, "PhieuKhamLs.GioLap", "PhieuKhamLsFull.GioLap");
                      if (ngayLap && gioLap) {
                        const datePart = new Date(ngayLap).toISOString().slice(0, 10);
                        apptTimeRaw = `${datePart}T${gioLap}`;
                      } else if (ngayLap) {
                        apptTimeRaw = ngayLap;
                      }
                    }
                  }

                  const checkinRaw = fld(p, "ThoiGianCheckin", "thoiGianCheckin", "checkIn");
                  const noteText = fld(p, "Nhan", "nhan", "GhiChu", "note", "symptoms");

                  return (
                    <Row key={key ?? i} i={i}>
                      <Td first>
                        <i className={`inline-block w-2 h-2 rounded-full ${pillTone[t].dot}`} title={t} />
                      </Td>
                      <Td>{i + 1}</Td>
                      <Td>
                        <span className="font-mono font-semibold truncate block">{patientId || "--"}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 min-w-0">
                          <InitialAvatar name={patientName || ""} id={patientId || ""} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-slate-900">{patientName || "--"}</div>
                            {sourceVal === "walkin" && (
                              <div className="text-[11px] text-slate-500 truncate">Khách đến trực tiếp</div>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="truncate block">{deptName || "--"}</span>
                      </Td>
                      <Td>
                        <span className="truncate block">{doctorName || "--"}</span>
                      </Td>
                      <Td>
                        <span className="truncate block">
                          {apptTimeRaw
                            ? new Date(apptTimeRaw).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                            : "--"}
                        </span>
                      </Td>
                      <Td title={checkinRaw ? new Date(checkinRaw).toLocaleString() : ""}>
                        <span className="truncate block">
                          {checkinRaw
                            ? new Date(checkinRaw).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                            : "--"}
                        </span>
                      </Td>
                      <Td>
                        <SourcePills item={p} />
                      </Td>
                      <Td>
                        <StatusBadge item={p} />
                      </Td>
                      <Td>
                        <div className="truncate text-slate-700 max-w-[8rem] break-words">{noteText || "--"}</div>
                      </Td>
                      <Td last right>
                        <div className="flex items-center justify-end gap-3">
                          <ActionButton active={active} onClick={() => onStart?.(p)} />
                        </div>
                      </Td>
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
