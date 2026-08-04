"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function HorizontalBarChart({
  data,
  height = 280,
  color = "#142244",
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-hm-grey-100)" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-hm-grey-500)" }} />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={140}
          tick={{ fontSize: 11.5, fill: "var(--color-hm-grey-700)", fontFamily: "var(--font-body)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--color-hm-grey-50)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--color-hm-grey-200)", fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={900} animationEasing="ease-out">
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
