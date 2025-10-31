import React, { useMemo } from 'react';
import { motion } from "framer-motion";
import DeptCard from "./DeptCard.jsx";

export default function DeptGrid({ items = [], onOpenDetail, onOpenSchedule, tab = "all" }) {
  const filteredItems = useMemo(() => {
    if (tab === "all") return items;
    return items.filter(item => {
      if (tab === "active") return item.status === "active";
      if (tab === "inactive") return item.status === "inactive";
      return true;
    });
  }, [items, tab]);

  if (!filteredItems.length) {
    return (
      <section className="card p-6 border-0 ring-1 ring-slate-200/80 text-slate-500">
        Không tìm thấy phòng phù hợp.
      </section>
    );
  }

  return (
    <motion.section
      layout
      className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 px-1 py-1"
    >
      {filteredItems.map((d) => (
        <DeptCard
          key={d.id}
          dept={d}
          onOpenDetail={onOpenDetail}
          onOpenSchedule={onOpenSchedule}
        />
      ))}
    </motion.section>
  );
}
