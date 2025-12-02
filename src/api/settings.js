// src/api/settings.js
// API cho trang Cài đặt (Settings) – dùng BE thật, không dùng settingsMock.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";

export const DEFAULT_SETTINGS = {
  name: "",
  email: "",
  phone: "",
  role: "",
  lang: "vi",
  theme: "light",
  density: "normal",
  showTips: true,
  accent: "cyan",
};

// Chuẩn hoá DTO trả về từ BE về dạng FE dùng
export function normalizeSettingsDto(dto) {
  const base = { ...DEFAULT_SETTINGS };

  if (!dto || typeof dto !== "object") return base;

  const s = { ...dto };

  return {
    ...base,
    ...s,
    // Map vài tên field phổ biến
    name: s.name ?? s.hoTen ?? base.name,
    email: s.email ?? s.emailLienHe ?? base.email,
    phone: s.phone ?? s.dienThoai ?? base.phone,
    role: s.role ?? s.vaiTro ?? base.role,

    lang: s.lang ?? s.language ?? base.lang,
    theme: s.theme ?? s.giaoDien ?? base.theme,
    density: s.density ?? s.matDo ?? base.density,
    showTips:
      typeof s.showTips === "boolean"
        ? s.showTips
        : typeof s.hienMeo === "boolean"
        ? s.hienMeo
        : base.showTips,
    accent: s.accent ?? s.themeAccent ?? base.accent,
  };
}

async function fetchSettings() {
  const res = await http.get("/settings/me");
  const dto = res.data ?? res;
  return normalizeSettingsDto(dto);
}

async function updateSettings(payload) {
  const res = await http.put("/settings/me", payload);
  const dto = res.data ?? res;
  return normalizeSettingsDto(dto);
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings", "current"],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettingsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess(data) {
      qc.setQueryData(["settings", "current"], data);
    },
  });
}
