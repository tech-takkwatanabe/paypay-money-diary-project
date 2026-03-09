"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Upload } from "lucide-react";
import { NAV_LINKS } from "@/constants/navigation";

type MobileMenuProps = {
  /** ページ固有のアクションボタン群 */
  actions?: React.ReactNode;
  /** 現在のページパス（ナビリンクのハイライト用） */
  currentPath?: string;
  /** ログイン中のユーザー情報 */
  user: { name: string } | null;
  /** ログアウトハンドラー */
  onLogout: () => void;
};

/**
 * 1020px未満の画面幅で表示されるモバイルメニューコンポーネント。
 *
 * ハンバーガーアイコンをクリックすると右からスライドインするメニューを表示する。
 * オーバーレイクリックまたはEscキーで閉じる。
 */
export const MobileMenu = ({ actions, currentPath, user, onLogout }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // メニューが閉じられた時にフォーカスをボタンに戻す
  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // メニュー開閉時にbodyスクロールを無効化
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon-xl"
        onClick={() => setIsOpen(true)}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
      >
        <Menu className="size-8" strokeWidth={0.85} />
      </Button>

      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-250 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* スライドインパネル */}
      <nav
        id="mobile-menu-panel"
        role="navigation"
        aria-label="モバイルメニュー"
        aria-hidden={!isOpen}
        inert={!isOpen || undefined}
        className={`fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-background shadow-xl transition-transform duration-250 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* ヘッダー */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-sm font-medium text-foreground">{user?.name}</span>
          <Button variant="ghost" size="icon-xl" onClick={close} aria-label="メニューを閉じる">
            <X className="size-8" strokeWidth={0.85} />
          </Button>
        </div>

        {/* ナビリンク */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              variant="ghost"
              className={`justify-start rounded-lg px-3 py-3 text-base font-medium text-foreground ${currentPath === link.href ? "bg-red-50 text-red-600 dark:bg-red-900/20" : ""}`}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}

          {currentPath !== "/categories" && currentPath !== "/rules" && (
            <Link
              href="/upload"
              variant="ghost"
              className={`justify-start rounded-lg px-3 py-3 text-base font-medium text-foreground ${currentPath === "/upload" ? "bg-red-50 text-red-600 dark:bg-red-900/20" : ""}`}
              onClick={close}
            >
              <Upload className="h-4 w-4" />
              CSV アップロード
            </Link>
          )}

          {actions && <div className="mt-2 border-t pt-2">{actions}</div>}
        </div>

        {/* フッター */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-base font-bold text-foreground"
            onClick={() => {
              onLogout();
              close();
            }}
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </nav>
    </>
  );
};
