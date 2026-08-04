"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export function DonutChart({
  data,
  height = 240,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return <div className="flex h-[240px] items-center justify-center text-sm text-grey-400">No data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={3}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-hm-grey-200)",
            fontSize: 12,
            fontFamily: "var(--font-body)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-body)", color: "var(--color-hm-grey-600)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
