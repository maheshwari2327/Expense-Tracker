<!-- LAYER: Frontend (Main Application Component - Composition API with <script setup>) -->
<!-- This root component coordinates the month picker state, fetches data from the backend API, -->
<!-- and renders the SummaryCards, ExpenseForm, and ExpenseList child components. -->

<script setup>
import { ref, onMounted } from 'vue';
import SummaryCards from './components/SummaryCards.vue';
import ExpenseForm from './components/ExpenseForm.vue';
import ExpenseList from './components/ExpenseList.vue';

// Helper: Formats current date to YYYY-MM (e.g. "2026-10")
const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Application State
const selectedMonth = ref(getCurrentMonthString());
const expenses = ref([]);
const summary = ref({
  month: selectedMonth.value,
  totalMonth: 0,
  totalCount: 0,
  byCategory: []
});
const isLoading = ref(false);
const fetchError = ref('');

/**
 * Shifts the selected month by an offset (-1 for previous month, +1 for next month)
 */
const changeMonthOffset = (offset) => {
  const [yearStr, monthStr] = selectedMonth.value.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + offset;

  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }

  const formattedMonth = String(month).padStart(2, '0');
  selectedMonth.value = `${year}-${formattedMonth}`;
  loadMonthData(selectedMonth.value);
};

/**
 * Handles direct change from HTML5 month picker input
 */
const onMonthInputChange = (event) => {
  selectedMonth.value = event.target.value;
  loadMonthData(selectedMonth.value);
};

/**
 * Fetches expenses list and monthly summary concurrently for the given month
 */
const loadMonthData = async (month) => {
  isLoading.value = true;
  fetchError.value = '';

  try {
    // Execute both API queries in parallel for peak performance
    const [expensesRes, summaryRes] = await Promise.all([
      fetch(`/api/expenses?month=${encodeURIComponent(month)}`),
      fetch(`/api/summary?month=${encodeURIComponent(month)}`)
    ]);

    if (!expensesRes.ok) {
      const err = await expensesRes.json();
      throw new Error(err.error || 'Failed to fetch expenses');
    }
    if (!summaryRes.ok) {
      const err = await summaryRes.json();
      throw new Error(err.error || 'Failed to fetch summary');
    }

    expenses.value = await expensesRes.json();
    summary.value = await summaryRes.json();
  } catch (err) {
    console.error('Data load error:', err);
    fetchError.value = err.message || 'Error connecting to the backend server.';
  } finally {
    isLoading.value = false;
  }
};

/**
 * Callback when a new expense is saved from ExpenseForm
 */
const handleExpenseAdded = (newExpense) => {
  // If the created expense belongs to the currently active month, refresh data
  const expenseMonth = newExpense.date.slice(0, 7);
  if (expenseMonth === selectedMonth.value) {
    loadMonthData(selectedMonth.value);
  } else {
    // If user added expense for a different month, switch to that month
    selectedMonth.value = expenseMonth;
    loadMonthData(expenseMonth);
  }
};

/**
 * Callback when an expense is deleted from ExpenseList
 */
const handleExpenseDeleted = () => {
  // Reload both expenses and aggregate summary to reflect updated totals
  loadMonthData(selectedMonth.value);
};

// Initial load on component mount
onMounted(() => {
  loadMonthData(selectedMonth.value);
});
</script>

<template>
  <div class="app-container">
    <!-- Top Header & Navigation -->
    <header class="app-header">
      <div class="brand-section">
        <div class="brand-icon-box">💰</div>
        <div>
          <h1 class="brand-title">Expense Tracker</h1>
          <p class="brand-subtitle">Vue 3 + Express + MongoDB Fullstack Application</p>
        </div>
      </div>

      <!-- Feature #5: Interactive Month Picker Toolbar -->
      <div class="month-selector-bar">
        <button
          class="month-nav-btn"
          @click="changeMonthOffset(-1)"
          title="Previous month"
          aria-label="Previous Month"
        >
          ‹
        </button>

        <div class="month-input-wrapper">
          <input
            type="month"
            id="month-picker"
            :value="selectedMonth"
            @change="onMonthInputChange"
            class="month-input"
            aria-label="Select month"
          />
        </div>

        <button
          class="month-nav-btn"
          @click="changeMonthOffset(1)"
          title="Next month"
          aria-label="Next Month"
        >
          ›
        </button>
      </div>
    </header>

    <!-- Global Connection / Fetch Error Toast -->
    <div v-if="fetchError" class="alert-box alert-error">
      <span>⚠️ {{ fetchError }}</span>
      <button class="btn-retry" @click="loadMonthData(selectedMonth)">Retry</button>
    </div>

    <!-- Feature #4: Summary Cards (Total for month and per category via Aggregation) -->
    <SummaryCards :summary="summary" :is-loading="isLoading" />

    <!-- Main Two-Column Layout -->
    <main class="main-content-grid">
      <!-- Feature #1: Expense Creation Form -->
      <section class="form-column">
        <ExpenseForm @expense-added="handleExpenseAdded" />
      </section>

      <!-- Features #2 & #3: Monthly Expense List & Deletion -->
      <section class="list-column">
        <ExpenseList
          :expenses="expenses"
          :is-loading="isLoading"
          :selected-month="selectedMonth"
          @expense-deleted="handleExpenseDeleted"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.main-content-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 992px) {
  .main-content-grid {
    grid-template-columns: 1fr;
  }
}

.btn-retry {
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 1rem;
}
</style>
