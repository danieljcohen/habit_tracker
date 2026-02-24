-- CreateTable
CREATE TABLE "FoodLog" (
    "id" UUID NOT NULL,
    "date_iso" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodLog_date_iso_category_idx" ON "FoodLog"("date_iso", "category");
