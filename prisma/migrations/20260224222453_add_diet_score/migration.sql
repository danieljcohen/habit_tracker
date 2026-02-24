-- CreateTable
CREATE TABLE "DietScore" (
    "id" UUID NOT NULL,
    "date_iso" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietScore_date_iso_key" ON "DietScore"("date_iso");
