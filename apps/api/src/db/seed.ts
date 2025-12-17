import { db } from './index';
import { categories, categoryRules, expenses } from './schema';
import { isNull, eq, and } from 'drizzle-orm';

const defaultCategories = [
	{ name: '食費', color: '#FF6B6B', icon: 'utensils', displayOrder: 1, isDefault: true },
	{ name: '交通費', color: '#4ECDC4', icon: 'train', displayOrder: 2, isDefault: true },
	{ name: '日用品', color: '#45B7D1', icon: 'shopping-cart', displayOrder: 3, isDefault: true },
	{ name: '娯楽', color: '#96CEB4', icon: 'gamepad-2', displayOrder: 4, isDefault: true },
	{ name: '通信費', color: '#FFEAA7', icon: 'wifi', displayOrder: 5, isDefault: true },
	{ name: '光熱費', color: '#DDA0DD', icon: 'zap', displayOrder: 6, isDefault: true },
	{ name: '医療費', color: '#98D8C8', icon: 'stethoscope', displayOrder: 7, isDefault: true },
	{ name: 'その他', color: '#B8B8B8', icon: 'circle-dot', displayOrder: 99, isDefault: true },
];

const defaultRules = [
	{ keyword: 'ファミリーマート', categoryName: '日用品' },
	{ keyword: 'セブン－イレブン', categoryName: '日用品' },
	{ keyword: 'ローソン', categoryName: '日用品' },
	{ keyword: 'マクドナルド', categoryName: '食費' },
	{ keyword: '吉野家', categoryName: '食費' },
	{ keyword: 'スターバックス', categoryName: '食費' },
	{ keyword: 'ＪＲ', categoryName: '交通費' },
	{ keyword: '地下鉄', categoryName: '交通費' },
	{ keyword: 'タクシー', categoryName: '交通費' },
	{ keyword: 'ソフトバンク', categoryName: '通信費' },
	{ keyword: 'ドコモ', categoryName: '通信費' },
	{ keyword: 'ａｕ', categoryName: '通信費' },
];

async function seed() {
	console.log('🔍 Checking for duplicate system categories...');

	// 1. 重複データのクリーンアップ
	const systemCategories = await db.select().from(categories).where(isNull(categories.userId));
	const nameToIds = new Map<string, string[]>();

	for (const cat of systemCategories) {
		const ids = nameToIds.get(cat.name) || [];
		ids.push(cat.id);
		nameToIds.set(cat.name, ids);
	}

	for (const [name, ids] of nameToIds.entries()) {
		if (ids.length > 1) {
			console.log(`🧹 Cleaning up duplicates for category: ${name}`);
			const [keepId, ...deleteIds] = ids;

			// 関連データの移行 (expenses)
			for (const deleteId of deleteIds) {
				await db.update(expenses).set({ categoryId: keepId }).where(eq(expenses.categoryId, deleteId));
				await db.update(categoryRules).set({ categoryId: keepId }).where(eq(categoryRules.categoryId, deleteId));
				await db.delete(categories).where(eq(categories.id, deleteId));
			}
		}
	}

	console.log('🌱 Seeding default categories...');

	for (const category of defaultCategories) {
		// 存在チェック
		const existing = await db
			.select()
			.from(categories)
			.where(and(isNull(categories.userId), eq(categories.name, category.name)))
			.limit(1);

		if (existing.length === 0) {
			await db.insert(categories).values({
				userId: null,
				...category,
			});
		} else {
			// 既存データの更新 (色やアイコンが変わっている場合)
			await db.update(categories).set(category).where(eq(categories.id, existing[0].id));
		}
	}

	console.log('🌱 Seeding default category rules...');

	// カテゴリ名からIDへのマップを作成
	const allCategories = await db.select().from(categories).where(isNull(categories.userId));
	const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

	for (const rule of defaultRules) {
		const categoryId = categoryMap.get(rule.categoryName);
		if (categoryId) {
			const existingRule = await db
				.select()
				.from(categoryRules)
				.where(and(isNull(categoryRules.userId), eq(categoryRules.keyword, rule.keyword)))
				.limit(1);

			if (existingRule.length === 0) {
				await db.insert(categoryRules).values({
					userId: null,
					keyword: rule.keyword,
					categoryId: categoryId,
					priority: 0,
				});
			}
		}
	}

	console.log('✅ Seeding completed!');
	process.exit(0);
}

seed().catch((error) => {
	console.error('❌ Seeding failed:', error);
	process.exit(1);
});
