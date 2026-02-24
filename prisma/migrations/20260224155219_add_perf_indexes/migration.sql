-- CreateIndex
CREATE INDEX "HabitLog_habit_id_occurred_at_idx" ON "HabitLog"("habit_id", "occurred_at");

-- CreateIndex
CREATE INDEX "Task_due_date_idx" ON "Task"("due_date");

-- CreateIndex
CREATE INDEX "Task_due_date_completed_idx" ON "Task"("due_date", "completed");
