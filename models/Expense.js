// LAYER: Database (Mongoose Schema & Model)
// This file defines the Expense schema, validation rules, enums,
// and exports the Mongoose model used to interact with the MongoDB 'expenses' collection.

const mongoose = require('mongoose');

// Allowed categories as specified in the project requirements
const ALLOWED_CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

// Define the Mongoose schema for an individual expense document
const expenseSchema = new mongoose.Schema(
  {
    // Amount in currency units: required number, strictly positive (> 0)
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    // Category: restricted to the enumerated list of 5 valid categories
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ALLOWED_CATEGORIES,
        message: '{VALUE} is not a valid category. Must be one of: ' + ALLOWED_CATEGORIES.join(', ')
      }
    },
    // Optional note/description providing context for the expense
    note: {
      type: String,
      trim: true,
      default: ''
    },
    // Date of the expense: defaults to current date if omitted
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    // STRETCH GOAL: Optional tags array demonstrating MongoDB's flexible schema support
    // E.g. ["urgent", "vacation", "lunch"]
    tags: {
      type: [String],
      default: []
    }
  },
  {
    // Automatically add createdAt and updatedAt ISO timestamps
    timestamps: true
  }
);

// Index on the date field to speed up monthly range queries and aggregation sorting
expenseSchema.index({ date: -1 });

// Create and export the Expense model along with the category enum list
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = {
  Expense,
  ALLOWED_CATEGORIES
};
