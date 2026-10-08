/**
 * Finance Service
 * Business logic for the Finance module
 * Handles transactions, goals, and calculations
 */

import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';
import { notificationService } from '../../services/notificationService.js';

export class FinanceService {
    constructor() {
        this.dataKey = 'finance_data';
        this.loadData();
        this.goalCompletionState = this.getGoalCompletionState();
    }

    /**
     * Load finance data from storage
     */
    loadData() {
        const defaultData = {
            initialBalance: 0,
            transactions: [],
            goals: [],
            categories: this.getDefaultCategories()
        };

        this.data = storageService.load(this.dataKey, defaultData);

        // Ensure categories exist
        if (!this.data.categories) {
            this.data.categories = this.getDefaultCategories();
        }
    }

    /**
     * Save finance data to storage
     */
    saveData() {
        if (!storageService.save(this.dataKey, this.data)) return false;
        const nextState = this.getGoalCompletionState();
        nextState.forEach((reached, goalId) => {
            if (!reached || this.goalCompletionState.get(goalId) === true) return;
            const goal = this.data.goals.find(item => item.id === goalId);
            if (!goal) return;
            notificationService.notify({
                title: goal.name,
                message: 'Finance savings goal reached.',
                type: 'success',
                source: 'finance',
                sourceId: goalId,
                dedupeKey: `finance-goal:${goalId}:${generateId()}`
            });
        });
        this.goalCompletionState = nextState;
        return true;
    }

    getGoalCompletionState() {
        return new Map(this.data.goals.map(goal => [goal.id, this.getGoalProgress(goal.id) >= 100]));
    }

    /**
     * Get default categories
     * @returns {Array}
     */
    getDefaultCategories() {
        return [
            { id: 'salary', name: 'Salary', icon: '💰', type: 'income' },
            { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income' },
            { id: 'investment', name: 'Investment', icon: '📈', type: 'income' },
            { id: 'other-income', name: 'Other Income', icon: '🎁', type: 'income' },
            
            { id: 'food', name: 'Food & Dining', icon: '🍔', type: 'expense' },
            { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
            { id: 'utilities', name: 'Utilities', icon: '⚡', type: 'expense' },
            { id: 'entertainment', name: 'Entertainment', icon: '🎮', type: 'expense' },
            { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
            { id: 'healthcare', name: 'Healthcare', icon: '🏥', type: 'expense' },
            { id: 'education', name: 'Education', icon: '📚', type: 'expense' },
            { id: 'other-expense', name: 'Other', icon: '📌', type: 'expense' }
        ];
    }

    /**
     * Set initial balance
     * @param {number} amount
     */
    setInitialBalance(amount) {
        if (this.data.transactions.length > 0) {
            throw new Error('Cannot set initial balance after transactions exist');
        }
        this.data.initialBalance = Math.max(0, amount);
        this.saveData();
    }

    /**
     * Get current balance
     * @returns {number}
     */
    getBalance() {
        let totalIncome = 0;
        let totalExpenses = 0;

        this.data.transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpenses += t.amount;
            }
        });

        return this.data.initialBalance + totalIncome - totalExpenses;
    }

    /**
     * Add a transaction
     * @param {Object} transaction
     * @returns {Object} Created transaction
     */
    addTransaction(transaction) {
        const newTransaction = {
            id: generateId(),
            amount: transaction.amount,
            type: transaction.type, // 'income' or 'expense'
            category: transaction.category,
            note: transaction.note || '',
            date: transaction.date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.data.transactions.push(newTransaction);
        this.saveData();

        return newTransaction;
    }

    /**
     * Remove a transaction
     * @param {string} transactionId
     */
    removeTransaction(transactionId) {
        const index = this.data.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            this.data.transactions.splice(index, 1);
            this.saveData();
        }
    }

    /**
     * Update a transaction
     * @param {string} transactionId
     * @param {Object} updates
     */
    updateTransaction(transactionId, updates) {
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (transaction) {
            Object.assign(transaction, updates);
            this.saveData();
        }
    }

    /**
     * Get all transactions
     * @returns {Array}
     */
    getTransactions() {
        return [...this.data.transactions].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStatistics() {
        const stats = {
            totalIncome: 0,
            totalExpenses: 0,
            netChange: 0,
            categoryBreakdown: {},
            transactionCount: this.data.transactions.length
        };

        this.data.transactions.forEach(t => {
            if (t.type === 'income') {
                stats.totalIncome += t.amount;
            } else if (t.type === 'expense') {
                stats.totalExpenses += t.amount;
            }

            // Category breakdown
            if (!stats.categoryBreakdown[t.category]) {
                stats.categoryBreakdown[t.category] = { total: 0, count: 0, type: t.type };
            }
            stats.categoryBreakdown[t.category].total += t.amount;
            stats.categoryBreakdown[t.category].count += 1;
        });

        stats.netChange = stats.totalIncome - stats.totalExpenses;

        return stats;
    }

    /**
     * Create a goal
     * @param {Object} goal
     * @returns {Object}
     */
    createGoal(goal) {
        const newGoal = {
            id: generateId(),
            name: goal.name,
            targetAmount: goal.targetAmount,
            deadline: goal.deadline || null,
            description: goal.description || '',
            createdAt: new Date().toISOString(),
            completed: false
        };

        this.data.goals.push(newGoal);
        this.saveData();

        return newGoal;
    }

    /**
     * Get all goals
     * @returns {Array}
     */
    getGoals() {
        return [...this.data.goals];
    }

    /**
     * Update a goal
     * @param {string} goalId
     * @param {Object} updates
     */
    updateGoal(goalId, updates) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (goal) {
            Object.assign(goal, updates);
            this.saveData();
        }
    }

    /**
     * Remove a goal
     * @param {string} goalId
     */
    removeGoal(goalId) {
        const index = this.data.goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            this.data.goals.splice(index, 1);
            this.saveData();
        }
    }

    /**
     * Calculate goal progress
     * @param {string} goalId
     * @returns {number} Progress as percentage 0-100
     */
    getGoalProgress(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (!goal) return 0;

        // For now, assume goal progress is based on balance vs target
        // This could be customized per goal later
        const progress = Math.min(100, (this.getBalance() / goal.targetAmount) * 100);
        return Math.max(0, progress);
    }

    /**
     * Get transactions by category
     * @param {string} category
     * @returns {Array}
     */
    getTransactionsByCategory(category) {
        return this.data.transactions.filter(t => t.category === category);
    }

    /**
     * Get category by ID
     * @param {string} categoryId
     * @returns {Object|null}
     */
    getCategory(categoryId) {
        return this.data.categories.find(c => c.id === categoryId) || null;
    }

    /**
     * Get all categories
     * @returns {Array}
     */
    getCategories() {
        return [...this.data.categories];
    }
}

// Export singleton
export const financeService = new FinanceService();
