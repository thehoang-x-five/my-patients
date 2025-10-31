import React from "react";

export default function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-50 to-cyan-50 ring-1 ring-sky-200 grid place-items-center text-sky-700 font-bold">
      {initials}
    </div>
  );
}
