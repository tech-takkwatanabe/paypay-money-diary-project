import { MonthlyExpensePieChart } from "@/components/charts/MonthlyExpensePieChart";
import { AnnualExpenseBarChart } from "@/components/charts/AnnualExpenseBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
        <h1 className="text-2xl font-bold tracking-tight">PayPay Money Diary</h1>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の支出</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥75,000</div>
              <p className="text-xs text-muted-foreground">
                先月比 +20.1%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年間支出累計</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥850,000</div>
              <p className="text-xs text-muted-foreground">
                2024年度
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最多カテゴリ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">食費</div>
              <p className="text-xs text-muted-foreground">
                全体の 45%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <AnnualExpenseBarChart />
          </div>
          <div className="col-span-3">
            <MonthlyExpensePieChart />
          </div>
        </div>
      </main>
    </div>
  );
}
