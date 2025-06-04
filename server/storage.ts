import { 
  users, costCenters, userCostCenters, wallets, transactions, installments, installmentPayments, categories, creditCards, 
  type User, type InsertUser, type CostCenter, type InsertCostCenter, type UserCostCenter, type InsertUserCostCenter,
  type Wallet, type InsertWallet, type Transaction, type InsertTransaction, 
  type Installment, type InsertInstallment, type InstallmentPayment, type Category, type InsertCategory, 
  type CreditCard, type InsertCreditCard 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Cost Centers
  getCostCenter(id: number): Promise<CostCenter | undefined>;
  getCostCenterByCode(code: string): Promise<CostCenter | undefined>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: number, costCenter: Partial<CostCenter>): Promise<CostCenter | undefined>;
  deleteCostCenter(id: number): Promise<boolean>;
  getUserCostCenters(userId: number): Promise<Array<CostCenter & { role: string; status: string }>>;
  
  // User Cost Center Memberships
  getUserCostCenterMembership(userId: number, costCenterId: number): Promise<UserCostCenter | undefined>;
  createUserCostCenterMembership(membership: InsertUserCostCenter): Promise<UserCostCenter>;
  updateUserCostCenterMembership(id: number, membership: Partial<UserCostCenter>): Promise<UserCostCenter | undefined>;
  deleteUserCostCenterMembership(id: number): Promise<boolean>;
  getPendingMemberships(costCenterId: number): Promise<Array<UserCostCenter & { user: User }>>;
  
  // Wallets
  getWallets(costCenterId: number): Promise<Wallet[]>;
  getWallet(id: number): Promise<Wallet | undefined>;
  getDefaultWallet(costCenterId: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;
  transferBetweenWallets(fromWalletId: number, toWalletId: number, amount: number, description: string): Promise<boolean>;
  
  // Transactions
  getTransactions(costCenterId: number): Promise<Transaction[]>;
  getTransactionsByDateRange(costCenterId: number, startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Installments
  getInstallments(costCenterId: number): Promise<Installment[]>;
  getActiveInstallments(costCenterId: number): Promise<Installment[]>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, installment: Partial<Installment>): Promise<Installment | undefined>;
  deleteInstallment(id: number): Promise<boolean>;
  
  // Installment Payments
  getInstallmentPayments(installmentId: number): Promise<InstallmentPayment[]>;
  getUpcomingPayments(costCenterId: number, days?: number): Promise<InstallmentPayment[]>;
  createInstallmentPayment(payment: Omit<InstallmentPayment, 'id' | 'createdAt'>): Promise<InstallmentPayment>;
  markPaymentAsPaid(paymentId: number): Promise<InstallmentPayment | undefined>;
  
  // Categories
  getCategories(costCenterId: number): Promise<Category[]>;
  getCategoriesByType(costCenterId: number, type: 'income' | 'expense'): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Credit Cards
  getCreditCards(costCenterId: number): Promise<CreditCard[]>;
  getCreditCard(id: number): Promise<CreditCard | undefined>;
  createCreditCard(creditCard: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(id: number, creditCard: Partial<CreditCard>): Promise<CreditCard | undefined>;
  deleteCreditCard(id: number): Promise<boolean>;
  chargeCreditCard(creditCardId: number, amount: number): Promise<boolean>;
  payBill(creditCardId: number, amount: number, fromWalletId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Cost Centers
  async getCostCenter(id: number): Promise<CostCenter | undefined> {
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, id));
    return costCenter;
  }

  async getCostCenterByCode(code: string): Promise<CostCenter | undefined> {
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.code, code));
    return costCenter;
  }

  async createCostCenter(insertCostCenter: InsertCostCenter): Promise<CostCenter> {
    const [costCenter] = await db
      .insert(costCenters)
      .values(insertCostCenter)
      .returning();
    return costCenter;
  }

  async updateCostCenter(id: number, updates: Partial<CostCenter>): Promise<CostCenter | undefined> {
    const [costCenter] = await db
      .update(costCenters)
      .set(updates)
      .where(eq(costCenters.id, id))
      .returning();
    return costCenter;
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    const result = await db
      .delete(costCenters)
      .where(eq(costCenters.id, id));
    return result.rowCount > 0;
  }

  async getUserCostCenters(userId: number): Promise<Array<CostCenter & { role: string; status: string }>> {
    const result = await db
      .select({
        id: costCenters.id,
        code: costCenters.code,
        name: costCenters.name,
        description: costCenters.description,
        adminUserId: costCenters.adminUserId,
        createdAt: costCenters.createdAt,
        role: userCostCenters.role,
        status: userCostCenters.status,
      })
      .from(userCostCenters)
      .innerJoin(costCenters, eq(userCostCenters.costCenterId, costCenters.id))
      .where(eq(userCostCenters.userId, userId));
    
    return result;
  }

  // User Cost Center Memberships
  async getUserCostCenterMembership(userId: number, costCenterId: number): Promise<UserCostCenter | undefined> {
    const [membership] = await db
      .select()
      .from(userCostCenters)
      .where(and(eq(userCostCenters.userId, userId), eq(userCostCenters.costCenterId, costCenterId)));
    return membership;
  }

  async createUserCostCenterMembership(insertMembership: InsertUserCostCenter): Promise<UserCostCenter> {
    const [membership] = await db
      .insert(userCostCenters)
      .values(insertMembership)
      .returning();
    return membership;
  }

  async updateUserCostCenterMembership(id: number, updates: Partial<UserCostCenter>): Promise<UserCostCenter | undefined> {
    const [membership] = await db
      .update(userCostCenters)
      .set(updates)
      .where(eq(userCostCenters.id, id))
      .returning();
    return membership;
  }

  async deleteUserCostCenterMembership(id: number): Promise<boolean> {
    const result = await db
      .delete(userCostCenters)
      .where(eq(userCostCenters.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPendingMemberships(costCenterId: number): Promise<Array<UserCostCenter & { user: User }>> {
    const result = await db
      .select({
        id: userCostCenters.id,
        userId: userCostCenters.userId,
        costCenterId: userCostCenters.costCenterId,
        role: userCostCenters.role,
        status: userCostCenters.status,
        requestedAt: userCostCenters.requestedAt,
        approvedAt: userCostCenters.approvedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        }
      })
      .from(userCostCenters)
      .innerJoin(users, eq(userCostCenters.userId, users.id))
      .where(and(eq(userCostCenters.costCenterId, costCenterId), eq(userCostCenters.status, "pending")));
    
    return result as Array<UserCostCenter & { user: User }>;
  }

  // Wallets
  async getWallets(costCenterId: number): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.costCenterId, costCenterId));
  }

  async getWallet(id: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet;
  }

  async getDefaultWallet(costCenterId: number): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.costCenterId, costCenterId), eq(wallets.isDefault, true)));
    return wallet;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values(insertWallet)
      .returning();
    return wallet;
  }

  async updateWallet(id: number, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    const [wallet] = await db
      .update(wallets)
      .set(updates)
      .where(eq(wallets.id, id))
      .returning();
    return wallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = await db
      .delete(wallets)
      .where(eq(wallets.id, id));
    return result.rowCount > 0;
  }

  async transferBetweenWallets(fromWalletId: number, toWalletId: number, amount: number, description: string): Promise<boolean> {
    const fromWallet = await this.getWallet(fromWalletId);
    const toWallet = await this.getWallet(toWalletId);
    
    if (!fromWallet || !toWallet) return false;
    
    const fromBalance = parseFloat(fromWallet.balance || "0");
    const transferAmount = parseFloat(amount.toString());
    
    if (fromBalance < transferAmount) return false;
    
    await db.transaction(async (tx) => {
      await tx
        .update(wallets)
        .set({ balance: (fromBalance - transferAmount).toFixed(2) })
        .where(eq(wallets.id, fromWalletId));
      
      const toBalance = parseFloat(toWallet.balance || "0");
      await tx
        .update(wallets)
        .set({ balance: (toBalance + transferAmount).toFixed(2) })
        .where(eq(wallets.id, toWalletId));
      
      await tx.insert(transactions).values([
        {
          costCenterId: fromWallet.costCenterId,
          userId: 1, // Sistema de transferência automática
          walletId: fromWalletId,
          type: "transfer_out",
          description: `Transferência para ${toWallet.name}: ${description}`,
          amount: transferAmount.toFixed(2),
          date: new Date(),
        },
        {
          costCenterId: toWallet.costCenterId,
          userId: 1, // Sistema de transferência automática
          walletId: toWalletId,
          type: "transfer_in", 
          description: `Transferência de ${fromWallet.name}: ${description}`,
          amount: transferAmount.toFixed(2),
          date: new Date(),
        }
      ]);
    });
    
    return true;
  }

  // Transactions
  async getTransactions(costCenterId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.costCenterId, costCenterId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByDateRange(costCenterId: number, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.costCenterId, costCenterId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return result.rowCount > 0;
  }

  // Installments
  async getInstallments(costCenterId: number): Promise<Installment[]> {
    return await db.select().from(installments).where(eq(installments.costCenterId, costCenterId));
  }

  async getActiveInstallments(costCenterId: number): Promise<Installment[]> {
    return await db
      .select()
      .from(installments)
      .where(and(eq(installments.costCenterId, costCenterId), eq(installments.status, "active")));
  }

  async createInstallment(insertInstallment: InsertInstallment): Promise<Installment> {
    const [installment] = await db
      .insert(installments)
      .values(insertInstallment)
      .returning();
    
    await this.createInstallmentPayments(installment);
    return installment;
  }

  private async createInstallmentPayments(installment: Installment): Promise<void> {
    const payments = [];
    const monthlyAmount = parseFloat(installment.totalAmount) / installment.totalInstallments;
    
    for (let i = 1; i <= installment.totalInstallments; i++) {
      const dueDate = new Date(installment.startDate);
      dueDate.setMonth(dueDate.getMonth() + i - 1);
      
      payments.push({
        installmentId: installment.id,
        paymentNumber: i,
        amount: monthlyAmount.toFixed(2),
        dueDate,
        status: "pending" as const,
      });
    }
    
    await db.insert(installmentPayments).values(payments);
  }

  async updateInstallment(id: number, updates: Partial<Installment>): Promise<Installment | undefined> {
    const [installment] = await db
      .update(installments)
      .set(updates)
      .where(eq(installments.id, id))
      .returning();
    return installment;
  }

  async deleteInstallment(id: number): Promise<boolean> {
    const result = await db
      .delete(installments)
      .where(eq(installments.id, id));
    return result.rowCount > 0;
  }

  // Installment Payments
  async getInstallmentPayments(installmentId: number): Promise<InstallmentPayment[]> {
    return await db
      .select()
      .from(installmentPayments)
      .where(eq(installmentPayments.installmentId, installmentId))
      .orderBy(installmentPayments.paymentNumber);
  }

  async getUpcomingPayments(costCenterId: number, days: number = 30): Promise<InstallmentPayment[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const result = await db
      .select({
        id: installmentPayments.id,
        installmentId: installmentPayments.installmentId,
        paymentNumber: installmentPayments.paymentNumber,
        amount: installmentPayments.amount,
        dueDate: installmentPayments.dueDate,
        paidDate: installmentPayments.paidDate,
        status: installmentPayments.status,
        createdAt: installmentPayments.createdAt,
      })
      .from(installmentPayments)
      .innerJoin(installments, eq(installmentPayments.installmentId, installments.id))
      .where(
        and(
          eq(installments.costCenterId, costCenterId),
          eq(installmentPayments.status, "pending"),
          lt(installmentPayments.dueDate, endDate)
        )
      )
      .orderBy(installmentPayments.dueDate);
    
    return result;
  }

  async createInstallmentPayment(payment: Omit<InstallmentPayment, 'id' | 'createdAt'>): Promise<InstallmentPayment> {
    const [newPayment] = await db
      .insert(installmentPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async markPaymentAsPaid(paymentId: number): Promise<InstallmentPayment | undefined> {
    const [payment] = await db
      .update(installmentPayments)
      .set({ 
        status: "paid",
        paidDate: new Date()
      })
      .where(eq(installmentPayments.id, paymentId))
      .returning();
    return payment;
  }

  // Categories
  async getCategories(costCenterId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.costCenterId, costCenterId));
  }

  async getCategoriesByType(costCenterId: number, type: 'income' | 'expense'): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(and(eq(categories.costCenterId, costCenterId), eq(categories.type, type)));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Credit Cards
  async getCreditCards(costCenterId: number): Promise<CreditCard[]> {
    return await db.select().from(creditCards).where(eq(creditCards.costCenterId, costCenterId));
  }

  async getCreditCard(id: number): Promise<CreditCard | undefined> {
    const [creditCard] = await db.select().from(creditCards).where(eq(creditCards.id, id));
    return creditCard;
  }

  async createCreditCard(insertCreditCard: InsertCreditCard): Promise<CreditCard> {
    const [creditCard] = await db
      .insert(creditCards)
      .values(insertCreditCard)
      .returning();
    return creditCard;
  }

  async updateCreditCard(id: number, updates: Partial<CreditCard>): Promise<CreditCard | undefined> {
    const [creditCard] = await db
      .update(creditCards)
      .set(updates)
      .where(eq(creditCards.id, id))
      .returning();
    return creditCard;
  }

  async deleteCreditCard(id: number): Promise<boolean> {
    const result = await db
      .delete(creditCards)
      .where(eq(creditCards.id, id));
    return result.rowCount > 0;
  }

  async chargeCreditCard(creditCardId: number, amount: number): Promise<boolean> {
    const creditCard = await this.getCreditCard(creditCardId);
    if (!creditCard) return false;
    
    const currentBalance = parseFloat(creditCard.currentBalance || "0");
    const chargeAmount = parseFloat(amount.toString());
    const newBalance = currentBalance + chargeAmount;
    
    const limit = parseFloat(creditCard.limit);
    if (newBalance > limit) return false;
    
    await db
      .update(creditCards)
      .set({ currentBalance: newBalance.toFixed(2) })
      .where(eq(creditCards.id, creditCardId));
    
    return true;
  }

  async payBill(creditCardId: number, amount: number, fromWalletId: number): Promise<boolean> {
    const creditCard = await this.getCreditCard(creditCardId);
    const wallet = await this.getWallet(fromWalletId);
    
    if (!creditCard || !wallet) return false;
    
    const walletBalance = parseFloat(wallet.balance || "0");
    const paymentAmount = parseFloat(amount.toString());
    
    if (walletBalance < paymentAmount) return false;
    
    await db.transaction(async (tx) => {
      const currentBalance = parseFloat(creditCard.currentBalance || "0");
      const newCreditBalance = Math.max(0, currentBalance - paymentAmount);
      
      await tx
        .update(creditCards)
        .set({ currentBalance: newCreditBalance.toFixed(2) })
        .where(eq(creditCards.id, creditCardId));
      
      await tx
        .update(wallets)
        .set({ balance: (walletBalance - paymentAmount).toFixed(2) })
        .where(eq(wallets.id, fromWalletId));
      
      await tx.insert(transactions).values({
        costCenterId: wallet.costCenterId,
        walletId: fromWalletId,
        creditCardId: creditCardId,
        type: "bill_payment",
        description: `Pagamento cartão ${creditCard.name}`,
        amount: paymentAmount.toFixed(2),
        date: new Date(),
      });
    });
    
    return true;
  }
}

export const storage = new DatabaseStorage();