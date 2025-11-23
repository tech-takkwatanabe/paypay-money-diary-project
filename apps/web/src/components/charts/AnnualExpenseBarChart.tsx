"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// Calculate totals for average line (mock logic)
const dataWithTotal = data.map(item => {
  const total = item.食費 + item.日用品 + item.交通費 + item.趣味 + item.その他;
  return { ...item, total };
});

export function AnnualExpenseBarChart() {
  return (
    <Card className="w-full h-full min-h-[400px]">
      <CardHeader>
        <CardTitle>年間支出推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dataWithTotal}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="食費" stackId="a" fill="#ef4444" />
              <Bar dataKey="日用品" stackId="a" fill="#3b82f6" />
              <Bar dataKey="交通費" stackId="a" fill="#10b981" />
              <Bar dataKey="趣味" stackId="a" fill="#f59e0b" />
              <Bar dataKey="その他" stackId="a" fill="#6b7280" />
              {/* Total Line */}
              {/* <Line type="monotone" dataKey="total" stroke="#ff7300" /> */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
