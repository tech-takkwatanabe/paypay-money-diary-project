import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

/**
 * シンプルで目覚ましくない、おしゃれなローディングコンポーネント
 * 200msの遅延フェードインにより高速な読み込み時のチラつきを防止します。
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
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        animation: "fade-in 0.3s ease-in-out forwards",
        animationDelay: "200ms",
        opacity: 0,
      }}
    >
      <div className={`flex ${gap}`}>
        <div
          className={`${dot} bg-black rounded-full`}
          style={{
            animation: "bounce-dot 1.4s ease-in-out infinite",
            animationDelay: "0ms",
          }}
        />
        <div
          className={`${dot} bg-black rounded-full`}
          style={{
            animation: "bounce-dot 1.4s ease-in-out infinite",
            animationDelay: "200ms",
          }}
        />
        <div
          className={`${dot} bg-black rounded-full`}
          style={{
            animation: "bounce-dot 1.4s ease-in-out infinite",
            animationDelay: "400ms",
          }}
        />
      </div>
      {message && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bounce-dot {
              0%,
              80%,
              100% {
                transform: translateY(0) scale(1);
                opacity: 0.7;
              }
              40% {
                transform: translateY(-12px) scale(1.1);
                opacity: 1;
              }
            }
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `,
        }}
      />
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">{content}</div>;
  }

  return content;
}
