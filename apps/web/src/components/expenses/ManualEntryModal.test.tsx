import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ManualEntryModal } from "./ManualEntryModal";
import { getCategories } from "@/api/generated/categories/categories";
import { postTransactions } from "@/api/generated/transactions/transactions";
import type { CategoryResponse as Category, TransactionResponse } from "@/api/models";

// Mock API functions
vi.mock("@/api/generated/categories/categories", () => ({
  getCategories: vi.fn(),
}));

vi.mock("@/api/generated/transactions/transactions", () => ({
  postTransactions: vi.fn(),
}));

describe("ManualEntryModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCategories: Category[] = [
    {
      id: "cat1",
      name: "Food",
      color: "#ff0000",
      icon: null,
      displayOrder: 1,
      isDefault: false,
      isOther: false,
      userId: "user1",
      hasRules: false,
      hasTransactions: false,
    },
    {
      id: "cat2",
      name: "Transport",
      color: "#0000ff",
      icon: null,
      displayOrder: 2,
      isDefault: false,
      isOther: false,
      userId: "user1",
      hasRules: false,
      hasTransactions: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCategories).mockResolvedValue({
      status: 200,
      data: { data: mockCategories },
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getCategories>>);
  });

  it("renders correctly when open", async () => {
    render(<ManualEntryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText("手動支出入力")).toBeInTheDocument();
    expect(screen.getByLabelText("日付")).toBeInTheDocument();
    expect(screen.getByLabelText("金額 (円)")).toBeInTheDocument();
    expect(screen.getByLabelText("店名・内容")).toBeInTheDocument();
    expect(screen.getByLabelText("カテゴリ")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("Transport")).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    render(<ManualEntryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Wait for categories to load to avoid act warning
    await waitFor(() => expect(screen.getByText("Food")).toBeInTheDocument());

    fireEvent.click(screen.getByText("キャンセル"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("submits the form successfully", async () => {
    const mockResponseData: TransactionResponse = {
      id: "tx1",
      userId: "user1",
      date: "2024-01-24",
      description: "Lunch",
      amount: 1500,
      categoryId: "cat1",
      categoryName: "Food",
      categoryColor: "#ff0000",
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(postTransactions).mockResolvedValue({
      status: 201,
      data: mockResponseData,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof postTransactions>>);

    render(<ManualEntryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Wait for categories to load
    await waitFor(() => expect(screen.getByText("Food")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("金額 (円)"), { target: { value: "1500" } });
    fireEvent.change(screen.getByLabelText("店名・内容"), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByLabelText("カテゴリ"), { target: { value: "cat1" } });

    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(postTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1500,
          description: "Lunch",
          categoryId: "cat1",
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error message on submission failure", async () => {
    // Suppress console.error for expected failure
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(postTransactions).mockResolvedValue({
      status: 400,
      data: { message: "Error" },
      headers: new Headers(),
    } as unknown as Awaited<ReturnType<typeof postTransactions>>);

    render(<ManualEntryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => expect(screen.getByText("Food")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("金額 (円)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("店名・内容"), { target: { value: "Test" } });

    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(screen.getByText("保存に失敗しました。入力内容を確認してください。")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("shows error message on API exception", async () => {
    // Suppress console.error for expected failure
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(postTransactions).mockRejectedValue(new Error("Network error"));

    render(<ManualEntryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => expect(screen.getByText("Food")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("金額 (円)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("店名・内容"), { target: { value: "Test" } });

    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(screen.getByText("エラーが発生しました。")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
