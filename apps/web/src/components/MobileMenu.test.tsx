import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu } from "./MobileMenu";

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

const mockUser = { name: "テストユーザー" };
const mockOnLogout = vi.fn();

describe("MobileMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("ハンバーガーボタンが表示される", () => {
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);
    expect(screen.getByLabelText("メニューを開く")).toBeInTheDocument();
  });

  it("ボタンクリックでメニューが開く", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.getByLabelText("メニューを閉じる")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "モバイルメニュー" })).toBeInTheDocument();
  });

  it("閉じるボタンでメニューが閉じる", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));
    await user.click(screen.getByLabelText("メニューを閉じる"));

    // メニューパネルはtranslate-x-fullで画面外になる
    const nav = screen.getByRole("navigation", { name: "モバイルメニュー" });
    expect(nav.className).toContain("translate-x-full");
  });

  it("Escキーでメニューが閉じる", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));
    await user.keyboard("{Escape}");

    const nav = screen.getByRole("navigation", { name: "モバイルメニュー" });
    expect(nav.className).toContain("translate-x-full");
  });

  it("メニュー内にナビリンクが表示される", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.getByText("支出一覧")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ")).toBeInTheDocument();
    expect(screen.getByText("ルール")).toBeInTheDocument();
  });

  it("CSVアップロードリンクが表示される", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.getByText("CSV アップロード")).toBeInTheDocument();
  });

  it("currentPath=/categories の場合CSVアップロードが非表示", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} currentPath="/categories" />);

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.queryByText("CSV アップロード")).not.toBeInTheDocument();
  });

  it("currentPath でリンクにハイライトが適用される", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} currentPath="/expenses" />);

    await user.click(screen.getByLabelText("メニューを開く"));

    const expensesLink = screen.getByText("支出一覧").closest("a");
    expect(expensesLink?.className).toContain("text-red-600");
  });

  it("ユーザー名が表示される", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
  });

  it("ログアウトボタンクリックで onLogout が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));
    await user.click(screen.getByText("ログアウト"));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it("メニューが開くとbodyスクロールが無効化される", async () => {
    const user = userEvent.setup();
    render(<MobileMenu user={mockUser} onLogout={mockOnLogout} />);

    await user.click(screen.getByLabelText("メニューを開く"));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByLabelText("メニューを閉じる"));
    expect(document.body.style.overflow).toBe("");
  });

  it("actions が渡されるとメニュー内に表示される", async () => {
    const user = userEvent.setup();
    render(
      <MobileMenu
        user={mockUser}
        onLogout={mockOnLogout}
        actions={<button data-testid="custom-action">カスタムアクション</button>}
      />
    );

    await user.click(screen.getByLabelText("メニューを開く"));

    expect(screen.getByTestId("custom-action")).toBeInTheDocument();
  });
});
