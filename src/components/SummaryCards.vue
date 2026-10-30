<!-- LAYER: Frontend (Vue 3 Component - Composition API) -->
<!-- This component renders the monthly summary metrics: total monthly spending, -->
<!-- transaction counts, and category breakdown derived from the MongoDB aggregation pipeline. -->

<script setup>
import { computed } from 'vue';

const props = defineProps({
  summary: {
    type: Object,
    required: true,
    default: () => ({
      month: '',
      totalMonth: 0,
      totalCount: 0,
      byCategory: []
    })
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

// Category visual metadata
const categoryMeta = {
  Food: { icon: '🍔', color: '#f59e0b', class: 'cat-food' },
  Travel: { icon: '✈️', color: '#06b6d4', class: 'cat-travel' },
  Bills: { icon: '📄', color: '#f43f5e', class: 'cat-bills' },
  Shopping: { icon: '🛍️', color: '#d946ef', class: 'cat-shopping' },
  Other: { icon: '🏷️', color: '#8b5cf6', class: 'cat-other' }
};

// Format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val || 0);
};

// Average expense calculation
const averageExpense = computed(() => {
  if (!props.summary.totalCount || props.summary.totalCount === 0) return 0;
  return props.summary.totalMonth / props.summary.totalCount;
});

// Identify the highest spend category
const topCategory = computed(() => {
  if (!props.summary.byCategory || props.summary.byCategory.length === 0) return null;
  const sorted = [...props.summary.byCategory].sort((a, b) => b.totalAmount - a.totalAmount);
  return sorted[0]?.totalAmount > 0 ? sorted[0] : null;
});
</script>

<template>
  <div class="summary-section">
    <!-- Top Row: Overview Hero Cards -->
    <div class="overview-grid">
      <!-- Total Month Spend Hero -->
      <div class="summary-card hero-card">
        <div class="card-glow"></div>
        <div class="hero-content">
          <div class="hero-header">
            <span class="hero-label">Total Monthly Spending</span>
            <span class="hero-pill">{{ summary.month || 'Selected Month' }}</span>
          </div>
          <div class="hero-amount">
            {{ formatCurrency(summary.totalMonth) }}
          </div>
          <div class="hero-footer">
            <span class="stat-item">
              <strong>{{ summary.totalCount }}</strong> expenses recorded
            </span>
            <span v-if="summary.totalCount > 0" class="stat-divider">•</span>
            <span v-if="summary.totalCount > 0" class="stat-item">
              Avg: <strong>{{ formatCurrency(averageExpense) }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Top Spending Highlight Card -->
      <div class="summary-card highlight-card">
        <div class="highlight-header">
          <span class="highlight-label">Top Expense Category</span>
          <span class="highlight-icon">🔥</span>
        </div>
        <div v-if="topCategory" class="highlight-body">
          <div class="top-cat-badge">
            <span class="cat-icon">{{ categoryMeta[topCategory.category]?.icon }}</span>
            <span class="cat-name">{{ topCategory.category }}</span>
          </div>
          <div class="top-cat-amount">
            {{ formatCurrency(topCategory.totalAmount) }}
            <span class="top-cat-percent">({{ topCategory.percentage }}% of total)</span>
          </div>
        </div>
        <div v-else class="highlight-empty">
          <p>No expenses recorded yet</p>
        </div>
      </div>
    </div>

    <!-- Category Breakdown Grid (5 Categories) -->
    <div class="category-breakdown-section">
      <h3 class="breakdown-title">
        <span>📊 Spending by Category</span>
        <span class="sub-label">MongoDB Aggregation Pipeline ($match + $group)</span>
      </h3>

      <div class="category-cards-grid">
        <div
          v-for="cat in summary.byCategory"
          :key="cat.category"
          class="cat-summary-card"
          :class="`border-${cat.category}`"
        >
          <div class="cat-card-top">
            <div class="cat-card-title">
              <span class="cat-card-icon">{{ categoryMeta[cat.category]?.icon }}</span>
              <span class="cat-card-name">{{ cat.category }}</span>
            </div>
            <span class="cat-card-count">{{ cat.count }} items</span>
          </div>

          <div class="cat-card-amount">
            {{ formatCurrency(cat.totalAmount) }}
          </div>

          <!-- Progress Bar Representation -->
          <div class="cat-progress-track">
            <div
              class="cat-progress-fill"
              :class="`fill-${cat.category}`"
              :style="{ width: `${cat.percentage}%` }"
            ></div>
          </div>

          <div class="cat-card-meta">
            <span>{{ cat.percentage }}% of month</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Overview Top Grid */
.overview-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1.75rem;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(14px);
}

.hero-card {
  background: linear-gradient(135deg, rgba(24, 32, 54, 0.9) 0%, rgba(15, 21, 37, 0.9) 100%);
  border-color: rgba(99, 102, 241, 0.25);
}

.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.hero-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.hero-pill {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #c7d2fe;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-pill);
}

.hero-amount {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 40%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.hero-footer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.hero-footer strong {
  color: var(--text-main);
}

.stat-divider {
  color: var(--text-dim);
}

/* Highlight Card */
.highlight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.highlight-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.highlight-icon {
  font-size: 1.25rem;
}

.top-cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.top-cat-amount {
  font-family: var(--font-heading);
  font-size: 1.65rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.top-cat-percent {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.highlight-empty {
  color: var(--text-dim);
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Category Breakdown Grid */
.breakdown-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sub-label {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-weight: 500;
  font-family: var(--font-body);
}

.category-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.85rem;
}

@media (max-width: 1024px) {
  .category-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .category-cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.cat-summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: all 0.2s ease;
}

.cat-summary-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.16);
}

.cat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-card-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.85rem;
}

.cat-card-count {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.cat-card-amount {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.cat-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-top: 0.1rem;
}

.cat-progress-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.5s ease-out;
}

.fill-Food { background: var(--cat-food); }
.fill-Travel { background: var(--cat-travel); }
.fill-Bills { background: var(--cat-bills); }
.fill-Shopping { background: var(--cat-shopping); }
.fill-Other { background: var(--cat-other); }

.cat-card-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
}
</style>
