type AppLogoSize = "sm" | "md" | "lg";
type AppLogoVariant = "brand" | "white";

type AppLogoProps = {
  /** サイズバリアント: sm=ヘッダー, md=モバイルロゴ, lg=ブランドエリア */
  size?: AppLogoSize;
  /** 色バリアント: brand=グラデーション背景, white=白背景（暗色背景用） */
  variant?: AppLogoVariant;
  /** 追加のclassName（外側のコンテナに適用） */
  className?: string;
};

const ICON_SIZE_CLASSES: Record<AppLogoSize, string> = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-10 h-10 rounded-xl",
  lg: "w-12 h-12 rounded-xl",
};

const ICON_TEXT_CLASSES: Record<AppLogoSize, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

const TEXT_SIZE_CLASSES: Record<AppLogoSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

const ICON_BG_CLASSES: Record<AppLogoVariant, string> = {
  brand: "bg-linear-to-br from-red-500 to-pink-600",
  white: "bg-white",
};

const ICON_COLOR_CLASSES: Record<AppLogoVariant, string> = {
  brand: "text-white",
  white: "text-red-500",
};

/**
 * アプリ共通のロゴコンポーネント。
 *
 * ¥ アイコンと「PayPay 家計簿」テキストを表示する。
 * ヘッダー・ログイン・サインアップページで共通利用される。
 */
export const AppLogo = ({ size = "sm", variant = "brand", className = "" }: AppLogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${ICON_SIZE_CLASSES[size]} ${ICON_BG_CLASSES[variant]} flex items-center justify-center`}>
        <span className={`${ICON_COLOR_CLASSES[variant]} font-bold ${ICON_TEXT_CLASSES[size]}`}>¥</span>
      </div>
      <h1 className={`${TEXT_SIZE_CLASSES[size]} font-bold tracking-tight`}>PayPay 家計簿</h1>
    </div>
  );
};
