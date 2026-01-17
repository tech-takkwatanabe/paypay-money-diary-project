import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { ICsvUploadRepository } from "@/domain/repository/csvUploadRepository";
import { CsvService } from "@/service/transaction/csvService";

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
  constructor(
    private transactionRepository: ITransactionRepository,
    private csvUploadRepository: ICsvUploadRepository,
    private csvService: CsvService
  ) {}

  async execute(input: UploadCsvInput): Promise<UploadCsvResult> {
    const { userId, fileName, csvContent } = input;

    // 1. CSV をパース
    const parseResult = this.csvService.parseCsv(csvContent);

    // 2. アップロード履歴を保存
    const upload = await this.csvUploadRepository.create({
      userId,
      fileName,
      rawData: parseResult.rawData,
      rowCount: parseResult.totalRows,
      status: "processing",
    });

    // 3. カテゴリを割り当て
    const categoryMap = await this.csvService.assignCategories(parseResult.expenses, userId);

    // 4. 重複排除しながら支出データを保存
    let importedRows = 0;
    let duplicateRows = 0;

    for (const expense of parseResult.expenses) {
      try {
        // 重複チェック
        const exists = await this.transactionRepository.existsByExternalId(userId, expense.externalTransactionId);

        if (exists) {
          duplicateRows++;
          continue;
        }

        // 新規挿入
        await this.transactionRepository.create({
          userId,
          date: expense.transactionDate,
          description: expense.merchant,
          amount: expense.amount,
          categoryId: categoryMap.get(expense.merchant) ?? "",
          categoryName: "", // リポジトリ側で補完されるか、ここでは空で渡す
          categoryColor: "",
          displayOrder: 100,
          externalTransactionId: expense.externalTransactionId,
        });

        importedRows++;
      } catch (error) {
        // 重複エラーは無視（UNIQUE制約違反）
        if (error instanceof Error && error.message.includes("unique")) {
          duplicateRows++;
        } else {
          throw error;
        }
      }
    }

    // 5. アップロードステータスを更新
    await this.csvUploadRepository.updateStatus(upload.id, "processed");

    return {
      uploadId: upload.id,
      totalRows: parseResult.totalRows,
      importedRows,
      skippedRows: parseResult.skippedRows,
      duplicateRows,
    };
  }
}
