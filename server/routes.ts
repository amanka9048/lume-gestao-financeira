import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCostCenterSchema, insertUserCostCenterSchema, insertWalletSchema, insertTransactionSchema, insertInstallmentSchema, insertCategorySchema, insertCreditCardSchema, userLoginSchema, userRegistrationSchema, costCenterJoinSchema, userUpdateProfileSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { Octokit } from "@octokit/rest";
import ignore from "ignore";

export async function registerRoutes(app: Express): Promise<Server> {
  // User Authentication
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = userRegistrationSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = userLoginSchema.parse(req.body);
      const user = await storage.getUserByEmail(loginData.email);
      
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(400).json({ message: error.message || "Failed to login" });
    }
  });

  // Cost Centers
  app.post("/api/cost-centers", async (req, res) => {
    try {
      const costCenterData = insertCostCenterSchema.parse(req.body);
      const costCenter = await storage.createCostCenter(costCenterData);
      
      // Automatically add creator as admin
      await storage.createUserCostCenterMembership({
        userId: costCenter.adminUserId,
        costCenterId: costCenter.id,
        role: "admin",
        status: "approved",
      });

      // Create default wallet
      await storage.createWallet({
        costCenterId: costCenter.id,
        name: "Carteira Principal",
        type: "checking",
        balance: "0.00",
        isDefault: true,
      });
      
      res.json(costCenter);
    } catch (error: any) {
      console.error("Error creating cost center:", error);
      res.status(400).json({ message: error.message || "Failed to create cost center" });
    }
  });

  app.post("/api/cost-centers/join", async (req, res) => {
    try {
      const { code } = costCenterJoinSchema.parse(req.body);
      const { userId } = req.body;
      
      const costCenter = await storage.getCostCenterByCode(code);
      if (!costCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      const existingMembership = await storage.getUserCostCenterMembership(userId, costCenter.id);
      if (existingMembership) {
        return res.status(400).json({ message: "Already a member of this cost center" });
      }
      
      const membership = await storage.createUserCostCenterMembership({
        userId,
        costCenterId: costCenter.id,
        role: "collaborator",
        status: "pending",
      });
      
      res.json(membership);
    } catch (error: any) {
      console.error("Error joining cost center:", error);
      res.status(400).json({ message: error.message || "Failed to join cost center" });
    }
  });

  app.get("/api/users/:userId/cost-centers", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const costCenters = await storage.getUserCostCenters(userId);
      res.json(costCenters);
    } catch (error: any) {
      console.error("Error fetching user cost centers:", error);
      res.status(500).json({ message: "Failed to fetch cost centers" });
    }
  });

  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        birthDate: user.birthDate
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profileData = userUpdateProfileSchema.parse(req.body);
      
      // Converter birthDate string para Date se fornecida
      const updateData = {
        ...profileData,
        birthDate: profileData.birthDate ? new Date(profileData.birthDate) : undefined,
        updatedAt: new Date(),
      };
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        address: updatedUser.address,
        birthDate: updatedUser.birthDate
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.get("/api/cost-centers/:id", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.id);
      const costCenter = await storage.getCostCenter(costCenterId);
      if (!costCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      res.json(costCenter);
    } catch (error: any) {
      console.error("Error fetching cost center:", error);
      res.status(500).json({ message: "Failed to fetch cost center" });
    }
  });

  // Get pending memberships for a cost center
  app.get("/api/cost-centers/:id/pending-memberships", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.id);
      const pendingMemberships = await storage.getPendingMemberships(costCenterId);
      res.json(pendingMemberships);
    } catch (error: any) {
      console.error("Error fetching pending memberships:", error);
      res.status(500).json({ message: "Failed to fetch pending memberships" });
    }
  });

  // Approve membership
  app.patch("/api/user-cost-centers/:id/approve", async (req, res) => {
    try {
      const membershipId = parseInt(req.params.id);
      const updatedMembership = await storage.updateUserCostCenterMembership(membershipId, {
        status: "approved"
      });
      
      if (!updatedMembership) {
        return res.status(404).json({ message: "Membership not found" });
      }
      
      res.json(updatedMembership);
    } catch (error: any) {
      console.error("Error approving membership:", error);
      res.status(500).json({ message: "Failed to approve membership" });
    }
  });

  // Reject/Delete membership
  app.delete("/api/user-cost-centers/:id", async (req, res) => {
    try {
      const membershipId = parseInt(req.params.id);
      const deleted = await storage.deleteUserCostCenterMembership(membershipId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Membership not found" });
      }
      
      res.json({ message: "Membership rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting membership:", error);
      res.status(500).json({ message: "Failed to reject membership" });
    }
  });

  app.get("/api/cost-centers/:costCenterId/wallets", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const wallets = await storage.getWallets(costCenterId);
      res.json(wallets);
    } catch (error: any) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const walletData = insertWalletSchema.parse(req.body);
      const wallet = await storage.createWallet(walletData);
      res.json(wallet);
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      res.status(400).json({ message: error.message || "Failed to create wallet" });
    }
  });

  app.get("/api/cost-centers/:costCenterId/transactions", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const transactions = await storage.getTransactions(costCenterId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Wallets (updated for cost centers)
  app.get("/api/wallets/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const wallets = await storage.getWallets(costCenterId);
      res.json(wallets);
    } catch (error: any) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const walletData = insertWalletSchema.parse(req.body);
      const wallet = await storage.createWallet(walletData);
      res.json(wallet);
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      res.status(400).json({ message: error.message || "Failed to create wallet" });
    }
  });

  // Transactions (updated for cost centers)
  app.get("/api/transactions/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const transactions = await storage.getTransactions(costCenterId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: error.message || "Failed to create transaction" });
    }
  });

  // Categories (updated for cost centers)
  app.get("/api/categories/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const categories = await storage.getCategories(costCenterId);
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  // Credit Cards (updated for cost centers)
  app.get("/api/credit-cards/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const creditCards = await storage.getCreditCards(costCenterId);
      res.json(creditCards);
    } catch (error: any) {
      console.error("Error fetching credit cards:", error);
      res.status(500).json({ message: "Failed to fetch credit cards" });
    }
  });

  app.post("/api/credit-cards", async (req, res) => {
    try {
      const creditCardData = insertCreditCardSchema.parse(req.body);
      const creditCard = await storage.createCreditCard(creditCardData);
      res.json(creditCard);
    } catch (error: any) {
      console.error("Error creating credit card:", error);
      res.status(400).json({ message: error.message || "Failed to create credit card" });
    }
  });

  // Installments (updated for cost centers)
  app.get("/api/installments/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const installments = await storage.getInstallments(costCenterId);
      res.json(installments);
    } catch (error: any) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Failed to fetch installments" });
    }
  });

  app.get("/api/installments/:costCenterId/active", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const installments = await storage.getActiveInstallments(costCenterId);
      res.json(installments);
    } catch (error: any) {
      console.error("Error fetching active installments:", error);
      res.status(500).json({ message: "Failed to fetch active installments" });
    }
  });

  app.get("/api/payments/upcoming/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      const days = parseInt(req.query.days as string) || 30;
      const payments = await storage.getUpcomingPayments(costCenterId, days);
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching upcoming payments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming payments" });
    }
  });

  app.post("/api/installments", async (req, res) => {
    try {
      const installmentData = insertInstallmentSchema.parse(req.body);
      const installment = await storage.createInstallment(installmentData);
      res.json(installment);
    } catch (error: any) {
      console.error("Error creating installment:", error);
      res.status(400).json({ message: error.message || "Failed to create installment" });
    }
  });

  // Reports routes
  app.get("/api/reports/users/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      
      // Get all users in this cost center
      const query = `
        SELECT 
          u.id, u.name, u.email,
          COUNT(t.id) as total_transactions,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS DECIMAL) ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN CAST(t.amount AS DECIMAL) ELSE 0 END), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS DECIMAL) ELSE -CAST(t.amount AS DECIMAL) END), 0) as balance,
          MAX(t.created_at) as last_transaction_date
        FROM users u
        INNER JOIN user_cost_centers ucc ON u.id = ucc.user_id
        LEFT JOIN transactions t ON u.id = t.user_id AND t.cost_center_id = $1
        WHERE ucc.cost_center_id = $1 AND ucc.status = 'approved'
        GROUP BY u.id, u.name, u.email
        ORDER BY total_transactions DESC
      `;
      
      const { pool } = await import('./db');
      const result = await pool.query(query, [costCenterId]);
      
      const userReports = result.rows.map(row => ({
        user: {
          id: row.id,
          name: row.name,
          email: row.email
        },
        totalTransactions: parseInt(row.total_transactions),
        totalIncome: parseFloat(row.total_income),
        totalExpenses: parseFloat(row.total_expenses),
        balance: parseFloat(row.balance),
        lastTransactionDate: row.last_transaction_date
      }));
      
      res.json(userReports);
    } catch (error: any) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  // Delete cost center (admin only)
  app.delete("/api/cost-centers/:id", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.id);
      const userId = req.body.userId;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user is admin of this cost center
      const membership = await storage.getUserCostCenterMembership(userId, costCenterId);
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can delete cost centers" });
      }

      // Delete the cost center
      const deleted = await storage.deleteCostCenter(costCenterId);
      if (!deleted) {
        return res.status(404).json({ message: "Cost center not found" });
      }

      res.json({ message: "Cost center deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting cost center:", error);
      res.status(500).json({ message: "Failed to delete cost center" });
    }
  });

  // Export System - Full Database Export
  app.get("/api/export/database/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      
      // Get all data for this cost center
      const costCenter = await storage.getCostCenter(costCenterId);
      const wallets = await storage.getWallets(costCenterId);
      const transactions = await storage.getTransactions(costCenterId);
      const installments = await storage.getInstallments(costCenterId);
      const categories = await storage.getCategories(costCenterId);
      const creditCards = await storage.getCreditCards(costCenterId);

      const exportData = {
        exportDate: new Date().toISOString(),
        costCenter,
        wallets,
        transactions,
        installments,
        categories,
        creditCards
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="lume-export-${costCenter?.name || 'data'}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error: any) {
      console.error("Error exporting database:", error);
      res.status(500).json({ message: "Failed to export database" });
    }
  });

  // Export System - Complete System Export (Code + Data)
  app.get("/api/export/complete/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      
      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="lume-complete-export-${new Date().toISOString().split('T')[0]}.zip"`);
      
      archive.pipe(res);

      // Add source code (excluding node_modules and .git)
      const excludePatterns = [
        'node_modules/**',
        '.git/**',
        '.env*',
        '*.log',
        'dist/**',
        'build/**'
      ];

      // Add all source files
      archive.glob('**/*', {
        cwd: process.cwd(),
        ignore: excludePatterns,
        dot: false
      });

      // Get database export
      const costCenter = await storage.getCostCenter(costCenterId);
      const wallets = await storage.getWallets(costCenterId);
      const transactions = await storage.getTransactions(costCenterId);
      const installments = await storage.getInstallments(costCenterId);
      const categories = await storage.getCategories(costCenterId);
      const creditCards = await storage.getCreditCards(costCenterId);

      const exportData = {
        exportDate: new Date().toISOString(),
        costCenter,
        wallets,
        transactions,
        installments,
        categories,
        creditCards
      };

      // Add database export to ZIP
      archive.append(JSON.stringify(exportData, null, 2), { name: 'database-export.json' });

      // Add setup instructions
      const setupInstructions = `# Lume - Sistema de Gestão Financeira

## Instruções de Instalação

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- Git

### Instalação

1. Extraia todos os arquivos desta pasta
2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure o banco de dados:
   - Crie um banco PostgreSQL
   - Configure a variável DATABASE_URL no ambiente
   - Execute as migrações:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. Restaure os dados (opcional):
   - Use o arquivo database-export.json para restaurar seus dados
   - Importe manualmente ou use ferramentas de migração

5. Inicie o sistema:
   \`\`\`bash
   npm run dev
   \`\`\`

### Estrutura do Projeto
- \`client/\` - Frontend React
- \`server/\` - Backend Express 
- \`shared/\` - Esquemas e tipos compartilhados
- \`database-export.json\` - Backup dos seus dados

### Suporte
Sistema exportado em: ${new Date().toLocaleString('pt-BR')}
`;

      archive.append(setupInstructions, { name: 'README.md' });

      await archive.finalize();
    } catch (error: any) {
      console.error("Error creating complete export:", error);
      res.status(500).json({ message: "Failed to create complete export" });
    }
  });

  // Export System - SQL Dump
  app.get("/api/export/sql/:costCenterId", async (req, res) => {
    try {
      const costCenterId = parseInt(req.params.costCenterId);
      
      // Generate SQL INSERT statements for the cost center data
      const costCenter = await storage.getCostCenter(costCenterId);
      const wallets = await storage.getWallets(costCenterId);
      const transactions = await storage.getTransactions(costCenterId);
      const categories = await storage.getCategories(costCenterId);

      let sqlDump = `-- Lume Financial System SQL Export
-- Generated on: ${new Date().toISOString()}
-- Cost Center: ${costCenter?.name}

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

      // Add cost center
      if (costCenter) {
        sqlDump += `-- Cost Center Data
INSERT INTO cost_centers (id, name, description, code, admin_user_id) VALUES 
(${costCenter.id}, '${costCenter.name.replace(/'/g, "''")}', '${(costCenter.description || '').replace(/'/g, "''")}', '${costCenter.code}', ${costCenter.adminUserId});

`;
      }

      // Add wallets
      if (wallets.length > 0) {
        sqlDump += `-- Wallets Data
INSERT INTO wallets (id, name, balance, is_default, cost_center_id) VALUES \n`;
        const walletValues = wallets.map(w => 
          `(${w.id}, '${w.name.replace(/'/g, "''")}', ${w.balance}, ${w.isDefault}, ${w.costCenterId})`
        ).join(',\n');
        sqlDump += walletValues + ';\n\n';
      }

      // Add categories
      if (categories.length > 0) {
        sqlDump += `-- Categories Data
INSERT INTO categories (id, name, type, color, cost_center_id) VALUES \n`;
        const categoryValues = categories.map(c => 
          `(${c.id}, '${c.name.replace(/'/g, "''")}', '${c.type}', '${c.color}', ${c.costCenterId})`
        ).join(',\n');
        sqlDump += categoryValues + ';\n\n';
      }

      // Add transactions
      if (transactions.length > 0) {
        sqlDump += `-- Transactions Data
INSERT INTO transactions (id, description, amount, type, date, category_id, wallet_id) VALUES \n`;
        const transactionValues = transactions.map(t => 
          `(${t.id}, '${t.description.replace(/'/g, "''")}', ${t.amount}, '${t.type}', '${t.date.toISOString()}', ${t.categoryId || 'NULL'}, ${t.walletId})`
        ).join(',\n');
        sqlDump += transactionValues + ';\n\n';
      }

      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="lume-sql-export-${new Date().toISOString().split('T')[0]}.sql"`);
      res.send(sqlDump);
    } catch (error: any) {
      console.error("Error creating SQL export:", error);
      res.status(500).json({ message: "Failed to create SQL export" });
    }
  });

  // Export System to GitHub
  app.post("/api/export/github", async (req, res) => {
    try {
      const { repoName, description, isPrivate = true } = req.body;
      
      if (!repoName) {
        return res.status(400).json({ message: "Repository name is required" });
      }

      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });

      // Get authenticated user info
      const { data: user } = await octokit.rest.users.getAuthenticated();
      
      // Create repository
      const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: description || "Lume - Sistema de Gestão Financeira exportado do Replit",
        private: isPrivate,
        auto_init: true,
        gitignore_template: "Node",
      });

      console.log(`Repository created: ${repo.html_url}`);

      // Wait for repository initialization
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get important files to upload
      const filesToUpload = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'vite.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'drizzle.config.ts',
        'components.json'
      ];

      // Get all TypeScript and JavaScript files
      const sourceFiles = [];
      
      // Client files
      const clientSrcPath = path.join(process.cwd(), 'client', 'src');
      if (fs.existsSync(clientSrcPath)) {
        const getAllFiles = (dir: string, fileList: string[] = []): string[] => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              getAllFiles(filePath, fileList);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.html')) {
              fileList.push(path.relative(process.cwd(), filePath));
            }
          });
          return fileList;
        };
        
        sourceFiles.push(...getAllFiles(clientSrcPath));
      }

      // Server files
      const serverFiles = ['server/index.ts', 'server/routes.ts', 'server/storage.ts', 'server/db.ts', 'server/vite.ts'];
      serverFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          sourceFiles.push(file);
        }
      });

      // Shared files
      const sharedFiles = ['shared/schema.ts'];
      sharedFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          sourceFiles.push(file);
        }
      });

      // Add all important files
      filesToUpload.push(...sourceFiles);

      // Create comprehensive README
      const readmeContent = `# Lume - Sistema de Gestão Financeira

Sistema completo de gestão financeira familiar exportado do Replit.

## 🚀 Características

- **Dashboard Intuitivo**: Visão geral completa das finanças
- **Gestão de Transações**: Controle de receitas e despesas  
- **Centros de Custo**: Organização por grupos familiares
- **Parcelamentos**: Controle de compras parceladas
- **Cartões de Crédito**: Gestão de faturas e limites
- **Relatórios**: Análises detalhadas de gastos
- **Multi-usuário**: Colaboração entre membros da família

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle
- **UI Components**: Radix UI + shadcn/ui

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Git

### Configuração

1. **Clone o repositório**
\`\`\`bash
git clone ${repo.clone_url}
cd ${repoName}
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm install
\`\`\`

3. **Configure o banco de dados**
\`\`\`bash
# Crie um banco PostgreSQL
createdb lume_financial

# Configure a variável de ambiente DATABASE_URL
# Exemplo: postgresql://usuario:senha@localhost:5432/lume_financial
\`\`\`

4. **Execute as migrações**
\`\`\`bash
npm run db:push
\`\`\`

5. **Inicie o sistema**
\`\`\`bash
npm run dev
\`\`\`

6. **Acesse o sistema**
Abra http://localhost:5000 no navegador

## 📁 Estrutura do Projeto

\`\`\`
├── client/           # Frontend React
│   ├── src/
│   │   ├── pages/    # Páginas da aplicação
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── lib/      # Utilitários e configurações
├── server/           # Backend Express
│   ├── routes.ts     # Rotas da API
│   ├── storage.ts    # Camada de dados
│   └── db.ts         # Configuração do banco
├── shared/           # Tipos e esquemas compartilhados
└── package.json      # Dependências e scripts
\`\`\`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit (\`git commit -m 'Add AmazingFeature'\`)
4. Push (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

---

**Sistema exportado automaticamente do Replit em ${new Date().toLocaleString('pt-BR')}**
`;

      let uploadedCount = 0;
      
      // Upload README first
      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: user.login,
          repo: repoName,
          path: 'README.md',
          message: 'Add comprehensive README',
          content: Buffer.from(readmeContent, 'utf-8').toString('base64'),
        });
        uploadedCount++;
      } catch (error) {
        console.warn('Failed to upload README:', error);
      }

      // Upload files one by one
      for (const filePath of filesToUpload) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          
          if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
          }

          const stats = fs.statSync(fullPath);
          if (stats.size > 1024 * 1024) { // Skip files larger than 1MB
            console.warn(`File too large: ${filePath}`);
            continue;
          }

          const content = fs.readFileSync(fullPath, 'utf-8');
          
          await octokit.rest.repos.createOrUpdateFileContents({
            owner: user.login,
            repo: repoName,
            path: filePath,
            message: `Add ${filePath}`,
            content: Buffer.from(content, 'utf-8').toString('base64'),
          });
          
          uploadedCount++;
          console.log(`Uploaded: ${filePath}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.warn(`Failed to upload ${filePath}:`, error);
        }
      }

      res.json({
        success: true,
        repository: {
          name: repo.name,
          url: repo.html_url,
          clone_url: repo.clone_url,
          ssh_url: repo.ssh_url,
        },
        filesUploaded: uploadedCount,
        totalFiles: filesToUpload.length + 1, // +1 for README
        message: "Sistema exportado com sucesso para GitHub!"
      });

    } catch (error: any) {
      console.error("Error exporting to GitHub:", error);
      
      if (error.status === 422 && error.response?.data?.errors?.[0]?.message?.includes('name already exists')) {
        return res.status(400).json({ 
          message: "Um repositório com este nome já existe em sua conta. Escolha outro nome." 
        });
      }
      
      res.status(500).json({ 
        message: "Erro ao exportar para GitHub: " + (error.message || "Erro desconhecido")
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}