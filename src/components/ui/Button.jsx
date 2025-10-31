import React from 'react';
import { forwardRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

const classes = {
  base:
    "inline-flex items-center justify-center rounded-xl transition " +
    "border border-slate-200 dark:border-slate-700 " +
    "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 " +
    "shadow-soft",
  size: {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-[15px] gap-2",
  },
  variant: {
    default: "",
    primary:
      "bg-gradient-to-tr from-sky-400 via-sky-300 to-sky-400 text-white border-transparent",
    outline:
      "bg-transparent dark:bg-transparent text-slate-700 dark:text-slate-200 " +
      "border-slate-300 dark:border-slate-600",
    ghost:
      "bg-transparent dark:bg-transparent border-transparent " +
      "hover:bg-slate-100/70 dark:hover:bg-slate-800/70",
    soft:
      "bg-sky-50 text-sky-800 border-sky-100 hover:border-sky-200 " +
      "dark:bg-slate-700/50 dark:text-sky-200 dark:border-slate-600",
    /* 🔥 gradient nổi bật cho nút đặc biệt */

    radigan:
      "text-sky-900 border-sky-100 " +
      "bg-gradient-to-tr from-sky-100 via-sky-200 to-sky-100 " +
      "shadow-[0_10px_18px_-6px_rgba(139,92,246,.35)] " +
      "hover:brightness-105 active:brightness-95 hover:border-sky-100",
  },
  iconOnly:
    "rounded-full p-2 !px-2 !py-2 aspect-square min-w-9 min-h-9 " +
    "flex items-center justify-center",
};

const Button = forwardRef(function Button(
  {
    as = "button",
    className,
    children,
    variant = "default",
    size = "md",
    iconOnly = false,
    ...rest
  },
  ref
) {
  const Comp = typeof as === "string" ? motion[as] : motion(as);
  return (
    <Comp
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        classes.base,
        classes.size[size],
        classes.variant[variant],
        iconOnly && classes.iconOnly,
        "hover:shadow-md active:shadow-none rounded-4xl",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});

export default Button;
