"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import type { GetCategories200DataItem as Category } from "@/api/models";

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
}

export function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: category.isOther, // 「その他」はドラッグ不可
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between py-4 bg-white dark:bg-gray-800 ${isDragging ? "shadow-lg rounded-lg border" : ""}`}
    >
      <div className="flex items-center gap-3">
        {!category.isOther ? (
          <button
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            aria-label="ドラッグして並び替え"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-1 text-gray-300 cursor-not-allowed">
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(category)}
          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {!category.isDefault && !category.hasRules && !category.hasTransactions && (
          <button
            onClick={() => onDelete(category.id, category.name)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
