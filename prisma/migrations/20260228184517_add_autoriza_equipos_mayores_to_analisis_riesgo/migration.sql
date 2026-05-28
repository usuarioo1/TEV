/*
  Warnings:

  - You are about to drop the column `medidasAplicadas` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `medidasControl` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `nivelRiesgo` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `riesgosIdentificados` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `bostezosFrecuentes` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `consumioAlcohol` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `descansoBien` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `dificultadConcentrar` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `horasSueno` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `medicamentos` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `ojosPesados` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - You are about to drop the column `sienteCansancio` on the `ChecklistFatiga` table. All the data in the column will be lost.
  - Added the required column `areaTrabajo` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoDocumento` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cuestionarioControl` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresa` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evaluacionTermino` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matrizDesarrollo` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsableTrabajo` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorRevisor` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trabajoRealizar` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `items` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenciaConducir` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lugarControl` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreConductor` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rut` to the `ChecklistFatiga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnalisisRiesgo" DROP COLUMN "medidasAplicadas",
DROP COLUMN "medidasControl",
DROP COLUMN "nivelRiesgo",
DROP COLUMN "observaciones",
DROP COLUMN "riesgosIdentificados",
ADD COLUMN     "areaTrabajo" TEXT NOT NULL,
ADD COLUMN     "autorizaEquiposMayores" TEXT,
ADD COLUMN     "codigoDocumento" TEXT NOT NULL,
ADD COLUMN     "cuestionarioControl" JSONB NOT NULL,
ADD COLUMN     "documentoNormativo" TEXT,
ADD COLUMN     "empresa" TEXT NOT NULL,
ADD COLUMN     "evaluacionTermino" JSONB NOT NULL,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "matrizDesarrollo" JSONB NOT NULL,
ADD COLUMN     "observacionesFinales" TEXT,
ADD COLUMN     "responsableTrabajo" TEXT NOT NULL,
ADD COLUMN     "supervisorRevisor" TEXT NOT NULL,
ADD COLUMN     "trabajoRealizar" TEXT NOT NULL,
ADD COLUMN     "version" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ChecklistFatiga" DROP COLUMN "bostezosFrecuentes",
DROP COLUMN "consumioAlcohol",
DROP COLUMN "descansoBien",
DROP COLUMN "dificultadConcentrar",
DROP COLUMN "horasSueno",
DROP COLUMN "medicamentos",
DROP COLUMN "ojosPesados",
DROP COLUMN "sienteCansancio",
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "hora" TEXT NOT NULL,
ADD COLUMN     "items" JSONB NOT NULL,
ADD COLUMN     "licenciaConducir" TEXT NOT NULL,
ADD COLUMN     "lugarControl" TEXT NOT NULL,
ADD COLUMN     "nombreConductor" TEXT NOT NULL,
ADD COLUMN     "rut" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ChecklistTractoCamion" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "patente" TEXT NOT NULL,
    "anio" TEXT NOT NULL,
    "nombreConductor" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "kilometraje" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "observacionesGenerales" TEXT,
    "equipoEnCondiciones" BOOLEAN NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTractoCamion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTractoCamion_servicioId_key" ON "ChecklistTractoCamion"("servicioId");

-- AddForeignKey
ALTER TABLE "ChecklistTractoCamion" ADD CONSTRAINT "ChecklistTractoCamion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
