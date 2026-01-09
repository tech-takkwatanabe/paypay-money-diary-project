"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { postTransactionsUpload } from "@/api/generated/transactions/transactions";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadResult {
  message: string;
  processedCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("CSVファイルを選択してください");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv")) {
        setError("CSVファイルを選択してください");
        return;
      }
      setFile(droppedFile);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setError("");

    try {
      const response = await postTransactionsUpload({
        file: file,
      });

      if (response.status === 201 && "data" in response) {
        setStatus("success");
        setResult(response.data);
      } else if ("data" in response && "error" in response.data) {
        setStatus("error");
        setError(response.data.error);
      }
    } catch (_err) {
      setStatus("error");
      setError("アップロードに失敗しました。もう一度お試しください。");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-800 px-4 sm:px-6">
        <Link href="/" variant="ghost">
          <ArrowLeft className="h-5 w-5" />
          <span>ダッシュボードに戻る</span>
        </Link>
        <Link href="/expenses" variant="outline">
          支出一覧
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CSV アップロード</h1>
          <p className="text-gray-500 dark:text-gray-400">
            PayPayアプリからダウンロードしたCSVファイルをアップロードしてください
          </p>
        </div>

        {status === "success" && result ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">アップロード完了</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{result.message}</p>

                <div className="grid grid-cols-3 gap-4 mb-6 max-w-sm mx-auto text-left">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">処理件数</div>
                    <div className="text-lg font-bold">{result.processedCount}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">分類済</div>
                    <div className="text-lg font-bold text-green-500">{result.categorizedCount}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">未分類</div>
                    <div className="text-lg font-bold text-yellow-500">{result.uncategorizedCount}</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={handleReset} variant="outline">
                    別のファイルをアップロード
                  </Button>
                  <Button onClick={() => router.push("/")} variant="brand">
                    ダッシュボードを見る
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>ファイル選択</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ドロップエリア */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragOver ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"}
                `}
              >
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-2">ファイルをドラッグ＆ドロップ</p>
                    <p className="text-sm text-gray-400">または クリックしてファイルを選択</p>
                  </>
                )}
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* アップロードボタン */}
              <Button
                onClick={handleUpload}
                disabled={!file || status === "uploading"}
                variant="brand"
                size="xl"
                className="w-full mt-6"
              >
                {status === "uploading" ? (
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
                    アップロード中...
                  </span>
                ) : (
                  "アップロード"
                )}
              </Button>

              {/* 注意事項 */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">対応フォーマット</h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• PayPayアプリからエクスポートしたCSVファイル</li>
                  <li>• 文字コード: UTF-8 または Shift-JIS</li>
                  <li>• 重複データは自動でスキップされます</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
