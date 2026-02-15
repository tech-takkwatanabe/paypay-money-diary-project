import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "./AppHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import type { User } from "@/api/models";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock API functions
const mockGetAuthMe = vi.fn();
const mockPostAuthLogout = vi.fn();

vi.mock("@/api/generated/auth/auth", () => ({
  getAuthMe: () => mockGetAuthMe(),
  postAuthLogout: () => mockPostAuthLogout(),
}));

const mockUser: User = {
  id: "user-123",
  name: "テストユーザー",
  email: "test@example.com",
};

const renderWithAuth = (ui: React.ReactNode) => {
  mockGetAuthMe.mockResolvedValue({ status: 200, data: mockUser });
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ロゴとブランド", () => {
    it("PayPay 家計簿のロゴテキストを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("PayPay 家計簿")).toBeInTheDocument();
    });

    it("¥アイコンを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("¥")).toBeInTheDocument();
    });

    it("currentPath='/' の場合ロゴがリンクでない", () => {
      renderWithAuth(<AppHeader currentPath="/" />);
      const logo = screen.getByText("PayPay 家計簿");
      // h1 は直接の親でリンクに囲まれていない
      expect(logo.closest("a")).toBeNull();
    });

    it("currentPath が '/' 以外の場合ロゴがリンクになる", () => {
      renderWithAuth(<AppHeader currentPath="/expenses" />);
      const logo = screen.getByText("PayPay 家計簿");
      const link = logo.closest("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/");
    });
  });

  describe("ナビゲーションリンク", () => {
    it("支出一覧リンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("支出一覧")).toBeInTheDocument();
    });

    it("カテゴリリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("カテゴリ")).toBeInTheDocument();
    });

    it("ルールリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("ルール")).toBeInTheDocument();
    });

    it("現在のパスのリンクにハイライトクラスが適用される", () => {
      renderWithAuth(<AppHeader currentPath="/expenses" />);
      const expensesLink = screen.getByText("支出一覧").closest("a");
      expect(expensesLink?.className).toContain("text-red-600");
    });

    it("現在のパスでないリンクにはハイライトクラスが適用されない", () => {
      renderWithAuth(<AppHeader currentPath="/expenses" />);
      const categoriesLink = screen.getByText("カテゴリ").closest("a");
      expect(categoriesLink?.className).not.toContain("text-red-600");
    });
  });

  describe("CSV アップロードリンク", () => {
    it("CSV アップロードリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("CSV アップロード")).toBeInTheDocument();
    });

    it("currentPath='/categories' の場合は CSV アップロードを非表示にする", () => {
      renderWithAuth(<AppHeader currentPath="/categories" />);
      expect(screen.queryByText("CSV アップロード")).not.toBeInTheDocument();
    });

    it("currentPath='/rules' の場合は CSV アップロードを非表示にする", () => {
      renderWithAuth(<AppHeader currentPath="/rules" />);
      expect(screen.queryByText("CSV アップロード")).not.toBeInTheDocument();
    });
  });

  describe("actions prop", () => {
    it("actions を渡すとレンダリングされる", () => {
      renderWithAuth(<AppHeader actions={<button data-testid="custom-action">カスタムアクション</button>} />);
      expect(screen.getByTestId("custom-action")).toBeInTheDocument();
      expect(screen.getByText("カスタムアクション")).toBeInTheDocument();
    });

    it("actions を渡さない場合もエラーにならない", () => {
      renderWithAuth(<AppHeader />);
      // ヘッダーが正常にレンダリングされている
      expect(screen.getByText("PayPay 家計簿")).toBeInTheDocument();
    });
  });

  describe("ログアウトボタン", () => {
    it("ログアウトボタンを表示する", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByText("ログアウト")).toBeInTheDocument();
    });

    it("ログアウトボタンクリックで logout が呼ばれる", async () => {
      mockPostAuthLogout.mockResolvedValue({ status: 200 });

      renderWithAuth(<AppHeader />);

      const user = userEvent.setup();
      const logoutButton = screen.getByText("ログアウト");
      await user.click(logoutButton);

      expect(mockPostAuthLogout).toHaveBeenCalled();
    });
  });
});
