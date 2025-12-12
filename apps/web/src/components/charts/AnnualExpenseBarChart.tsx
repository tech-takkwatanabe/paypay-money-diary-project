'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlyBreakdown } from '@/api/models';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AnnualExpenseBarChartProps {
	data: MonthlyBreakdown[];
	isLoading?: boolean;
}

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function AnnualExpenseBarChart({ data, isLoading }: AnnualExpenseBarChartProps) {
	// 月別データを整形（1月〜12月）
	const monthlyData = monthNames.map((name, index) => {
		const monthData = data.find((d) => d.month === index + 1);
		return {
			name,
			amount: monthData?.totalAmount ?? 0,
		};
	});

	const options: ApexCharts.ApexOptions = {
		chart: {
			type: 'bar',
			fontFamily: 'inherit',
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '60%',
				borderRadius: 4,
			},
		},
		xaxis: {
			categories: monthlyData.map((item) => item.name),
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
			show: false,
		},
		dataLabels: {
			enabled: false,
		},
		tooltip: {
			y: {
				formatter: (val: number) => `¥${val.toLocaleString()}`,
			},
		},
		colors: ['#ef4444'],
		fill: {
			type: 'gradient',
			gradient: {
				shade: 'light',
				type: 'vertical',
				shadeIntensity: 0.2,
				opacityFrom: 1,
				opacityTo: 0.8,
			},
		},
	};

	const series = [
		{
			name: '支出',
			data: monthlyData.map((item) => item.amount),
		},
	];

	return (
		<Card className="w-full h-full min-h-[400px]">
			<CardHeader>
				<CardTitle>年間支出推移</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="w-full h-[300px] flex items-center justify-center">
						<div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : (
					<div className="w-full h-[300px]">
						<Chart options={options} series={series} type="bar" height="100%" />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
