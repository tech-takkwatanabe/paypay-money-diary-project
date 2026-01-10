import { db } from "../db";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";

async function fixCategoryOrder() {
  console.log("🔍 Checking categories with display_order = 0...");

  const results = await db.select().from(categories).where(eq(categories.displayOrder, 0));

  console.log(`Found ${results.length} categories with display_order = 0.`);

  for (const cat of results) {
    console.log(`Updating category: ${cat.name} (ID: ${cat.id}) to display_order = 100`);
    await db.update(categories).set({ displayOrder: 100 }).where(eq(categories.id, cat.id));
  }

  console.log("✅ Update completed!");
  process.exit(0);
}

fixCategoryOrder().catch((error) => {
  console.error("❌ Update failed:", error);
  process.exit(1);
});
