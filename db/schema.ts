import { pgTable, text, timestamp, uuid, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    occupation: text("occupation"),
    currency: text("currency").default("USD"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const authOtps = pgTable("auth_otps", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // "Current", "Savings", "Investment", "Wallet"
    balance: doublePrecision("balance").default(0).notNull(),
    color: text("color").default("bg-primary"),
    icon: text("icon").default("Wallet"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }), // Nullable for public categories
    name: text("name").notNull(),
    type: text("type").notNull(), // "income", "expense"
    color: text("color").default("#94a3b8"),
    icon: text("icon").default("tag"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
    amount: text("amount").notNull(), // Encrypted value
    type: text("type").notNull(), // "income", "expense"
    description: text("description"), // Encrypted value
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
    userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
    insights: jsonb("insights").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
