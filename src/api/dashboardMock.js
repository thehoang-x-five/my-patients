// src/api/dashboardMock.js
// Mock dữ liệu cho trang Overview (Dashboard) – bám DTO DashboardTodayDto
import { mockEnabled } from "./mockData.js";

const HOURS = [8, 9, 10, 11, 14, 15, 16, 17];

function makeSeries(base) {
  return HOURS.map((h, idx) => ({
    gio: h,
    giaTri: base + (idx % 4) * 3 + (idx > 3 ? 2 : 0),
  }));
}

const today = new Date();
const todayIso = today.toISOString();

// Mock theo đúng shape DashboardTodayDto
const dashboardTodayMock = {
  ngay: todayIso,

  // BenhNhanTrongNgay: TodayPatientsKpiDto
  benhNhanTrongNgay: {
    tongSoBenhNhan: 48,
    daXuLy: 30,
    choXuLy: 12,
    daHuy: 6,
    tangTruongPhanTram: 12.0,
    phanBoTheoGio: makeSeries(4),
  },

  // LichHenHomNay: TodayAppointmentsKpiDto
  lichHenHomNay: {
    tongSoLichHen: 22,
    daXacNhan: 18,
    choXacNhan: 3,
    daHuy: 1,
    tangTruongPhanTram: 5.0,
    phanBoTheoGio: makeSeries(3),
  },

  // DoanhThuHomNay: TodayRevenueKpiDto
  doanhThuHomNay: {
    tongDoanhThu: 24_500_000,
    doanhThuKhamLs: 8_500_000,
    doanhThuCls: 9_000_000,
    doanhThuThuoc: 7_000_000,
    tangTruongPhanTram: 8.0,
    phanBoTheoGio: makeSeries(5),
  },

  // LuotKhamHomNay: TodayExamOverviewDto
  luotKhamHomNay: {
    tongLuotKham: 52,
    choKham: 16,
    dangKham: 7,
    daHoanTat: 29,
    tangTruongPhanTram: 3.0,
    phanBoTheoGio: makeSeries(2),
  },

  // LichHenSapToi: UpcomingAppointmentDashboardItemDto[]
  lichHenSapToi: [
    {
      ngayHen: todayIso,
      gioHen: "08:30:00",
      tenBenhNhan: "Nguyễn Văn A",
      tenDichVuKham: "Khám Nội tổng quát",
      tenKhoa: "Nội tổng quát",
      trangThai: "da_xac_nhan",
    },
    {
      ngayHen: todayIso,
      gioHen: "09:15:00",
      tenBenhNhan: "Trần Thị B",
      tenDichVuKham: "Khám Nhi",
      tenKhoa: "Nhi",
      trangThai: "dang_cho",
    },
    {
      ngayHen: todayIso,
      gioHen: "10:00:00",
      tenBenhNhan: "Lê Văn C",
      tenDichVuKham: "Khám Tim mạch",
      tenKhoa: "Tim mạch",
      trangThai: "da_checkin",
    },
    {
      ngayHen: todayIso,
      gioHen: "10:30:00",
      tenBenhNhan: "Phạm Thị D",
      tenDichVuKham: "Khám Sản",
      tenKhoa: "Sản",
      trangThai: "da_huy",
    },
    {
      ngayHen: todayIso,
      gioHen: "11:00:00",
      tenBenhNhan: "Ngô Văn E",
      tenDichVuKham: "Khám Nội tiết",
      tenKhoa: "Nội tiết",
      trangThai: "da_xac_nhan",
    },
  ],

  // HoatDongGanDay: DashboardActivityDto[]
  hoatDongGanDay: [
    {
      moTa: "Bác sĩ A hoàn tất khám BN Nguyễn Văn A (Nội tổng quát).",
      thoiGian: new Date(today.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      moTa: "Điều dưỡng B đưa BN Trần Thị B vào phòng khám Nhi.",
      thoiGian: new Date(today.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      moTa: "Hoàn tất gói CLS cho BN Lê Văn C.",
      thoiGian: new Date(today.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      moTa: "Bác sĩ C kê đơn thuốc cho BN Ngô Văn E.",
      thoiGian: new Date(today.getTime() - 20 * 60 * 1000).toISOString(),
    },
    {
      moTa: "Thu ngân hoàn tất thu tiền CLS trong ca sáng.",
      thoiGian: new Date(today.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ],
};

export { mockEnabled };

export const mockDashboardApi = {
  async getToday() {
    // Giả lập API, có thể thêm độ trễ nếu cần
    return dashboardTodayMock;
  },
};
