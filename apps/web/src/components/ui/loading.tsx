import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

/**
 * シンプルで目立たないローディングコンポーネント
 * 3つのドットが順番にバウンスするアニメーション
 */
export function Loading({ size = "md", fullScreen = false, message, className = "" }: LoadingProps) {
  // サイズに応じたドットのサイズとギャップを定義
  const sizeClasses = {
    sm: { dot: "w-1.5 h-1.5", gap: "gap-1" },
    md: { dot: "w-2 h-2", gap: "gap-1.5" },
    lg: { dot: "w-2.5 h-2.5", gap: "gap-2" },
  };

  const { dot, gap } = sizeClasses[size];

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex ${gap}`}>
        <div className={`${dot} bg-red-500 rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
        <div className={`${dot} bg-red-500 rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
        <div className={`${dot} bg-red-500 rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
      </div>
      {message && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">{content}</div>;
  }

  return content;
}
