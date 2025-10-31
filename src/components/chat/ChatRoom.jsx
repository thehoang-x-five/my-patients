import React from 'react';
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useMediaQuery from "../../hooks/useMediaQuery";

export default function ChatRoom({
  thread,
  messages,
  onSend,
  onOpenProfile,
  onOpenAppointment,
  onAttach,
  isOldPatient,
}) {
  const listRef = useRef(null);
  const [text, setText] = useState("");
  const fileRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thread?.id]);

  if (!thread) return null;

  const handleSend = () => {
    const v = text.trim();
    if (!v) return;
    onSend?.(v);
    setText("");
  };

  return (
    <section className="card p-0 flex flex-col min-h-0 h-full">
      {/* Header */}
      <header
        className={`flex ${
          isMobile ? "flex-col" : "items-center justify-between"
        } px-4 py-3 border-b border-slate-200`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 grid place-items-center font-bold">
            {thread.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <b className="truncate">{thread.name}</b>
              {isOldPatient ? (
                <span className="tag">BN: {thread.patientId}</span>
              ) : (
                <span className="tag yellow">Bệnh nhân mới</span>
              )}
            </div>
            <div className="text-xs text-slate-500">Kênh: {thread.channel}</div>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 ${
            isMobile ? "mt-3 w-full justify-between" : ""
          }`}
        >
          <button
            className={`btn ${isMobile ? "flex-1" : ""}`}
            onClick={() => alert("Đang giả lập gọi...")}
            title="Gọi"
          >
            📞 {!isMobile && "Gọi"}
          </button>
          <button
            className={`btn ${isMobile ? "flex-1" : ""}`}
            onClick={onOpenProfile}
          >
            {isOldPatient ? "Hồ sơ" : "+ Hồ sơ"}
          </button>
          <button
            className={`btn btn-primary ${isMobile ? "flex-1" : ""}`}
            onClick={onOpenAppointment}
          >
            📅 {!isMobile && "Tạo lịch hẹn"}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-auto px-3 py-2 space-y-2"
      >
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              m.dir === "out" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-3 py-2 ${
                isMobile
                  ? "max-w-[85%]"
                  : isTablet
                  ? "max-w-[75%]"
                  : "max-w-[70%]"
              } shadow-soft ring-1 ${
                m.dir === "out"
                  ? "bg-sky-50 ring-sky-200"
                  : "bg-white ring-slate-200"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {m.text}
                {m?.meta?.attachment && (
                  <div className="mt-1 text-xs">
                    📎 <b>{m.meta.attachment.name}</b>{" "}
                    <span className="text-slate-500">
                      ({Math.round(m.meta.attachment.size / 1024)} KB)
                    </span>
                  </div>
                )}
                {m?.meta?.system && (
                  <div className="mt-1 text-[11px] text-slate-600">
                    [Hệ thống]
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 text-right">
                {m.at}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Composer */}
      <footer className="px-3 py-3 border-t border-slate-200">
        <div
          className={`flex items-center ${
            isMobile ? "flex-col gap-3" : "gap-2"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              onAttach?.(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-2 w-full">
            <button
              className={`btn ${isMobile ? "flex-none" : ""}`}
              title="Đính kèm"
              onClick={() => fileRef.current?.click()}
            >
              📎
            </button>
            <div className="relative flex-1 ">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isMobile
                    ? "Nhập tin nhắn..."
                    : "Nhập tin nhắn và nhấn Enter để gửi…"
                }
                className="w-full rounded-xl px-3 py-1.5 pl-2 pr-7 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
                aria-label="Soạn tin"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa tin nhắn"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              className={`btn btn-primary ${isMobile ? "flex-none" : ""}`}
              onClick={handleSend}
              aria-label="Gửi tin nhắn"
            >
              {isMobile ? "➤" : "Gửi"}
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
