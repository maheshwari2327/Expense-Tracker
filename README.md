# 💰 Expense Tracker (Fullstack Vue 3 + Express + MongoDB)

A simple, beautiful, and beginner-friendly **Expense Tracker** application built with a modern 3-layer architecture:
- **Frontend Layer:** Vue 3 with Vite, Composition API (`<script setup>`), and custom CSS.
- **Backend API Layer:** Node.js with Express, input validation, and RESTful routing.
- **Database Layer:** MongoDB with Mongoose ODM (supporting both local installs, MongoDB Atlas clusters, or automatic zero-config fallback).

---

## 📸 Architecture & 3-Layer Separation

The project enforces a strict, transparent separation of concerns:
```
expense_tracker/
├── server/                    # 🟢 BACKEND & DATABASE LAYERS
│   ├── models/
│   │   └── Expense.js         # Layer: Database (Mongoose Schema & Models)
│   ├── routes/
│   │   └── expenses.js        # Layer: Backend API (Express Router & Aggregations)
│   ├── index.js               # Layer: Backend Server (Express App & Mongo Connection)
│   ├── .env.example           # Environment template (MONGO_URL, PORT)
│   ├── .env                   # Active environment variables
│   └── package.json           # Server dependencies & scripts
│
├── client/                    # 🔵 FRONTEND LAYER
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExpenseForm.vue   # Layer: Frontend (Creation Form & Stretch Goal Tags)
│   │   │   ├── ExpenseList.vue   # Layer: Frontend (Monthly Expense List & Delete)
│   │   │   └── SummaryCards.vue  # Layer: Frontend (Overview & Category Aggregation)
│   │   ├── App.vue               # Layer: Frontend (Root Coordinator & Month Picker)
│   │   ├── main.js               # Layer: Frontend (Vue Application Bootstrap)
│   │   └── style.css             # Layer: Frontend (Modern Dark Theme Design System)
│   ├── index.html             # Layer: Frontend (HTML5 Host Page)
│   ├── vite.config.js         # Layer: Frontend (Vite Dev Server & Proxy)
│   └── package.json           # Client dependencies & scripts
│
└── README.md                  # Complete documentation
```

*Every source file includes a top-level banner comment designating its architectural layer!*

---

## ✨ Features

1. **Expense Form (`ExpenseForm.vue`)**:
   - Fields: Amount ($), Category (`Food`, `Travel`, `Bills`, `Shopping`, `Other`), Note / Description, Date.
   - **Stretch Goal Included**: Flexible `tags` array allowing tag chips (e.g., `#groceries`, `#commute`, `#work`) demonstrating MongoDB's schema flexibility.
   - Client and server-side validation (Amount > 0, valid category, valid date).

2. **Monthly Expense List (`ExpenseList.vue`)**:
   - Lists all expenses for the selected month, sorted **newest first**.
   - Category badges with distinctive colors and icons.
   - Formatted currency (`$XX.XX`) and formatted dates (`MMM D, YYYY`).
   - Quick search/filter bar to filter by note or tag.

3. **Delete Expense**:
   - One-click deletion with confirmation.
   - Triggers `DELETE /api/expenses/:id` and updates list + summaries instantly.

4. **Summary Cards (`SummaryCards.vue`)**:
   - Total monthly spending card.
   - Top-spending category highlight.
   - Total spending per category computed using a **MongoDB aggregation pipeline** (`$match` + `$group`) with visual percentage progress bars.

5. **Month Picker (`App.vue`)**:
   - Quick navigation buttons (`‹` previous month, `›` next month).
   - HTML5 month input (`YYYY-MM`) defaulting to current month (`2026-10`).
   - Switching months immediately re-queries backend endpoints.

6. **Automatic Seeding**:
   - On first launch, if the database has 0 records, the backend automatically seeds 5 realistic sample expenses with tags for October 2026.

---

## 📦 Data Model (Mongoose Schema)

Located at `server/models/Expense.js`:

```javascript
const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Other']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  // Stretch Goal: Flexible tags array
  tags: {
    type: [String],
    default: []
  }
}, { timestamps: true });
```

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api`:

| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses?month=YYYY-MM` | `?month=2026-10` | Returns all expenses in that month, newest first. |
| `POST` | `/api/expenses` | `{ amount, category, note, date, tags }` | Validates input and creates a new expense (201 Created). |
| `DELETE` | `/api/expenses/:id` | `:id` param | Deletes an expense by its MongoDB `_id` (200 OK / 404 Not Found). |
| `GET` | `/api/summary?month=YYYY-MM` | `?month=2026-10` | Uses MongoDB `$match` and `$group` aggregation to calculate monthly total and category breakdown. |

---

## 🚀 Prerequisites

- **Node.js**: v18.0.0 or higher (v22+ recommended).
- **npm**: v9.0.0 or higher.
- **MongoDB**: 
  - *Option A (Atlas)*: A free MongoDB Atlas cluster connection string.
  - *Option B (Local)*: A local MongoDB community edition service (`mongodb://127.0.0.1:27017`).
  - *Option C (Zero-Config)*: If no MongoDB is detected, the server automatically starts an in-memory MongoDB instance for effortless local testing.

---

## 🛠️ Installation & Setup

### 1. Backend Server Setup
Open a terminal in the project directory:

```bash
cd expense_tracker/server

# Install dependencies (pinned versions)
npm install

# (Optional) Verify or customize .env
# If using MongoDB Atlas, replace MONGO_URL in server/.env:
# MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/expense_tracker?retryWrites=true&w=majority
```

### 2. Frontend Client Setup
Open a second terminal window:

```bash
cd expense_tracker/client

# Install frontend dependencies
npm install
```

---

## ▶️ Running the Application

### 1. Start the Backend Server
In the `server` terminal:
```bash
npm run dev
# Or: npm start
```
- Server URL: **`http://localhost:5000`**
- Health Check: **`http://localhost:5000/`**

### 2. Start the Frontend Client
In the `client` terminal:
```bash
npm run dev
```
- Application Web URL: **`http://localhost:5173`**

Open **`http://localhost:5173`** in your browser to start tracking expenses!

---

## 🧪 Testing the Features

1. **Viewing Seed Data**:
   - When the page loads at `http://localhost:5173`, the 5 seeded sample expenses for October 2026 will appear along with summary stats.
2. **Adding an Expense**:
   - Enter an amount (e.g. `14.50`), select `Food`, add a note (e.g. `Healthy salad lunch`), pick a date, and type tags (`salad, lunch`). Click **"+ Add Expense"**.
   - Notice the instant update of the monthly total, category breakdown bar, and list.
3. **Deleting an Expense**:
   - Click the 🗑️ icon beside any expense and confirm. The item is removed and totals recalculate immediately.
4. **Switching Months**:
   - Use the `‹` / `›` buttons or date picker to switch to another month (e.g., September or November 2026) to see the empty state or navigate back.
