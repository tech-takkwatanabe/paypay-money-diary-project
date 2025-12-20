"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories, postCategories, putCategoriesId, deleteCategoriesId } from "@/api/generated/category/category";
import type { CategoryWithSystem } from "@/api/models";

// プリセットカラー
const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#6b7280",
  "#64748b",
];

interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#ef4444",
    icon: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.status === 200 && "data" in response) {
        setCategories(response.data.data);
      }
    } catch (_error) {
      console.error("Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("カテゴリ名を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await postCategories({
        name: formData.name,
        color: formData.color,
        icon: formData.icon || undefined,
      });

      if (response.status === 201) {
        await fetchCategories();
        setShowForm(false);
        setFormData({ name: "", color: "#ef4444", icon: "" });
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
    if (!formData.name.trim()) {
      setError("カテゴリ名を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await putCategoriesId(id, {
        name: formData.name,
        color: formData.color,
        icon: formData.icon || null,
      });

      if (response.status === 200) {
        await fetchCategories();
        setEditingId(null);
        setFormData({ name: "", color: "#ef4444", icon: "" });
      } else if ("data" in response && "error" in response.data) {
        setError(response.data.error);
      }
    } catch (_error) {
      setError("更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;

    try {
      const response = await deleteCategoriesId(id);
      if (response.status === 200) {
        await fetchCategories();
      } else if ("data" in response && "error" in response.data) {
        alert(response.data.error);
      }
    } catch (_error) {
      alert("削除に失敗しました");
    }
  };

  const startEdit = (category: CategoryWithSystem) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || "",
    });
    setShowForm(false);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", color: "#ef4444", icon: "" });
    setError("");
  };

  const startCreate = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({ name: "", color: "#ef4444", icon: "" });
    setError("");
  };

  // システムカテゴリとユーザーカテゴリを分離
  const systemCategories = categories.filter((c) => c.isSystem);
  const userCategories = categories.filter((c) => !c.isSystem);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white dark:bg-gray-800 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>ダッシュボードに戻る</span>
        </Link>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-red-500 to-pink-600 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">カテゴリ管理</h1>
          <p className="text-gray-500 dark:text-gray-400">支出のカテゴリを管理します</p>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">新規カテゴリ作成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">カテゴリ名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="例: 趣味"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">色</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? "作成中..." : "作成"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ユーザーカテゴリ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">マイカテゴリ</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : userCategories.length === 0 ? (
              <p className="text-center text-gray-500 py-8">カスタムカテゴリはありません</p>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {userCategories.map((category) => (
                  <div key={category.id} className="py-4">
                    {editingId === category.id ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setFormData({ ...formData, color })}
                              className={`w-6 h-6 rounded-full transition-transform ${formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(category.id)}
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
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
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

        {/* システムカテゴリ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">システムカテゴリ</CardTitle>
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y dark:divide-gray-700">
              {systemCategories.map((category) => (
                <div key={category.id} className="py-4 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-gray-400">(編集不可)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
