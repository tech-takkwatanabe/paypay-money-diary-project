"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionSummaryMonthlyBreakdownItem as MonthlyBreakdown } from "@/api/models";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AnnualExpenseBarChartProps {
  data: MonthlyBreakdown[];
  isLoading?: boolean;
}

const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function AnnualExpenseBarChart({ data, isLoading }: AnnualExpenseBarChartProps) {
  const hasData = data.some((m) => (m.categories ?? []).some((c) => (c.amount ?? 0) > 0));

  // 全てのカテゴリーを抽出（ユニークなリストを作成）
  const allCategories = Array.from(
    new Map(
      data
        .flatMap((d) => d.categories)
        .map((c) => [
          c.categoryId || "others",
          {
            name: c.categoryName,
            color: c.categoryColor,
            displayOrder: c.displayOrder ?? 100,
          },
        ])
    ).entries()
  ).sort((a, b) => a[1].displayOrder - b[1].displayOrder);

  // 月別データを整形（1月〜12月）
  const monthlyData = monthNames.map((name, index) => {
    const monthData = data.find((d) => d.month === index + 1);
    return {
      name,
      categories: monthData?.categories ?? [],
    };
  });

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      fontFamily: "inherit",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    xaxis: {
      categories: monthNames,
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 10000) {
            return `¥${(val / 10000).toFixed(0)}万`;
          }
          return `¥${val.toLocaleString()}`;
        },
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      offsetY: 8,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `¥${val.toLocaleString()}`,
      },
    },
    colors: allCategories.map(([_, info]) => info.color),
  };

  const series = allCategories.map(([id, info]) => ({
    name: info.name,
    data: monthlyData.map((m) => {
      const cat = m.categories.find((c) => (c.categoryId || "others") === id);
      return cat?.amount ?? 0;
    }),
  }));

  return (
    <Card className="w-full h-full min-h-100">
      <CardHeader>
        <CardTitle>年間支出推移</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-75 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="w-full h-75 flex items-center justify-center text-muted-foreground">
            まだデータがありません
          </div>
        ) : (
          <div className="w-full h-75">
            <Chart options={options} series={series} type="bar" height="100%" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
