import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Button from "../ui/Button.jsx";
import PopoverSelect from "../ui/PopoverSelect.jsx";
import RxPickerModal from "./RxPickerModal.jsx";
import PaymentWizard from "../billing/PaymentWizard.jsx";
import { useAuthStore } from "../stores/appStore.js";
import {
  canManageReception,
  canEnterExamData,
  canEnterClsResult,
  canPrescribe,
} from "../../utils/permissions.js";
import {
  useExamServices,
  useCreateExamOrder,
  useCreateDiagnosis,
  useCreateClsResult,
} from "../../api/examination.js";
import { toLocalYmd } from "../../utils/dateLocal.js";

const MAX_NOTE_LEN = 200;
const STATUS_DEFAULT = "Chưa có kết quả";
const fadeIn = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

function getApiAssetOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  try {
    const url = new URL(apiBase, window.location.origin);
    return url.pathname.toLowerCase().endsWith("/api")
      ? url.origin
      : url.origin;
  } catch {
    return "";
  }
}

function normalizeAttachmentUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (/^[a-z]:\\/i.test(raw) || raw.startsWith("\\\\")) return "";

  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  if (!normalizedPath.toLowerCase().startsWith("/uploads/")) return "";

  const origin = getApiAssetOrigin();
  const encodedPath = encodeURI(normalizedPath);
  return origin ? `${origin}${encodedPath}` : encodedPath;
}

function attachmentNameFrom(raw, fallback) {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  const path = value.split(/[?#]/)[0].replace(/\\/g, "/");
  return path.split("/").filter(Boolean).pop() || fallback;
}

function emptyRow() {
  return {
    id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    svcId: "",
    status: STATUS_DEFAULT,
    note: "",
  };
}

function parseAttachmentValue(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (typeof item === "string") {
          const url = normalizeAttachmentUrl(item);
          return {
            id: `file-${index + 1}`,
            name: attachmentNameFrom(item, `Tệp ${index + 1}`),
            url,
          };
        }
        if (item && typeof item === "object") {
          const rawUrl = item.url || item.href || item.path || "";
          const url = normalizeAttachmentUrl(rawUrl);
          return {
            id: item.id || item.name || item.fileName || `file-${index + 1}`,
            name:
              item.name ||
              item.fileName ||
              item.filename ||
              attachmentNameFrom(rawUrl, `Tệp ${index + 1}`),
            url,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return parseAttachmentValue(JSON.parse(trimmed));
      } catch {
        return [
          {
            id: trimmed,
            name: trimmed,
            url: "",
          },
        ];
      }
    }

    return [
      {
        id: trimmed,
        name: attachmentNameFrom(trimmed, "Tệp 1"),
        url: normalizeAttachmentUrl(trimmed),
      },
    ];
  }

  return [];
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file?.name || ""}`));
    reader.readAsDataURL(file);
  });
}

async function buildAttachmentPayload(files) {
  if (!Array.isArray(files) || !files.length) return [];

  const items = await Promise.all(
    files.map(async (file, index) => ({
      id:
        file?.name ||
        `file-${index + 1}-${Date.now()}`,
      name: file?.name || `Tệp ${index + 1}`,
      url: await fileToDataUrl(file),
    }))
  );

  return items;
}

export default function ExamDetail({
  patient,
  onBack,
  onExportDiagnosis,
  onExportOrder,
}) {
  // ----- STATE CHUNG -----
  // ✅ RBAC: kiểm tra quyền action-level
  const user = useAuthStore((s) => s.user);
  const allowPayment = canManageReception(user);    // Chỉ YTHC
  const allowExamData = canEnterExamData(user);     // BS + YtaLS
  const allowClsResult = canEnterClsResult(user);   // YtaCLS + KTV
  const allowPrescribe = canPrescribe(user);         // BS only

  const [rows, setRows] = useState([emptyRow()]);
  const [dx, setDx] = useState({
    pre: "",
    final: "",
    plan: "",
    advice: "",
    note: "",
    followupDate: "",
    followupTime: "",
    flags: {
      choVe: false,
      choThuocVe: false,
      taiKham: false,
    },
  });
  const [dxFlagError, setDxFlagError] = useState("");
  const [rx, setRx] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingDxPayload, setPendingDxPayload] = useState(null);

  // CLS – thêm kết quả & file
  const [clsResult, setClsResult] = useState("");
  const [clsFiles, setClsFiles] = useState([]);
 // Lấy mã phòng từ patient để truyền vào API overview
 const roomId =
 patient?.roomId ||
 patient?.MaPhong ||
 patient?.maPhong ||
 patient?.room ||
 "";

// /api/master-data/services/overview?MaPhong=...
const { data: rawExamServices = [] } = useExamServices(  { loaiDichVu: "can_lam_sang" });

// CLS result mutation
const createClsResultMut = useCreateClsResult();

// Chuẩn hóa dữ liệu dịch vụ về { id, name, type, _raw }
const examServices = useMemo(
 () =>
   (rawExamServices || []).map((s) => ({
     id: s.id ?? s.MaDV ?? s.maDV ?? s.code ?? "",
     name:
       s.name ??
       s.TenDV ??
       s.tenDV ??
       s.ten_dich_vu ??
       "",
     type: s.LoaiDichVu ?? s.loaiDichVu ?? s.type ?? "",
     _raw: s,
   })),
 [rawExamServices]
);

const svcMap = useMemo(() => {
 const m = new Map();
 examServices.forEach((s) => m.set(s.id, s));
 return m;
}, [examServices]);

  // Lấy maPhieuKham từ patient để gọi API chi tiết phiếu khám
  const maPhieuKham =
    patient?.MaPhieuKham ||
    patient?.maPhieuKham ||
    patient?.maPhieuKham ||
    null;

  // Ưu tiên dùng dữ liệu kèm trong queue (không gọi API chi tiết phiếu)
  const clinicalExamData =
    patient?.PhieuKhamLsFull || patient?.PhieuKhamLs || {};

  // Prefill nếu có serviceOrder.items (LS)
  useEffect(() => {
    const items = patient?.serviceOrder?.items;
    if (Array.isArray(items) && items.length) {
      setRows(
        items.map((sid) => ({
          ...emptyRow(),
          svcId: sid,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.serviceOrder?.items]);

  // ✅ AUTO-FILL "Nội dung khám" từ loại dịch vụ + triệu chứng
  useEffect(() => {
    // Chỉ auto-fill khi dx.note đang trống
    if (dx.note && dx.note.trim()) return;
    
    const serviceType = clinicalExamData?.LoaiDichVu || 
                       clinicalExamData?.loaiDichVu || 
                       clinicalExamData?.loai_dich_vu || 
                       patient?.serviceType ||
                       "";
    
    const symptoms = clinicalExamData?.TrieuChung || 
                    clinicalExamData?.trieuChung || 
                    clinicalExamData?.trieu_chung ||
                    patient?.symptoms ||
                    "";
    
    // Tạo nội dung khám từ loại dịch vụ + triệu chứng
    const parts = [];
    if (serviceType) {
      parts.push(`Loại dịch vụ: ${serviceType}`);
    }
    if (symptoms) {
      parts.push(`Triệu chứng: ${symptoms}`);
    }
    
    if (parts.length > 0) {
      const autoFilledNote = parts.join("\n");
      setDx((s) => ({ ...s, note: autoFilledNote }));
    }
  }, [clinicalExamData, patient, dx.note]);

  const hasOrder = useMemo(
    () => rows.some((r) => (r.svcId || "").trim()),
    [rows]
  );
  const hasDx = useMemo(() => {
    const t = (v) => (v ?? "").trim();
    return !!(t(dx.pre) || t(dx.final) || t(dx.plan) || t(dx.advice));
  }, [dx]);

  function addRow() {
    setRows((s) => [...s, emptyRow()]);
  }
  function removeRow(id) {
    setRows((s) => (s.length > 1 ? s.filter((r) => r.id !== id) : s));
  }
  function patchRow(id, patch) {
    setRows((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // ---- FLAGS HƯỚNG XỬ TRÍ ----
  const dxFlags = dx.flags || {
    choVe: false,
    choThuocVe: false,
    taiKham: false,
  };
  const canPrescribeTakeHome = allowPrescribe && !!dxFlags.choThuocVe;
  const minFollowupDate = useMemo(
    () => toLocalYmd(new Date()),
    []
  );

  useEffect(() => {
    if (dxFlags.choThuocVe) return;
    if (pickerOpen) setPickerOpen(false);
    if (rx.length > 0) setRx([]);
  }, [dxFlags.choThuocVe, pickerOpen, rx.length]);

  useEffect(() => {
    if (dxFlags.taiKham) return;
    if (!dx.followupDate && !dx.followupTime) return;

    setDx((prev) => {
      if (!prev.followupDate && !prev.followupTime) return prev;
      return {
        ...prev,
        followupDate: "",
        followupTime: "",
      };
    });
  }, [dx.followupDate, dx.followupTime, dxFlags.taiKham]);

  function toggleDxFlag(name) {
    setDxFlagError("");
    setDx((prev) => {
      const prevFlags = prev.flags || {
        choVe: false,
        choThuocVe: false,
        taiKham: false,
      };
      const nextFlags = { ...prevFlags, [name]: !prevFlags[name] };

      // Không cho tick cùng lúc “Cho về” + “Tái khám”
      if (name === "choVe" && nextFlags.choVe && nextFlags.taiKham) {
        nextFlags.taiKham = false;
      }
      if (name === "taiKham" && nextFlags.taiKham && nextFlags.choVe) {
        nextFlags.choVe = false;
      }

      return { ...prev, flags: nextFlags };
    });
  }

  function buildPayloadCommon() {
    const orderRows = rows
      .filter((r) => (r.svcId || "").trim())
      .map((r) => {
        const meta = svcMap.get(r.svcId);
        return {
          id: r.svcId,
          serviceName: meta?.name || r.svcId,
          status: r.status || STATUS_DEFAULT,
          note: r.note || "",
        };
      });

    const rxRows = rx
      .map((r) => ({
        code: r.code,
        name: r.name,
        dose: (r.dose ?? "").trim(),
        qty: Math.max(1, Number.parseInt(r.qty ?? 0, 10) || 0),
        price: Number(r.price || 0) || 0,
        unit: r.unit || "",
        usage: r.usage || "",
      }))
      .filter(
        (r) =>
          r.code &&
          r.name &&
          r.dose &&
          Number.isFinite(r.qty) &&
          r.qty > 0
      );

    return {
      meta: {
        examAt: new Date().toISOString(),
        dept: patient.dept || patient.department || "",
        doctor: patient.doctor || "",
        version: Date.now(),
        source: "exam",
      },
      orderRows,
      rxRows,
      dx: {
        ...dx,
        followupDate: dxFlags.taiKham ? dx.followupDate || "" : "",
        followupTime: dxFlags.taiKham ? dx.followupTime || "" : "",
        flags: dxFlags,
      },
    };
  }


  // Helper: lay ma nguoi lap de gui kem payload tao phieu CLS
  function getCurrentUserMaNguoiLap() {
    if (typeof window === "undefined") return null;

    try {
      const authData = localStorage.getItem("his-auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        const user = parsed?.user;
        if (user) {
          return (
            user.MaNhanSu ||
            user.maNhanSu ||
            user.MaNguoiLap ||
            user.maNguoiLap ||
            user.id ||
            user.userId ||
            null
          );
        }
      }
      if (window.APP_USER) {
        const u = window.APP_USER;
        return (
          u.MaNhanSu ||
          u.maNhanSu ||
          u.MaNguoiLap ||
          u.maNguoiLap ||
          u.id ||
          u.userId ||
          null
        );
      }
    } catch (err) {
      console.warn("Không thể lấy MãNgườiLập:", err);
    }
    return null;
  }

  function buildClsOrderPayload() {
    const orderId =
      patient?.MaPhieuKhamCls ??
      patient?.maPhieuKhamCls ??
      patient?.PhieuKhamCls?.MaPhieuKhamCls ??
      patient?.phieuKhamCls?.MaPhieuKhamCls ??
      `cls-${Date.now()}`;

    const listItemDV = rows
      .filter((r) => (r.svcId || "").trim())
      .map((r) => ({
        MaPhieuKhamCls: orderId,
        MaDichVu: r.svcId,
        GhiChu: r.note || "",
        TrangThai: "chua_co_ket_qua",
      }));

    const maNguoiLap =
      patient?.MaNguoiLap ??
      patient?.maNguoiLap ??
      getCurrentUserMaNguoiLap() ??
      patient?.MaBacSiKham ??
      patient?.maBacSiKham ??
      "system";

    const maPhieuKhamLs =
      patient?.MaPhieuKham ??
      patient?.maPhieuKham ??
      patient?.MaPhieuKhamLs ??
      patient?.maPhieuKhamLs ??
      patient?.PhieuKhamLs?.MaPhieuKham ??
      patient?.phieuKhamLs?.MaPhieuKham ??
      maPhieuKham ??
      null;

    return {
      MaBenhNhan:
        patient?.MaBenhNhan ??
        patient?.maBenhNhan ??
        patient?.pid ??
        patient?.id ??
        null,
      MaPhieuKhamLs: maPhieuKhamLs,
      MaPhieuKhamCls: orderId,
      MaNguoiLap: maNguoiLap,
      AutoPublishEnabled: true,
      GhiChu: listItemDV.map((i) => i.GhiChu).filter(Boolean).join("; "),
      // ✅ Trạng thái phiếu CLS:
      // - da_lap: Đã lập (phiếu CLS vừa được tạo bởi bác sĩ) ← Dùng khi xuất phiếu khám
      // - dang_thuc_hien: Đang thực hiện (y tá đã tiếp nhận và đang làm)
      // - da_hoan_tat: Đã hoàn tất (đã có kết quả)
      // - da_huy: Đã hủy
      TrangThai: "da_lap",
      ListItemDV: listItemDV,
    };
  }

  // Mutations (fallback nếu không có callback từ parent)
  const orderMut = useCreateExamOrder();
  const dxMut = useCreateDiagnosis();

  async function handleExportOrder() {
    if (!hasOrder) return;
    const payload = buildClsOrderPayload();
    if (!payload?.ListItemDV?.length) return;

    if (onExportOrder) {
      await onExportOrder(patient, payload);
      return;
    }

    await orderMut.mutateAsync(payload);
  }

  async function handleExportDiagnosisLS() {
    if (!hasDx) return;

    // ✅ VALIDATION: Kiểm tra các trường bắt buộc trước khi xuất chẩn đoán
    const errors = [];
    
    // Kiểm tra chẩn đoán sơ bộ
    if (!dx.pre || !dx.pre.trim()) {
      errors.push("Chẩn đoán sơ bộ");
    }
    
    // Kiểm tra chẩn đoán xác định
    if (!dx.final || !dx.final.trim()) {
      errors.push("Chẩn đoán xác định");
    }
    
    // Kiểm tra phác đồ điều trị
    if (!dx.plan || !dx.plan.trim()) {
      errors.push("Phác đồ điều trị");
    }
    
    // Kiểm tra tư vấn & dặn dò
    if (!dx.advice || !dx.advice.trim()) {
      errors.push("Tư vấn & Dặn dò");
    }
    
    // Kiểm tra hướng xử trí (phải tích ít nhất 1 ô)
    if (!dxFlags.choVe && !dxFlags.choThuocVe && !dxFlags.taiKham) {
      errors.push("Hướng xử trí (phải chọn ít nhất 1 mục)");
    }

    if (dxFlags.taiKham && !(dx.followupDate || "").trim()) {
      errors.push("Ngày tái khám");
    }
    
    // Nếu có lỗi, hiển thị thông báo và dừng lại
    if (errors.length > 0) {
      const errorMsg = `Vui lòng điền đầy đủ các trường sau:\n• ${errors.join("\n• ")}`;
      toast.warn(errorMsg, { autoClose: 5000 });
      setDxFlagError(errors.length > 0 ? "Vui lòng điền đầy đủ thông tin trước khi xuất chẩn đoán" : "");
      return;
    }

    // đảm bảo không có combination choVe + taiKham (phòng thủ)
    if (dxFlags.choVe && dxFlags.taiKham) {
      setDxFlagError('Không thể chọn đồng thời "Cho về" và "Tái khám".');
      return;
    }

    const payload = buildPayloadCommon();
    const pid = patient?.pid || patient?.id;
    payload.services = payload.orderRows.map((r) => r.id);

    if (!dxFlags.choThuocVe && payload.rxRows.length > 0) {
      toast.error("Chỉ được kê thuốc khi đã chọn hướng xử lý 'Cho thuốc về'.");
      return;
    }

    try {
      if (onExportDiagnosis) {
        await onExportDiagnosis(patient, {
          dx: payload.dx,
          rxRows: payload.rxRows,
          services: payload.services,
        });

        // Sau khi lưu chẩn đoán thành công → mở PaymentWizard
        // BE đã auto-tạo hóa đơn "chua_thu" khi tạo phiếu khám LS
        // PaymentWizard sẽ tìm hóa đơn đó theo MaPhieuKham rồi confirm
        const paymentItems = payload.orderRows.map((r) => ({
          name: r.serviceName || r.id,
          amount: 0, // BE tính giá — Wizard sẽ hiện giá thực từ hóa đơn
        }));

        // Luôn mở PaymentWizard — giá thực lấy từ hóa đơn BE tạo sẵn
        if (allowPayment) {
          setPendingDxPayload(paymentItems);
          setPaymentOpen(true);
        } else {
          toast.success("Đã lưu chẩn đoán thành công.");
        }
        return;
      }

      await dxMut.mutateAsync({
        pid,
        dx: payload?.dx || {},
        rx: payload?.rxRows || [],
        services:
          payload?.services || (payload?.orderRows || []).map((r) => r.id),
        // CLS: cho phép đính kèm kết quả + file nếu có
        files: payload?.files,
        result: payload?.result,
        note: payload?.note,
      });
    } catch (error) {
      toast.error(error?.message || "Không thể xuất chẩn đoán. Vui lòng thử lại.");
    }

  }

  function onPickMany(list) {
    if (!dxFlags.choThuocVe) {
      toast.error("Hãy chọn hướng xử lý 'Cho thuốc về' trước khi kê thuốc.");
      setPickerOpen(false);
      return;
    }
    setRx((s) => [
      ...s,
      ...list.filter((n) => !s.some((x) => x.code === n.code)),
    ]);
    setPickerOpen(false);
  }
  function removeRxAt(index) {
    setRx((s) => s.filter((_, i) => i !== index));
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ----- PHÂN BIỆT LS / CLS -----
  // Sử dụng field names từ API response (PascalCase hoặc camelCase alias)
  const queueType =
    patient?.LoaiHangDoi || patient?.loaiHangDoi || patient?.queueType || patient?.visitType;
  const isCLS = queueType === "can_lam_sang" || queueType === "cls";

  // Loại lượt (Khám mới / Tái khám) chỉ hiển thị trong LS
  const visitKind = patient?.LoaiLuot || patient?.loaiLuot || patient?.loai_luot || patient?.visitKind; // kham_moi | tai_kham
  let visitKindLabel = "";
  if (visitKind === "tai_kham") visitKindLabel = "Tái khám";
  else if (visitKind === "kham_moi") visitKindLabel = "Khám mới";

  // LS: có phải lượt "trả từ dịch vụ" hay không
  const src = patient?.Nguon || patient?.nguon || patient?.source; // appointment | walkin | service_return
  const isReturnFromService =
    !isCLS &&
    (src === "service_return" || patient?.nguon_label === "Trả từ dịch vụ");

  // Dữ liệu kết quả dịch vụ kèm theo (tùy backend, cố gắng map linh hoạt)
  const shouldShowOrderSection = !isCLS && !isReturnFromService;
  const shouldShowReturnedResultsSection = !isCLS && isReturnFromService;
  const rawServiceResults =
    patient?.serviceResults || // dạng mong muốn
    patient?.clsResults ||
    patient?.services ||
    [];

  // Chuẩn hóa: mỗi dòng gồm tên DV, ghi chú, kết quả, file đính kèm
  const serviceResults = Array.isArray(rawServiceResults)
    ? rawServiceResults.map((x, i) => ({
        id: x.id || x.ma_chi_tiet_dv || `svc-${i}`,
        name:
          x.serviceName ||
          x.ten_dich_vu ||
          x.name ||
          `Dịch vụ ${i + 1}`,
        note: x.note || x.ghi_chu || "",
        result: x.result || x.ket_qua || "",
        files: parseAttachmentValue(
          x.files ||
            x.attachments ||
            x.tep_dinh_kem ||
            x.TepDinhKem ||
            []
        ),
      }))
    : [];

  const serviceName =
    patient?.serviceName || patient?.ten_dich_vu || patient?.dich_vu || "";

  const clsStaffName =
    patient?.TenKyThuatVienThucHien ||
    patient?.tenKyThuatVienThucHien ||
    patient?.TenNhanSuThucHien ||
    patient?.tenNhanSuThucHien ||
    patient?.doctor ||
    "";

  const clsCreatedBy =
    patient?.TenNguoiLap ||
    patient?.tenNguoiLap ||
    "";

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("vi-VN");
  };

  const clsStartTime = formatDateTime(
    patient?.ThoiGianBatDauLuot || patient?.thoiGianBatDauLuot
  );
  const clsEndTime = formatDateTime(
    patient?.ThoiGianKetThucLuot || patient?.thoiGianKetThucLuot
  );

  // Hoàn tất CLS
  async function handleFinishCLS() {
    const maChiTietDv =
      patient?.maChiTietDv ||
      patient?.MaChiTietDv ||
      patient?.PhieuKhamClsItem?.MaChiTietDv ||
      null;
    if (!maChiTietDv) {
      toast.error("Thiếu mã chi tiết dịch vụ CLS.");
      return;
    }
    const staffCode =
      patient?.maNhanSuThucHien ||
      patient?.MaNhanSuThucHien ||
      patient?.maYTaHoTro ||
      patient?.MaYTaHoTro ||
      null;

    try {
      const attachmentPayload = await buildAttachmentPayload(clsFiles);
      await createClsResultMut.mutateAsync({
        MaChiTietDv: maChiTietDv,
        TrangThaiChot: "da_co_ket_qua",
        NoiDungKetQua: clsResult || dx.note || "",
        MaNhanSuThucHien: staffCode,
        TepDinhKem: JSON.stringify(attachmentPayload),
      });
      toast.success("Đã gửi kết quả CLS.");
      onBack?.();
    } catch (err) {
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể gửi kết quả CLS.";
      toast.error(msg);
    }
  }

  return (
    <>
      <section className="h-full min-h-0 flex flex-col ">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-teal-50 via-white to-teal-50/60 backdrop-blur shadow-sm rounded-2xl">
          <div className="flex items-start justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button onClick={onBack} aria-label="Quay lại">
                  ←
                </Button>
              </motion.div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                {patient.name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {patient.pid || patient.id}
              </span>
              {patient.age != null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {patient.age} tuổi
                </span>
              )}
              {patient.gender && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {patient.gender}
                </span>
              )}
              {(patient.dept || patient.department) && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {patient.dept || patient.department}
                </span>
              )}

              {/* Loại lượt: LS / CLS */}
              {isCLS ? (
                <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5">
                  CLS
                </span>
              ) : (
                <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5">
                  Khám LS
                </span>
              )}

              {/* LS: Khám mới / Tái khám (nếu có) */}
              {!isCLS && visitKindLabel && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {visitKindLabel}
                </span>
              )}

              {/* Nguồn hiển thị chỉ cho LS (Hẹn khám / Walk-in / Trả từ dịch vụ) */}
              {!isCLS && src && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {src === "appointment"
                    ? "Hẹn khám"
                    : src === "walkin"
                    ? "Walk-in"
                    : src === "service_return"
                    ? "Trả từ dịch vụ"
                    : src}
                </span>
              )}

              {(patient.CapCuu || patient.capCuu || patient.cap_cuu) && (
                <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5">
                  Khẩn
                </span>
              )}

              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {todayStr} • {timeStr}
              </span>
            </div>
          </div>
        </header>

        {/* Body */}
        <motion.div
          {...fadeIn}
          className="flex-1 bg-cyan-50/10 min-h-0 overflow-y-auto scrollbar-none px-1 pt-3 pb-0"
          
        >
          <div className="grid md:grid-cols-2 gap-3">
        <motion.div whileHover={{ y: -1 }} className="rounded-2xl p-3 bg-white shadow-sm border border-slate-200">
          <b className="block mb-1 text-slate-900">Thông tin chi tiết</b>
          <div className="text-sm max-h-40 overflow-y-auto scrollbar-none break-words whitespace-pre-wrap">
            {clinicalExamData?.ThongTinChiTiet || clinicalExamData?.thongTinChiTiet || patient?.note || "—"}
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="rounded-2xl p-3 bg-white shadow-sm border border-slate-200">
          <b className="block mb-1 text-slate-900">Ghi chú vào khám</b>
          <div className="text-sm max-h-40 overflow-y-auto scrollbar-none break-words whitespace-pre-wrap">
            {clinicalExamData?.TrieuChung || clinicalExamData?.trieuChung || patient?.note || "—"}
          </div>
        </motion.div>
      </div>
          {/* ================== MODE KHÁM LÂM SÀNG (LS) ================== */}
          {!isCLS && (
            <>
              {/* Phiếu khám (Chỉ định dịch vụ) */}
              {shouldShowOrderSection && (
                <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3  bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Phiếu khám (Chỉ định dịch vụ)
                </h4>
                <div className="overflow-x-auto scrollbar-none">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                      <tr className="bg-gradient-to-b from-teal-50 to-white">
                        <th className="px-2 py-2 w-12">STT</th>
                        <th className="px-2 py-2 w-72">Dịch vụ</th>
                        <th className="px-2 py-2 w-44">Trạng thái</th>
                        <th className="px-2 py-2">Ghi chú</th>
                        <th className="px-2 py-2 w-16">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, idx) => {
                        const svc = svcMap.get(r.svcId);
                        return (
                          <tr
                            key={r.id}
                            className="align-top transition-colors hover:bg-teal-50/50"
                          >
                            <td className="px-2 py-2 text-slate-700">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-2">
                              <PopoverSelect
                                name={`svcId-${r.id}`}
                                value={r.svcId}
                                onChange={(value) =>
                                  patchRow(r.id, { svcId: value })
                                }
                                options={[
                                  { value: "", label: "— Chọn dịch vụ —" },
                                  ...examServices.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                  })),
                                ]}
                                placeholder="Chọn dịch vụ"
                                buttonClassName="rounded-lg ring-teal-200/80 focus:ring-teal-500 hover:ring-teal-300"
                              />
                              {svc?.name && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {svc.name}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-amber-200 bg-amber-50 text-amber-700">
                                {r.status || STATUS_DEFAULT}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <textarea
                                value={r.note}
                                onChange={(e) =>
                                  patchRow(r.id, {
                                    note: e.target.value.slice(
                                      0,
                                      MAX_NOTE_LEN
                                    ),
                                  })
                                }
                                title={r.note}
                                rows={2}
                                maxLength={MAX_NOTE_LEN}
                                placeholder="Ghi chú (vd: chụp tay phải, nhịn ăn 8h...)"
                                className="w-full px-2 py-1 rounded-md ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none max-h-16 overflow-y-auto scrollbar-none bg-white"
                              />
                              <div className="text-[11px] text-slate-400 mt-0.5 text-right">
                                {r.note?.length || 0}/{MAX_NOTE_LEN}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <Button
                                type="button"
                                className="!px-2"
                                onClick={() => removeRow(r.id)}
                                aria-label="Xóa dòng"
                              >
                                ✕
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <Button type="button" onClick={addRow}>
                    + Thêm dòng
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
                      variant="radigan"
                      disabled={!hasOrder || orderMut.isPending}
                      onClick={handleExportOrder}
                      title={
                        !hasOrder
                          ? "Chọn ít nhất 1 dịch vụ"
                          : "Xuất phiếu khám (chuyển sang tiếp nhận dịch vụ)"
                      }
                    >
                      {orderMut.isPending
                        ? "Đang lưu..."
                        : "Xuất phiếu khám"}
                    </Button>
                  </div>
                </div>
                </motion.section>
              )}

              {/* Kết quả dịch vụ trả về (nếu lượt này là Trả từ dịch vụ) */}
              {shouldShowReturnedResultsSection && (
                <motion.section
                  {...fadeIn}
                  className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
                >
                  <h4 className="font-extrabold mb-2 text-slate-900">
                    Kết quả dịch vụ trả về
                  </h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Tổng hợp kết quả các cận lâm sàng đã thực hiện trước khi
                    quay lại khám lâm sàng.
                  </p>
                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-12" />
                        <col className="w-44" />
                        <col className="w-56" />
                        <col className="w-[30rem]" />
                        <col className="w-44" />
                      </colgroup>
                      <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                        <tr className="bg-gradient-to-b from-sky-50 to-white">
                          <th className="px-2 py-2 w-10">STT</th>
                          <th className="px-2 py-2 w-64">Dịch vụ</th>
                          <th className="px-2 py-2">Ghi chú</th>
                          <th className="px-2 py-2 w-80">Kết quả</th>
                          <th className="px-2 py-2 w-40">Tệp đính kèm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {serviceResults.length > 0 ? serviceResults.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className="align-top hover:bg-sky-50/40 transition-colors"
                          >
                            <td className="px-2 py-2 text-slate-700">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-2">
                              <div className="font-semibold text-slate-900 break-all max-h-24 overflow-y-auto scrollbar-none">
                                {row.name}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-sm text-slate-700 whitespace-pre-wrap break-all max-h-24 overflow-y-auto scrollbar-none">
                                {row.note || (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-sm text-slate-700 whitespace-pre-wrap break-all max-h-28 overflow-y-auto scrollbar-none">
                                {row.result || (
                                  <span className="text-slate-400">
                                    Chưa nhập
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              {Array.isArray(row.files) &&
                              row.files.length > 0 ? (
                                <ul className="text-xs text-slate-600 space-y-0.5 max-h-20 overflow-y-auto scrollbar-none">
                                  {row.files.map((f, i) => (
                                    <li
                                      key={f.id || f.name || i}
                                      className="break-all"
                                    >
                                      {f.url ? (
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                          <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sky-700 underline underline-offset-2 hover:text-sky-800"
                                          >
                                            {f.name ||
                                              f.fileName ||
                                              f.filename ||
                                              `Tệp ${i + 1}`}
                                          </a>
                                          <a
                                            href={f.url}
                                            download={f.name || `tep-${i + 1}`}
                                            className="text-[11px] font-semibold text-slate-500 hover:text-sky-700"
                                          >
                                            Tải
                                          </a>
                                        </div>
                                      ) : (
                                        <span>
                                          {f.name ||
                                            f.fileName ||
                                            f.filename ||
                                            `Tệp ${i + 1}`}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Không có tệp
                                </span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-6 text-center text-sm text-slate-500"
                            >
                              Chưa có kết quả dịch vụ trả về cho lượt khám này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              )}

              {/* Chẩn đoán & Điều trị */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Chẩn đoán & Điều trị
                </h4>
                {/* ✅ RBAC: chỉ BS + YtaLS nhập chẩn đoán */}
                {!allowExamData && (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-2">📖 Bạn không có quyền nhập chẩn đoán — chỉ xem.</p>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    Chẩn đoán sơ bộ
                    <input
                      value={dx.pre}
                      onChange={(e) =>
                        setDx((s) => ({ ...s, pre: e.target.value }))
                      }
                      disabled={!allowExamData}
                      className="mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <label className="text-sm">
                    Chẩn đoán xác định
                    <input
                      value={dx.final}
                      onChange={(e) =>
                        setDx((s) => ({ ...s, final: e.target.value }))
                      }
                      disabled={!allowExamData}
                      className="mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    Phác đồ điều trị
                    <textarea
                      rows={3}
                      value={dx.plan}
                      onChange={(e) =>
                        setDx((s) => ({ ...s, plan: e.target.value }))
                      }
                      disabled={!allowExamData}
                      className="scrollbar-none mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    Tư vấn & Dặn dò
                    <textarea
                      rows={3}
                      value={dx.advice}
                      onChange={(e) =>
                        setDx((s) => ({ ...s, advice: e.target.value }))
                      }
                      disabled={!allowExamData}
                      className="scrollbar-none mt-1 w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  {/* Ô tích sau tư vấn */}
                  <div className="md:col-span-2 mt-1">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 focus:ring-teal-500"
                          checked={!!dxFlags.choVe}
                          onChange={() => toggleDxFlag("choVe")}
                          disabled={!allowExamData}
                        />
                        <span>Cho về</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 focus:ring-teal-500"
                          checked={!!dxFlags.choThuocVe}
                          onChange={() => toggleDxFlag("choThuocVe")}
                          disabled={!allowExamData}
                        />
                        <span>Cho thuốc về</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 focus:ring-teal-500"
                          checked={!!dxFlags.taiKham}
                          onChange={() => toggleDxFlag("taiKham")}
                          disabled={!allowExamData}
                        />
                        <span>Tái khám</span>
                      </label>
                    </div>
                    {dxFlags.taiKham && (
                      <div className="mt-3 grid gap-3 md:max-w-md">
                        <label className="text-sm">
                          Ngày tái khám
                          <input
                            type="date"
                            min={minFollowupDate}
                            value={dx.followupDate || ""}
                            onChange={(e) =>
                              setDx((s) => ({
                                ...s,
                                followupDate: e.target.value,
                              }))
                            }
                            disabled={!allowExamData}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>
                    )}
                    {dxFlagError && (
                      <p className="mt-1 text-xs text-red-500">
                        {dxFlagError}
                      </p>
                    )}
                  </div>
                </div>
              </motion.section>

              {/* Kê đơn */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900">
                    Kê đơn thuốc
                  </h4>
                  {/* ✅ RBAC: chỉ BS mới kê đơn */}
                  {allowPrescribe && (
                    <Button
                      type="button"
                      className="btn-primary"
                      onClick={() => setPickerOpen(true)}
                      disabled={!canPrescribeTakeHome}
                      aria-disabled={!canPrescribeTakeHome}
                      title={
                        canPrescribeTakeHome
                          ? "Kê thuốc"
                          : "Chọn 'Cho thuốc về' để kê đơn"
                      }
                    >
                      Kê thuốc
                    </Button>
                  )}
                </div>

                <div className="mt-2 rounded-xl bg-white shadow-inner/10 max-h-56 overflow-y-auto scrollbar-none border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-700 sticky top-0 bg-white/95 backdrop-blur">
                      <tr className="bg-gradient-to-b from-teal-50 to-white">
                        <th className="px-3 py-2 w-12">STT</th>
                        <th className="px-3 py-2">Thuốc</th>
                        <th className="px-3 py-2">Liều dùng</th>
                        <th className="px-3 py-2 w-24">Số lượng</th>
                        <th className="px-3 py-2 w-12">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.map((r, i) => (
                        <tr
                          key={r.code || `${r.name}-${i}`}
                          className="transition-colors hover:bg-teal-50/50"
                        >
                          <td className="px-3 py-2 text-slate-700">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900">
                              {r.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.code} • {r.unit}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={r.dose || ""}
                              onChange={(e) =>
                                setRx((s) =>
                                  s.map((x, j) =>
                                    j === i
                                      ? { ...x, dose: e.target.value }
                                      : x
                                  )
                                )
                              }
                              placeholder="VD: 1v x 2 lần/ngày"
                              className="w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none placeholder:text-slate-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={r.qty || ""}
                              onChange={(e) =>
                                setRx((s) =>
                                  s.map((x, j) =>
                                    j === i
                                      ? { ...x, qty: e.target.value }
                                      : x
                                  )
                                )
                              }
                              placeholder="SL"
                              className="w-full bg-transparent px-0 py-1 border-b border-slate-200 focus:border-teal-400 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              className="!px-2"
                              onClick={() => removeRxAt(i)}
                              aria-label="Xóa thuốc"
                            >
                              ✕
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!rx.length && (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-3 py-6 text-slate-500"
                          >
                            {canPrescribeTakeHome ? (
                              <>
                                Chưa có thuốc. Nhấn <b>Kê thuốc</b> để thêm.
                              </>
                            ) : (
                              <>Chọn <b>Cho thuốc về</b> trong hướng xử lý để kê đơn.</>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 pt-3 flex justify-end">
                  {/* ✅ RBAC: chỉ BS + YtaLS xuất chẩn đoán */}
                  {allowExamData ? (
                    <Button
                      className="transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
                      variant="radigan"
                      disabled={!hasDx || dxMut.isPending}
                      aria-disabled={!hasDx || dxMut.isPending}
                      onClick={handleExportDiagnosisLS}
                      title={
                        !hasDx
                          ? "Cần có chẩn đoán"
                          : "Xuất phiếu chẩn đoán & kết thúc khám"
                      }
                    >
                      {dxMut.isPending
                        ? "Đang lưu..."
                        : "Xuất phiếu chẩn đoán"}
                    </Button>
                  ) : (
                    <span className="text-sm text-slate-400">Không có quyền xuất chẩn đoán</span>
                  )}
                </div>
              </motion.section>
            </>
          )}

          {/* ================== MODE CẬN LÂM SÀNG (CLS) ================== */}
          {isCLS && (
            <>
              {/* Thông tin lượt CLS */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Thực hiện cận lâm sàng
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
                  <div className="space-y-1">
                    <p>
                      <b>Bệnh nhân:</b> {patient.name} (
                      {patient.pid || patient.id})
                    </p>
                    {patient.dept && (
                      <p>
                        <b>Khoa:</b> {patient.dept}
                      </p>
                    )}
                    {patient.room && (
                      <p>
                        <b>Phòng thực hiện:</b> {patient.room}
                      </p>
                    )}
                    {clsStaffName && (
                      <p>
                        <b>KTV / Nhân sự thực hiện:</b> {clsStaffName}
                      </p>
                    )}
                    {clsCreatedBy && (
                      <p>
                        <b>Người lập phiếu:</b> {clsCreatedBy}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p>
                      <b>Loại lượt:</b>{" "}
                      {queueType === "can_lam_sang"
                        ? "Cận lâm sàng"
                        : "Khác"}
                    </p>
                    {serviceName && (
                      <p>
                        <b>Loại dịch vụ:</b> {serviceName}
                      </p>
                    )}
                    {clsStartTime && (
                      <p>
                        <b>Bắt đầu:</b> {clsStartTime}
                      </p>
                    )}
                    {clsEndTime && (
                      <p>
                        <b>Kết thúc:</b> {clsEndTime}
                      </p>
                    )}
                    {(patient.CapCuu || patient.capCuu || patient.cap_cuu) && (
                      <p className="text-rose-600 font-semibold">
                        • Ca cấp cứu
                      </p>
                    )}
                  </div>
                </div>
              </motion.section>

              {/* Ghi chú thực hiện */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Ghi chú thực hiện
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  Ghi lại các lưu ý trong quá trình thực hiện, tình trạng bệnh
                  nhân, hoặc thông tin cần nhắn lại cho bác sĩ chỉ định.
                </p>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Nhập ghi chú (tùy chọn)…"
                  value={dx.note || ""}
                  onChange={(e) =>
                    setDx((s) => ({ ...s, note: e.target.value }))
                  }
                />
              </motion.section>

              {/* Kết quả thực hiện */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Kết quả thực hiện
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Ghi tóm tắt kết quả chính hoặc nhận xét kỹ thuật cho lần thực
                  hiện này.
                </p>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Nhập kết quả chính (tùy chọn)…"
                  value={clsResult}
                  onChange={(e) => setClsResult(e.target.value)}
                />
              </motion.section>

              {/* Tệp đính kèm */}
              <motion.section
                {...fadeIn}
                className="rounded-2xl p-4 mt-3 bg-white shadow-sm border border-slate-200"
              >
                <h4 className="font-extrabold mb-2 text-slate-900">
                  Tệp đính kèm
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Đính kèm hình ảnh, PDF hoặc file kết quả máy (nếu có).
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setClsFiles(Array.from(e.target.files || []))
                  }
                  className="block w-full text-sm text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {clsFiles.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600">
                    Đã chọn {clsFiles.length} tệp.
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={onBack}>
                    Đóng
                  </Button>
                  {/* ✅ RBAC: chỉ YtaCLS + KTV hoàn tất CLS */}
                  {allowClsResult ? (
                    <Button
                      className="transition-all duration-300"
                      variant="radigan"
                      onClick={handleFinishCLS}
                    >
                      Hoàn tất CLS
                    </Button>
                  ) : (
                    <span className="text-sm text-slate-400">Không có quyền hoàn tất CLS</span>
                  )}
                </div>
              </motion.section>
            </>
          )}
        </motion.div>
      </section>

      {/* Payment Wizard — mở sau khi lưu chẩn đoán thành công */}
      <PaymentWizard
        open={allowPayment && paymentOpen}
        patient={patient}
        items={pendingDxPayload || []}
        examId={maPhieuKham}
        onClose={() => {
          setPaymentOpen(false);
          setPendingDxPayload(null);
        }}
        onComplete={(result) => {
          setPaymentOpen(false);
          setPendingDxPayload(null);
          toast.success(
            result?.status === "deferred"
              ? "Đã lưu hóa đơn ở trạng thái chưa thu."
              : "Lập phiếu và thanh toán thành công."
          );
        }}
      />

      {/* Rx modal */}
      <RxPickerModal
        open={pickerOpen && dxFlags.choThuocVe}
        onClose={() => setPickerOpen(false)}
        onPickMany={onPickMany}
      />
    </>
  );
}

