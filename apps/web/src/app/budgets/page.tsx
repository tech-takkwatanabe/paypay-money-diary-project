'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { getCategories } from '@/api/generated/category/category';
import { getBudgets, postBudgets } from '@/api/generated/budget/budget';
import type { GetBudgets200DataItem } from '@/api/models';
import type { Category } from '@/api/models/category';

export default function BudgetsPage() {
	const router = useRouter();
	const [categoriesList, setCategoriesList] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 現在の年月をデフォルトに設定
	const now = new Date();
	const [selectedYear, setSelectedYear] = useState(now.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

	// 編集中の予算データ
	const [editingBudgets, setEditingBudgets] = useState<{ [categoryId: string]: number }>({});
	const [overallBudget, setOverallBudget] = useState<number>(0);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [catsRes, budgetsRes] = await Promise.all([getCategories(), getBudgets({ year: selectedYear.toString(), month: selectedMonth.toString() })]);

			if (catsRes.status === 200 && 'data' in catsRes.data) {
				setCategoriesList(catsRes.data.data);
			}

			if (budgetsRes.status === 200 && 'data' in budgetsRes.data) {
				const budgets = budgetsRes.data.data;

				const editing: { [categoryId: string]: number } = {};
				let overall = 0;

				budgets.forEach((b: GetBudgets200DataItem) => {
					if (b.categoryId) {
						editing[b.categoryId] = b.amount;
					} else {
						overall = b.amount;
					}
				});

				setEditingBudgets(editing);
				setOverallBudget(overall);
			}
		} catch (err) {
			console.error('Fetch data error:', err);
			setError('データの取得に失敗しました。');
		} finally {
			setIsLoading(false);
		}
	}, [selectedYear, selectedMonth]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleAmountChange = (categoryId: string | null, value: string) => {
		const amount = parseInt(value) || 0;
		if (categoryId) {
			setEditingBudgets((prev) => ({ ...prev, [categoryId]: amount }));
		} else {
			setOverallBudget(amount);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		setError(null);
		try {
			// 全体予算の保存 (categoryId: null)
			await postBudgets({
				categoryId: null,
				amount: overallBudget,
				year: selectedYear,
				month: selectedMonth,
			});

			// カテゴリ別予算の保存
			const promises = Object.entries(editingBudgets).map(([categoryId, amount]) =>
				postBudgets({
					categoryId,
					amount,
					year: selectedYear,
					month: selectedMonth,
				})
			);

			await Promise.all(promises);
			await fetchData();
			// 成功メッセージなどを出す場合はここで
		} catch (err) {
			console.error('Save budget error:', err);
			setError('予算の保存に失敗しました。');
		} finally {
			setIsSaving(false);
		}
	};

	const years = [2024, 2025, 2026];
	const months = Array.from({ length: 12 }, (_, i) => i + 1);

	return (
		<div className="min-h-screen bg-slate-50 pb-20">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
				<div className="max-w-2xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
							<ArrowLeft className="w-5 h-5 text-slate-600" />
						</button>
						<h1 className="text-xl font-bold text-slate-800">予算設定</h1>
					</div>
					<button
						onClick={handleSave}
						disabled={isSaving || isLoading}
						className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
						{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
						保存
					</button>
				</div>
			</header>

			<main className="max-w-2xl mx-auto px-4 py-8">
				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
						<AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				{/* Year/Month Selector */}
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">対象年月</h2>
					<div className="flex gap-4">
						<div className="flex-1">
							<select
								value={selectedYear}
								onChange={(e) => setSelectedYear(parseInt(e.target.value))}
								className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none">
								{years.map((y) => (
									<option key={y} value={y}>
										{y}年
									</option>
								))}
							</select>
						</div>
						<div className="flex-1">
							<select
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
								className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none">
								{months.map((m) => (
									<option key={m} value={m}>
										{m}月
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Overall Budget */}
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">月間全体の予算</h2>
					<div className="relative">
						<input
							type="number"
							value={overallBudget}
							onChange={(e) => handleAmountChange(null, e.target.value)}
							placeholder="0"
							className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-4 text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
						/>
						<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">円</span>
					</div>
					<p className="mt-2 text-xs text-slate-400">※カテゴリ別の予算を設定しない場合、この金額が全体の目標となります。</p>
				</div>

				{/* Category Budgets */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-2">カテゴリ別予算</h2>
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
							<p className="text-slate-400 text-sm">読み込み中...</p>
						</div>
					) : (
						categoriesList.map((category) => (
							<div key={category.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-indigo-200 transition-all">
								<div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
									<span className="text-lg">
										{/* アイコンの簡易表示。本来はLucideアイコンをマップする */}
										{category.name.charAt(0)}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-bold text-slate-700 truncate">{category.name}</h3>
								</div>
								<div className="relative w-32 shrink-0">
									<input
										type="number"
										value={editingBudgets[category.id] || 0}
										onChange={(e) => handleAmountChange(category.id, e.target.value)}
										className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-right font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
									/>
									<span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">円</span>
								</div>
							</div>
						))
					)}
				</div>
			</main>
		</div>
	);
}
