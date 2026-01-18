import { db } from "./index";
import { defaultCategories, defaultCategoryRules } from "./schema";
import { eq } from "drizzle-orm";

const categoriesData = [
  {
    name: "食費",
    color: "#FF6B6B",
    icon: "utensils",
    displayOrder: 1,
    isDefault: true,
  },
  {
    name: "交通費",
    color: "#4ECDC4",
    icon: "train",
    displayOrder: 2,
    isDefault: true,
  },
  {
    name: "日用品",
    color: "#45B7D1",
    icon: "shopping-cart",
    displayOrder: 3,
    isDefault: true,
  },
  {
    name: "娯楽",
    color: "#96CEB4",
    icon: "gamepad-2",
    displayOrder: 4,
    isDefault: true,
  },
  {
    name: "通信費",
    color: "#FFEAA7",
    icon: "wifi",
    displayOrder: 5,
    isDefault: true,
  },
  {
    name: "光熱費",
    color: "#DDA0DD",
    icon: "zap",
    displayOrder: 6,
    isDefault: true,
  },
  {
    name: "医療費",
    color: "#98D8C8",
    icon: "stethoscope",
    displayOrder: 7,
    isDefault: true,
  },
  {
    name: "その他",
    color: "#9c9c9c",
    icon: "circle-dot",
    displayOrder: 999,
    isDefault: true,
  },
];

const rulesData = [
  { keyword: "ファミリーマート", categoryName: "日用品" },
  { keyword: "セブン－イレブン", categoryName: "日用品" },
  { keyword: "ローソン", categoryName: "日用品" },
  { keyword: "マクドナルド", categoryName: "食費" },
  { keyword: "吉野家", categoryName: "食費" },
  { keyword: "スターバックス", categoryName: "食費" },
  { keyword: "ＪＲ", categoryName: "交通費" },
  { keyword: "地下鉄", categoryName: "交通費" },
  { keyword: "タクシー", categoryName: "交通費" },
  { keyword: "ソフトバンク", categoryName: "通信費" },
  { keyword: "ドコモ", categoryName: "通信費" },
  { keyword: "ａｕ", categoryName: "通信費" },
];

async function seed() {
  console.log("🌱 Seeding default categories...");

  for (const category of categoriesData) {
    // 存在チェック
    const existing = await db
      .select()
      .from(defaultCategories)
      .where(eq(defaultCategories.name, category.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(defaultCategories).values(category);
    } else {
      // 既存データの更新 (色やアイコンが変わっている場合)
      await db.update(defaultCategories).set(category).where(eq(defaultCategories.id, existing[0].id));
    }
  }

  console.log("🌱 Seeding default category rules...");

  // カテゴリ名からIDへのマップを作成
  const allCategories = await db.select().from(defaultCategories);
  const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

  for (const rule of rulesData) {
    const categoryId = categoryMap.get(rule.categoryName);
    if (categoryId) {
      const existingRule = await db
        .select()
        .from(defaultCategoryRules)
        .where(eq(defaultCategoryRules.keyword, rule.keyword))
        .limit(1);

      if (existingRule.length === 0) {
        await db.insert(defaultCategoryRules).values({
          keyword: rule.keyword,
          defaultCategoryId: categoryId,
          priority: 0,
        });
      }
    }
  }

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
