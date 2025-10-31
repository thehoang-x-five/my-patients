// src/data/settings.js
export const ROLES = ["Bác sĩ", "Y tá"];

export const DEFAULT_SETTINGS = {
  name: "Admin User",
  email: "admin@clinic.local",
  phone: "",
  role: "Bác sĩ", // 👈 mặc định
  density: "comfortable",
  showTips: true,
  theme: "light",
  lang: "vi",
  accent: "sky",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem("app.settings");
    if (!raw) return DEFAULT_SETTINGS;
    const obj = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    // 🧰 đảm bảo role hợp lệ (chỉ bác sĩ / điều dưỡng)
    if (!ROLES.includes(obj.role)) obj.role = "Bác sĩ";
    return obj;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s) {
  localStorage.setItem("app.settings", JSON.stringify(s));
}
