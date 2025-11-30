'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const data = [
	{ name: '食費', value: 45000, color: '#ef4444' },
	{ name: '日用品', value: 12000, color: '#3b82f6' },
	{ name: '交通費', value: 8000, color: '#10b981' },
	{ name: '趣味', value: 15000, color: '#f59e0b' },
	{ name: 'その他', value: 5000, color: '#6b7280' },
];

export function MonthlyExpensePieChart() {
	const options: ApexCharts.ApexOptions = {
		chart: {
			type: 'donut',
			fontFamily: 'inherit',
		},
		labels: data.map((item) => item.name),
		colors: data.map((item) => item.color),
		legend: {
			position: 'bottom',
		},
		dataLabels: {
			enabled: true,
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
					size: '65%',
				},
			},
		},
	};

	const series = data.map((item) => item.value);

	return (
		<Card className="w-full h-full min-h-[400px]">
			<CardHeader>
				<CardTitle>今月の支出内訳</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="w-full h-[300px]">
					<Chart options={options} series={series} type="donut" height="100%" />
				</div>
			</CardContent>
		</Card>
	);
}
