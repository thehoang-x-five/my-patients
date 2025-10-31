import React, { useMemo, useRef, useState, lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import ThreadsList from "../components/chat/ThreadsList.jsx";
import ChatRoom from "../components/chat/ChatRoom.jsx";
import FilterSheet from "../components/chat/FilterSheet.jsx";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import {
  THREADS as seedThreads,
  MESSAGES as seedMsgs,
  PATIENTS as seedPatients,
} from "../data/chat.js";

const ProfileDrawer = lazy(() =>
  import("../components/chat/ProfileDrawer.jsx")
);

function EmptyState({
  title = "Chưa chọn hội thoại",
  subtitle = "Hãy chọn 1 hội thoại ở bên trái để bắt đầu",
  icon = "💬",
}) {
  return (
    <div className="grid place-items-center h-full text-center">
      <div>
        <div className="text-5xl">{icon}</div>
        <div className="mt-2 text-lg font-bold">{title}</div>
        <div className="text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export default function LiveChat() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [threads, setThreads] = useState(seedThreads);
  const [messages, setMessages] = useState(seedMsgs);
  const [patients, setPatients] = useState(seedPatients);
  const [activeId, setActiveId] = useState(threads[0]?.id || null);

  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState({ status: "Tất cả", channel: "Tất cả" });
  const [role, setRole] = useState("all");
  const filterAnchorRef = useRef(null);

  const items = useMemo(() => {
    const search = q.trim().toLowerCase();
    return threads.filter((t) => {
      const matchQ =
        !search ||
        [t.name, t.snippet, t.channel].join(" ").toLowerCase().includes(search);
      const matchCh =
        filter.channel === "Tất cả" || t.channel === filter.channel;
      const matchSt =
        filter.status === "Tất cả" ||
        (filter.status === "Chưa đọc" && t.unread) ||
        (filter.status === "Đã lưu trữ" && t.archived) ||
        (filter.status === "Ghim" && t.pinned);
      const matchRole =
        role === "all" ||
        (role === "patient" && !!t.patientId) ||
        (role === "nurse" && /y tá/i.test(t.snippet)) ||
        (role === "doctor" && /(bác sĩ|bs)/i.test(t.snippet));
      return matchQ && matchCh && matchSt && matchRole;
    });
  }, [threads, q, filter, role]);

  const thread = useMemo(
    () => items.find((t) => t.id === activeId) || items[0] || null,
    [items, activeId]
  );

  const msgs = useMemo(
    () => (thread ? messages[thread.id] || [] : []),
    [messages, thread]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const patient = useMemo(
    () => (thread?.patientId ? patients[thread.patientId] : null),
    [thread, patients]
  );
  const isOld = !!patient;

  function send(text) {
    if (!thread) return;
    const newMsg = {
      id: crypto.randomUUID(),
      dir: "out",
      text,
      at: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((s) => ({
      ...s,
      [thread.id]: [...(s[thread.id] || []), newMsg],
    }));
  }
  function togglePin(id) {
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }
  function toggleUnread(id) {
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, unread: t.unread ? 0 : 1 } : t))
    );
  }
  function toggleArchive(id) {
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, archived: !t.archived } : t))
    );
  }
  function deleteThread(id) {
    setThreads((ts) => ts.filter((t) => t.id !== id));
    setTimeout(() => {
      setActiveId((cur) => (cur === id ? threads[0]?.id || null : cur));
    }, 0);
  }
  function handleCreateFromForm(newPatient) {
    const id =
      newPatient.id && newPatient.id.trim()
        ? newPatient.id.trim()
        : `BN${Math.floor(Math.random() * 900 + 100)}`;
    const full = { ...newPatient, id };
    setPatients((p) => ({ ...p, [id]: full }));
    setThreads((ts) =>
      ts.map((t) => (t.id === thread.id ? { ...t, patientId: id } : t))
    );
  }

  useEffect(() => {
    if (!thread && items[0]) setActiveId(items[0].id);
  }, [thread, items]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Live Chat"
    >
      <section
        className="mt-2 grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_1fr] gap-3
                   min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <ThreadsList
          items={items}
          activeId={thread?.id}
          onPick={setActiveId}
          onOpenFilter={() => setFilterOpen(true)}
          q={q}
          setQ={setQ}
          role={role}
          setRole={setRole}
          filterAnchorRef={filterAnchorRef}
          onTogglePin={togglePin}
          onToggleUnread={toggleUnread}
          onToggleArchive={toggleArchive}
          onDeleteThread={deleteThread}
        />

        {thread ? (
          <ChatRoom
            thread={thread}
            messages={msgs}
            onSend={send}
            onOpenProfile={() => setDrawerOpen(true)}
            isOldPatient={isOld}
          />
        ) : (
          <div className="card">
            <EmptyState />
          </div>
        )}
      </section>

      <Suspense fallback={null}>
        <ProfileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          thread={thread}
          patient={patient}
          onCreateFromForm={handleCreateFromForm}
        />
      </Suspense>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={filter}
        setValues={setFilter}
        anchorEl={filterAnchorRef.current}
      />
    </motion.main>
  );
}
