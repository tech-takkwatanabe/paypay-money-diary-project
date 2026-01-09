"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GetTransactionsSummary200CategoryBreakdownItem as CategoryBreakdown } from "@/api/models";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyExpensePieChartProps {
  data: CategoryBreakdown[];
  isLoading?: boolean;
}

// デフォルトカラー
const defaultColors = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6b7280",
];

export function MonthlyExpensePieChart({ data, isLoading }: MonthlyExpensePieChartProps) {
  const chartData =
    data.length > 0
      ? data.map((item, index) => ({
          name: item.categoryName,
          value: item.totalAmount,
          color: item.categoryColor || defaultColors[index % defaultColors.length],
        }))
      : [{ name: "データなし", value: 1, color: "#e5e7eb" }];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels: chartData.map((item) => item.name),
    colors: chartData.map((item) => item.color),
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: data.length > 0,
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `¥${val.toLocaleString()}`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    noData: {
      text: "データがありません",
    },
  };

  const series = chartData.map((item) => item.value);

  return (
    <Card className="w-full h-full min-h-[400px]">
      <CardHeader>
        <CardTitle>カテゴリ別支出</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <Chart options={options} series={series} type="donut" height="100%" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
