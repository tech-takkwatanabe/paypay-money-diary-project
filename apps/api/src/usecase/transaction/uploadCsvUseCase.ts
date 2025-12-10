/**
 * CSV アップロードユースケース
 * CSVファイルをパースし、支出データをDBに保存する
 */

import { db } from '@/db';
import { csvUploads, expenses } from '@/db/schema';
import { parsePayPayCsv } from '@/infrastructure/csv/paypayParser';
import { assignCategories } from '@/infrastructure/csv/categoryClassifier';
import { eq, and } from 'drizzle-orm';

export interface UploadCsvInput {
	userId: string;
	fileName: string;
	csvContent: string;
}

export interface UploadCsvResult {
	uploadId: string;
	totalRows: number;
	importedRows: number;
	skippedRows: number;
	duplicateRows: number;
}

export class UploadCsvUseCase {
	async execute(input: UploadCsvInput): Promise<UploadCsvResult> {
		const { userId, fileName, csvContent } = input;

		// 1. CSV をパース
		const parseResult = parsePayPayCsv(csvContent);

		// 2. アップロード履歴を保存
		const [upload] = await db
			.insert(csvUploads)
			.values({
				userId,
				fileName,
				rawData: parseResult.rawData,
				rowCount: parseResult.totalRows,
				status: 'processing',
			})
			.returning();

		// 3. カテゴリを割り当て
		const categoryMap = await assignCategories(parseResult.expenses, userId);

		// 4. 重複排除しながら支出データを保存
		let importedRows = 0;
		let duplicateRows = 0;

		for (const expense of parseResult.expenses) {
			try {
				// 重複チェック（同じ取引番号が存在するか）
				const existing = await db
					.select({ id: expenses.id })
					.from(expenses)
					.where(and(eq(expenses.userId, userId), eq(expenses.externalTransactionId, expense.externalTransactionId)))
					.limit(1);

				if (existing.length > 0) {
					duplicateRows++;
					continue;
				}

				// 新規挿入
				await db.insert(expenses).values({
					userId,
					uploadId: upload.id,
					transactionDate: expense.transactionDate,
					amount: expense.amount,
					merchant: expense.merchant,
					categoryId: categoryMap.get(expense.merchant) ?? null,
					paymentMethod: expense.paymentMethod,
					externalTransactionId: expense.externalTransactionId,
				});

				importedRows++;
			} catch (error) {
				// 重複エラーは無視（UNIQUE制約違反）
				if (error instanceof Error && error.message.includes('unique')) {
					duplicateRows++;
				} else {
					throw error;
				}
			}
		}

		// 5. アップロードステータスを更新
		await db.update(csvUploads).set({ status: 'processed' }).where(eq(csvUploads.id, upload.id));

		return {
			uploadId: upload.id,
			totalRows: parseResult.totalRows,
			importedRows,
			skippedRows: parseResult.skippedRows,
			duplicateRows,
		};
	}
}
