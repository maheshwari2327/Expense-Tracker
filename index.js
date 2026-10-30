// LAYER: Backend Server (Entry Point & Server Setup)
// This file initializes Express, configures middleware (CORS, JSON parser),
// establishes connection to MongoDB (with zero-config in-memory fallback),
// seeds initial sample data if empty, and starts the HTTP listener.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const expenseRoutes = require('./routes/expenses');
const { Expense } = require('./models/Expense');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for the Vue frontend
app.use(cors());

// Parse incoming JSON request payloads
app.use(express.json());

// Lightweight request logging middleware for developer clarity
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount the Expense REST API routes under the /api prefix
app.use('/api', expenseRoutes);

// Root health-check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Expense Tracker Backend API',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET    /api/expenses?month=YYYY-MM',
      'POST   /api/expenses',
      'DELETE /api/expenses/:id',
      'GET    /api/summary?month=YYYY-MM'
    ]
  });
});

/**
 * Seeds the database with 5 diverse sample records on first run
 * if the database has 0 expenses.
 */
async function seedInitialData() {
  try {
    const count = await Expense.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database is empty. Seeding 5 sample expenses...');
      
      // Sample expenses tailored to current month October 2026
      const sampleExpenses = [
        {
          amount: 68.50,
          category: 'Food',
          note: 'Weekly organic groceries at market',
          date: new Date('2026-10-05T10:30:00Z'),
          tags: ['groceries', 'healthy']
        },
        {
          amount: 45.00,
          category: 'Travel',
          note: 'Metro card monthly transit recharge',
          date: new Date('2026-10-10T08:15:00Z'),
          tags: ['commute', 'subway']
        },
        {
          amount: 65.00,
          category: 'Bills',
          note: 'Fiber optic broadband internet bill',
          date: new Date('2026-10-15T14:00:00Z'),
          tags: ['utilities', 'work-from-home']
        },
        {
          amount: 39.99,
          category: 'Shopping',
          note: 'Ergonomic desk mousepad & cable organizer',
          date: new Date('2026-10-20T16:45:00Z'),
          tags: ['workspace', 'electronics']
        },
        {
          amount: 25.00,
          category: 'Other',
          note: 'Community plant nursery & pots',
          date: new Date('2026-10-24T11:20:00Z'),
          tags: ['gardening', 'hobby']
        }
      ];

      await Expense.insertMany(sampleExpenses);
      console.log('[Seed] Successfully seeded 5 sample expenses into MongoDB.');
    } else {
      console.log(`[Seed] Database already contains ${count} expense records.`);
    }
  } catch (err) {
    console.error('[Seed] Error seeding sample data:', err.message);
  }
}

/**
 * Connects to MongoDB.
 * Priority 1: User-specified MONGO_URL (e.g. MongoDB Atlas or local MongoDB service).
 * Priority 2: Built-in in-memory MongoDB fallback if external MongoDB is unavailable.
 */
async function connectDatabase() {
  const primaryUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/expense_tracker';
  
  try {
    console.log(`[MongoDB] Attempting connection to: ${primaryUrl}`);
    // Short 3s timeout so we quickly failover if no local daemon is running
    await mongoose.connect(primaryUrl, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[MongoDB] Connected successfully to MongoDB server.');
  } catch (primaryErr) {
    console.warn(`[MongoDB] Could not connect to primary URL (${primaryErr.message}).`);
    console.log('[MongoDB] Starting built-in in-memory MongoDB server for instant zero-config testing...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      
      await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] In-memory MongoDB running at: ${inMemoryUri}`);
      console.log('[MongoDB] Zero-config mode active! (Tip: Set MONGO_URL in server/.env for permanent Atlas persistence).');
    } catch (fallbackErr) {
      console.error('[MongoDB] In-memory server startup failed:', fallbackErr.message);
      process.exit(1);
    }
  }

  // Seed sample data once connected
  await seedInitialData();
}

// Start database and Express HTTP server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Expense Tracker Backend API`);
    console.log(` Server URL : http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/`);
    console.log(` API Docs   : http://localhost:${PORT}/api/expenses`);
    console.log(`===============================================`);
  });
}).catch(err => {
  console.error('Fatal initialization error:', err);
});
