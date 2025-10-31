// src/pages/Settings.jsx
import React from 'react';
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button.jsx";
import { useUI } from "../context/UIContext.jsx";
import { pushToast } from "../components/ui/ToastDock.jsx";

import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../data/settings.js";
import SettingsForm from "../components/settings/SettingsForm.jsx";

import useViewportVH from "../hooks/useViewportVH.js";
import useMediaQuery from "../hooks/useMediaQuery.js";

export default function Settings() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const { theme, setTheme, lang, setLang } = useUI();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    const s = loadSettings();
    setForm((f) => ({ ...f, ...s }));
    if (s.theme) setTheme(s.theme);
    if (s.lang) setLang(s.lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const user = useMemo(
    () => ({
      id: "NV-00123",
      name: form.name || "Admin User",
      email: form.email || "admin@clinic.local",
      role: form.role || "Bác sĩ",
    }),
    [form]
  );

  function doSave() {
    const pack = { ...form, theme, lang };
    saveSettings(pack);
    pushToast({ tone: "ok", title: "Đã lưu", message: "Cài đặt đã được lưu." });
  }
  function doReset() {
    setForm(DEFAULT_SETTINGS);
    setTheme(DEFAULT_SETTINGS.theme);
    setLang(DEFAULT_SETTINGS.lang);
    pushToast({
      tone: "warn",
      title: "Đã đặt lại",
      message: "Cài đặt quay về mặc định.",
    });
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 min-h-0 overflow-hidden"
      role="main"
      aria-label="Cài đặt"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* vùng cuộn chiếm hết phần còn lại */}
        <section className="p-1 flex-1  mb-0 min-h-0 ">
          {/* KHÔNG bọc grid ở đây nữa */}
          <SettingsForm
            user={user}
            form={form}
            change={change}
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={setLang}
            onSave={doSave}
            onReset={doReset}
          />
        </section>
      </div>
    </motion.main>
  );
}
