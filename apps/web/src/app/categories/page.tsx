"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import {
  getCategories,
  postCategories,
  putCategoriesId,
  deleteCategoriesId,
  patchCategoriesReorder,
} from "@/api/generated/categories/categories";
import type { CategoryResponse as Category } from "@/api/models";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCategoryItem } from "@/components/categories/SortableCategoryItem";

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
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#ef4444",
    icon: "",
  });
  const [error, setError] = useState("");
  const [dragError, setDragError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        success("カテゴリを削除しました");
      } else if ("data" in response && "error" in response.data) {
        toastError(response.data.error);
      }
    } catch (_error) {
      toastError(
        "削除に失敗しました。このカテゴリを使用したルールまたは支出がある場合は、先にルールの変更や支出の付け替えを行ってください。"
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // 「その他」がドラッグされた場合は処理しない
    const activeCategory = categories.find((c) => c.id === active.id);
    if (activeCategory?.isOther) {
      setDragError("「その他」カテゴリは並び替えできません");
      setTimeout(() => setDragError(""), 3000);
      return;
    }

    // 「その他」がドロップ先として選ばれた場合も処理しない
    const overCategory = categories.find((c) => c.id === over?.id);
    if (overCategory?.isOther) {
      setDragError("「その他」カテゴリは並び替えできません");
      setTimeout(() => setDragError(""), 3000);
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      // 「その他」が移動されないように、または「その他」の位置を考慮
      const newCategories = arrayMove(categories, oldIndex, newIndex);

      // 「その他」を常に末尾にする
      const otherIndex = newCategories.findIndex((c) => c.isOther);
      if (otherIndex !== -1 && otherIndex !== newCategories.length - 1) {
        const other = newCategories.splice(otherIndex, 1)[0];
        newCategories.push(other);
      }

      setCategories(newCategories);

      try {
        // 「その他」を除外して API に送信
        const reorderableIds = newCategories.filter((c) => !c.isOther).map((c) => c.id);

        const response = await patchCategoriesReorder({
          categoryIds: reorderableIds,
        });

        // non-2xx レスポンスをチェック
        if (response.status < 200 || response.status >= 300) {
          const message =
            "data" in response && "error" in response.data ? response.data.error : "並び替えに失敗しました";
          throw new Error(message);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "並び替えに失敗しました";
        setDragError(errorMessage);
        console.error("Failed to reorder categories", err);
        // 失敗した場合は元に戻す
        await fetchCategories();
        // 3秒後にエラーメッセージを消す
        setTimeout(() => setDragError(""), 3000);
      }
    }
  };

  const startEdit = (category: Category) => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white dark:bg-gray-800 px-4 sm:px-6">
        <Link href="/" variant="ghost">
          <ArrowLeft className="h-5 w-5" />
          <span>ダッシュボードに戻る</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/expenses" variant="outline">
            支出一覧
          </Link>
          <Button variant="brand" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">カテゴリ管理</h1>
          <p className="text-gray-500 dark:text-gray-400">支出のカテゴリを管理します（ドラッグで並び替え可能）</p>
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
                  <Input
                    type="text"
                    variant="filter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        {/* カテゴリ一覧 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">カテゴリ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {dragError && <p className="text-sm text-red-500 mb-4">{dragError}</p>}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-gray-500 py-8">カテゴリはありません</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y dark:divide-gray-700">
                    {categories.map((category) => (
                      <div key={category.id}>
                        {editingId === category.id ? (
                          <div className="py-4 space-y-4">
                            <div className="flex gap-4">
                              <Input
                                type="text"
                                variant="filter"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                          <SortableCategoryItem category={category} onEdit={startEdit} onDelete={handleDelete} />
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
