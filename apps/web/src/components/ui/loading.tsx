type LoadingProps = {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
  className?: string;
};

/**
 * ドットが動くローディングコンポーネント
 * 200msの遅延フェードインにより高速な読み込み時のチラつきを防止します。
 */
export const Loading = ({ size = "md", fullScreen = false, message, className = "" }: LoadingProps) => {
  // サイズに応じたドットのサイズとギャップを定義
  const sizeClasses = {
    sm: { dot: "w-1.5 h-1.5", gap: "gap-1" },
    md: { dot: "w-2 h-2", gap: "gap-1.5" },
    lg: { dot: "w-2.5 h-2.5", gap: "gap-2" },
  };

  const { dot, gap } = sizeClasses[size];

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message ?? "読み込み中"}
      data-testid="loading-indicator"
      className={`flex flex-col items-center justify-center loading-container ${className}`}
    >
      <div className={`flex ${gap}`}>
        <div className={`${dot} bg-black dark:bg-white rounded-full loading-dot`} style={{ animationDelay: "0ms" }} />
        <div className={`${dot} bg-black dark:bg-white rounded-full loading-dot`} style={{ animationDelay: "200ms" }} />
        <div className={`${dot} bg-black dark:bg-white rounded-full loading-dot`} style={{ animationDelay: "400ms" }} />
      </div>
      {message && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">{content}</div>;
  }

  return content;
};
