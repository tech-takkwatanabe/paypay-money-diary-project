import { db } from './index';
import { categories } from './schema';

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

async function seed() {
	console.log('🌱 Seeding default categories...');

	for (const category of defaultCategories) {
		await db
			.insert(categories)
			.values({
				userId: null, // システム共通カテゴリ
				...category,
			})
			.onConflictDoNothing();
	}

	console.log('✅ Seeding completed!');
	process.exit(0);
}

seed().catch((error) => {
	console.error('❌ Seeding failed:', error);
	process.exit(1);
});
