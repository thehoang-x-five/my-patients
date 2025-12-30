// src/api/notifications.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http, getStoredAccessToken } from "./http.js";
import { on } from "./realtime.js";

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

  // ====== 4. Loại người nhận notification ======
  // - Ưu tiên claim LoaiNguoiNhan trong token
  // - Nếu không có, mà là NVYT (bac_si / y_ta / ...) => default "nhan_vien_y_te"
  let loaiNguoiNhan =
    payload.LoaiNguoiNhan ||
    payload.loaiNguoiNhan ||
    null;

  if (!loaiNguoiNhan) {
    if (vaiTro === "bac_si" || vaiTro === "y_ta") {
      loaiNguoiNhan = "nhan_vien_y_te";
    }
  }

  // Fallback cuối cùng
  if (!loaiNguoiNhan) {
    loaiNguoiNhan = "nhan_vien_y_te";
  }

  // Nếu không xác định được mã người nhận thì để BE tự suy ra
  if (!maNguoiNhan) {
    return {
      LoaiNguoiNhan: loaiNguoiNhan,
      VaiTro: vaiTro,
    };
  }

  return {
    LoaiNguoiNhan: loaiNguoiNhan, // cho notification
    MaNguoiNhan: maNguoiNhan,
    TenNguoiNhan: tenNguoiNhan,
    VaiTro: vaiTro,               // FE dùng cho sidebar/quyền
  };
}


/** ================== Helpers: normalize DTO -> FE shape ================== */

function safeLower(v) {
  return v == null ? "" : String(v).toLowerCase();
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

  const priority =
    safeLower(
      dto.mucDoUuTien ??
        dto.MucDoUuTien ??
        dto.DoUuTien ??
        dto.priority ??
        "normal"
    ) || "normal";

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

// ================== Core REST helpers ==================

async function listNotifications(params = {}) {
  const {
    tab,        // all | unread | today
    take,       // số bản ghi muốn lấy (bell dùng để lấy top 5)
    page,
    q,          // keyword - filter client
    type,       // loại thông báo - filter client
    priority,   // ưu tiên - filter client
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
          FromTime: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          ToTime: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        }
      : {}),
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

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiCreateNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
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
  const handler = (dto) => {
    const mapped = normalizeNotification(dto);
    
    if (queryClient && typeof queryClient.invalidateQueries === "function") {
           queryClient.invalidateQueries({ queryKey: ["notifications"] });
           
         }
    try {
      window.dispatchEvent(
        new CustomEvent("app:new-notification", { detail: mapped })
      );
    } catch {
      // ignore
    }
  };

  const offCreated = on("NotificationCreated", handler);
  const offUpdated = on("NotificationUpdated", handler);

  return () => {
    offCreated?.();
    offUpdated?.();
  };
}
