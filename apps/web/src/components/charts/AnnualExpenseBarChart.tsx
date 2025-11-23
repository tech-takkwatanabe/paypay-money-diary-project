"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const data = [
  { name: "1月", 食費: 40000, 日用品: 2400, 交通費: 2400, 趣味: 5000, その他: 2000 },
  { name: "2月", 食費: 30000, 日用品: 1398, 交通費: 2210, 趣味: 3000, その他: 1000 },
  { name: "3月", 食費: 20000, 日用品: 9800, 交通費: 2290, 趣味: 8000, その他: 3000 },
  { name: "4月", 食費: 27800, 日用品: 3908, 交通費: 2000, 趣味: 4000, その他: 2000 },
  { name: "5月", 食費: 18900, 日用品: 4800, 交通費: 2181, 趣味: 6000, その他: 1500 },
  { name: "6月", 食費: 23900, 日用品: 3800, 交通費: 2500, 趣味: 5000, その他: 2000 },
  { name: "7月", 食費: 34900, 日用品: 4300, 交通費: 2100, 趣味: 7000, その他: 2500 },
  { name: "8月", 食費: 40000, 日用品: 2400, 交通費: 2400, 趣味: 10000, その他: 3000 },
  { name: "9月", 食費: 30000, 日用品: 1398, 交通費: 2210, 趣味: 4000, その他: 1000 },
  { name: "10月", 食費: 20000, 日用品: 9800, 交通費: 2290, 趣味: 5000, その他: 2000 },
  { name: "11月", 食費: 27800, 日用品: 3908, 交通費: 2000, 趣味: 3000, その他: 1500 },
  { name: "12月", 食費: 50000, 日用品: 10000, 交通費: 5000, 趣味: 20000, その他: 10000 },
];

export function AnnualExpenseBarChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      },
    },
    xaxis: {
      categories: data.map((item) => item.name),
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `¥${val.toLocaleString()}`,
      },
    },
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `¥${val.toLocaleString()}`,
      },
    },
    colors: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#6b7280"],
  };

  const series = [
    {
      name: "食費",
      data: data.map((item) => item.食費),
    },
    {
      name: "日用品",
      data: data.map((item) => item.日用品),
    },
    {
      name: "交通費",
      data: data.map((item) => item.交通費),
    },
    {
      name: "趣味",
      data: data.map((item) => item.趣味),
    },
    {
      name: "その他",
      data: data.map((item) => item.その他),
    },
  ];

  return (
    <Card className="w-full h-full min-h-[400px]">
      <CardHeader>
        <CardTitle>年間支出推移</CardTitle>
      </CardHeader>
      <CardContent>
        {mounted ? (
          <div className="w-full h-[300px]">
            <Chart options={options} series={series} type="bar" height="100%" />
          </div>
        ) : (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
