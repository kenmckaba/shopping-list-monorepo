/*
  Warnings:

  - Added the required column `updatedAt` to the `list_items` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_list_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "listId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "list_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_list_items" ("addedAt", "id", "isCompleted", "itemId", "listId", "notes", "quantity") SELECT "addedAt", "id", "isCompleted", "itemId", "listId", "notes", "quantity" FROM "list_items";
DROP TABLE "list_items";
ALTER TABLE "new_list_items" RENAME TO "list_items";
CREATE UNIQUE INDEX "list_items_listId_itemId_key" ON "list_items"("listId", "itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
