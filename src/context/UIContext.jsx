import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUiStore } from "../components/stores/appStore.js";
import {
  DEFAULT_LANG,
  getLocaleForLanguage,
  normalizeLang,
} from "../utils/i18n.js";

const UI = createContext(null);

const dict = {
  vi: {
    brandSub: "Quản lý bệnh nhân",
    menu: "Menu",
    index: "Tổng quan",
    appointments: "Lịch hẹn",
    examinations: "Khám bệnh",
    patients: "Bệnh nhân",
    departments: "Khoa phòng",
    inpatient: "Nội trú",
    staff: "Nhân sự",
    prescriptions: "Đơn thuốc",
    notifications: "Thông báo",
    history: "Lịch sử",
    reports: "Báo cáo",
    settings: "Cài đặt",
    topbarGreeting: "Xin chào",
    topbarBanner: "Thanh trên",
    topbarClock: "Thời gian hiện tại",
    quickActions: "Hành động nhanh",
    quickCreateAppointment: "Tạo lịch hẹn",
    quickViewAppointments: "Xem lịch hẹn",
    quickAppointmentDescCreate: "Chuyển tới trang Lịch hẹn",
    quickAppointmentDescView: "Xem danh sách lịch hẹn",
    quickCreatePatient: "Thêm bệnh nhân",
    quickCreatePatientDesc: "Mở trang Bệnh nhân",
    quickViewNotifications: "Xem thông báo",
    quickViewNotificationsDesc: "Mở danh sách thông báo",
    openMenu: "Mở menu",
    collapseMenu: "Thu gọn menu",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    switchTheme: "Chuyển giao diện",
    lightMode: "Sáng",
    darkMode: "Tối",
    live: "Live",
    todayFlow: "Luồng hôm nay",
    userFallback: "Người dùng",
    avatarAlt: "Ảnh đại diện người dùng",
  },
  en: {
    brandSub: "Patient management",
    menu: "Menu",
    index: "Overview",
    appointments: "Appointments",
    examinations: "Examination",
    patients: "Patients",
    departments: "Departments",
    inpatient: "Inpatients",
    staff: "Staff",
    prescriptions: "Prescriptions",
    notifications: "Notifications",
    history: "History",
    reports: "Reports",
    settings: "Settings",
    topbarGreeting: "Hello",
    topbarBanner: "Top bar",
    topbarClock: "Current time",
    quickActions: "Quick actions",
    quickCreateAppointment: "Create appointment",
    quickViewAppointments: "View appointments",
    quickAppointmentDescCreate: "Go to the Appointments page",
    quickAppointmentDescView: "Open appointment list",
    quickCreatePatient: "Add patient",
    quickCreatePatientDesc: "Open the Patients page",
    quickViewNotifications: "View notifications",
    quickViewNotificationsDesc: "Open notifications list",
    openMenu: "Open menu",
    collapseMenu: "Collapse menu",
    language: "Language",
    theme: "Theme",
    switchTheme: "Switch theme",
    lightMode: "Light",
    darkMode: "Dark",
    live: "Live",
    todayFlow: "Today flow",
    userFallback: "User",
    avatarAlt: "User avatar",
  },
};

export function UIProvider({ children }) {
  const theme = useUiStore((state) => (state.theme === "dark" ? "dark" : "light"));
  const storeLang = useUiStore((state) => state.lang);
  const setThemeStore = useUiStore((state) => state.setTheme);
  const setLangStore = useUiStore((state) => state.setLang);
  const [collapsed, setCollapsed] = useState(false);

  const lang = normalizeLang(storeLang || DEFAULT_LANG);

  useEffect(() => {
    const width = collapsed ? "48px" : "260px";
    document.documentElement.style.setProperty("--sbw", width);
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const messages = dict[lang] || dict.vi;
    return {
      collapsed,
      setCollapsed,
      theme,
      setTheme: (next) => {
        const resolved = typeof next === "function" ? next(theme) : next;
        setThemeStore(resolved === "dark" ? "dark" : "light");
      },
      lang,
      setLang: (next) => {
        const resolved = typeof next === "function" ? next(lang) : next;
        setLangStore(normalizeLang(resolved));
      },
      locale: getLocaleForLanguage(lang),
      t: messages,
      tr: (key, fallback = "") => messages[key] || fallback || key,
    };
  }, [collapsed, lang, setLangStore, setThemeStore, theme]);

  return <UI.Provider value={value}>{children}</UI.Provider>;
}

export function useUI() {
  return useContext(UI);
}
