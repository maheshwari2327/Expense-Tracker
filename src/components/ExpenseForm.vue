<!-- LAYER: Frontend (Vue 3 Component - Composition API) -->
<!-- This component renders the expense creation form with fields for amount, category, -->
<!-- note, date, and optional tags (stretch goal). It emits 'expense-added' upon success. -->

<script setup>
import { ref } from 'vue';

// Define emitted events to notify parent App when a new expense is successfully created
const emit = defineEmits(['expense-added']);

// Allowed categories matching backend enum
const categories = [
  { value: 'Food', label: 'Food', icon: '🍔' },
  { value: 'Travel', label: 'Travel', icon: '✈️' },
  { value: 'Bills', label: 'Bills', icon: '📄' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'Other', label: 'Other', icon: '🏷️' }
];

// Helper to get today's date in YYYY-MM-DD for standard date input
const getTodayString = () => new Date().toISOString().split('T')[0];

// Reactive form state
const amount = ref('');
const category = ref('Food');
const note = ref('');
const date = ref(getTodayString());
const tagInput = ref('');
const tags = ref([]);

// UI State
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Add tag chip
const addTag = () => {
  const trimmed = tagInput.value.trim().replace(/^#/, '');
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value.push(trimmed);
  }
  tagInput.value = '';
};

// Remove tag chip
const removeTag = (indexToRemove) => {
  tags.value = tags.value.filter((_, idx) => idx !== indexToRemove);
};

// Handle tag input keydown (Enter or Comma)
const handleTagKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTag();
  }
};

// Reset form fields
const resetForm = () => {
  amount.value = '';
  category.value = 'Food';
  note.value = '';
  date.value = getTodayString();
  tagInput.value = '';
  tags.value = [];
};

// Handle form submission
const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  const parsedAmount = parseFloat(amount.value);
  if (!parsedAmount || parsedAmount <= 0) {
    errorMessage.value = 'Please enter a valid amount greater than $0.00';
    return;
  }

  if (!category.value) {
    errorMessage.value = 'Please choose a category.';
    return;
  }

  // If user typed in tag input without hitting enter, include it
  if (tagInput.value.trim()) {
    addTag();
  }

  isSubmitting.value = true;

  try {
    const payload = {
      amount: parsedAmount,
      category: category.value,
      note: note.value.trim(),
      date: date.value,
      tags: tags.value
    };

    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save expense');
    }

    successMessage.value = `Added $${parsedAmount.toFixed(2)} in ${category.value}!`;
    resetForm();
    emit('expense-added', data.expense);

    // Auto-clear success message after 3.5 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3500);
  } catch (err) {
    errorMessage.value = err.message || 'Network error while adding expense.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="card expense-form-card">
    <h2 class="card-title">
      <span class="icon">➕</span> Add New Expense
    </h2>

    <!-- Feedback Alerts -->
    <div v-if="errorMessage" class="alert-box alert-error">
      <span>⚠️ {{ errorMessage }}</span>
      <button class="alert-close-btn" @click="errorMessage = ''" aria-label="Close error">✕</button>
    </div>

    <div v-if="successMessage" class="alert-box alert-success">
      <span>✅ {{ successMessage }}</span>
      <button class="alert-close-btn" @click="successMessage = ''" aria-label="Close message">✕</button>
    </div>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <!-- Amount Field -->
        <div class="form-group">
          <label for="expense-amount" class="form-label">
            Amount ($) <span class="required-star">*</span>
          </label>
          <div class="input-with-prefix">
            <span class="currency-prefix">$</span>
            <input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              v-model="amount"
              required
              class="form-input with-prefix"
            />
          </div>
        </div>

        <!-- Category Dropdown Field -->
        <div class="form-group">
          <label for="expense-category" class="form-label">
            Category <span class="required-star">*</span>
          </label>
          <select id="expense-category" v-model="category" class="form-select" required>
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.icon }} {{ cat.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <!-- Date Picker Field -->
        <div class="form-group">
          <label for="expense-date" class="form-label">
            Date <span class="required-star">*</span>
          </label>
          <input
            id="expense-date"
            type="date"
            v-model="date"
            required
            class="form-input date-input"
          />
        </div>

        <!-- Stretch Goal: Tags Array Field -->
        <div class="form-group">
          <label for="expense-tags" class="form-label">
            Tags (Optional Stretch Goal)
          </label>
          <div class="tag-input-container">
            <input
              id="expense-tags"
              type="text"
              placeholder="e.g. groceries, coffee (Enter or ,)"
              v-model="tagInput"
              @keydown="handleTagKeydown"
              class="form-input tag-input-box"
            />
          </div>
          <!-- Active Tags Chips -->
          <div v-if="tags.length > 0" class="tags-preview-list">
            <span v-for="(tag, idx) in tags" :key="tag" class="tag-chip">
              #{{ tag }}
              <button type="button" class="tag-remove-btn" @click="removeTag(idx)" aria-label="Remove tag">✕</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Note / Description Field -->
      <div class="form-group">
        <label for="expense-note" class="form-label">
          Note / Description
        </label>
        <input
          id="expense-note"
          type="text"
          placeholder="e.g. Trader Joe's grocery haul"
          v-model="note"
          class="form-input"
        />
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn-primary" :disabled="isSubmitting" id="btn-submit-expense">
        <span v-if="isSubmitting">Saving Expense...</span>
        <span v-else>+ Add Expense</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.expense-form-card {
  height: 100%;
}

.required-star {
  color: var(--danger);
  font-weight: bold;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  pointer-events: none;
}

.with-prefix {
  padding-left: 2rem;
}

.date-input {
  color-scheme: dark;
}

.alert-close-btn {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 0.25rem;
}

.tags-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tag-remove-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  margin-left: 0.25rem;
  font-size: 0.65rem;
  display: inline-flex;
  align-items: center;
}

.tag-remove-btn:hover {
  color: #ef4444;
}
</style>
