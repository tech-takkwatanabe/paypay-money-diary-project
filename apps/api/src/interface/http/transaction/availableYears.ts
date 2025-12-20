/**
 * 利用可能な年リスト取得 API ハンドラー
 * csv_uploads.file_name から年を抽出
 */

import { Context } from "hono";
import { db } from "@/db";
import { csvUploads } from "@/db/schema";
import { eq } from "drizzle-orm";

// ファイル名から年を抽出 (例: Transactions_20240101-20241231.csv → [2024])
const extractYearsFromFileName = (fileName: string): number[] => {
  // パターン: Transactions_YYYYMMDD-YYYYMMDD.csv
  const match = fileName.match(/(\d{4})\d{4}-(\d{4})\d{4}/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    // startYear から endYear までの年を返す
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }
  return [];
};

export const getAvailableYearsHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // ユーザーのCSVアップロード履歴を取得
    const uploads = await db
      .select({ fileName: csvUploads.fileName })
      .from(csvUploads)
      .where(eq(csvUploads.userId, userPayload.userId));

    // ファイル名から年を抽出してユニークにする
    const yearsSet = new Set<number>();
    for (const upload of uploads) {
      const years = extractYearsFromFileName(upload.fileName);
      years.forEach((y) => yearsSet.add(y));
    }

    // 降順でソート
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // 最小年は2023 (PayPayの仕様)
    const filteredYears = availableYears.filter((y) => y >= 2023);

    return c.json({
      years:
        filteredYears.length > 0 ? filteredYears : [new Date().getFullYear()],
    });
  } catch (error) {
    console.error("Get available years error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
