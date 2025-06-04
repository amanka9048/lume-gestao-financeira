import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários individuais
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"), // URL ou base64 da imagem
  address: text("address"),
  birthDate: timestamp("birth_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Centros de custo (grupos financeiros)
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // Ex: 2025ABC01
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relacionamento usuários-centros de custo
export const userCostCenters = pgTable("user_cost_centers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  role: varchar("role", { length: 20 }).notNull().default("collaborator"), // admin, collaborator
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Tabela de sessões para autenticação
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Transações financeiras
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").references(() => wallets.id),
  creditCardId: integer("credit_card_id").references(() => creditCards.id),
  type: varchar("type", { length: 20 }).notNull(), // 'income', 'expense', 'transfer_in', 'transfer_out', 'credit_expense', 'bill_payment'
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  date: timestamp("date").notNull(),
  installmentId: integer("installment_id").references(() => installments.id),
  currentInstallment: integer("current_installment"),
  totalInstallments: integer("total_installments"),
  isFixed: boolean("is_fixed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Parcelamentos
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalInstallments: integer("total_installments").notNull(),
  paidInstallments: integer("paid_installments").default(0),
  startDate: timestamp("start_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Pagamentos de parcelas
export const installmentPayments = pgTable("installment_payments", {
  id: serial("id").primaryKey(),
  installmentId: integer("installment_id").notNull().references(() => installments.id),
  paymentNumber: integer("payment_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, overdue
  createdAt: timestamp("created_at").defaultNow(),
});

// Carteiras (contas bancárias, dinheiro, etc.)
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // checking, savings, cash, investment
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00"),
  isDefault: boolean("is_default").default(false),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  icon: varchar("icon", { length: 50 }).default("wallet"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categorias de transação
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // income, expense
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cartões de crédito
export const creditCards = pgTable("credit_cards", {
  id: serial("id").primaryKey(),
  costCenterId: integer("cost_center_id").notNull().references(() => costCenters.id),
  name: varchar("name", { length: 255 }).notNull(),
  limit: decimal("limit", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).default("0.00"),
  dueDate: integer("due_date").notNull(), // dia do vencimento (1-31)
  closingDate: integer("closing_date").notNull(), // dia do fechamento (1-31)
  color: varchar("color", { length: 7 }).default("#FF6B6B"),
  icon: varchar("icon", { length: 50 }).default("credit-card"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas de validação
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const insertCostCenterSchema = createInsertSchema(costCenters).pick({
  code: true,
  name: true,
  description: true,
  adminUserId: true,
});

export const insertUserCostCenterSchema = createInsertSchema(userCostCenters).pick({
  userId: true,
  costCenterId: true,
  role: true,
  status: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  costCenterId: true,
  name: true,
  type: true,
  balance: true,
  isDefault: true,
  color: true,
  icon: true,
});

export const insertTransactionSchema = z.object({
  costCenterId: z.number(),
  userId: z.number(),
  walletId: z.number().optional(),
  creditCardId: z.number().optional(),
  type: z.enum(["income", "expense", "transfer_in", "transfer_out", "credit_expense", "bill_payment"]),
  description: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  categoryId: z.number().optional(),
  date: z.date(),
  installmentId: z.number().optional(),
  currentInstallment: z.number().optional(),
  totalInstallments: z.number().optional(),
  isFixed: z.boolean().default(false),
  notes: z.string().optional(),
});

export const insertInstallmentSchema = createInsertSchema(installments).pick({
  costCenterId: true,
  walletId: true,
  description: true,
  totalAmount: true,
  totalInstallments: true,
  startDate: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  costCenterId: true,
  name: true,
  type: true,
  color: true,
  icon: true,
  isDefault: true,
});

export const insertCreditCardSchema = createInsertSchema(creditCards).pick({
  costCenterId: true,
  name: true,
  limit: true,
  dueDate: true,
  closingDate: true,
  color: true,
  icon: true,
});

// Schemas de autenticação
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userRegistrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const costCenterJoinSchema = z.object({
  code: z.string().min(1),
});

export const userUpdateProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  avatar: z.string().optional(),
});

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type UserCostCenter = typeof userCostCenters.$inferSelect;
export type InsertUserCostCenter = z.infer<typeof insertUserCostCenterSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
export type CostCenterJoinData = z.infer<typeof costCenterJoinSchema>;
export type UserUpdateProfileData = z.infer<typeof userUpdateProfileSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type InstallmentPayment = typeof installmentPayments.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;