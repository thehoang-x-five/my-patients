import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PopoverSelect from "../ui/PopoverSelect.jsx";

const EMPTY_DEPARTMENT = {
  maKhoa: "",
  tenKhoa: "",
  trangThai: "hoat_dong",
  moTa: "",
  dienThoai: "",
  email: "",
  diaDiem: "",
  ghiChu: "",
};

const EMPTY_ROOM = {
  maPhong: "",
  tenPhong: "",
  maKhoa: "",
  loaiPhong: "phong_kham_ls",
  sucChua: "",
  viTri: "",
  email: "",
  dienThoai: "",
  gioMoCua: "07:30",
  gioDongCua: "16:30",
  thietBi: "",
  trangThai: "hoat_dong",
  maBacSiPhuTrach: "",
};

const EMPTY_SERVICE = {
  maDichVu: "",
  tenDichVu: "",
  loaiDichVu: "kham_lam_sang",
  maPhong: "",
  donGia: "",
  thoiGianDuKienPhut: "15",
};

const SERVICE_TYPE_OPTIONS = [
  { value: "kham_lam_sang", label: "Khám lâm sàng" },
  { value: "can_lam_sang", label: "Cận lâm sàng" },
  { value: "khac", label: "Khác" },
];

function toTimeInput(value) {
  if (!value) return "";
  const raw = String(value);
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function toTimeSpan(value) {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function departmentFormFromItem(item) {
  if (!item) return EMPTY_DEPARTMENT;
  return {
    maKhoa: item.MaKhoa || "",
    tenKhoa: item.TenKhoa || "",
    trangThai: item.TrangThai || "hoat_dong",
    moTa: item.MoTa || "",
    dienThoai: item.DienThoai || "",
    email: item.Email || "",
    diaDiem: item.DiaDiem || "",
    ghiChu: item.GhiChu || "",
  };
}

function roomFormFromItem(item) {
  if (!item) return EMPTY_ROOM;
  return {
    maPhong: item.MaPhong || "",
    tenPhong: item.TenPhong || "",
    maKhoa: item.MaKhoa || "",
    loaiPhong: item.LoaiPhong || "phong_kham_ls",
    sucChua: item.SucChua ?? "",
    viTri: item.ViTri || "",
    email: item.Email || "",
    dienThoai: item.DienThoai || "",
    gioMoCua: toTimeInput(item.GioMoCua),
    gioDongCua: toTimeInput(item.GioDongCua),
    thietBi: Array.isArray(item.ThietBi) ? item.ThietBi.join(", ") : "",
    trangThai: item.TrangThai || "hoat_dong",
    maBacSiPhuTrach: item.MaBacSiPhuTrach || "",
  };
}

function serviceFormFromItem(item) {
  if (!item) return EMPTY_SERVICE;
  return {
    maDichVu: item.MaDichVu || "",
    tenDichVu: item.TenDichVu || "",
    loaiDichVu: item.LoaiDichVu || "kham_lam_sang",
    maPhong: item.MaPhong || "",
    donGia: item.DonGia ?? "",
    thoiGianDuKienPhut: item.ThoiGianDuKienPhut ?? "15",
  };
}

function serviceTypeLabel(value) {
  return (
    SERVICE_TYPE_OPTIONS.find((item) => item.value === value)?.label || value
  );
}

export default function DepartmentAdminModal({
  open,
  onClose,
  departments = [],
  rooms = [],
  services = [],
  onCreateDepartment,
  onUpdateDepartment,
  onCreateRoom,
  onUpdateRoom,
  onCreateService,
  onUpdateService,
  departmentPending = false,
  roomPending = false,
  servicePending = false,
}) {
  const [tab, setTab] = useState("departments");
  const [departmentEditing, setDepartmentEditing] = useState(null);
  const [roomEditing, setRoomEditing] = useState(null);
  const [serviceEditing, setServiceEditing] = useState(null);
  const [departmentForm, setDepartmentForm] = useState(EMPTY_DEPARTMENT);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);

  const sortedDepartments = useMemo(
    () =>
      [...(Array.isArray(departments) ? departments : [])].sort((a, b) =>
        String(a.TenKhoa || "").localeCompare(String(b.TenKhoa || ""), "vi")
      ),
    [departments]
  );

  const sortedRooms = useMemo(
    () =>
      [...(Array.isArray(rooms) ? rooms : [])]
        .filter((room) => room.LoaiPhong !== "thu_ngan")
        .sort((a, b) =>
          String(a.TenPhong || "").localeCompare(String(b.TenPhong || ""), "vi")
        ),
    [rooms]
  );

  const sortedServices = useMemo(
    () =>
      [...(Array.isArray(services) ? services : [])].sort((a, b) =>
        String(a.TenDichVu || "").localeCompare(String(b.TenDichVu || ""), "vi")
      ),
    [services]
  );

  const roomLabelMap = useMemo(
    () =>
      new Map(
        sortedRooms.map((room) => [
          room.MaPhong,
          `${room.TenPhong}${room.TenKhoa ? ` • ${room.TenKhoa}` : ""}`,
        ])
      ),
    [sortedRooms]
  );

  if (!open) return null;

  const resetDepartmentForm = () => {
    setDepartmentEditing(null);
    setDepartmentForm(EMPTY_DEPARTMENT);
  };

  const resetRoomForm = () => {
    setRoomEditing(null);
    setRoomForm(EMPTY_ROOM);
  };

  const resetServiceForm = () => {
    setServiceEditing(null);
    setServiceForm(EMPTY_SERVICE);
  };

  const handleDepartmentSubmit = (event) => {
    event.preventDefault();
    const payload = {
      MaKhoa: departmentForm.maKhoa.trim(),
      TenKhoa: departmentForm.tenKhoa.trim(),
      TrangThai: departmentForm.trangThai,
      MoTa: departmentForm.moTa.trim() || null,
      DienThoai: departmentForm.dienThoai.trim() || null,
      Email: departmentForm.email.trim() || null,
      DiaDiem: departmentForm.diaDiem.trim() || null,
      GhiChu: departmentForm.ghiChu.trim() || null,
    };

    if (departmentEditing?.MaKhoa) {
      onUpdateDepartment?.(departmentEditing.MaKhoa, payload);
      return;
    }

    onCreateDepartment?.(payload);
  };

  const handleRoomSubmit = (event) => {
    event.preventDefault();
    const payload = {
      MaPhong: roomForm.maPhong.trim(),
      TenPhong: roomForm.tenPhong.trim(),
      MaKhoa: roomForm.maKhoa,
      LoaiPhong: roomForm.loaiPhong,
      SucChua: roomForm.sucChua === "" ? null : Number(roomForm.sucChua) || 0,
      ViTri: roomForm.viTri.trim() || null,
      Email: roomForm.email.trim() || null,
      DienThoai: roomForm.dienThoai.trim() || null,
      GioMoCua: toTimeSpan(roomForm.gioMoCua),
      GioDongCua: toTimeSpan(roomForm.gioDongCua),
      ThietBi: roomForm.thietBi
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      TrangThai: roomForm.trangThai,
      MaBacSiPhuTrach: roomForm.maBacSiPhuTrach.trim() || null,
    };

    if (roomEditing?.MaPhong) {
      onUpdateRoom?.(roomEditing.MaPhong, payload);
      return;
    }

    onCreateRoom?.(payload);
  };

  const handleServiceSubmit = (event) => {
    event.preventDefault();
    const payload = {
      MaDichVu: serviceForm.maDichVu.trim(),
      TenDichVu: serviceForm.tenDichVu.trim(),
      LoaiDichVu: serviceForm.loaiDichVu,
      MaPhong: serviceForm.maPhong,
      DonGia: Number(serviceForm.donGia || 0),
      ThoiGianDuKienPhut: Number(serviceForm.thoiGianDuKienPhut || 0),
    };

    if (serviceEditing?.MaDichVu) {
      onUpdateService?.(serviceEditing.MaDichVu, payload);
      return;
    }

    onCreateService?.(payload);
  };

  const activeDepartmentId = departmentEditing?.MaKhoa || null;
  const activeRoomId = roomEditing?.MaPhong || null;
  const activeServiceId = serviceEditing?.MaDichVu || null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="mx-4 grid max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 lg:grid-cols-[1.15fr_1fr]"
        >
          <section className="flex max-h-[90vh] flex-col border-r border-slate-100 bg-slate-50/70">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Quản trị khoa, phòng và dịch vụ
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Admin quản lý danh mục vận hành cốt lõi trong cùng một module.
                  </p>
                </div>
                <button type="button" onClick={onClose} className="btn text-sm">
                  Đóng
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-3">
              <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-indigo-200/80">
                {[
                  { key: "departments", label: "Khoa" },
                  { key: "rooms", label: "Phòng" },
                  { key: "services", label: "Dịch vụ" },
                ].map((item) => {
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:text-indigo-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4">
              {tab === "departments" ? (
                <div className="space-y-3">
                  {sortedDepartments.map((department) => (
                    <article
                      key={department.MaKhoa}
                      className={`rounded-2xl bg-white p-4 ring-1 transition ${
                        activeDepartmentId === department.MaKhoa
                          ? "ring-indigo-300 shadow-sm"
                          : "ring-slate-200 hover:ring-indigo-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {department.TenKhoa}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {department.MaKhoa}
                            {department.DiaDiem ? ` • ${department.DiaDiem}` : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                            department.TrangThai === "hoat_dong"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {department.TrangThai === "hoat_dong"
                            ? "Hoạt động"
                            : "Tạm dừng"}
                        </span>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDepartmentEditing(department);
                            setDepartmentForm(departmentFormFromItem(department));
                          }}
                          className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[13px] font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                        >
                          Sửa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : tab === "rooms" ? (
                <div className="space-y-3">
                  {sortedRooms.map((room) => (
                    <article
                      key={room.MaPhong}
                      className={`rounded-2xl bg-white p-4 ring-1 transition ${
                        activeRoomId === room.MaPhong
                          ? "ring-indigo-300 shadow-sm"
                          : "ring-slate-200 hover:ring-indigo-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {room.TenPhong}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {room.MaPhong}
                            {room.TenKhoa ? ` • ${room.TenKhoa}` : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                            room.TrangThai === "hoat_dong"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {room.TrangThai === "hoat_dong" ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {room.LoaiPhong}
                        {room.ViTri ? ` • ${room.ViTri}` : ""}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRoomEditing(room);
                            setRoomForm(roomFormFromItem(room));
                          }}
                          className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[13px] font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                        >
                          Sửa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedServices.map((service) => (
                    <article
                      key={service.MaDichVu}
                      className={`rounded-2xl bg-white p-4 ring-1 transition ${
                        activeServiceId === service.MaDichVu
                          ? "ring-indigo-300 shadow-sm"
                          : "ring-slate-200 hover:ring-indigo-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {service.TenDichVu}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {service.MaDichVu}
                            {service.MaPhong
                              ? ` • ${roomLabelMap.get(service.MaPhong) || service.MaPhong}`
                              : ""}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                          {serviceTypeLabel(service.LoaiDichVu)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatMoney(service.DonGia)} đ • {service.ThoiGianDuKienPhut || 0} phút
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setServiceEditing(service);
                            setServiceForm(serviceFormFromItem(service));
                          }}
                          className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[13px] font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                        >
                          Sửa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="flex max-h-[90vh] flex-col">
            {tab === "departments" ? (
              <form onSubmit={handleDepartmentSubmit} className="flex h-full flex-col">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {departmentEditing ? "Cập nhật khoa" : "Tạo khoa mới"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Chỉnh trực tiếp danh mục chuyên môn dùng toàn hệ thống.
                      </p>
                    </div>
                    {departmentEditing ? (
                      <button
                        type="button"
                        onClick={resetDepartmentForm}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      >
                        Tạo mới
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto scrollbar-none px-6 py-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Mã khoa</span>
                      <input
                        required
                        disabled={!!departmentEditing}
                        className="input"
                        value={departmentForm.maKhoa}
                        onChange={(e) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            maKhoa: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Tên khoa</span>
                      <input
                        required
                        className="input"
                        value={departmentForm.tenKhoa}
                        onChange={(e) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            tenKhoa: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Trạng thái</span>
                      <PopoverSelect
                        name="departmentStatus"
                        value={departmentForm.trangThai}
                        onChange={(value) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            trangThai: value,
                          }))
                        }
                        options={[
                          { value: "hoat_dong", label: "Hoạt động" },
                          { value: "tam_dung", label: "Tạm dừng" },
                        ]}
                        placeholder="Chọn trạng thái"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Địa điểm</span>
                      <input
                        className="input"
                        value={departmentForm.diaDiem}
                        onChange={(e) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            diaDiem: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Điện thoại</span>
                      <input
                        className="input"
                        value={departmentForm.dienThoai}
                        onChange={(e) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            dienThoai: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Email</span>
                      <input
                        className="input"
                        value={departmentForm.email}
                        onChange={(e) =>
                          setDepartmentForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-600">Mô tả</span>
                    <textarea
                      rows={4}
                      className="input min-h-[112px] resize-y"
                      value={departmentForm.moTa}
                      onChange={(e) =>
                        setDepartmentForm((prev) => ({
                          ...prev,
                          moTa: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-600">Ghi chú</span>
                    <textarea
                      rows={3}
                      className="input min-h-[96px] resize-y"
                      value={departmentForm.ghiChu}
                      onChange={(e) =>
                        setDepartmentForm((prev) => ({
                          ...prev,
                          ghiChu: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
                  <button
                    type="submit"
                    disabled={departmentPending}
                    className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
                  >
                    {departmentPending
                      ? "Đang lưu..."
                      : departmentEditing
                      ? "Cập nhật khoa"
                      : "Tạo khoa"}
                  </button>
                </div>
              </form>
            ) : tab === "rooms" ? (
              <form onSubmit={handleRoomSubmit} className="flex h-full flex-col">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {roomEditing ? "Cập nhật phòng" : "Tạo phòng mới"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Quản lý phòng khám, phòng CLS và các thông số vận hành cơ bản.
                      </p>
                    </div>
                    {roomEditing ? (
                      <button
                        type="button"
                        onClick={resetRoomForm}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      >
                        Tạo mới
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto scrollbar-none px-6 py-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Mã phòng</span>
                      <input
                        required
                        disabled={!!roomEditing}
                        className="input"
                        value={roomForm.maPhong}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            maPhong: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Tên phòng</span>
                      <input
                        required
                        className="input"
                        value={roomForm.tenPhong}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            tenPhong: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Khoa</span>
                      <PopoverSelect
                        required
                        name="roomDepartment"
                        value={roomForm.maKhoa}
                        onChange={(value) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            maKhoa: value,
                          }))
                        }
                        options={[
                          { value: "", label: "-- Chọn khoa --" },
                          ...sortedDepartments.map((department) => ({
                            value: department.MaKhoa,
                            label: department.TenKhoa,
                          })),
                        ]}
                        placeholder="Chọn khoa"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Loại phòng</span>
                      <PopoverSelect
                        name="roomType"
                        value={roomForm.loaiPhong}
                        onChange={(value) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            loaiPhong: value,
                          }))
                        }
                        options={[
                          { value: "phong_kham_ls", label: "Phòng khám LS" },
                          { value: "phong_cls", label: "Phòng CLS" },
                          { value: "thu_ngan", label: "Thu ngân" },
                        ]}
                        placeholder="Chọn loại phòng"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Trạng thái</span>
                      <PopoverSelect
                        name="roomStatus"
                        value={roomForm.trangThai}
                        onChange={(value) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            trangThai: value,
                          }))
                        }
                        options={[
                          { value: "hoat_dong", label: "Hoạt động" },
                          { value: "tam_dung", label: "Tạm dừng" },
                        ]}
                        placeholder="Chọn trạng thái"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Sức chứa</span>
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={roomForm.sucChua}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            sucChua: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Vị trí</span>
                      <input
                        className="input"
                        value={roomForm.viTri}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            viTri: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Mã BS phụ trách</span>
                      <input
                        className="input"
                        value={roomForm.maBacSiPhuTrach}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            maBacSiPhuTrach: e.target.value,
                          }))
                        }
                        placeholder="Để trống nếu chưa gán"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Email</span>
                      <input
                        className="input"
                        value={roomForm.email}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Điện thoại</span>
                      <input
                        className="input"
                        value={roomForm.dienThoai}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            dienThoai: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Giờ mở cửa</span>
                      <input
                        type="time"
                        className="input"
                        value={roomForm.gioMoCua}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            gioMoCua: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Giờ đóng cửa</span>
                      <input
                        type="time"
                        className="input"
                        value={roomForm.gioDongCua}
                        onChange={(e) =>
                          setRoomForm((prev) => ({
                            ...prev,
                            gioDongCua: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-600">Thiết bị</span>
                    <input
                      className="input"
                      value={roomForm.thietBi}
                      onChange={(e) =>
                        setRoomForm((prev) => ({
                          ...prev,
                          thietBi: e.target.value,
                        }))
                      }
                      placeholder="Ví dụ: Máy ECG, Máy siêu âm"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
                  <button
                    type="submit"
                    disabled={roomPending}
                    className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
                  >
                    {roomPending
                      ? "Đang lưu..."
                      : roomEditing
                      ? "Cập nhật phòng"
                      : "Tạo phòng"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleServiceSubmit} className="flex h-full flex-col">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {serviceEditing ? "Cập nhật dịch vụ" : "Tạo dịch vụ mới"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Quản lý dịch vụ khám và CLS gắn trực tiếp với phòng thực hiện.
                      </p>
                    </div>
                    {serviceEditing ? (
                      <button
                        type="button"
                        onClick={resetServiceForm}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      >
                        Tạo mới
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto scrollbar-none px-6 py-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Mã dịch vụ</span>
                      <input
                        required
                        disabled={!!serviceEditing}
                        className="input"
                        value={serviceForm.maDichVu}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            maDichVu: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Tên dịch vụ</span>
                      <input
                        required
                        className="input"
                        value={serviceForm.tenDichVu}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            tenDichVu: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Loại dịch vụ</span>
                      <PopoverSelect
                        name="serviceType"
                        value={serviceForm.loaiDichVu}
                        onChange={(value) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            loaiDichVu: value,
                          }))
                        }
                        options={SERVICE_TYPE_OPTIONS}
                        placeholder="Chọn loại dịch vụ"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Phòng thực hiện</span>
                      <PopoverSelect
                        required
                        name="serviceRoom"
                        value={serviceForm.maPhong}
                        onChange={(value) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            maPhong: value,
                          }))
                        }
                        options={[
                          { value: "", label: "-- Chọn phòng --" },
                          ...sortedRooms.map((room) => ({
                            value: room.MaPhong,
                            label: `${room.TenPhong}${room.TenKhoa ? ` • ${room.TenKhoa}` : ""}`,
                          })),
                        ]}
                        placeholder="Chọn phòng thực hiện"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Đơn giá</span>
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={serviceForm.donGia}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            donGia: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-600">Thời gian dự kiến (phút)</span>
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={serviceForm.thoiGianDuKienPhut}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            thoiGianDuKienPhut: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  {serviceForm.maPhong ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Phòng được gắn
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-800">
                        {roomLabelMap.get(serviceForm.maPhong) || serviceForm.maPhong}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
                  <button
                    type="submit"
                    disabled={servicePending}
                    className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
                  >
                    {servicePending
                      ? "Đang lưu..."
                      : serviceEditing
                      ? "Cập nhật dịch vụ"
                      : "Tạo dịch vụ"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
