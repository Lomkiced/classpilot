"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface AnalyticsData {
  name: string;
  students: number;
  assessments: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  // If there's no data, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        No analytics data available.
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 20,
          }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            dx={-10}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "#f3f4f6" }}
            contentStyle={{ 
              borderRadius: "12px", 
              border: "none", 
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)"
            }}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Bar 
            dataKey="students" 
            name="Total Students"
            fill="#ec4899" // Pink-500 from theme
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="assessments" 
            name="Assessments"
            fill="#c026d3" // Fuchsia/Purple to match theme
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
