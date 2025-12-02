import React from "react";
import StaffCard from "./StaffCard.jsx";

export default function StaffGrid({ items = [], role, onDetail, onSchedule }) {
  if (!items.length) {
    return (
      <section className=" h-full  rounded-2xl bg-white ring-1 ring-slate-200/60 text-sm text-slate-500 min-h-[320px] flex items-center justify-center">
        Không tìm thấy nhân sự phù hợp.
      </section>
    );
  }
  return (
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 px-1 py-1">
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
