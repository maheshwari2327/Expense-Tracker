<!-- LAYER: Frontend (Vue 3 Component - Composition API) -->
<!-- This component displays the list of expenses for the selected month, sorted newest first, -->
<!-- with category badges, optional tags, formatted currency, and deletion capabilities. -->

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  expenses: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  selectedMonth: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['expense-deleted']);

// State to track which expense is currently pending deletion confirmation
const deletingId = ref(null);
const searchFilter = ref('');

// Category emoji icons map
const categoryIcons = {
  Food: '🍔',
  Travel: '✈️',
  Bills: '📄',
  Shopping: '🛍️',
  Other: '🏷️'
};

// Format currency into standard $XX.XX format
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

// Format ISO date into user-friendly format e.g., "Oct 24, 2026"
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Optional client-side quick search filter within the current month
const filteredExpenses = computed(() => {
  if (!searchFilter.value.trim()) return props.expenses;
  const q = searchFilter.value.toLowerCase().trim();
  return props.expenses.filter((item) => {
    const noteMatch = (item.note || '').toLowerCase().includes(q);
    const categoryMatch = item.category.toLowerCase().includes(q);
    const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
    const amountMatch = String(item.amount).includes(q);
    return noteMatch || categoryMatch || tagMatch || amountMatch;
  });
});

// Handle deletion of an expense
const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }

  deletingId.value = id;
  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete expense');
    }

    emit('expense-deleted', id);
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    deletingId.value = null;
  }
};
</script>

<template>
  <div class="card expense-list-card">
    <div class="list-header">
      <div class="list-title-group">
        <h2 class="card-title">
          <span class="icon">📋</span> Monthly Expenses
        </h2>
        <span class="count-pill">{{ expenses.length }} transactions</span>
      </div>

      <!-- Quick Search Bar -->
      <div class="search-box-wrapper" v-if="expenses.length > 0">
        <input
          type="text"
          v-model="searchFilter"
          placeholder="Filter notes or tags..."
          class="form-input search-input"
          aria-label="Filter expenses"
        />
        <span v-if="searchFilter" class="clear-search" @click="searchFilter = ''">✕</span>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading expenses for {{ selectedMonth }}...</p>
    </div>

    <!-- Empty State: No expenses for this month -->
    <div v-else-if="expenses.length === 0" class="empty-state">
      <div class="empty-icon">💸</div>
      <h3>No expenses recorded</h3>
      <p>There are no transactions recorded for <strong>{{ selectedMonth }}</strong>.</p>
      <p class="empty-tip">Use the form to record your first expense for this month!</p>
    </div>

    <!-- Empty search results -->
    <div v-else-if="filteredExpenses.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No matches found</h3>
      <p>No expenses matched "<strong>{{ searchFilter }}</strong>".</p>
      <button class="btn-clear-search" @click="searchFilter = ''">Reset Filter</button>
    </div>

    <!-- Expenses List (Newest First) -->
    <div v-else class="expense-items-container">
      <div
        v-for="expense in filteredExpenses"
        :key="expense._id"
        class="expense-row"
      >
        <!-- Category Icon & Badge -->
        <div class="expense-main-info">
          <div class="category-icon-box" :class="`icon-${expense.category}`">
            {{ categoryIcons[expense.category] || '💰' }}
          </div>
          
          <div class="expense-details">
            <div class="expense-title-line">
              <span class="expense-note">
                {{ expense.note || expense.category }}
              </span>
              <span :class="['badge-category', `badge-${expense.category}`]">
                {{ expense.category }}
              </span>
            </div>

            <div class="expense-meta-line">
              <span class="expense-date">
                📅 {{ formatDate(expense.date) }}
              </span>
              
              <!-- Stretch Goal Tags Display -->
              <span v-if="expense.tags && expense.tags.length > 0" class="row-tags">
                <span
                  v-for="tag in expense.tags"
                  :key="tag"
                  class="tag-chip"
                >
                  #{{ tag }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Amount and Actions -->
        <div class="expense-actions-side">
          <span class="expense-amount">
            -{{ formatCurrency(expense.amount) }}
          </span>

          <button
            class="delete-btn"
            :disabled="deletingId === expense._id"
            @click="handleDelete(expense._id)"
            title="Delete this expense"
            aria-label="Delete expense"
          >
            <span v-if="deletingId === expense._id">...</span>
            <span v-else>🗑️</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expense-list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.list-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.list-title-group .card-title {
  margin-bottom: 0;
}

.count-pill {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-weight: 600;
}

.search-box-wrapper {
  position: relative;
  min-width: 200px;
}

.search-input {
  padding: 0.45rem 1.8rem 0.45rem 0.75rem;
  font-size: 0.85rem;
  border-radius: var(--radius-pill);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-dim);
  font-size: 0.75rem;
}

.clear-search:hover {
  color: var(--text-main);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  gap: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
  margin: auto 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state h3 {
  font-size: 1.15rem;
  margin-bottom: 0.35rem;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.empty-tip {
  margin-top: 0.5rem;
  color: var(--text-dim);
  font-size: 0.8rem;
}

.btn-clear-search {
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-subtle);
  color: #fff;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

/* List Rows */
.expense-items-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 580px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  gap: 1rem;
}

.expense-row:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.expense-main-info {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  min-width: 0;
}

.category-icon-box {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.icon-Food {
  background: var(--cat-food-bg);
  border-color: var(--cat-food-border);
}
.icon-Travel {
  background: var(--cat-travel-bg);
  border-color: var(--cat-travel-border);
}
.icon-Bills {
  background: var(--cat-bills-bg);
  border-color: var(--cat-bills-border);
}
.icon-Shopping {
  background: var(--cat-shopping-bg);
  border-color: var(--cat-shopping-border);
}
.icon-Other {
  background: var(--cat-other-bg);
  border-color: var(--cat-other-border);
}

.expense-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.expense-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.expense-note {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.expense-meta-line {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.row-tags {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

/* Actions Side */
.expense-actions-side {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.expense-amount {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  color: #f43f5e;
  letter-spacing: -0.01em;
}

.delete-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-dim);
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background: var(--danger-glow);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--danger);
  transform: scale(1.05);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
