"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthlyExpensePieChart } from "@/components/charts/MonthlyExpensePieChart";
import { AnnualExpenseBarChart } from "@/components/charts/AnnualExpenseBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { Link } from "@/components/ui/link";
import { DollarSign, TrendingUp, Wallet, LogOut, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactionsSummary, getTransactionsAvailableYears } from "@/api/generated/transactions/transactions";
import type {
  GetTransactionsSummary200 as SummaryResponse,
  GetTransactionsSummary200CategoryBreakdownItem as CategoryBreakdown,
} from "@/api/models";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // 利用可能な年を取得
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await getTransactionsAvailableYears();
        if (response.status === 200 && "data" in response) {
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

  // 月平均
  const monthlyAverage =
    summary?.monthlyBreakdown && summary.monthlyBreakdown.length > 0
      ? summary.monthlyBreakdown.reduce((total, m) => total + m.totalAmount, 0) / 12
      : 0;

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
          <Link href="/expenses" variant="outline">
            支出一覧
          </Link>
          <Link href="/categories" variant="outline">
            カテゴリ
          </Link>
          <Link href="/rules" variant="outline">
            ルール
          </Link>
          <Link href="/upload" variant="brand">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">CSV アップロード</span>
          </Link>
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">ログアウト</span>
          </Button>
        </div>
      </header>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-6 md:gap-8">
        {/* 年選択ドロップダウン */}
        <div className="flex items-center gap-4">
          <SelectNative
            value={selectedYear ?? ""}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-fit"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </SelectNative>
          <span className="text-muted-foreground">の支出データ</span>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 年間支出累計 */}
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
          {/* 月の平均支出 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月の平均支出</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(monthlyAverage)}</div>
                </>
              )}
            </CardContent>
          </Card>
          {/* 最多カテゴリ */}
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
