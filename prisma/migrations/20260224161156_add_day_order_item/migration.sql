-- CreateTable
CREATE TABLE "DayOrderItem" (
    "id" UUID NOT NULL,
    "date_iso" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "DayOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayOrderItem_date_iso_position_idx" ON "DayOrderItem"("date_iso", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DayOrderItem_date_iso_item_type_item_id_key" ON "DayOrderItem"("date_iso", "item_type", "item_id");
