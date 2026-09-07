import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(d, withTime = true) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  const opts = { year: "numeric", month: "short", day: "numeric" };
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  return date.toLocaleString("en-US", opts);
}

export function timeAgo(d) {
  if (!d) return "-";
  const date = new Date(d);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [label, secs] of steps) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${label}${val > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
