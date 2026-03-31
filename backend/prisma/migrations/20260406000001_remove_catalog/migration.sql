-- Remove catalog dependency: drop item_catalog, rebuild kit_items with own name/category/unit

-- 1. Drop FK from inspection_log_items → kit_items so we can recreate kit_items
ALTER TABLE "inspection_log_items" DROP CONSTRAINT IF EXISTS "inspection_log_items_kitItemId_fkey";

-- 2. Drop old FKs on kit_items
ALTER TABLE "kit_items" DROP CONSTRAINT IF EXISTS "kit_items_catalogItemId_fkey";
ALTER TABLE "kit_items" DROP CONSTRAINT IF EXISTS "kit_items_kitId_fkey";

-- 3. Drop old tables
DROP TABLE IF EXISTS "kit_items";
DROP TABLE IF EXISTS "item_catalog";

-- 4. Recreate kit_items with independent name/category/unit fields
CREATE TABLE "kit_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT DEFAULT 'pcs',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "locationInKit" TEXT,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kitId" TEXT NOT NULL,
    CONSTRAINT "kit_items_pkey" PRIMARY KEY ("id")
);

-- 5. Restore FK kit_items → kits
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_kitId_fkey"
  FOREIGN KEY ("kitId") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Restore FK inspection_log_items → kit_items
ALTER TABLE "inspection_log_items" ADD CONSTRAINT "inspection_log_items_kitItemId_fkey"
  FOREIGN KEY ("kitItemId") REFERENCES "kit_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
