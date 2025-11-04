// src/components/staff/StaffDetail.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "./Avatar.jsx";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

export default function StaffDetail({ open, item, role, schedule, roomToday, weekRoom, onClose }) {
  if (!item) return null;

  const apptCount = item?.apptCount ?? item?.appointmentsToday ?? item?.appts ?? item?.appointments ?? 0;
  const isAdminNurse = role === "nurse" && item.roleType === "administrative";
  const today = dayKey();
  const shiftToday = schedule?.[today] ?? "—";
  const managedRooms = item.managedRooms || [];
  const certCount = (item.certificates || []).length;
  const weekShifts = Object.values(schedule || {}).filter((s) => s && s !== "Nghỉ").length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ y: 14, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.98, opacity: 0 }}
              className="w-[min(1000px,100%)] max-h-[86vh] overflow-auto scrollbar-none bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Chi tiết nhân sự"
            >
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-100">
                <header className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.name} />
                    <div>
                      <h3 className="text-lg font-extrabold">{item.name}</h3>
                      <div className="text-slate-500 text-sm">
                        {item.dept} • {item.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-bold ring-1 bg-sky-50 text-sky-700 ring-sky-200">
                      📍 {roomToday || "—"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ring-1 ${
                        item.status === "online"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {item.status === "online" ? "Đang làm việc" : "Tạm nghỉ"}
                    </span>
                    <Button onClick={onClose} aria-label="Đóng">✕</Button>
                  </div>
                </header>
              </div>

              <div className="p-4 grid md:grid-cols-2 gap-3">
                {/* Tổng quan */}
                <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Tổng quan</b>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Tile label="Đơn vị" value={item.dept} />
                    <Tile label="Phòng/Office" value={item.office || "—"} />
                    <Tile label="Học vị" value={item.degree || "—"} />
                    <Tile label="Kinh nghiệm" value={`${item.years || 0} năm`} />
                  </div>
                </section>

                {/* Phân công */}
                <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Phân công</b>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Tile label="Ngôn ngữ" value={(item.languages || []).join(", ") || "—"} />
                    <Tile label="Ngày làm việc" value={(item.workdays || []).join(", ") || "—"} />
                    <Tile
                      label={isAdminNurse ? "Đơn vị phụ trách" : role === "doctor" ? "Lịch hẹn hôm nay" : "Số phòng quản lý"}
                      value={isAdminNurse ? (item.managedDepartments?.length || 0) : role === "doctor" ? apptCount : (item.rooms ?? managedRooms.length)}
                    />
                    <Tile label="Chuyên môn" value={(item.specialties || []).join(", ") || "—"} />
                  </div>
                </section>

                {/* Ghi chú */}
                <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Ghi chú</b>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {(item.notes && item.notes.length ? item.notes : ["—"]).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>

                {/* Liên hệ */}
                <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Liên hệ</b>
                  <div className="text-sm space-y-1">
                    <div>Email: <a className="text-sky-700 hover:underline" href={`mailto:${item.email}`}>{item.email}</a></div>
                    <div>SĐT: <a className="text-sky-700 hover:underline" href={`tel:${item.phone}`}>{item.phone}</a></div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`tel:${item.phone}`, "_self")}>📞 Gọi</Button>
                    <Button variant="outline" onClick={() => window.open(`mailto:${item.email}`, "_self")}>✉️ Email</Button>
                  </div>
                </section>

                {/* Chỉ số */}
                <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Chỉ số</b>
                  <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
                    <StatTile label="Ca trong tuần" value={weekShifts} />
                    <StatTile label="Chứng chỉ" value={certCount} />
                    <StatTile label="Phòng quản lý" value={managedRooms.length} />
                    <StatTile label="Trực hôm nay" value={`${shiftToday}`} />
                  </div>
                </section>

                {/* Phòng quản lý (BS/điều dưỡng lâm sàng) */}
                {!isAdminNurse && (
                  <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                    <b className="block mb-2">Phòng quản lý</b>
                    <div className="flex flex-wrap gap-2">
                      {(managedRooms.length ? managedRooms : ["—"]).map((r) => (
                        <span key={r} className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-cyan-200 bg-cyan-50 text-cyan-700 hover:ring-cyan-300 hover:bg-cyan-100 transition">{r}</span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Hành chính */}
                {isAdminNurse && (
                  <>
                    <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                      <b className="block mb-2">KPI hành chính</b>
                      <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
                        <StatTile label="Hồ sơ xử lý hôm nay" value={item.adminHandledToday ?? 0} />
                        <StatTile label="SLA" value={item.adminSLA ?? "—"} />
                        <StatTile label="HS chờ duyệt" value={item.docsPending ?? 0} />
                        <StatTile label="Bàn hôm nay" value={roomToday || "—"} />
                      </div>
                    </section>

                    <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <b className="block mb-2">Đơn vị phụ trách</b>
                      <div className="flex flex-wrap gap-2">
                        {(item.managedDepartments || ["—"]).map((d) => (
                          <span key={d} className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:ring-cyan-300 transition">{d}</span>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <b className="block mb-2">Nhiệm vụ</b>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {(item.responsibilities || ["—"]).map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </section>

                    <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                      <b className="block mb-2">Quy trình</b>
                      <div className="flex flex-wrap gap-2">
                        {(item.procedures || ["—"]).map((p) => (
                          <span key={p} className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:ring-sky-300 transition">{p}</span>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* Kỹ năng */}
                <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Kỹ năng</b>
                  <div className="flex flex-wrap gap-2">
                    {(item.skills || []).map((s) => (
                      <span key={s} className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:ring-sky-300 transition">{s}</span>
                    ))}
                  </div>
                </section>

                {/* Chứng chỉ */}
                <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Chứng chỉ</b>
                  <div className="flex flex-wrap gap-2">
                    {(item.certificates || []).map((c) => (
                      <span key={c} className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:ring-cyan-300 transition">{c}</span>
                    ))}
                  </div>
                </section>

                {/* Tiểu sử */}
                <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                  <b className="block mb-2">Tiểu sử</b>
                  <div className="text-sm">{item.bio || "—"}</div>
                </section>

                {/* Lịch tuần nhanh */}
                {weekRoom && schedule && (
                  <section className="md:col-span-2 rounded-xl p-3 ring-1 ring-slate-200/80">
                    <b className="block mb-2">Lịch tuần</b>
                    <div className="overflow-auto">
                      <table className="min-w-[640px] w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-600 bg-slate-50">
                            {WEEK.map((d) => (
                              <th key={d} className="px-2 py-2">{d}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {WEEK.map((d) => (
                              <td key={d} className={`px-2 py-2 align-top ${d===today ? "bg-sky-50" : ""}`}>
                                <div>Ca: <b>{schedule?.[d] ?? "—"}</b></div>
                                <div>Phòng: <b>{weekRoom?.[d] ?? "—"}</b></div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-lg ring-1 ring-slate-200 p-2 bg-white hover:bg-sky-50 transition">
      <div className="text-slate-500">{label}</div>
      <b>{value}</b>
    </div>
  );
}
function StatTile({ label, value }) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200 p-3 bg-gradient-to-br from-white to-sky-50 hover:from-sky-50 hover:to-white transition">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
