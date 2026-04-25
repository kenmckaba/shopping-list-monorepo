-- SQLite schema for shopping list application
-- This creates all the required tables for the GraphQL server

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "lastOpenedListId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shopping lists table
CREATE TABLE IF NOT EXISTS "shopping_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Items table
CREATE TABLE IF NOT EXISTS "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- List items table (junction table)
CREATE TABLE IF NOT EXISTS "list_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT 0,
    "notes" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "listId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    FOREIGN KEY ("listId") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE,
    UNIQUE ("listId", "itemId")
);

-- List shares table
CREATE TABLE IF NOT EXISTS "list_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "sharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("listId") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
    UNIQUE ("listId", "userId")
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_shopping_lists_ownerId" ON "shopping_lists" ("ownerId");
CREATE INDEX IF NOT EXISTS "idx_list_items_listId" ON "list_items" ("listId");
CREATE INDEX IF NOT EXISTS "idx_list_items_itemId" ON "list_items" ("itemId");
CREATE INDEX IF NOT EXISTS "idx_list_shares_listId" ON "list_shares" ("listId");
CREATE INDEX IF NOT EXISTS "idx_list_shares_userId" ON "list_shares" ("userId");
CREATE INDEX IF NOT EXISTS "idx_items_createdById" ON "items" ("createdById");