"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function TrendChart({
  data,
  dataKey = "orders",
  color = "#ff6b00",
  height = 240,
}: {
  data: Record<string, unknown>[];
  dataKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-hm-grey-100)" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-hm-grey-500)", fontFamily: "var(--font-body)" }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-hm-grey-500)" }} width={30} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-hm-grey-200)",
            fontSize: 12,
            fontFamily: "var(--font-body)",
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#fill-${dataKey})`}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
