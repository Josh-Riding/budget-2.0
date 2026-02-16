CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'credit', 'investment', 'retirement');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('bill', 'income', 'everything_else', 'ignore', 'uncategorized', 'fund');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"month" text,
	"paid_amount" numeric(12, 2),
	"paid_date" date
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"current_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_on_budget" boolean DEFAULT true NOT NULL,
	"account_type" "account_type",
	"last_synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fund_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"fund_id" text NOT NULL,
	"month" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"fund_id" text NOT NULL,
	"display_name" text NOT NULL,
	"position" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"override_amount" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fund_settings_fund_id_unique" UNIQUE("fund_id")
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sealed_months" (
	"id" text PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"sealed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sealed_months_month_unique" UNIQUE("month")
);
--> statement-breakpoint
CREATE TABLE "transaction_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"label" text,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"category_type" "category_type",
	"category_id" text,
	"income_month" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category_type" "category_type",
	"category_id" text,
	"income_month" text,
	"is_split" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_settings" ADD CONSTRAINT "fund_settings_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;