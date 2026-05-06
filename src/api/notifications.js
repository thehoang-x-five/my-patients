// src/api/notifications.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http, getStoredAccessToken } from "./http.js";
import { on } from "./realtime.js";
import { endOfLocalDayParam, startOfLocalDayParam } from "../utils/dateLocal.js";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    // JWT payload dùng base64-url: cần convert về base64 chuẩn + padding '='
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);

    let jsonStr;

    // Trình duyệt: dùng atob + decode UTF-8
    if (typeof atob === "function") {
      const binary = atob(padded); // binary string (mỗi char = 1 byte)

      if (typeof TextDecoder !== "undefined") {
        // Cách chuẩn: TextDecoder UTF-8
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        jsonStr = new TextDecoder("utf-8").decode(bytes);
      } else {
        // Fallback: trick decodeURIComponent(escape(...))
        jsonStr = decodeURIComponent(
          binary
            .split("")
            .map((c) =>
              "%" + c.charCodeAt(0).toString(16).padStart(2, "0")
            )
            .join("")
        );
      }
    }
    // Node / SSR
    else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(padded, "base64").toString("utf8");
    } else {
      return null;
    }

    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn("[notif] decodeJwtPayload error", err);
    return null;
  }
}

function normalizeCodeText(value) {
  return value == null
    ? ""
    : String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[\s-]+/g, "_");
}

function normalizeRoleCode(value) {
  const normalized = normalizeCodeText(value);

  if (["ky_thuat_vien", "kythuatvien", "ktv", "technician"].includes(normalized)) {
    return "ky_thuat_vien";
  }
  if (["bac_si", "bacsi", "doctor"].includes(normalized)) {
    return "bac_si";
  }
  if (["y_ta", "yta", "nurse"].includes(normalized)) {
    return "y_ta";
  }
  if (["admin", "quan_tri_vien", "quantrivien"].includes(normalized)) {
    return "admin";
  }

  return normalized;
}

function isGenericStaffReceiverType(value) {
  return ["nhan_vien_y_te", "nhan_su", "staff"].includes(normalizeRoleCode(value));
}

export function inferRecipientFromToken() {
  if (typeof window === "undefined") return {};

  let token = null;
  try {
    token = getStoredAccessToken();
  } catch {
    // ignore
  }

  if (!token) return {};

  let payload = null;
  try {
    payload = decodeJwtPayload(token);
  } catch {
    return {};
  }

  if (!payload) return {};

  // ====== 1. Mã người nhận ======
  const maNguoiNhan =
    payload.MaNhanVien ||
    payload.maNhanVien ||
    payload.sub ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    null;

  // ====== 2. Tên người nhận ======
  const tenNguoiNhan =
    payload.HoTen ||
    payload.hoTen ||
    payload.TenNhanVien ||
    payload.tenNhanVien ||
    payload.TenNguoiDung ||
    payload.tenNguoiDung ||
    payload.fullName ||
    payload.FullName ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ] ||
    payload.unique_name ||
    payload.preferred_username ||
    payload.name ||
    null;

  // ====== 3. Vai trò (bac_si, y_ta, admin, ...) ======
  const vaiTro =
    payload.VaiTro ||
    payload.vaiTro ||
    payload.role || // từ ClaimTypes.Role
    payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] ||
    null;
  const normalizedVaiTro = normalizeRoleCode(vaiTro);

  // ====== 4. Loại người nhận notification ======
  // - Ưu tiên claim LoaiNguoiNhan trong token
  // - Nếu không có, mà là NVYT (bac_si / y_ta / ...) => dùng vai trò cụ thể
  let loaiNguoiNhan =
    payload.LoaiNguoiNhan ||
    payload.loaiNguoiNhan ||
    null;

  // ====== 5. Loại y tá cụ thể (hanhchinh / cls / phong_kham) ======
  const loaiYTa =
    payload.loai_y_ta ||
    payload.LoaiYTa ||
    payload.loaiYTa ||
    null;

  if (!loaiNguoiNhan || isGenericStaffReceiverType(loaiNguoiNhan)) {
    if (normalizedVaiTro === "bac_si") {
      loaiNguoiNhan = "bac_si";
    } else if (normalizedVaiTro === "y_ta") {
      loaiNguoiNhan = "y_ta";
    } else if (normalizedVaiTro === "admin") {
      loaiNguoiNhan = "admin";
    } else if (normalizedVaiTro === "ky_thuat_vien") {
      loaiNguoiNhan = "ky_thuat_vien";
    }
  }

  // Fallback cuối cùng
  loaiNguoiNhan = normalizeRoleCode(loaiNguoiNhan) || "nhan_vien_y_te";

  // Nếu không xác định được mã người nhận thì để BE tự suy ra
  if (!maNguoiNhan) {
    return {
      LoaiNguoiNhan: loaiNguoiNhan,
      LoaiYTa: loaiYTa,
      VaiTro: normalizedVaiTro || vaiTro,
    };
  }

  return {
    LoaiNguoiNhan: loaiNguoiNhan, // cho notification
    LoaiYTa: loaiYTa,             // cho inbox filter đúng sub-type
    MaNguoiNhan: maNguoiNhan,
    TenNguoiNhan: tenNguoiNhan,
    VaiTro: vaiTro,               // FE dùng cho sidebar/quyền
  };
}


/** ================== Helpers: normalize DTO -> FE shape ================== */

function safeLower(v) {
  return v == null ? "" : String(v).toLowerCase();
}

function normalizePriorityCode(value) {
  const normalized = safeLower(value).trim();
  if (["cao", "high", "hight", "uu_tien"].includes(normalized)) return "high";
  if (["normal", "thuong", "trung_binh", "thong_thuong", "medium"].includes(normalized)) return "normal";
  return normalized || "normal";
}

export function normalizeNotification(dto = {}) {
  // primary ids
  const id =
    dto.maTbNguoiNhan ??
    dto.MaTbNguoiNhan ??
    dto.id ??
    dto.Id;

  const notifId =
    dto.maThongBao ??
    dto.MaThongBao ??
    dto.notifId ??
    dto.NotifId;

  // type & priority
  const rawType =
    dto.loaiThongBao ??
    dto.LoaiThongBao ??
    dto.type ??
    "system";

  const type = safeLower(rawType) || "system";

  const priority = normalizePriorityCode(
    dto.mucDoUuTien ??
      dto.MucDoUuTien ??
      dto.DoUuTien ??
      dto.priority ??
      "normal"
  );

  const status =
    dto.trangThai ??
    dto.TrangThai ??
    dto.status ??
    "";

  // title / message / description
  const title =
    dto.tieuDe ??
    dto.TieuDe ??
    dto.title ??
    "";

  const message =
    dto.noiDung ??
    dto.NoiDung ??
    dto.message ??
    "";

  const description =
    dto.moTa ??
    dto.MoTa ??
    dto.description ??
    "";

  // receiver
  const loaiNguoiNhan =
    dto.loaiNguoiNhan ??
    dto.LoaiNguoiNhan ??
    dto.receiverType ??
    "";

  const maNguoiNhan =
    dto.maNguoiNhan ??
    dto.MaNguoiNhan ??
    dto.receiverId ??
    "";

  const read =
    dto.daDoc ??
    dto.DaDoc ??
    dto.read ??
    false;

  // times
  const createdAtRaw =
    dto.thoiGianTao ??
    dto.ThoiGianTao ??
    dto.thoiGianGui ??
    dto.ThoiGianGui ??
    dto.createdAt ??
    dto.time ??
    null;

  const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString() : null;

  const readAtRaw =
    dto.thoiGianDoc ??
    dto.ThoiGianDoc ??
    dto.readAt ??
    null;

  const readAt = readAtRaw ? new Date(readAtRaw).toISOString() : null;

  // extra: patient / staff / dept info (nếu BE có)
  const patientId =
    dto.maBenhNhan ??
    dto.MaBenhNhan ??
    dto.benhNhan?.maBenhNhan ??
    dto.BenhNhan?.MaBenhNhan ??
    null;

  const patientName =
    dto.tenBenhNhan ??
    dto.TenBenhNhan ??
    dto.hoTenBenhNhan ??
    dto.HoTenBenhNhan ??
    dto.benhNhan?.hoTen ??
    dto.BenhNhan?.HoTen ??
    null;

  const fromStaff =
    dto.nhanSuNguon?.hoTen ??
    dto.NhanSuNguon?.HoTen ??
    dto.nguoiGui?.hoTen ??
    dto.NguoiGui?.HoTen ??
    dto.staffName ??
    dto.StaffName ??
    null;

  const fromDept =
    dto.nhanSuNguon?.khoa?.tenKhoa ??
    dto.NhanSuNguon?.Khoa?.TenKhoa ??
    dto.khoaPhong ??
    dto.KhoaPhong ??
    null;

  const links = dto.links ?? dto.Links ?? [];

  return {
    // primary
    id,
    notifId,
    type,
    priority,
    status,
    // main texts
    title: title || message || "(Không có tiêu đề)",
    message,
    description: description || message,
    // receiver
    loaiNguoiNhan,
    maNguoiNhan,
    read: !!read,
    // time
    createdAt,
    readAt,
    // extra info
    patientId,
    patientName,
    fromStaff,
    fromDept,
    // nav links
    links: Array.isArray(links) ? links : [],
    // keep raw
    _raw: dto,
  };
}

function getAllowedNotificationReceiverTypes() {
  const { LoaiNguoiNhan, LoaiYTa, VaiTro } = inferRecipientFromToken() || {};
  const role = normalizeRoleCode(VaiTro || LoaiNguoiNhan);
  const receiverType = normalizeRoleCode(LoaiNguoiNhan);
  const nurseType = safeLower(LoaiYTa).trim();

  const allowed = new Set(["nhan_vien_y_te", "nhan_su", "staff"]);
  if (receiverType && !isGenericStaffReceiverType(receiverType)) {
    allowed.add(receiverType);
  }

  if (role === "bac_si") {
    allowed.add("bac_si");
  } else if (role === "y_ta") {
    allowed.add("y_ta");
    if (["hanhchinh", "hanh_chinh"].includes(nurseType)) {
      allowed.add("y_ta_hanh_chinh");
    } else if (["cls", "can_lam_sang"].includes(nurseType)) {
      allowed.add("y_ta_cls");
      allowed.add("y_ta_can_lam_sang");
    } else if (["ls", "phong_kham", "lam_sang"].includes(nurseType)) {
      allowed.add("y_ta_phong_kham");
      allowed.add("y_ta_lam_sang");
    } else {
      allowed.add("y_ta_hanh_chinh");
      allowed.add("y_ta_phong_kham");
      allowed.add("y_ta_cls");
      allowed.add("y_ta_lam_sang");
      allowed.add("y_ta_can_lam_sang");
    }
  } else if (["ky_thuat_vien", "kythuatvien", "ktv"].includes(role)) {
    allowed.add("ky_thuat_vien");
    allowed.add("ktv");
  } else if (["admin", "quan_tri_vien"].includes(role)) {
    allowed.add("admin");
    allowed.add("quan_tri_vien");
  }

  return allowed;
}

function isNotificationVisibleToCurrentUser(item) {
  const { MaNguoiNhan } = inferRecipientFromToken() || {};
  const receiverType = normalizeRoleCode(item?.loaiNguoiNhan);
  const receiverId = String(item?.maNguoiNhan || "").trim();

  if (receiverId) {
    return !!MaNguoiNhan && receiverId === String(MaNguoiNhan);
  }

  if (!receiverType) return true;
  return getAllowedNotificationReceiverTypes().has(receiverType);
}

function upsertNotificationCache(queryClient, dto) {
  if (!queryClient) return;

  const item = normalizeNotification(dto);
  if (!isNotificationVisibleToCurrentUser(item)) return;

  queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => {
    if (!old) return old;

    const same = (a) =>
      (item.id && a?.id === item.id) ||
      (item.notifId && a?.notifId === item.notifId);

    const prepend = (items) => {
      const list = Array.isArray(items) ? items : [];
      const withoutDuplicate = list.filter((x) => !same(x));
      return [item, ...withoutDuplicate];
    };

    if (Array.isArray(old)) {
      return prepend(old);
    }

    if (Array.isArray(old.Items)) {
      const nextItems = prepend(old.Items);
      return {
        ...old,
        Items: nextItems,
        TotalItems: Math.max(old.TotalItems ?? nextItems.length, nextItems.length),
      };
    }

    if (Array.isArray(old.items)) {
      const nextItems = prepend(old.items);
      return {
        ...old,
        items: nextItems,
        totalItems: Math.max(old.totalItems ?? nextItems.length, nextItems.length),
      };
    }

    return old;
  });
}

// ================== Core REST helpers ==================

async function listNotifications(params = {}) {
  const {
    tab,        // all | unread | today
    take,       // số bản ghi muốn lấy (bell dùng để lấy top 5)
    page,
    q,          // keyword - filter backend
    keyword,    // keyword - alias
    type,       // loại thông báo - filter backend
    priority,   // ưu tiên - filter backend
    sortBy,     // sorting field
    sortDirection, // sorting direction
    ...rest
  } = params || {};

  // Map sang NotificationFilterRequest (API GetInbox)
  // LoaiNguoiNhan & MaNguoiNhan: ưu tiên lấy từ token; nếu không decode được thì để BE tự suy ra.
  const { LoaiNguoiNhan, MaNguoiNhan ,TenNguoiNhan,VaiTro} = inferRecipientFromToken() || {};
 
  
  const filter = {
    ...(LoaiNguoiNhan ? { LoaiNguoiNhan } : {}),
    ...(MaNguoiNhan ? { MaNguoiNhan } : {}),
    // true: chỉ chưa đọc, undefined: để BE trả tất cả
    OnlyUnread: tab === "unread" ? true : false,
    ...(tab === "today"
      ? {
          FromTime: startOfLocalDayParam(),
          ToTime: endOfLocalDayParam(),
        }
      : {}),
    ...(q || keyword ? { Keyword: q || keyword } : {}),
    ...(type && type !== "all" ? { LoaiThongBao: type } : {}),
    ...(priority && priority !== "all" ? { MucDoUuTien: priority } : {}),
    ...(sortBy ? { SortBy: sortBy } : {}),
    ...(sortDirection ? { SortDirection: sortDirection } : {}),
    Page: page || 1,
    PageSize: take || rest.PageSize || rest.pageSize || 50, // ✅ Chuẩn hóa: 50 items mặc định
    ...rest,
  };

  const res = await http.get("/notification/inbox", { params: filter });
  console.log(res.data);
  const payload = res.data || {};
  const rawItems =
  
    Array.isArray(payload.Items) && payload.Items.length >= 0
      ? payload.Items
      : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [];

  const mappedItems = rawItems.map(normalizeNotification);

  // Trả về dạng PagedResult chuẩn để FE có thể dùng nếu cần
  if (
    typeof payload.TotalItems === "number" ||
    typeof payload.totalItems === "number"
  ) {
    return {
      items: mappedItems,
      totalItems: payload.TotalItems ?? payload.totalItems,
      page: payload.Page ?? payload.page ?? 1,
      pageSize: payload.PageSize ?? payload.pageSize ?? mappedItems.length,
    };
  }

  // Fallback: trả về chỉ array
  return mappedItems;
}


async function apiMarkRead(id) {
  if (!id && id !== 0) return null;

  // MarkAsRead: PUT /api/notification/recipient/{maTbNguoiNhan:long}/read
  const res = await http.put(`/notification/recipient/${id}/read`);
  return res.data;
}
async function apiCreateNotification(payload) {
  // payload FE: { type, title, message, priority, source, sourceId, recipients }
  const {
    type,
    title,
    message,
    priority = "normal",
    source,
    sourceId,
    recipients = [],
  } = payload || {};

  const request = {
    LoaiThongBao: type,
    TieuDe: title,
    NoiDung: message,
    MucDoUuTien: priority,
    NguonLienQuan: source ?? null,
    MaDoiTuongLienQuan: sourceId ?? null,
    NguoiNhan: recipients.map((r) => ({
      LoaiNguoiNhan:
        r.LoaiNguoiNhan ?? r.loaiNguoiNhan ?? r.type ?? "staff",
      MaNguoiNhan: r.MaNguoiNhan ?? r.maNguoiNhan ?? r.id ?? "",
    })),
  };

  const res = await http.post("/notification", request);
  return normalizeNotification(res.data);
}

async function searchSystemNotifications(params = {}) {
  const res = await http.get("/notification/search", {
    params: {
      LoaiThongBao: params.type || undefined,
      MucDoUuTien: params.priority || undefined,
      TrangThai: params.status || undefined,
      Keyword: params.keyword || undefined,
      FromTime: params.fromTime || undefined,
      ToTime: params.toTime || undefined,
      Page: params.page || 1,
      PageSize: params.pageSize || 50,
    },
  });

  const payload = res.data || {};
  const rawItems = Array.isArray(payload.Items)
    ? payload.Items
    : Array.isArray(payload.items)
    ? payload.items
    : [];

  return {
    items: rawItems.map(normalizeNotification),
    totalItems: payload.TotalItems ?? payload.totalItems ?? rawItems.length,
    page: payload.Page ?? payload.page ?? 1,
    pageSize: payload.PageSize ?? payload.pageSize ?? rawItems.length,
  };
}

async function listNotificationTemplates() {
  const res = await http.get("/notification-templates");
  return Array.isArray(res.data) ? res.data : [];
}

async function createNotificationTemplate(payload) {
  const res = await http.post("/notification-templates", payload);
  return res.data;
}

async function updateNotificationTemplate({ id, data }) {
  const res = await http.put(`/notification-templates/${id}`, data);
  return res.data;
}

async function deleteNotificationTemplate(id) {
  await http.delete(`/notification-templates/${id}`);
  return true;
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiCreateNotification,
    onSuccess: async (created) => {
      upsertNotificationCache(qc, created);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["notifications"] }),
        qc.invalidateQueries({ queryKey: ["notification-search"] }),
      ]);
      await Promise.all([
        qc.refetchQueries({ queryKey: ["notifications"], type: "active" }),
        qc.refetchQueries({ queryKey: ["notification-search"], type: "active" }),
      ]);
    },
  });
}

export function useNotificationSearch(params = {}, options = {}) {
  return useQuery({
    queryKey: ["notification-search", params],
    queryFn: () => searchSystemNotifications(params),
    staleTime: 15_000,
    keepPreviousData: true,
    ...options,
  });
}

export function useNotificationTemplates(options = {}) {
  return useQuery({
    queryKey: ["notification-templates"],
    queryFn: listNotificationTemplates,
    staleTime: 30_000,
    ...options,
  });
}

export function useCreateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNotificationTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
}

export function useDeleteNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-templates"] });
    },
  });
}



/** ================== React Query hooks ================== */


export function useNotifications({ params } = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => listNotifications(params),
    select: (res) => {
      // ✅ Trả về PagedResult đầy đủ
      if (res && typeof res === "object" && ("totalItems" in res || "TotalItems" in res)) {
        return {
          Items: res.items || res.Items || [],
          TotalItems: res.TotalItems ?? res.totalItems ?? 0,
          Page: res.Page ?? res.page ?? (params?.page ?? 1),
          PageSize: res.PageSize ?? res.pageSize ?? (params?.pageSize ?? 50),
        };
      }
      // Fallback: nếu là array
      const items = Array.isArray(res) ? res : [];
      return {
        Items: items,
        TotalItems: items.length,
        Page: params?.page ?? 1,
        PageSize: params?.pageSize ?? 50,
      };
    },
    keepPreviousData: true,
    staleTime: 15_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiMarkRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
      await qc.refetchQueries({ queryKey: ["notifications"], type: "active" });
    },
  });
}
/** ================== Realtime subscribe (SignalR) ================== */
/**
 * Khớp với IRealtimeClient:
 *  - NotificationCreated(NotificationDto dto)
 *  - NotificationUpdated(NotificationDto dto)
 */
export function subscribeNotifications(queryClient) {
  const handler = async (dto) => {
    console.log("[NOTIF-RT] 🔔 Event received:", JSON.stringify(dto, null, 2));
    const debugItem = normalizeNotification(dto);
    const debugVisible = isNotificationVisibleToCurrentUser(debugItem);
    const debugRecipient = inferRecipientFromToken();
    console.log("[NOTIF-RT] 📋 Normalized:", { id: debugItem.id, notifId: debugItem.notifId, type: debugItem.type, loaiNguoiNhan: debugItem.loaiNguoiNhan, maNguoiNhan: debugItem.maNguoiNhan });
    console.log("[NOTIF-RT] 👤 Current user:", { LoaiNguoiNhan: debugRecipient?.LoaiNguoiNhan, MaNguoiNhan: debugRecipient?.MaNguoiNhan, VaiTro: debugRecipient?.VaiTro });
    console.log("[NOTIF-RT] ✅ Visible:", debugVisible, "| Allowed types:", [...getAllowedNotificationReceiverTypes()]);
    if (queryClient && typeof queryClient.invalidateQueries === "function") {
      upsertNotificationCache(queryClient, dto);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.refetchQueries?.({ queryKey: ["notifications"], type: "active" });
    }
  };

  const offCreated = on("NotificationCreated", handler);
  const offUpdated = on("NotificationUpdated", handler);

  return () => {
    offCreated?.();
    offUpdated?.();
  };
}
