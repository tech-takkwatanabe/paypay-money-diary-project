"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Loading } from "@/components/ui/loading";
import { Search, ChevronDown, ChevronUp, Filter, Pencil, Check, X, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { AppHeader } from "@/components/AppHeader";
import { ManualEntryModal } from "@/components/expenses/ManualEntryModal";
import {
  getTransactions,
  getTransactionsAvailableYears,
  putTransactionsId,
  deleteTransactionsId,
  type getTransactionsResponse,
} from "@/api/generated/transactions/transactions";
import { getCategories } from "@/api/generated/categories/categories";
import type { TransactionResponse as Transaction, CategoryResponse as CategoryWithSystem } from "@/api/models";

/**
 * Render the expenses page with UI for viewing and managing expenditure transactions.
 *
 * Provides listing with filtering (year, month, category, merchant), sorting, pagination,
 * inline editing (category and, for manual payments, amount), deletion of manual entries,
 * and a manual-entry modal.
 *
 * @returns The ExpensesPage React element.
 */
const ExpensesPage = () => {
  const { success, error: toastError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryWithSystem[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // フィルタ状態
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 編集状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");

  const limit = 50;

  // 初期データ取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [yearsRes, categoriesRes] = await Promise.all([getTransactionsAvailableYears(), getCategories()]);

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
      const response: getTransactionsResponse = await getTransactions({
        page: currentPage.toString(),
        limit: limit.toString(),
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
        categoryId: selectedCategory || undefined,
        search: merchantSearch || undefined,
        sortBy,
        sortOrder,
      });

      if (response.status === 200 && "data" in response) {
        setTransactions(response.data.data);
        setTotalCount(response.data.pagination.totalCount);
        setTotalAmount(response.data.pagination.totalAmount);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedYear, selectedMonth, selectedCategory, merchantSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (column: "date" | "amount") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleUpdateTransaction = async (id: string) => {
    try {
      // 現在のトランザクションを取得
      const currentTransaction = transactions.find((t) => t.id === id);
      if (!currentTransaction) return;

      if (!editCategoryId) {
        toastError("カテゴリを選択してください");
        return;
      }

      // 手動の場合のみ金額と店名・内容・日付を含める
      const updateData: { categoryId: string; amount?: number; description?: string; date?: string } = {
        categoryId: editCategoryId,
      };

      if (currentTransaction.paymentMethod === "手動") {
        if (editAmount !== "") {
          const amount = parseInt(editAmount, 10);
          if (!isNaN(amount)) {
            updateData.amount = amount;
          }
        }
        if (editDescription !== currentTransaction.description) {
          const normalizedDescription = editDescription.trim();
          if (normalizedDescription === "") {
            toastError("店名・内容を入力してください");
            return;
          }
          updateData.description = normalizedDescription;
        }
        // 日付の更新
        const currentDateStr = new Date(currentTransaction.date).toISOString().split("T")[0];
        if (editDate !== currentDateStr) {
          if (!editDate) {
            toastError("日付を入力してください");
            return;
          }
          updateData.date = new Date(editDate).toISOString();
        }
      }

      const response = await putTransactionsId(id, updateData);

      if (response.status === 200) {
        // ローカルの状態を更新
        setTransactions((prev) => prev.map((t) => (t.id === id ? (response.data as Transaction) : t)));
        setEditingId(null);
        success("取引を更新しました");
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toastError("更新に失敗しました");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("この取引を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await deleteTransactionsId(id);
      if (response.status === 204) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        // 総額や件数も更新するために再取得
        fetchTransactions();
        success("取引を削除しました");
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toastError("削除に失敗しました");
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
      <AppHeader
        currentPath="/expenses"
        actions={
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">手動入力</span>
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:px-6 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">支出一覧</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>全 {totalCount} 件の取引</div>
            <div className="h-4 w-px bg-border" />
            <div>
              支出総額: <span className="font-bold text-foreground">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* フィルタ・検索バー */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <div className="yearSelect flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectNative
                    variant="filter"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      if (e.target.value === "") {
                        setSelectedMonth("");
                      }
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
                {selectedYear && (
                  <div className="monthSelect flex items-center gap-2">
                    <SelectNative
                      variant="filter"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="flex-1"
                    >
                      <option value="">すべての月</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {month}月
                        </option>
                      ))}
                    </SelectNative>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  variant="filter"
                  placeholder="店名・内容 で検索..."
                  value={merchantSearch}
                  onChange={(e) => {
                    setMerchantSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
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
                {(() => {
                  const defaultYear = availableYears[0]?.toString() || "";
                  const isFilterApplied =
                    merchantSearch !== "" ||
                    selectedYear !== defaultYear ||
                    selectedMonth !== "" ||
                    selectedCategory !== "";

                  return (
                    isFilterApplied && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMerchantSearch("");
                          setSelectedYear(defaultYear);
                          setSelectedMonth("");
                          setSelectedCategory("");
                          setCurrentPage(1);
                        }}
                      >
                        リセット
                      </Button>
                    )
                  );
                })()}
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
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      日付
                      {sortBy === "date" &&
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
                  <tr>
                    <td className="px-4 py-8 text-center" colSpan={5}>
                      <Loading />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                      取引データが見つかりません
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        editingId === t.id ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {editingId === t.id && t.paymentMethod === "手動" ? (
                          <Input
                            type="date"
                            variant="filter"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateTransaction(t.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-32"
                          />
                        ) : (
                          formatDate(t.date)
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {editingId === t.id && t.paymentMethod === "手動" ? (
                          <Input
                            type="text"
                            variant="filter"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateTransaction(t.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full"
                          />
                        ) : (
                          t.description
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === t.id ? (
                          <div className="flex items-center gap-2">
                            <SelectNative
                              variant="filter"
                              value={editCategoryId}
                              onChange={(e) => setEditCategoryId(e.target.value)}
                              className="w-fit"
                            >
                              <option value="" disabled>
                                カテゴリを選択
                              </option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </SelectNative>
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
                      <td className="px-4 py-3 text-sm font-bold text-right">
                        {editingId === t.id && t.paymentMethod === "手動" ? (
                          <Input
                            type="number"
                            variant="filter"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateTransaction(t.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-24 text-right ml-auto"
                            step="1"
                            autoFocus
                          />
                        ) : (
                          formatCurrency(t.amount)
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          {editingId === t.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateTransaction(t.id)}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                title="保存"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="キャンセル"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(t.id);
                                  setEditCategoryId(t.categoryId || "");
                                  setEditAmount(t.amount.toString());
                                  setEditDescription(t.description);
                                  // YYYY-MM-DD 形式に変換
                                  setEditDate(new Date(t.date).toISOString().split("T")[0]);
                                }}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                title="編集"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {t.paymentMethod === "手動" && (
                                <button
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="削除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
      <ManualEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTransactions} />
    </div>
  );
};

export default ExpensesPage;
