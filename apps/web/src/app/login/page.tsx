"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postAuthLogin } from "@/api/generated/auth/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { LoginSchema } from "@paypay-money-diary/shared";
import { ZodError } from "zod";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    try {
      // Zodバリデーション
      const validatedData = LoginSchema.parse({ email, password });

      setIsLoading(true);
      const response = await postAuthLogin(validatedData);

      if (response.status === 200) {
        await login();
        router.push("/");
      } else if ("data" in response && "error" in response.data) {
        setGeneralError(response.data.error);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        err.issues.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError("ログインに失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左側：ブランドエリア */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-red-500 via-red-600 to-pink-600 relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl" />
        </div>

        {/* コンテンツ */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <AppLogo size="lg" variant="white" className="mb-6" />
            <p className="text-xl text-white/90 leading-relaxed">
              あなたの支出を可視化して、
              <br />
              賢いお金の使い方を見つけよう
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-white/90">PayPay CSVを簡単インポート</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-white/90">カテゴリ別で支出を分析</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="text-white/90">月次レポートで傾向把握</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右側：ログインフォーム */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* モバイル用ロゴ */}
          <div className="lg:hidden mb-8 text-center">
            <AppLogo size="md" className="inline-flex mb-4" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">おかえりなさい</h2>
              <p className="text-gray-500 dark:text-gray-400">アカウントにログインしてください</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メールアドレス
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  パスワード
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              <Button type="submit" variant="brand" size="xl" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    ログイン中...
                  </span>
                ) : (
                  "ログイン"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                アカウントをお持ちでないですか？ <Link href="/signup">新規登録</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
