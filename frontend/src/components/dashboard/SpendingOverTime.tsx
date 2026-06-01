"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AnalyticsDate } from "@/lib/types";

export function SpendingOverTime({ data }: { data: AnalyticsDate[] }) {
  const chartData = data.map((d) => ({ date: d.date, amount: parseFloat(d.amount) }));
  if (chartData.length === 0)
    return <p className="text-sm text-slate-500">No expenses to chart.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
