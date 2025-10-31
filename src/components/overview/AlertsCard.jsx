import { Card, Badge, Stagger, StaggerItem } from "../ui/Supports.jsx";
import React from 'react';
export default function AlertsCard({ alerts = [] }) {
  const tone = (t) =>
    t === "high" ? "danger" : t === "medium" ? "warn" : "info";
  const wrapCls = (lvl) =>
    lvl === "high"
      ? "bg-rose-50 ring-rose-200 text-rose-800"
      : lvl === "medium"
      ? "bg-amber-50 ring-amber-200 text-amber-800"
      : "bg-sky-50 ring-sky-200 text-sky-800";

  // nhận sẵn 5 mục từ Overview; nếu không, tự cắt 5 mục
  const rows = alerts.slice(0, 5);

  return (
    <Card
      title="Cảnh báo trong ngày"
      action={
        <a
          href="/notifications"
          className="text-slate-500 text-sm underline hover:text-sky-500"
        >
          Tất cả →
        </a>
      }
      tone="rose"
    >
      <Stagger className="flex flex-col gap-2">
        {rows.map((a) => (
          <StaggerItem key={a.id}>
            <div
              className={`rounded-xl p-1 ring-1 ${wrapCls(a.level)}
                          hover:brightness-105 transition`}
            >
              <div className="flex items-center justify-between">
                <b className="leading-tight">{a.title}</b>
                <Badge tone={tone(a.level)}>{a.levelLabel}</Badge>
              </div>
              <div className="text-sm mt-1">{a.desc}</div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Card>
  );
}
