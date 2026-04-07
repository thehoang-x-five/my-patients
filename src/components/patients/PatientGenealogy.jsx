// src/components/patients/PatientGenealogy.jsx
// Tab Pha Hệ — Hiển thị cây gia phả + link cha/mẹ
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Chip from "../ui/Chip.jsx";
import { ANIMATION_CONFIG } from "./Shared.jsx";

import {
  useGenealogyTree,
  useFamilyDiseases,
  useLinkParents,
} from "../../api/genealogy.js";
import { usePatientsList } from "../../api/patients.js";

// Hook tìm kiếm
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const RELATION_LABELS = {
  self: "Bản thân",
  cha: "Cha",
  me: "Mẹ",
  con: "Con",
  anh_chi_em: "Anh/Chị/Em",
  to_tien: "Tổ tiên",
  unknown: "—",
};

const RELATION_TONES = {
  self: { tone: "emerald", dot: "emerald" },
  cha: { tone: "cyan", dot: "cyan" },
  me: { tone: "rose", dot: "rose" },
  con: { tone: "teal", dot: "teal" },
  anh_chi_em: { tone: "amber", dot: "amber" },
  to_tien: { tone: "slate", dot: "slate" },
};

// --- COMBOBOX CHỌN BỆNH NHÂN CÓ TÌM KIẾM ---
function PatientSelector({ value, onChange, placeholder, excludeId }) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState("");
  const debouncedKw = useDebounce(kw, 300);
  const boxRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const { data: result, isFetching } = usePatientsList({
    keyword: debouncedKw || undefined,
    pageSize: 20
  });

  const items = (result?.Items || []).filter(p => !excludeId || (p.id !== excludeId && p.maBenhNhan !== excludeId));
  const selected = value ? items.find(p => p.id === value || p.maBenhNhan === value) : null;

  // Lấy label
  const displayLabel = selected 
    ? `${selected.id || selected.maBenhNhan} — ${selected.hoTen || selected.name}` 
    : value 
      ? value 
      : placeholder;

  // Cập nhật vị trí dropdown khi mở
  useLayoutEffect(() => {
    if (open && boxRef.current) {
      const updatePosition = () => {
        const rect = boxRef.current.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      };
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      // Bỏ qua click nếu nằm trên dropdown
      if (e.target.closest('[data-popover="patient-selector"]')) {
        return;
      }
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative mt-1.5" ref={boxRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setKw("");
        }}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm text-[13px] text-left"
      >
        <span className={!value ? "text-slate-400" : "text-slate-800 font-medium truncate"}>
          {displayLabel}
        </span>
        <span className="text-slate-400 text-[11px] text-right shrink-0 ml-2">▼</span>
      </button>

      {open && createPortal(
        <AnimatePresence>
          <motion.div
            data-popover="patient-selector"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{ ...dropdownStyle, position: "fixed" }}
            className="z-[9999] bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden max-h-[280px] flex flex-col"
          >
            <div className="p-1.5 border-b border-slate-100 shrink-0 relative">
              <input
                autoFocus
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="Tìm mã, họ tên, SĐT..."
                className="w-full rounded-lg bg-slate-50 px-3 pl-8 py-2 text-[13px] ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
            </div>
            
            <div className="overflow-y-auto scrollbar-none p-1.5 flex-1">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full px-3 py-2 text-left text-[13px] rounded-lg hover:bg-rose-50 hover:text-rose-600 transition text-slate-500 mb-1"
              >
                — Hủy chọn —
              </button>
              
              {isFetching ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">Đang tìm...</div>
              ) : items.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">Không tìm thấy bệnh nhân</div>
              ) : (
                items.map(p => {
                  const pid = p.id || p.maBenhNhan;
                  const active = pid === value;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => { onChange(pid); setOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-[13px] rounded-lg transition flex flex-col ${
                        active ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="font-semibold">{p.hoTen || p.name}</span>
                      <span className="text-[11px] opacity-70 mt-0.5">{pid} • {p.dienThoai || p.phone || "Không có SĐT"}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function PatientGenealogy({ patientId, allPatients = [] }) {
  const { data: tree, isLoading, isError, refetch } = useGenealogyTree(patientId);
  const { data: diseases } = useFamilyDiseases(patientId);
  const linkMutation = useLinkParents();

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkCha, setLinkCha] = useState("");
  const [linkMe, setLinkMe] = useState("");
  const [activeTab, setActiveTab] = useState("tree");

  const nodes = useMemo(() => tree?.Nodes || [], [tree]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const n of nodes) {
      const rel = n.QuanHe || "unknown";
      if (!groups[rel]) groups[rel] = [];
      groups[rel].push(n);
    }
    return groups;
  }, [nodes]);

  async function handleLink() {
    if (!linkCha && !linkMe) {
      toast.error("Vui lòng chọn ít nhất Cha hoặc Mẹ.");
      return;
    }
    try {
      await linkMutation.mutateAsync({
        maBenhNhan: patientId,
        MaCha: linkCha || null,
        MaMe: linkMe || null,
      });
      toast.success("Đã liên kết cha/mẹ thành công!");
      setShowLinkForm(false);
      setLinkCha("");
      setLinkMe("");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data || err.message || "Lỗi liên kết cha/mẹ");
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        <div className="skel w-8 h-8 rounded-full mx-auto mb-3" />
        Đang tải sơ đồ pha hệ...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-rose-500 text-sm">
        Không thể tải pha hệ.{" "}
        <button onClick={() => refetch()} className="btn text-xs ml-2">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("tree")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            activeTab === "tree"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Sơ đồ pha hệ
        </button>
        <button
          onClick={() => setActiveTab("diseases")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            activeTab === "diseases"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Tiền sử bệnh gia đình
        </button>
        <button
          onClick={() => setShowLinkForm(!showLinkForm)}
          className={`ml-auto px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            showLinkForm
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
          }`}
        >
          {showLinkForm ? "Đóng" : "Liên kết Cha/Mẹ"}
        </button>
      </div>

      {/* Link Form */}
      <AnimatePresence>
        {showLinkForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm space-y-3">
              <div className="text-sm font-semibold text-slate-700 mb-1">
                Liên kết Cha / Mẹ cho bệnh nhân
              </div>
              <div className="flex flex-wrap items-end gap-4 max-w-4xl">
                <label className="text-[13px] font-semibold text-slate-600 flex-1 min-w-[220px]">
                  Cha
                  <PatientSelector
                    value={linkCha}
                    onChange={setLinkCha}
                    placeholder="— Chọn người làm Cha —"
                    excludeId={patientId}
                  />
                </label>
                <label className="text-[13px] font-semibold text-slate-600 flex-1 min-w-[220px]">
                  Mẹ
                  <PatientSelector
                    value={linkMe}
                    onChange={setLinkMe}
                    placeholder="— Chọn người làm Mẹ —"
                    excludeId={patientId}
                  />
                </label>
                <div className="w-[150px] shrink-0 mb-0.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLink}
                    disabled={linkMutation.isPending}
                    className="w-full px-4 py-2 rounded-xl text-[13px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
                  >
                    {linkMutation.isPending ? "Đang lưu..." : "Lưu liên kết"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree View */}
      {activeTab === "tree" && (
        <div className="space-y-4">
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Chưa có thông tin pha hệ. Hãy liên kết cha/mẹ để bắt đầu.
            </div>
          ) : (
            Object.entries(grouped).map(([relation, members]) => {
              const chipTone = RELATION_TONES[relation] || { tone: "slate", dot: "slate" };
              return (
                <div key={relation}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-800">
                      {RELATION_LABELS[relation] || relation}
                    </span>
                    <Chip tone={chipTone.tone} dot={chipTone.dot} className="text-xs">
                      {members.length}
                    </Chip>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {members.map((m) => (
                      <motion.div
                        key={m.MaBenhNhan}
                        whileHover={{ y: -2 }}
                        className="rounded-2xl p-4 bg-white ring-1 ring-slate-200/60 shadow-sm hover:shadow transition"
                      >
                        <div className="font-semibold text-sm text-slate-900">{m.HoTen}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.MaBenhNhan} · {m.GioiTinh} ·{" "}
                          {new Date(m.NgaySinh).toLocaleDateString("vi-VN")}
                        </div>
                        {m.NhomMau && (
                          <Chip tone="rose" className="text-xs mt-2">
                            Nhóm máu: {m.NhomMau}
                          </Chip>
                        )}
                        {m.BenhManTinh && (
                          <div className="text-xs text-amber-600 font-medium mt-1.5">
                            Bệnh mạn tính: {m.BenhManTinh}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Family Diseases View */}
      {activeTab === "diseases" && diseases && (
        <div className="space-y-4">
          {Object.keys(diseases.ThongKeBenhGiaDinh || {}).length > 0 && (
            <div className="rounded-2xl p-4 bg-amber-50/30 ring-1 ring-amber-200/50 shadow-sm">
              <div className="text-sm font-bold text-slate-800 mb-2">
                Thống kê bệnh mạn tính gia đình
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(diseases.ThongKeBenhGiaDinh).map(([disease, count]) => (
                  <Chip key={disease} tone="amber" dot="amber" className="text-xs">
                    {disease}: {count} người
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto scrollbar-none rounded-2xl ring-1 ring-slate-200/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Thành viên</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Quan hệ</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Bệnh mạn tính</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Tiểu sử bệnh</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Dị ứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(diseases.ThanhVien || []).map((m) => (
                  <tr key={m.MaBenhNhan} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{m.HoTen}</td>
                    <td className="px-4 py-2.5 text-slate-600">{RELATION_LABELS[m.QuanHe] || m.QuanHe}</td>
                    <td className="px-4 py-2.5 text-amber-600 font-medium">{m.BenhManTinh || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{m.TieuSuBenh || "—"}</td>
                    <td className="px-4 py-2.5 text-rose-600 font-medium">{m.DiUng || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
