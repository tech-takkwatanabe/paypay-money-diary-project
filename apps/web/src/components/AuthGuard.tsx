"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

// 認証不要なパス
const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicPath) {
      // 未認証でプライベートページにアクセス → ログインへリダイレクト
      router.push("/login");
    } else if (isAuthenticated && isPublicPath) {
      // 認証済みでログイン/サインアップページにアクセス → ホームへリダイレクト
      router.push("/");
    }
  }, [isAuthenticated, isLoading, isPublicPath, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証でプライベートページ → 何も表示しない (リダイレクト中)
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  // 認証済みでパブリックページ → 何も表示しない (リダイレクト中)
  if (isAuthenticated && isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
