-- Migration: Create tables for Shanghai Calculator
-- Run this in the Supabase SQL Editor or via the REST API

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS "Expense" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  "payerId" INT NOT NULL REFERENCES "User"(id)
);

-- ExpenseShare table
CREATE TABLE IF NOT EXISTS "ExpenseShare" (
  id SERIAL PRIMARY KEY,
  "expenseId" INT NOT NULL REFERENCES "Expense"(id) ON DELETE CASCADE,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "amountOwed" DOUBLE PRECISION NOT NULL,
  "isPaid" BOOLEAN DEFAULT FALSE,
  UNIQUE("expenseId", "userId")
);

-- PocketTransaction table (shared pocket deposits/withdrawals)
CREATE TABLE IF NOT EXISTS "PocketTransaction" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id),
  amount DOUBLE PRECISION NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);
