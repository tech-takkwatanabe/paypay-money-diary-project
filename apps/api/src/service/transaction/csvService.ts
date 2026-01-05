import { parsePayPayCsv, ParsedExpense } from "@/infrastructure/csv/paypayParser";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";

export class CsvService {
  constructor(
    private ruleRepository: IRuleRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  /**
   * CSVコンテンツをパース
   */
  parseCsv(csvContent: string) {
    return parsePayPayCsv(csvContent);
  }

  /**
   * 支出データにカテゴリを割り当て
   */
  async assignCategories(expenses: ParsedExpense[], userId: string): Promise<Map<string, string | null>> {
    const rules = await this.ruleRepository.findByUserId(userId);
    const categories = await this.categoryRepository.findByUserId(userId);
    const defaultCategory = categories.find((c) => c.name === "その他");
    const defaultCategoryId = defaultCategory?.id ?? null;

    const result = new Map<string, string | null>();

    for (const expense of expenses) {
      if (result.has(expense.merchant)) continue;

      const matchedRule = rules.find((rule) => expense.merchant.toLowerCase().includes(rule.keyword.toLowerCase()));

      result.set(expense.merchant, matchedRule?.categoryId ?? defaultCategoryId);
    }

    return result;
  }
}
