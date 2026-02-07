"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

type AuthGuardProps = {
  children: React.ReactNode;
};

// 認証不要なパス
const PUBLIC_PATHS = ["/login", "/signup"];

export const AuthGuard = ({ children }: AuthGuardProps) => {
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
    return <Loading fullScreen message="読み込み中..." size="lg" />;
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
};
