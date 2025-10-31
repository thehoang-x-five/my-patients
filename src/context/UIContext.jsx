import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const UI = createContext();

const dict = {
  vi: {
    brandSub: "Quản lý bệnh nhân",
    menu: "Menu",
    index: "Tổng quan",
    appointments: "Lịch hẹn",
    examinations: "Khám bệnh",
    patients: "Bệnh nhân",
    departments: "Khoa phòng",
    inpatient: "Bệnh nhân nội trú",
    staff: "Nhân sự",
    prescriptions: "Đơn thuốc",
    notifications: "Thông báo",
    chat: "Live chat",
    history: "Lịch sử",
    reports: "Báo cáo",
  },
  en: {
    brandSub: "Patient management",
    menu: "Menu",
    index: "Overview",
    appointments: "Appointments",
    examinations: "Examination",
    patients: "Patients",
    departments: "Departments",
    inpatient: "Inpatient",
    staff: "Staff",
    prescriptions: "Prescriptions",
    notifications: "Notifications",
    chat: "Live chat",
    history: "History",
    reports: "Reports",
  },
};

export function UIProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "vi");
  useEffect(() => {
    const w = collapsed ? "48px" : "260px";
    document.documentElement.style.setProperty("--sbw", w);
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => localStorage.setItem("lang", lang), [lang]);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      theme,
      setTheme,
      lang,
      setLang,
      t: dict[lang],
    }),
    [collapsed, theme, lang]
  );
  return <UI.Provider value={value}>{children}</UI.Provider>;
}
export const useUI = () => useContext(UI);
