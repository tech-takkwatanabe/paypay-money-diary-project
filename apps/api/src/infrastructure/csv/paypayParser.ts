/**
 * PayPay CSV パーサー
 * PayPayの取引履歴CSVを解析し、支出データを抽出する
 */

export interface PayPayCsvRow {
  transactionDate: string; // 取引日
  withdrawalAmount: string; // 出金金額（円）
  depositAmount: string; // 入金金額（円）
  foreignAmount: string; // 海外出金金額
  currency: string; // 通貨
  exchangeRate: string; // 変換レート（円）
  country: string; // 利用国
  transactionType: string; // 取引内容
  merchant: string; // 取引先
  paymentMethod: string; // 取引方法
  paymentCategory: string; // 支払い区分
  user: string; // 利用者
  transactionId: string; // 取引番号
}

export interface ParsedExpense {
  transactionDate: Date;
  amount: number;
  merchant: string;
  paymentMethod: string;
  externalTransactionId: string;
}

export interface CsvParseResult {
  expenses: ParsedExpense[];
  rawData: PayPayCsvRow[];
  totalRows: number;
  expenseRows: number;
  skippedRows: number;
}

/**
 * CSVテキストを行に分割（クォート内のカンマを考慮）
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * 金額文字列を数値に変換（カンマ除去）
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr === "-") {
    return 0;
  }
  // カンマとクォートを除去
  const cleaned = amountStr.replace(/[,"\s]/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * PayPay CSV の日付文字列をDateオブジェクトに変換
 * 形式: "2024/12/31 14:46:28"
 */
function parseDate(dateStr: string): Date {
  // "2024/12/31 14:46:28" -> Date
  const [datePart, timePart] = dateStr.split(" ");
  const [year, month, day] = datePart.split("/").map(Number);

  if (timePart) {
    const [hour, minute, second] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }

  return new Date(year, month - 1, day);
}

/**
 * PayPay CSV をパースして支出データを抽出
 */
export function parsePayPayCsv(csvContent: string): CsvParseResult {
  // BOM を除去
  const content = csvContent.replace(/^\uFEFF/, "");

  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // ヘッダー行をスキップ
  const dataLines = lines.slice(1);

  const rawData: PayPayCsvRow[] = [];
  const expenses: ParsedExpense[] = [];
  let skippedRows = 0;

  for (const line of dataLines) {
    const columns = parseCsvLine(line);

    if (columns.length < 13) {
      skippedRows++;
      continue;
    }

    const row: PayPayCsvRow = {
      transactionDate: columns[0],
      withdrawalAmount: columns[1],
      depositAmount: columns[2],
      foreignAmount: columns[3],
      currency: columns[4],
      exchangeRate: columns[5],
      country: columns[6],
      transactionType: columns[7],
      merchant: columns[8],
      paymentMethod: columns[9],
      paymentCategory: columns[10],
      user: columns[11],
      transactionId: columns[12],
    };

    rawData.push(row);

    // 「支払い」のみを抽出（ポイント獲得などは除外）
    if (row.transactionType === "支払い" && parseAmount(row.withdrawalAmount) > 0) {
      expenses.push({
        transactionDate: parseDate(row.transactionDate),
        amount: parseAmount(row.withdrawalAmount),
        merchant: row.merchant,
        paymentMethod: row.paymentMethod,
        externalTransactionId: row.transactionId,
      });
    }
  }

  return {
    expenses,
    rawData,
    totalRows: dataLines.length,
    expenseRows: expenses.length,
    skippedRows,
  };
}
