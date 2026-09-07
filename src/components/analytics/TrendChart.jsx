import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="created" name="Created" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
