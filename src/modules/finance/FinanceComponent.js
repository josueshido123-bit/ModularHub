/**
 * Finance Module Component
 * Renders the finance module UI
 */

import { financeService } from './financeService.js';
import { formatCurrency, formatDate, showToast } from '../../utilities/uiUtils.js';

export class FinanceComponent {
    constructor(state = {}) {
        this.state = {
            view: 'overview', // 'overview', 'transactions', 'goals', 'stats'
            showAddTransaction: false,
            showAddGoal: false,
            ...state
        };
    }

    /**
     * Render the component
     * @returns {HTMLElement}
     */
    render() {
        const container = document.createElement('div');
        container.className = 'finance-module-content';

        // Check if initial balance is set
        if (financeService.getBalance() === 0 && financeService.getTransactions().length === 0) {
            container.innerHTML = this.renderInitialSetup();
        } else {
            container.innerHTML = this.renderDashboard();
        }

        this.attachEventListeners(container);
        return container;
    }

    /**
     * Render initial setup view
     */
    renderInitialSetup() {
        return `
            <div class="finance-init">
                <div class="finance-init-header">
                    <h2>💰 Finance Tracker</h2>
                    <p>Start by setting your initial balance</p>
                </div>
                
                <form class="finance-init-form">
                    <div class="form-group">
                        <label for="initial-balance">Initial Balance</label>
                        <div class="input-group">
                            <span class="currency-symbol">$</span>
                            <input type="number" id="initial-balance" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Set Balance</button>
                </form>
            </div>
        `;
    }

    /**
     * Render main dashboard view
     */
    renderDashboard() {
        const balance = financeService.getBalance();
        const stats = financeService.getStatistics();
        const transactions = financeService.getTransactions().slice(0, 5); // Last 5

        return `
            <div class="finance-dashboard">
                <!-- Balance Section -->
                <div class="finance-balance">
                    <div class="balance-label">Current Balance</div>
                    <div class="balance-amount">${formatCurrency(balance)}</div>
                </div>

                <!-- Quick Stats -->
                <div class="finance-stats-grid">
                    <div class="stat-item">
                        <div class="stat-icon income">📈</div>
                        <div class="stat-value">${formatCurrency(stats.totalIncome)}</div>
                        <div class="stat-label">Income</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon expense">📉</div>
                        <div class="stat-value">${formatCurrency(stats.totalExpenses)}</div>
                        <div class="stat-label">Expenses</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon ${stats.netChange >= 0 ? 'positive' : 'negative'}">
                            ${stats.netChange >= 0 ? '✓' : '✗'}
                        </div>
                        <div class="stat-value">${formatCurrency(stats.netChange)}</div>
                        <div class="stat-label">Net</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="finance-actions">
                    <button class="btn btn-sm btn-primary add-transaction-btn">+ Add Transaction</button>
                    <button class="btn btn-sm btn-secondary view-all-btn">View All</button>
                </div>

                <!-- Recent Transactions -->
                ${transactions.length > 0 ? `
                    <div class="finance-section">
                        <h3>Recent Transactions</h3>
                        <div class="transactions-list">
                            ${transactions.map(t => this.renderTransaction(t)).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="finance-empty">
                        <p>No transactions yet. Add one to get started!</p>
                    </div>
                `}

                <!-- Add Transaction Modal (hidden by default) -->
                <div class="modal modal-add-transaction hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add Transaction</h2>
                            <button class="modal-close">×</button>
                        </div>
                        <form class="add-transaction-form">
                            <div class="form-group">
                                <label>Type</label>
                                <div class="button-group">
                                    <label class="radio-button">
                                        <input type="radio" name="type" value="expense" checked>
                                        <span>Expense</span>
                                    </label>
                                    <label class="radio-button">
                                        <input type="radio" name="type" value="income">
                                        <span>Income</span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="amount">Amount</label>
                                <div class="input-group">
                                    <span class="currency-symbol">$</span>
                                    <input type="number" id="amount" name="amount" placeholder="0.00" step="0.01" min="0" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="category">Category</label>
                                <select id="category" name="category" required>
                                    ${financeService.getCategories().map(cat => 
                                        `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
                                    ).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="note">Note</label>
                                <input type="text" id="note" name="note" placeholder="Optional note...">
                            </div>

                            <div class="form-group">
                                <label for="date">Date</label>
                                <input type="date" id="date" name="date">
                            </div>

                            <button type="submit" class="btn btn-primary btn-block">Add Transaction</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a single transaction item
     */
    renderTransaction(transaction) {
        const category = financeService.getCategory(transaction.category);
        const isIncome = transaction.type === 'income';
        const sign = isIncome ? '+' : '-';
        const className = isIncome ? 'income' : 'expense';

        return `
            <div class="transaction-item ${className}" data-id="${transaction.id}">
                <div class="transaction-icon">${category?.icon || '💳'}</div>
                <div class="transaction-info">
                    <div class="transaction-category">${category?.name || 'Uncategorized'}</div>
                    <div class="transaction-note">${transaction.note || 'No note'}</div>
                </div>
                <div class="transaction-amount">
                    <span class="amount">${sign}${formatCurrency(transaction.amount)}</span>
                    <div class="transaction-date">${formatDate(transaction.date, 'short')}</div>
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon delete-btn" aria-label="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners(container) {
        // Initial setup form
        const initForm = container.querySelector('.finance-init-form');
        if (initForm) {
            initForm.addEventListener('submit', (e) => this.handleSetInitialBalance(e, container));
        }

        // Add transaction button
        const addBtn = container.querySelector('.add-transaction-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddTransactionModal(container));
        }

        // View all button
        const viewAllBtn = container.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.showAllTransactions(container));
        }

        // Add transaction form
        const transForm = container.querySelector('.add-transaction-form');
        if (transForm) {
            transForm.addEventListener('submit', (e) => this.handleAddTransaction(e, container));

            // Set today's date by default
            const dateInput = transForm.querySelector('#date');
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
        }

        // Modal close button
        const closeBtn = container.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAddTransactionModal(container));
        }

        // Delete transaction buttons
        const deleteButtons = container.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteTransaction(e, container));
        });

        // Type radio buttons change
        const typeRadios = container.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateCategoryOptions(container));
        });
    }

    /**
     * Handle initial balance setup
     */
    handleSetInitialBalance(e, container) {
        e.preventDefault();
        const input = container.querySelector('#initial-balance');
        const amount = parseFloat(input.value);

        if (amount < 0) {
            showToast('Amount must be positive', 'error');
            return;
        }

        financeService.setInitialBalance(amount);
        showToast(`Initial balance set to ${formatCurrency(amount)}`, 'success');

        // Re-render
        container.innerHTML = this.renderDashboard();
        this.attachEventListeners(container);
    }

    /**
     * Handle adding a transaction
     */
    handleAddTransaction(e, container) {
        e.preventDefault();
        
        const form = e.target;
        const data = new FormData(form);

        try {
            const transaction = {
                type: data.get('type'),
                amount: parseFloat(data.get('amount')),
                category: data.get('category'),
                note: data.get('note'),
                date: new Date(data.get('date')).toISOString()
            };

            if (!transaction.amount || transaction.amount <= 0) {
                showToast('Amount must be greater than 0', 'error');
                return;
            }

            financeService.addTransaction(transaction);
            showToast('Transaction added successfully', 'success');

            // Re-render
            container.innerHTML = this.renderDashboard();
            this.attachEventListeners(container);

            this.hideAddTransactionModal(container);
        } catch (error) {
            console.error('Error adding transaction:', error);
            showToast('Failed to add transaction', 'error');
        }
    }

    /**
     * Handle deleting a transaction
     */
    handleDeleteTransaction(e, container) {
        e.preventDefault();
        const item = e.target.closest('.transaction-item');
        const id = item.getAttribute('data-id');

        if (confirm('Delete this transaction?')) {
            financeService.removeTransaction(id);
            showToast('Transaction deleted', 'success');

            // Re-render
            container.innerHTML = this.renderDashboard();
            this.attachEventListeners(container);
        }
    }

    /**
     * Show add transaction modal
     */
    showAddTransactionModal(container) {
        const modal = container.querySelector('.modal-add-transaction');
        if (modal) {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
        }
    }

    /**
     * Hide add transaction modal
     */
    hideAddTransactionModal(container) {
        const modal = container.querySelector('.modal-add-transaction');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    /**
     * Show all transactions
     */
    showAllTransactions(container) {
        const transactions = financeService.getTransactions();
        const content = container.querySelector('.finance-dashboard');

        const allTransView = document.createElement('div');
        allTransView.className = 'transactions-full-view';
        allTransView.innerHTML = `
            <div class="transactions-header">
                <h3>All Transactions</h3>
                <button class="btn-back">← Back</button>
            </div>
            <div class="transactions-list">
                ${transactions.map(t => this.renderTransaction(t)).join('')}
            </div>
        `;

        // Replace content
        content.style.display = 'none';
        container.appendChild(allTransView);

        // Back button handler
        allTransView.querySelector('.btn-back').addEventListener('click', () => {
            allTransView.remove();
            content.style.display = 'block';
            this.attachEventListeners(container);
        });

        // Attach delete listeners
        allTransView.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteTransaction(e, container));
        });
    }

    /**
     * Update category options based on selected type
     */
    updateCategoryOptions(container) {
        const selectedType = container.querySelector('input[name="type"]:checked').value;
        const select = container.querySelector('#category');
        const categories = financeService.getCategories().filter(c => c.type === selectedType);

        select.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
    }
}
