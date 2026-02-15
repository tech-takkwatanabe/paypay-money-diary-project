"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthlyExpensePieChart } from "@/components/charts/MonthlyExpensePieChart";
import { AnnualExpenseBarChart } from "@/components/charts/AnnualExpenseBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { Loading } from "@/components/ui/loading";
import { DollarSign, TrendingUp, Wallet, PlusCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ManualEntryModal } from "@/components/expenses/ManualEntryModal";
import { getTransactionsSummary, getTransactionsAvailableYears } from "@/api/generated/transactions/transactions";
import type {
  TransactionSummary as SummaryResponse,
  TransactionSummaryCategoryBreakdownItem as CategoryBreakdown,
} from "@/api/models";

/**
 * Render the dashboard UI for viewing and managing yearly expense summaries.
 *
 * Fetches available years on mount and loads the selected year's summary.
 * Displays header/navigation, a year selector, KPI cards (annual total, monthly average, top category),
 * monthly and category charts, and a manual entry modal. Also shows the current user and provides logout.
 *
 * @returns The React element that renders the full dashboard interface including controls, charts, and the ManualEntryModal.
 */
const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (_error) {
        console.error("Failed to fetch available years");
        setIsLoading(false);
      }
    };
    fetchYears();
  }, []);

  // サマリーデータを取得
  const handleModalSuccess = () => {
    if (selectedYear) {
      fetchSummary(selectedYear);
    }
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AppHeader
        currentPath="/"
        actions={
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">手動入力</span>
          </Button>
        }
      />

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
                <Loading size="sm" />
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
                <Loading size="sm" />
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
                <Loading size="sm" />
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
      <ManualEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleModalSuccess} />
    </div>
  );
};

export default Dashboard;
