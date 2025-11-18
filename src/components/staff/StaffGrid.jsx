import React from "react";
import StaffCard from "./StaffCard.jsx";

export default function StaffGrid({ items = [], role, onDetail, onSchedule }) {
  if (!items.length) {
    return (
      <section className="p-6 m-1 text-slate-500 rounded-xl bg-white ring-1 ring-slate-200">
        Không tìm thấy nhân sự phù hợp.
      </section>
    );
  }
  return (
    <section className="p-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {items.map((s) => (
        <StaffCard
          key={s.id}
          item={s}
          role={role}
          onDetail={onDetail}
          onSchedule={onSchedule}
        />
      ))}
    </section>
  );
}
