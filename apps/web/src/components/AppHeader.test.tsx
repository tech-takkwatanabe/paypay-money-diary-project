import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

/**
 * デスクトップメニュー領域のコンテナを取得するヘルパー。
 * モバイルメニューにも同じテキストが存在するため、スコープを限定して検索する。
 */
const getDesktopMenu = () => within(screen.getByTestId("desktop-menu"));

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

  describe("ナビゲーションリンク（デスクトップ）", () => {
    it("支出一覧リンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("支出一覧")).toBeInTheDocument();
    });

    it("カテゴリリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("カテゴリ")).toBeInTheDocument();
    });

    it("ルールリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("ルール")).toBeInTheDocument();
    });

    it("現在のパスのリンクにハイライトクラスが適用される", () => {
      renderWithAuth(<AppHeader currentPath="/expenses" />);
      const desktop = getDesktopMenu();
      const expensesLink = desktop.getByText("支出一覧").closest("a");
      expect(expensesLink?.className).toContain("text-red-600");
    });

    it("現在のパスでないリンクにはハイライトクラスが適用されない", () => {
      renderWithAuth(<AppHeader currentPath="/expenses" />);
      const desktop = getDesktopMenu();
      const categoriesLink = desktop.getByText("カテゴリ").closest("a");
      expect(categoriesLink?.className).not.toContain("text-red-600");
    });
  });

  describe("CSV アップロードリンク（デスクトップ）", () => {
    it("CSV アップロードリンクを表示する", () => {
      renderWithAuth(<AppHeader />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("CSV アップロード")).toBeInTheDocument();
    });

    it("currentPath='/categories' の場合は CSV アップロードを非表示にする", () => {
      renderWithAuth(<AppHeader currentPath="/categories" />);
      const desktop = getDesktopMenu();
      expect(desktop.queryByText("CSV アップロード")).not.toBeInTheDocument();
    });

    it("currentPath='/rules' の場合は CSV アップロードを非表示にする", () => {
      renderWithAuth(<AppHeader currentPath="/rules" />);
      const desktop = getDesktopMenu();
      expect(desktop.queryByText("CSV アップロード")).not.toBeInTheDocument();
    });
  });

  describe("actions prop", () => {
    it("actions を渡すとレンダリングされる", () => {
      renderWithAuth(<AppHeader actions={<button data-testid="custom-action">カスタムアクション</button>} />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("カスタムアクション")).toBeInTheDocument();
    });

    it("actions を渡さない場合もエラーにならない", () => {
      renderWithAuth(<AppHeader />);
      // ヘッダーが正常にレンダリングされている
      expect(screen.getByText("PayPay 家計簿")).toBeInTheDocument();
    });
  });

  describe("ログアウトボタン（デスクトップ）", () => {
    it("ログアウトボタンを表示する", () => {
      renderWithAuth(<AppHeader />);
      const desktop = getDesktopMenu();
      expect(desktop.getByText("ログアウト")).toBeInTheDocument();
    });

    it("ログアウトボタンクリックで logout が呼ばれる", async () => {
      mockPostAuthLogout.mockResolvedValue({ status: 200 });

      renderWithAuth(<AppHeader />);

      const user = userEvent.setup();
      const desktop = getDesktopMenu();
      const logoutButton = desktop.getByText("ログアウト");
      await user.click(logoutButton);

      expect(mockPostAuthLogout).toHaveBeenCalled();
    });
  });

  describe("モバイルメニュー", () => {
    it("ハンバーガーボタンが表示される", () => {
      renderWithAuth(<AppHeader />);
      expect(screen.getByLabelText("メニューを開く")).toBeInTheDocument();
    });
  });
});
