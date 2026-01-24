import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortableCategoryItem } from "./SortableCategoryItem";
import type { GetCategories200DataItem as Category } from "@/api/models";

// Mock @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

// Mock @dnd-kit/utilities
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => "translate3d(0, 0, 0)"),
    },
  },
}));

describe("SortableCategoryItem", () => {
  const mockCategory: Category = {
    id: "1",
    icon: "",
    userId: "1",
    name: "Food",
    color: "#ff0000",
    displayOrder: 1,
    isDefault: false,
    isOther: false,
    hasRules: false,
    hasTransactions: false,
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it("renders category name and color correctly", () => {
    render(<SortableCategoryItem category={mockCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("Food")).toBeInTheDocument();
    const colorIndicator = screen.getByText("Food").previousSibling as HTMLElement;
    expect(colorIndicator).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
  });

  it("renders drag handle when not 'Other' category", () => {
    render(<SortableCategoryItem category={mockCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByLabelText("ドラッグして並び替え")).toBeInTheDocument();
  });

  it("disables drag handle for 'Other' category", () => {
    const otherCategory = { ...mockCategory, isOther: true, name: "その他" };
    render(<SortableCategoryItem category={otherCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.queryByLabelText("ドラッグして並び替え")).not.toBeInTheDocument();
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(<SortableCategoryItem category={mockCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.getAllByRole("button");
    const editBtn = buttons.find((b) => b.innerHTML.includes("lucide-pencil"));

    if (editBtn) {
      fireEvent.click(editBtn);
      expect(mockOnEdit).toHaveBeenCalledWith(mockCategory);
    } else {
      throw new Error("Edit button not found");
    }
  });

  it("hides edit button for 'Other' category", () => {
    const otherCategory = { ...mockCategory, isOther: true };
    render(<SortableCategoryItem category={otherCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.queryAllByRole("button");
    const editBtn = buttons.find((b) => b.innerHTML.includes("lucide-pencil"));
    expect(editBtn).toBeUndefined();
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<SortableCategoryItem category={mockCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.getAllByRole("button");
    const deleteBtn = buttons.find((b) => b.innerHTML.includes("lucide-trash2"));

    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      expect(mockOnDelete).toHaveBeenCalledWith(mockCategory.id, mockCategory.name);
    } else {
      throw new Error("Delete button not found");
    }
  });

  it("hides delete button for default categories", () => {
    const defaultCategory = { ...mockCategory, isDefault: true };
    render(<SortableCategoryItem category={defaultCategory} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.queryAllByRole("button");
    const deleteBtn = buttons.find((b) => b.innerHTML.includes("lucide-trash2"));
    expect(deleteBtn).toBeUndefined();
  });

  it("hides delete button when category has rules", () => {
    const categoryWithRules = { ...mockCategory, hasRules: true };
    render(<SortableCategoryItem category={categoryWithRules} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.queryAllByRole("button");
    const deleteBtn = buttons.find((b) => b.innerHTML.includes("lucide-trash2"));
    expect(deleteBtn).toBeUndefined();
  });

  it("hides delete button when category has transactions", () => {
    const categoryWithTransactions = { ...mockCategory, hasTransactions: true };
    render(<SortableCategoryItem category={categoryWithTransactions} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.queryAllByRole("button");
    const deleteBtn = buttons.find((b) => b.innerHTML.includes("lucide-trash2"));
    expect(deleteBtn).toBeUndefined();
  });
});
