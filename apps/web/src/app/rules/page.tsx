"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Loading } from "@/components/ui/loading";
import { AppHeader } from "@/components/AppHeader";
import { getRules, postRules, putRulesId, deleteRulesId } from "@/api/generated/rules/rules";
import { getCategories } from "@/api/generated/categories/categories";
import { postTransactionsReCategorize } from "@/api/generated/transactions/transactions";
import type { RuleResponse as Rule, CategoryResponse as CategoryWithSystem } from "@/api/models";

type RuleFormData = {
  keyword: string;
  categoryId: string;
  priority: number;
};

const RulesPage = () => {
  const { success, error: toastError } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<CategoryWithSystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    keyword: "",
    categoryId: "",
    priority: 0,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReCategorizing, setIsReCategorizing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, categoriesRes] = await Promise.all([getRules(), getCategories()]);

      if (rulesRes.status === 200 && "data" in rulesRes) {
        setRules(rulesRes.data.data);
      }
      if (categoriesRes.status === 200 && "data" in categoriesRes) {
        setCategories(categoriesRes.data.data);
        // デフォルトのカテゴリIDを設定
        if (categoriesRes.data.data.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({
            ...prev,
            categoryId: categoriesRes.data.data[0].id,
          }));
        }
      }
    } catch (_error) {
      console.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!formData.keyword.trim()) {
      setError("キーワードを入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await postRules({
        keyword: formData.keyword,
        categoryId: formData.categoryId,
        priority: formData.priority,
      });

      if (response.status === 201) {
        await fetchData();
        setShowForm(false);
        setFormData({
          keyword: "",
          categoryId: categories[0]?.id || "",
          priority: 0,
        });
      } else if ("data" in response && "error" in response.data) {
        setError(response.data.error);
      }
    } catch (_error) {
      setError("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.keyword.trim()) {
      setError("キーワードを入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await putRulesId(id, {
        keyword: formData.keyword,
        categoryId: formData.categoryId,
        priority: formData.priority,
      });

      if (response.status === 200) {
        await fetchData();
        setEditingId(null);
      } else if ("data" in response && "error" in response.data) {
        setError(response.data.error);
      }
    } catch (_error) {
      setError("更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`キーワード「${keyword}」のルールを削除しますか？`)) return;

    try {
      const response = await deleteRulesId(id);
      if (response.status === 200) {
        await fetchData();
        success("ルールを削除しました");
      } else if ("data" in response && "error" in response.data) {
        toastError(response.data.error);
      }
    } catch (_error) {
      toastError("削除に失敗しました");
    }
  };

  const handleReCategorize = async () => {
    if (!confirm("現在のルールに基づいてすべての取引を再分類しますか？")) return;

    setIsReCategorizing(true);
    try {
      const response = await postTransactionsReCategorize({});
      if (response.status === 200) {
        success("再分類が完了しました");
      } else {
        toastError("再分類に失敗しました");
      }
    } catch (_error) {
      toastError("エラーが発生しました");
    } finally {
      setIsReCategorizing(false);
    }
  };

  const startEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setFormData({
      keyword: rule.keyword,
      categoryId: rule.categoryId,
      priority: rule.priority,
    });
    setShowForm(false);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const startCreate = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({
      keyword: "",
      categoryId: categories[0]?.id || "",
      priority: 0,
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader
        currentPath="/rules"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReCategorize} disabled={isReCategorizing}>
              <RefreshCw className={`h-4 w-4 ${isReCategorizing ? "animate-spin" : ""}`} />
              一括再分類
            </Button>
            <Button variant="brand" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">カテゴリルール管理</h1>
          <p className="text-gray-500 dark:text-gray-400">店名などのキーワードに基づいて自動でカテゴリを振り分けます</p>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">新規ルール作成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-rule-keyword" className="block text-sm font-medium mb-2">
                      キーワード
                    </label>
                    <Input
                      id="new-rule-keyword"
                      type="text"
                      variant="filter"
                      value={formData.keyword}
                      onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                      placeholder="例: セブンイレブン"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-rule-category" className="block text-sm font-medium mb-2">
                      カテゴリ
                    </label>
                    <SelectNative
                      id="new-rule-category"
                      variant="filter"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </SelectNative>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <Button onClick={handleCreate} variant="brand" disabled={isSubmitting}>
                    {isSubmitting ? "作成中..." : "作成"}
                  </Button>
                  <Button onClick={() => setShowForm(false)} variant="outline">
                    キャンセル
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ルール一覧 */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            ) : rules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">ルールはまだありません</p>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {rules.map((rule) => (
                  <div key={rule.id} className="py-4">
                    {editingId === rule.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            id={`edit-rule-keyword-${rule.id}`}
                            aria-label="キーワードを編集"
                            type="text"
                            variant="filter"
                            value={formData.keyword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                keyword: e.target.value,
                              })
                            }
                          />
                          <SelectNative
                            id={`edit-rule-category-${rule.id}`}
                            aria-label="カテゴリを編集"
                            variant="filter"
                            value={formData.categoryId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                categoryId: e.target.value,
                              })
                            }
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </SelectNative>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(rule.id)}
                            disabled={isSubmitting}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          <div className="min-w-[120px]">
                            <span className="text-sm text-gray-400 block">キーワード</span>
                            <span className="font-medium">{rule.keyword}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400 block">カテゴリ</span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                              {rule.categoryName}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(rule)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id, rule.keyword)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RulesPage;
