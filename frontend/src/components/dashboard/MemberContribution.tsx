"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { AnalyticsMember } from "@/lib/types";

export function MemberContribution({ data }: { data: AnalyticsMember[] }) {
  const chartData = data.map((m) => ({
    name: m.display_name,
    paid: parseFloat(m.total_paid),
    share: parseFloat(m.total_share),
  }));
  if (chartData.length === 0) return <p className="text-sm text-slate-500">No members.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" fontSize={12} />
          <YAxis dataKey="name" type="category" fontSize={12} width={80} />
          <Tooltip />
          <Legend />
          <Bar dataKey="paid" fill="#10b981" />
          <Bar dataKey="share" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
