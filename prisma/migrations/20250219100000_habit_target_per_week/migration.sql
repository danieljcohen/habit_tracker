-- AlterTable: rename target_per_day to target_per_week (habits are now targets per week)
ALTER TABLE "Habit" RENAME COLUMN "target_per_day" TO "target_per_week";
