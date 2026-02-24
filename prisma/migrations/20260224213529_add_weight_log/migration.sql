-- CreateTable
CREATE TABLE "WeightLog" (
    "id" UUID NOT NULL,
    "date_iso" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightLog_date_iso_idx" ON "WeightLog"("date_iso");

-- CreateIndex
CREATE INDEX "WeightLog_created_at_idx" ON "WeightLog"("created_at");
