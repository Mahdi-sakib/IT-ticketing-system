import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { STATUS_LABELS } from "@/lib/ticketConstants";

const COLORS = {
  new: "#3b82f6",
  open: "#6366f1",
  assigned: "#8b5cf6",
  in_progress: "#f59e0b",
  pending: "#fb923c",
  resolved: "#10b981",
  closed: "#94a3b8",
};

export default function StatusPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name] || "#cbd5e1"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value, name) => [value, STATUS_LABELS[name] || name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(name) => STATUS_LABELS[name] || name}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
