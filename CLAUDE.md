# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal budget management application with SimpleFin bank integration. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL, and Drizzle ORM.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run start        # Start production server
npm run db:push      # Push schema to database (dev)
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:studio    # Browse data in web UI
npm run db:seed      # Seed database with mock data
docker compose up -d # Start local PostgreSQL
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 App Router with React Server Components
- **Database:** PostgreSQL 16 (Docker) + Drizzle ORM
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York style, Radix UI primitives)
- **Icons:** lucide-react
- **Fonts:** Geist Sans and Geist Mono

### Directory Structure
- `/app` - Next.js app router pages (dashboard, transactions, networth)
- `/components` - React components
- `/components/ui` - shadcn/ui component library
- `/lib` - Types, utilities, and mock data
- `/lib/db` - Database schema, client, queries, and seed script
- `/drizzle` - Generated migration files

### Key Patterns

**Path Alias:** Use `@/` for absolute imports (e.g., `@/components/ui/button`)

**Component Types:**
- Server Components - used for pages that fetch initial data
- Client Components (`"use client"`) - used for interactive UI with state

**Utility Function:** `cn()` from `@/lib/utils` merges Tailwind classes with clsx + tailwind-merge

**Database Queries:** `/lib/db/queries.ts` contains data access functions that return types matching `lib/types.ts` interfaces. Pages import from here, not directly from the schema.

**Mock Data:** `/lib/mock-data.ts` contains original mock data (kept for reference). Active pages use `lib/db/queries.ts`.

### Data Models (lib/types.ts)
- `Bill` - recurring expenses with expected/paid amounts
- `Transaction` - individual transactions with categorization
- `TransactionSplit` - breakdown of single transaction into multiple categories
- `SimpleFinConnection` - bank account with on-budget/off-budget designation
- `CategoryOption` - union type: bill | income | uncategorized | everything_else | ignore

### Database Schema (lib/db/schema.ts)
- `connections` - SimpleFin bank accounts (id, name, currentBalance, isOnBudget, accountType)
- `transactions` - All transactions with categoryType enum + optional categoryId
- `transaction_splits` - Split sub-transactions
- `bills` - Monthly recurring bills with expected/paid tracking
- `funds` - Fund buckets (future)
- `fund_allocations` - Monthly fund deposits/withdrawals (future)
- `sealed_months` - Locked months (future)

Money columns use `numeric(12,2)`. Enums: `account_type`, `category_type`.

### Features
- Transaction categorization and splitting across budget categories
- SimpleFin bank account integration (on-budget vs off-budget accounts)
- Bill tracking with expected vs paid amounts
- Monthly filtering via MonthSelector component
