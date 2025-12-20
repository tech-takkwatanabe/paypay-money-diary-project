/**
 * CSV アップロード API ハンドラー
 */

import { Context } from "hono";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";

export const uploadCsvHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // multipart/form-data からファイルを取得
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    // ファイル名の検証
    if (!file.name.endsWith(".csv")) {
      return c.json({ error: "Only CSV files are allowed" }, 400);
    }

    // ファイル内容を読み込み
    const csvContent = await file.text();

    const uploadCsvUseCase = new UploadCsvUseCase();
    const result = await uploadCsvUseCase.execute({
      userId: userPayload.userId,
      fileName: file.name,
      csvContent,
    });

    return c.json(
      {
        message: "CSV uploaded successfully",
        uploadId: result.uploadId,
        totalRows: result.totalRows,
        importedRows: result.importedRows,
        skippedRows: result.skippedRows,
        duplicateRows: result.duplicateRows,
      },
      201,
    );
  } catch (error) {
    console.error("CSV upload error:", error);

    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ error: "Internal Server Error" }, 500);
  }
};
