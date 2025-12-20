"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthlyExpensePieChart } from "@/components/charts/MonthlyExpensePieChart";
import { AnnualExpenseBarChart } from "@/components/charts/AnnualExpenseBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, LogOut, Upload, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactionsSummary } from "@/api/generated/transaction/transaction";
import { customFetch } from "@/api/customFetch";
import type { SummaryResponse, CategoryBreakdown, MonthlyBreakdown } from "@/api/models";
import Link from "next/link";

interface AvailableYearsResponse {
  status: number;
  data: { years: number[] };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  // 利用可能な年を取得
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await customFetch<AvailableYearsResponse>("/transactions/years");
        if (response.status === 200 && response.data.years) {
          setAvailableYears(response.data.years);
          // 最新の年をデフォルト選択
          if (response.data.years.length > 0) {
            setSelectedYear(response.data.years[0]);
          }
        }
      } catch (_error) {
        console.error("Failed to fetch available years");
      }
    };
    fetchYears();
  }, []);

  // サマリーデータを取得
  const fetchSummary = useCallback(async (year: number) => {
    setIsLoading(true);
    try {
      const response = await getTransactionsSummary({
        year: year.toString(),
      });

      if (response.status === 200 && "data" in response) {
        setSummary(response.data);
      }
    } catch (_error) {
      console.error("Failed to fetch summary");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 年が選択されたらデータを取得
  useEffect(() => {
    if (selectedYear) {
      fetchSummary(selectedYear);
    }
  }, [selectedYear, fetchSummary]);

  // 今月の支出を計算
  const thisMonthExpense =
    summary?.monthlyBreakdown?.find((m: MonthlyBreakdown) => m.month === currentMonth)?.totalAmount ?? 0;

  // 先月の支出を計算
  const lastMonthExpense =
    summary?.monthlyBreakdown?.find((m: MonthlyBreakdown) => m.month === currentMonth - 1)?.totalAmount ?? 0;

  // 先月比のパーセンテージ
  const monthlyChange = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

  // 年間合計
  const yearlyTotal = summary?.summary?.totalAmount ?? 0;

  // 最多カテゴリを取得
  const topCategory = summary?.categoryBreakdown?.reduce(
    (max: CategoryBreakdown | null, current: CategoryBreakdown) =>
      max === null || current.totalAmount > max.totalAmount ? current : max,
    null as CategoryBreakdown | null
  );

  const topCategoryRatio = yearlyTotal > 0 && topCategory ? (topCategory.totalAmount / yearlyTotal) * 100 : 0;

  const handleLogout = async () => {
    await logout();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">¥</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">PayPay 家計簿</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/categories"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-foreground border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            カテゴリ
          </Link>
          <Link
            href="/rules"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-foreground border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ルール
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-red-500 to-pink-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">CSV アップロード</span>
          </Link>
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">ログアウト</span>
          </button>
        </div>
      </header>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-6 md:gap-8">
        {/* 年選択ドロップダウン */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 pr-10 text-lg font-semibold focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none cursor-pointer"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <span className="text-muted-foreground">の支出データ</span>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{currentMonth}月の支出</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(thisMonthExpense)}</div>
                  <p className="text-xs text-muted-foreground">
                    先月比 {monthlyChange >= 0 ? "+" : ""}
                    {monthlyChange.toFixed(1)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年間支出累計</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(yearlyTotal)}</div>
                  <p className="text-xs text-muted-foreground">{selectedYear}年度</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最多カテゴリ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{topCategory?.categoryName ?? "---"}</div>
                  <p className="text-xs text-muted-foreground">全体の {topCategoryRatio.toFixed(1)}%</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <AnnualExpenseBarChart data={summary?.monthlyBreakdown ?? []} isLoading={isLoading} />
          </div>
          <div className="col-span-3">
            <MonthlyExpensePieChart data={summary?.categoryBreakdown ?? []} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
