import {
  pgTable,
  bigserial,
  varchar,
  timestamp,
  char,
  integer,
  jsonb,
  boolean,
  uuid as pgUuid,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const csvUploads = pgTable("csv_uploads", {
  id: pgUuid("id").defaultRandom().primaryKey(),
  userId: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.uuid, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  rawData: jsonb("raw_data").notNull(),
  rowCount: integer("row_count").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

export const categories = pgTable(
  "categories",
  {
    id: pgUuid("id").defaultRandom().primaryKey(),
    userId: char("user_id", { length: 36 }).references(() => users.uuid, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    icon: varchar("icon", { length: 50 }),
    displayOrder: integer("display_order").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_category_per_user").on(table.userId, table.name),
    index("unique_system_category").on(table.name).where(isNull(table.userId)),
  ],
);

export const categoryRules = pgTable("category_rules", {
  id: pgUuid("id").defaultRandom().primaryKey(),
  userId: char("user_id", { length: 36 }).references(() => users.uuid, {
    onDelete: "cascade",
  }),
  keyword: varchar("keyword", { length: 100 }).notNull(),
  categoryId: pgUuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable(
  "expenses",
  {
    id: pgUuid("id").defaultRandom().primaryKey(),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.uuid, { onDelete: "cascade" }),
    uploadId: pgUuid("upload_id").references(() => csvUploads.id, {
      onDelete: "set null",
    }),
    transactionDate: timestamp("transaction_date").notNull(),
    amount: integer("amount").notNull(),
    merchant: varchar("merchant", { length: 200 }).notNull(),
    categoryId: pgUuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    paymentMethod: varchar("payment_method", { length: 100 }),
    externalTransactionId: varchar("external_transaction_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_user_transaction").on(
      table.userId,
      table.externalTransactionId,
    ),
    index("idx_expenses_user_date").on(table.userId, table.transactionDate),
    index("idx_expenses_category").on(table.userId, table.categoryId),
    index("idx_expenses_merchant").on(table.userId, table.merchant),
  ],
);
