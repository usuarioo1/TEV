/*
  Warnings:

  - You are about to drop the column `conductorApto` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - Added the required column `aptoParaTrabajar` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChecklistFatiga" DROP COLUMN "conductorApto",
ADD COLUMN     "aptoParaTrabajar" BOOLEAN NOT NULL;
