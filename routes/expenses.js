// LAYER: Backend API (Express Routes & Controller Handlers)
// This file defines the RESTful API endpoints for managing expenses and summaries.
// It handles input validation, status codes (200, 201, 400, 404), and MongoDB queries/aggregations.

const express = require('express');
const mongoose = require('mongoose');
const { Expense, ALLOWED_CATEGORIES } = require('../models/Expense');

const router = express.Router();

/**
 * Helper: Parses a "YYYY-MM" string into UTC start and end Date objects.
 * Example: "2026-10" -> start: 2026-10-01T00:00:00.000Z, end: 2026-11-01T00:00:00.000Z
 */
function getMonthDateRange(monthString) {
  // Regex strictly validating YYYY-MM format
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!monthRegex.test(monthString)) {
    return null;
  }

  const [yearStr, monthStr] = monthString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed (1 = January, 10 = October)

  // Start date: first millisecond of the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // End date: first millisecond of the following month in UTC
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return { startDate, endDate };
}

/**
 * GET /api/expenses?month=YYYY-MM
 * Fetches all expenses for the given month, sorted newest first.
 * If month query param is omitted, defaults to the current UTC month.
 */
router.get('/expenses', async (req, res) => {
  try {
    // Determine the target month (defaults to current YYYY-MM if omitted)
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const month = req.query.month || currentYearMonth;

    const dateRange = getMonthDateRange(month);
    if (!dateRange) {
      return res.status(400).json({
        error: 'Invalid month format. Please use YYYY-MM (e.g., 2026-10)'
      });
    }

    // Query documents within the date range, sorted newest first
    const expenses = await Expense.find({
      date: { $gte: dateRange.startDate, $lt: dateRange.endDate }
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return res.status(500).json({ error: 'Server error while fetching expenses' });
  }
});

/**
 * POST /api/expenses
 * Creates a new expense record with validation.
 * Expected body: { amount: Number, category: String, note?: String, date?: String/Date, tags?: Array/String }
 */
router.post('/expenses', async (req, res) => {
  try {
    const { amount, category, note, date, tags } = req.body;

    // 1. Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: 'Amount is required and must be a positive number greater than 0.'
      });
    }

    // 2. Validate Category against allowed enums
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }

    // 3. Validate Date (if provided, otherwise defaults to now)
    let parsedDate = new Date();
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Provided date is invalid. Please supply a valid ISO date or YYYY-MM-DD.'
        });
      }
    }

    // 4. Process optional stretch goal: tags
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags
        .map(t => String(t).trim())
        .filter(t => t.length > 0);
    } else if (typeof tags === 'string' && tags.trim().length > 0) {
      // Allow comma-separated strings as well
      parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }

    // 5. Create new Expense document
    const newExpense = new Expense({
      amount: parsedAmount,
      category,
      note: note ? String(note).trim() : '',
      date: parsedDate,
      tags: parsedTags
    });

    const savedExpense = await newExpense.save();

    // 201 Created status code
    return res.status(201).json({
      message: 'Expense created successfully',
      expense: savedExpense
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Server error while creating expense' });
  }
});

/**
 * DELETE /api/expenses/:id
 * Deletes an expense by its MongoDB _id.
 */
router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid expense ID format.' });
    }

    // Find and delete the document in one step
    const deletedExpense = await Expense.findByIdAndDelete(id);

    // Return 404 if no matching expense was found
    if (!deletedExpense) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    // Return 200 OK on successful deletion
    return res.status(200).json({
      message: 'Expense deleted successfully',
      id
    });
  } catch (err) {
    console.error('Error deleting expense:', err);
    return res.status(500).json({ error: 'Server error while deleting expense' });
  }
});

/**
 * GET /api/summary?month=YYYY-MM
 * Computes monthly total and category breakdown using a MongoDB aggregation pipeline
 * ($match stage followed by $group stage).
 */
router.get('/summary', async (req, res) => {
  try {
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const month = req.query.month || currentYearMonth;

    const dateRange = getMonthDateRange(month);
    if (!dateRange) {
      return res.status(400).json({
        error: 'Invalid month format. Please use YYYY-MM (e.g., 2026-10)'
      });
    }

    // MongoDB Aggregation Pipeline:
    // Stage 1: $match - Filters expenses that fall inside the requested month
    // Stage 2: $group - Groups matching expenses by category, computing sum(amount) and count
    const aggregationResult = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: dateRange.startDate,
            $lt: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Map aggregation results by category for easy lookup
    const resultMap = new Map();
    let totalMonthAmount = 0;
    let totalExpenseCount = 0;

    aggregationResult.forEach(item => {
      resultMap.set(item._id, {
        totalAmount: Number(item.totalAmount.toFixed(2)),
        count: item.count
      });
      totalMonthAmount += item.totalAmount;
      totalExpenseCount += item.count;
    });

    // Build complete category breakdown ensuring all 5 categories are present
    const byCategory = ALLOWED_CATEGORIES.map(categoryName => {
      const data = resultMap.get(categoryName) || { totalAmount: 0, count: 0 };
      const percentage = totalMonthAmount > 0 
        ? Math.round((data.totalAmount / totalMonthAmount) * 100) 
        : 0;

      return {
        category: categoryName,
        totalAmount: data.totalAmount,
        count: data.count,
        percentage
      };
    });

    // Return the summary object
    return res.status(200).json({
      month,
      totalMonth: Number(totalMonthAmount.toFixed(2)),
      totalCount: totalExpenseCount,
      byCategory
    });
  } catch (err) {
    console.error('Error generating summary:', err);
    return res.status(500).json({ error: 'Server error while generating summary' });
  }
});

module.exports = router;
