import React from 'react';
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ProfileDrawer({
  open,
  onClose,
  thread,
  patient,
  onCreateFromForm,
  appointments = {},
}) {
  const initialTab = patient ? "profile" : "collect";
  const [tab, setTab] = useState(initialTab);
  const firstRef = useRef(null);

  useEffect(() => {
    setTab(patient ? "profile" : "collect");
  }, [patient, open]);

  // form gửi tới BN
  const [collect, setCollect] = useState({
    name: "",
    phone: "",
    dob: "",
    gender: "",
    id: "",
    address: "",
    email: "",
    insurance: "",
  });

  function mockPatientSubmit() {
    setCollect((s) => ({
      ...s,
      name: s.name || thread?.name || "",
      phone: s.phone || "09" + Math.floor(Math.random() * 1e8).toString(),
      id: s.id || "",
    }));
  }

  function createFromCollect() {
    if (!collect.name?.trim() || !collect.phone?.trim()) return;
    onCreateFromForm?.(collect);
    setTab("profile");
  }

  const Tag = ({ children }) => (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-slate-50 ring-1 ring-slate-200/80">
      {children}
    </span>
  );
  const Field = ({ label, value }) => (
    <div className="grid grid-cols-[120px,1fr] gap-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-medium break-words">
        {value || <i className="text-slate-400">—</i>}
      </div>
    </div>
  );

  const patientLink = patient?.id
    ? `/patients?pid=${encodeURIComponent(patient.id)}`
    : null;

  // lịch hẹn sắp tới: theo patientId, nếu chưa có BN thì lấy theo TMP-thread
  const aptKey = patient?.id || (thread ? `TMP-${thread.id}` : null);
  const upcoming = (aptKey && appointments[aptKey]) || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Hồ sơ bệnh nhân"
            className="fixed inset-0 z-[70] p-4 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.99, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="w-[min(960px,100%)] max-h-[88vh] overflow-auto bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-2xl"
            >
              <header className="flex items-center justify-between px-5 py-4 border-b">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold">
                    Hồ sơ & thông tin khách
                  </div>
                  <div className="text-slate-500 text-sm truncate">
                    Hội thoại: <b>{thread?.name}</b> • {thread?.channel}
                  </div>
                </div>

                {/* Tabs ở giữa header */}
                <div className="mx-auto hidden sm:block">
                  <div
                    className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white"
                    role="tablist"
                    aria-label="Chọn mục"
                  >
                    {[
                      { k: "profile", label: "Hồ sơ" },
                      { k: "collect", label: "Mẫu gửi BN" },
                      { k: "history", label: "Lịch sử" },
                    ].map((t) => {
                      const active = tab === t.k;
                      return (
                        <button
                          key={t.k}
                          role="tab"
                          aria-selected={active}
                          onClick={() => setTab(t.k)}
                          className={`relative z-10 px-3 py-1.5 font-semibold ${
                            active ? "text-sky-700" : "text-slate-700"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="profileTabs"
                              className="absolute inset-0 rounded-lg bg-sky-50"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}
                          <span className="relative">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  className="btn !px-2"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </header>

              <div className="p-4 grid gap-3">
                {/* ===== Tab Hồ sơ ===== */}
                {tab === "profile" && (
                  <section className="grid gap-3">
                    {!patient && (
                      <div className="rounded-xl p-3 ring-1 ring-amber-200 bg-amber-50 text-amber-800">
                        Chưa có hồ sơ. Bấm <b>+Hồ sơ</b> trong tab{" "}
                        <b>Mẫu gửi BN</b> để tạo nhanh.
                      </div>
                    )}

                    <article className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full grid place-items-center font-bold ring-1 ring-slate-200/80">
                          {thread?.avatar || "BN"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-extrabold truncate">
                                {patient?.name || thread?.name || "—"}
                              </div>
                              <div className="text-slate-500 text-sm">
                                {patient?.id ? (
                                  <>
                                    Mã BN: <b>{patient.id}</b>
                                  </>
                                ) : (
                                  "Chưa có mã BN"
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tag>
                                {patient ? "Bệnh nhân cũ" : "Khách mới"}
                              </Tag>
                              {patient?.id && (
                                <Link
                                  to={`/patients?pid=${patient.id}`}
                                  className="btn btn-outline"
                                >
                                  Xem hồ sơ BN
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Grid thông tin */}
                          <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                            <Field label="SĐT" value={patient?.phone} />
                            <Field label="Email" value={patient?.email} />
                            <Field label="Ngày sinh" value={patient?.dob} />
                            <Field label="Giới tính" value={patient?.gender} />
                            <Field label="Địa chỉ" value={patient?.address} />
                            <Field
                              label="Bảo hiểm"
                              value={patient?.insurance}
                            />
                            <Field label="Dị ứng" value={patient?.allergies} />
                            <Field
                              label="Bệnh mạn tính"
                              value={patient?.chronicConditions}
                            />
                          </div>
                        </div>
                      </div>
                    </article>

                    {/* Lịch hẹn sắp tới */}
                    <article className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <b className="block mb-2">Lịch hẹn sắp tới</b>
                      {upcoming.length ? (
                        <ul className="space-y-2">
                          {upcoming
                            .slice()
                            .sort((a, b) => new Date(a.at) - new Date(b.at))
                            .map((a) => (
                              <li
                                key={a.id}
                                className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200/80 flex items-center justify-between"
                              >
                                <div className="text-sm">
                                  <b>
                                    {new Date(a.at).toLocaleString("vi-VN")}
                                  </b>{" "}
                                  • {a.dept} {a.doctor ? `• ${a.doctor}` : ""}{" "}
                                  {a.note ? `— ${a.note}` : ""}
                                </div>
                                <span className="tag">{a.status}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500">
                          Chưa có lịch hẹn nào.
                        </div>
                      )}
                    </article>
                  </section>
                )}

                {/* ===== Tab Mẫu gửi BN ===== */}
                {tab === "collect" && (
                  <section className="grid gap-3">
                    <article className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <div className="mb-2">
                        <b>Mẫu thông tin gửi tới bệnh nhân</b>
                        <div className="text-slate-500 text-sm">
                          Điền tối thiểu <b>Họ tên</b> và <b>SĐT</b> → bấm{" "}
                          <b>+ Hồ sơ</b>.
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <label className="text-sm">
                          Họ và tên *
                          <input
                            ref={firstRef}
                            className="input mt-1"
                            value={collect.name}
                            onChange={(e) =>
                              setCollect((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          SĐT *
                          <input
                            className="input mt-1"
                            value={collect.phone}
                            onChange={(e) =>
                              setCollect((s) => ({
                                ...s,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Ngày sinh
                          <input
                            type="date"
                            className="input mt-1"
                            value={collect.dob}
                            onChange={(e) =>
                              setCollect((s) => ({ ...s, dob: e.target.value }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Giới tính
                          <select
                            className="input mt-1"
                            value={collect.gender}
                            onChange={(e) =>
                              setCollect((s) => ({
                                ...s,
                                gender: e.target.value,
                              }))
                            }
                          >
                            <option value="">—</option>
                            <option>Nam</option>
                            <option>Nữ</option>
                            <option>Khác</option>
                          </select>
                        </label>
                        <label className="text-sm md:col-span-2">
                          Địa chỉ
                          <input
                            className="input mt-1"
                            value={collect.address}
                            onChange={(e) =>
                              setCollect((s) => ({
                                ...s,
                                address: e.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Email
                          <input
                            className="input mt-1"
                            value={collect.email}
                            onChange={(e) =>
                              setCollect((s) => ({
                                ...s,
                                email: e.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Mã BN (tuỳ chọn)
                          <input
                            className="input mt-1"
                            value={collect.id}
                            onChange={(e) =>
                              setCollect((s) => ({ ...s, id: e.target.value }))
                            }
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          className="btn btn-outline"
                          onClick={mockPatientSubmit}
                        >
                          Giả lập BN gửi lại
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={createFromCollect}
                          disabled={
                            !collect.name.trim() || !collect.phone.trim()
                          }
                          aria-disabled={
                            !collect.name.trim() || !collect.phone.trim()
                          }
                          title="Tạo và chuyển sang tab Hồ sơ"
                        >
                          + Hồ sơ
                        </button>
                      </div>
                    </article>
                  </section>
                )}

                {/* ===== Tab Lịch sử ===== */}
                {tab === "history" && (
                  <section className="grid gap-3">
                    <article className="rounded-xl p-3 ring-1 ring-slate-200/80">
                      <div className="mb-2">
                        <b>Lịch sử gần đây</b>
                        <div className="text-slate-500 text-sm">
                          Tổng hợp từ hội thoại hiện tại.
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200/80">
                          {new Date().toLocaleString("vi-VN")} — Trao đổi tư vấn
                          ban đầu.
                        </li>
                        <li className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200/80">
                          Hệ thống gửi form thông tin cho bệnh nhân.
                        </li>
                        <li className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200/80">
                          Chờ bệnh nhân phản hồi…
                        </li>
                      </ul>
                    </article>
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
