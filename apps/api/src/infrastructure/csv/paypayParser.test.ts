import { describe, it, expect } from "bun:test";
import { parsePayPayCsv } from "./paypayParser";

describe("parsePayPayCsv", () => {
  it("should parse valid CSV with expenses", () => {
    const csv = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2024/12/31 14:46:28,-,6,-,-,-,-,ポイント、残高の獲得,近鉄百貨店,PayPayポイント,-,-,04608314245975736327
2024/12/31 14:46:27,550,-,-,-,-,-,支払い,近鉄百貨店 - 名古屋店,クレジット Mastercard 1678,-,-,04608314245975736328
2024/12/31 14:42:23,"3,600",-,-,-,-,-,支払い,近鉄百貨店,クレジット Mastercard 1678,-,-,04608312158621466625`;

    const result = parsePayPayCsv(csv);

    expect(result.totalRows).toBe(3);
    expect(result.expenseRows).toBe(2);
    expect(result.expenses).toHaveLength(2);

    // 最初の支出（550円）
    expect(result.expenses[0].amount).toBe(550);
    expect(result.expenses[0].merchant).toBe("近鉄百貨店 - 名古屋店");
    expect(result.expenses[0].paymentMethod).toBe("クレジット Mastercard 1678");
    expect(result.expenses[0].externalTransactionId).toBe("04608314245975736328");

    // 2番目の支出（3,600円）
    expect(result.expenses[1].amount).toBe(3600);
    expect(result.expenses[1].merchant).toBe("近鉄百貨店");
  });

  it("should skip non-expense rows (ポイント獲得)", () => {
    const csv = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2024/12/31 14:46:28,-,6,-,-,-,-,ポイント、残高の獲得,近鉄百貨店,PayPayポイント,-,-,04608314245975736327`;

    const result = parsePayPayCsv(csv);

    expect(result.totalRows).toBe(1);
    expect(result.expenseRows).toBe(0);
    expect(result.expenses).toHaveLength(0);
  });

  it("should handle BOM in CSV", () => {
    const csv = `\uFEFF取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2024/12/31 14:46:27,100,-,-,-,-,-,支払い,Test Store,クレジット,-,-,12345`;

    const result = parsePayPayCsv(csv);

    expect(result.expenseRows).toBe(1);
    expect(result.expenses[0].amount).toBe(100);
  });

  it("should parse date correctly", () => {
    const csv = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2024/06/15 09:30:45,500,-,-,-,-,-,支払い,Test Store,クレジット,-,-,12345`;

    const result = parsePayPayCsv(csv);

    const date = result.expenses[0].transactionDate;
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(5); // 0-indexed
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
    expect(date.getSeconds()).toBe(45);
  });

  it("should throw error for empty CSV", () => {
    expect(() => parsePayPayCsv("")).toThrow("CSV file is empty");
  });

  it("should return raw data for all rows", () => {
    const csv = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2024/12/31 14:46:28,-,6,-,-,-,-,ポイント、残高の獲得,近鉄百貨店,PayPayポイント,-,-,04608314245975736327
2024/12/31 14:46:27,550,-,-,-,-,-,支払い,Store,クレジット,-,-,12345`;

    const result = parsePayPayCsv(csv);

    expect(result.rawData).toHaveLength(2);
    expect(result.rawData[0].transactionType).toBe("ポイント、残高の獲得");
    expect(result.rawData[1].transactionType).toBe("支払い");
  });
});
