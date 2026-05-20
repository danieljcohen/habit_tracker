-- AlterTable
ALTER TABLE "Task" ADD COLUMN "parent_id" UUID;

-- CreateIndex
CREATE INDEX "Task_parent_id_idx" ON "Task"("parent_id");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
