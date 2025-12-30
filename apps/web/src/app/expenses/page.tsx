"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Link } from "@/components/ui/link";
import { Search, ChevronDown, ChevronUp, LogOut, Upload, Filter, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, getTransactionsYears, patchTransactionsId } from "@/api/generated/transaction/transaction";
import { getCategories } from "@/api/generated/category/category";
import type { Transaction, CategoryWithSystem } from "@/api/models";

export default function ExpensesPage() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryWithSystem[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // フィルタ状態
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [sortBy, setSortBy] = useState<"transactionDate" | "amount">("transactionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 編集状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>("");

  const limit = 50;

  // 初期データ取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [yearsRes, categoriesRes] = await Promise.all([getTransactionsYears(), getCategories()]);

        if (yearsRes.status === 200 && "data" in yearsRes) {
          setAvailableYears(yearsRes.data.years);
          if (yearsRes.data.years.length > 0) {
            setSelectedYear(yearsRes.data.years[0].toString());
          }
        }

        if (categoriesRes.status === 200 && "data" in categoriesRes) {
          setCategories(categoriesRes.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // 取引データ取得
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getTransactions({
        page: currentPage.toString(),
        limit: limit.toString(),
        year: selectedYear || undefined,
        categoryId: selectedCategory || undefined,
        merchant: merchantSearch || undefined,
        sortBy,
        sortOrder,
      });

      if (response.status === 200 && "data" in response) {
        setTransactions(response.data.data);
        setTotalCount(response.data.pagination.totalCount);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedYear, selectedCategory, merchantSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSort = (column: "transactionDate" | "amount") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleUpdateCategory = async (id: string) => {
    try {
      const response = await patchTransactionsId(id, {
        categoryId: editCategoryId,
      });

      if (response.status === 200) {
        // ローカルの状態を更新
        setTransactions((prev) => prev.map((t) => (t.id === id ? (response.data as Transaction) : t)));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">¥</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">PayPay 家計簿</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/expenses" variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20">
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

      <main className="flex-1 p-4 sm:px-6 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">支出一覧</h2>
          <div className="text-sm text-muted-foreground">全 {totalCount} 件の取引</div>
        </div>

        {/* フィルタ・検索バー */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  variant="filter"
                  placeholder="店名で検索..."
                  value={merchantSearch}
                  onChange={(e) => {
                    setMerchantSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectNative
                  variant="filter"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                >
                  <option value="">すべての年</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </SelectNative>
              </div>

              <div className="flex items-center gap-2">
                <SelectNative
                  variant="filter"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  <option value="">すべてのカテゴリ</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </SelectNative>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMerchantSearch("");
                    setSelectedYear(availableYears[0]?.toString() || "");
                    setSelectedCategory("");
                    setCurrentPage(1);
                  }}
                >
                  リセット
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 取引テーブル */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th
                    className="px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("transactionDate")}
                  >
                    <div className="flex items-center gap-1">
                      日付
                      {sortBy === "transactionDate" &&
                        (sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium text-sm">店名・内容</th>
                  <th className="px-4 py-3 font-medium text-sm">カテゴリ</th>
                  <th
                    className="px-4 py-3 font-medium text-sm text-right cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      金額
                      {sortBy === "amount" &&
                        (sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium text-sm text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4 h-12 bg-muted/20" colSpan={5} />
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                      取引データが見つかりません
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{t.merchant}</td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === t.id ? (
                          <div className="flex items-center gap-2">
                            <SelectNative
                              variant="filter"
                              value={editCategoryId}
                              onChange={(e) => setEditCategoryId(e.target.value)}
                              className="w-fit"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </SelectNative>
                            <button
                              onClick={() => handleUpdateCategory(t.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: t.categoryColor || "#B8B8B8" }}
                            />
                            <span>{t.categoryName || "未分類"}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => {
                            setEditingId(t.id);
                            setEditCategoryId(t.categoryId || "");
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {currentPage} / {totalPages} ページ
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50"
                >
                  前へ
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
