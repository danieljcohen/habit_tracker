-- CreateTable
CREATE TABLE "HabitSkip" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "skipped_date" DATE NOT NULL,

    CONSTRAINT "HabitSkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HabitSkip_habit_id_skipped_date_key" ON "HabitSkip"("habit_id", "skipped_date");

-- AddForeignKey
ALTER TABLE "HabitSkip" ADD CONSTRAINT "HabitSkip_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
