"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";

type AppHeaderProps = {
  /** 右側に表示するページ固有のアクションボタン群 */
  actions?: React.ReactNode;
  /** 現在のページパス（ナビリンクのハイライト用） */
  currentPath?: string;
};

const NAV_LINKS = [
  { href: "/expenses", label: "支出一覧" },
  { href: "/categories", label: "カテゴリ" },
  { href: "/rules", label: "ルール" },
] as const;

/**
 * アプリ全体で使用する共通ヘッダーコンポーネント。
 *
 * ロゴ、ナビゲーションリンク、CSVアップロードリンク、ページ固有アクション、
 * ユーザー名表示、ログアウトボタンを含む。
 */
export const AppHeader = ({ actions, currentPath }: AppHeaderProps) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {currentPath === "/" ? (
          <>
            <div className="w-8 h-8 bg-linear-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">¥</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">PayPay 家計簿</h1>
          </>
        ) : (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">¥</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">PayPay 家計簿</h1>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            variant="outline"
            className={currentPath === link.href ? "text-red-600 bg-red-50 dark:bg-red-900/20" : ""}
          >
            {link.label}
          </Link>
        ))}
        {currentPath !== "/categories" && currentPath !== "/rules" && (
          <Link
            href="/upload"
            variant="brand"
            className={currentPath === "/upload" ? "opacity-80 ring-2 ring-red-300" : ""}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">CSV アップロード</span>
          </Link>
        )}
        {actions}
        <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">ログアウト</span>
        </Button>
      </div>
    </header>
  );
};
