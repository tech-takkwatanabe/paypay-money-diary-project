"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { postTransactions } from "@/api/generated/transactions/transactions";
import { getCategories } from "@/api/generated/categories/categories";
import type { GetCategories200DataItem as Category } from "@/api/models";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Render a modal dialog to manually create an expense transaction.
 *
 * When opened, the component fetches available categories and preselects the first one if present.
 * Submitting the form posts a new transaction; on a successful creation it calls `onSuccess` and closes the modal.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param onSuccess - Callback invoked after a transaction is successfully created
 * @returns The JSX element for the manual entry modal
 */
export function ManualEntryModal({ isOpen, onClose, onSuccess }: ManualEntryModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await getCategories();
          if (response.status === 200 && "data" in response) {
            setCategories(response.data.data);
            if (response.data.data.length > 0) {
              setCategoryId(response.data.data[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch categories:", err);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await postTransactions({
        date: new Date(date).toISOString(),
        amount: parseInt(amount, 10),
        description,
        categoryId,
      });

      if (response.status === 201) {
        onSuccess();
        onClose();
        // Reset form
        setAmount("");
        setDescription("");
      } else {
        setError("保存に失敗しました。入力内容を確認してください。");
      }
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setError("エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>手動支出入力</DialogTitle>
          <DialogDescription>
            手動で支出データを登録します。支払い方法は自動的に「手動」として登録されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">金額 (円)</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">店名・内容</Label>
            <Input
              id="description"
              placeholder="スーパー、コンビニなど"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <SelectNative id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectNative>
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" variant="brand" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
