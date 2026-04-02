import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAbnormalStats, useDiseaseTrends, usePopularDrugs } from "../api/analytics.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Dashboard() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      fromDate: start.toISOString().slice(0, 10),
      toDate: end.toISOString().slice(0, 10),
    };
  }, []);

  const { data: abnormal, isLoading: loadingAbnormal } = useAbnormalStats();
  const { data: diseases, isLoading: loadingDiseases } = useDiseaseTrends({ ...dateRange, top: 10 });
  const { data: drugs, isLoading: loadingDrugs } = usePopularDrugs({ ...dateRange, top: 10 });

  const diseaseData = useMemo(() => {
    if (!diseases?.Items) return [];
    return diseases.Items.map(d => ({
      name: d.TenBenh ?? d.tenBenh ?? d.ChanDoan ?? d.chanDoan,
      count: d.SoLuot ?? d.soLuot ?? 0,
    }));
  }, [diseases]);

  const drugData = useMemo(() => {
    if (!drugs?.Items) return [];
    return drugs.Items.map(d => ({
      name: d.TenThuoc ?? d.tenThuoc,
      count: d.SoLuot ?? d.soLuot ?? 0,
    }));
  }, [drugs]);

  const stats = [
    { label: "Bệnh nhân bất thường", value: abnormal?.SoBenhNhanBatThuong ?? abnormal?.soBenhNhanBatThuong ?? 0, color: "text-red-600" },
    { label: "Đơn thuốc bất thường", value: abnormal?.SoDonThuocBatThuong ?? abnormal?.soDonThuocBatThuong ?? 0, color: "text-orange-600" },
    { label: "Dịch vụ bất thường", value: abnormal?.SoDichVuBatThuong ?? abnormal?.soDichVuBatThuong ?? 0, color: "text-yellow-600" },
  ];

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="card p-4">
              <div className="text-sm text-slate-600">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color} mt-2`}>
                {loadingAbnormal ? "..." : stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="card p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Xu hướng bệnh tật (30 ngày)</h2>
            <div className="flex-1 min-h-0">
              {loadingDiseases ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-500">Đang tải...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Thuốc hay dùng (30 ngày)</h2>
            <div className="flex-1 min-h-0">
              {loadingDrugs ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-500">Đang tải...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={drugData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
