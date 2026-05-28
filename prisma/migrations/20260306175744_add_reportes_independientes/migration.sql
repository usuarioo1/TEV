/*
  Warnings:

  - Added the required column `creadoPorId` to the `ReportePeligro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creadoPorId` to the `TarjetaStop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReportePeligro" ADD COLUMN     "creadoPorId" INTEGER NOT NULL,
ALTER COLUMN "caminataId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TarjetaStop" ADD COLUMN     "creadoPorId" INTEGER NOT NULL,
ALTER COLUMN "caminataId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ReportePeligro" ADD CONSTRAINT "ReportePeligro_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarjetaStop" ADD CONSTRAINT "TarjetaStop_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
