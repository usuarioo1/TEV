/*
  Warnings:

  - You are about to drop the column `areaTrabajo` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `autorizaEquiposMayores` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `codigoDocumento` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `cuestionarioControl` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `documentoNormativo` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `empresa` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `evaluacionTermino` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `matrizDesarrollo` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `observacionesFinales` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `participantes` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `responsableTrabajo` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorRevisor` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `trabajoRealizar` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `AnalisisRiesgo` table. All the data in the column will be lost.
  - Added the required column `condicionesClimaticas` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaResponsable` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eppElementos` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etapasTrabajo` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lugarAreaTrabajo` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preguntasIntegrantes` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riesgosPotenciales` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tareaNormadaPor` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tareaRealizar` to the `AnalisisRiesgo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('PENDIENTE', 'EN_REVISION', 'PENDIENTE_VERIFICACION', 'CERRADO');

-- AlterTable
ALTER TABLE "AnalisisRiesgo" DROP COLUMN "areaTrabajo",
DROP COLUMN "autorizaEquiposMayores",
DROP COLUMN "codigoDocumento",
DROP COLUMN "cuestionarioControl",
DROP COLUMN "documentoNormativo",
DROP COLUMN "empresa",
DROP COLUMN "evaluacionTermino",
DROP COLUMN "matrizDesarrollo",
DROP COLUMN "observacionesFinales",
DROP COLUMN "participantes",
DROP COLUMN "responsableTrabajo",
DROP COLUMN "supervisorRevisor",
DROP COLUMN "trabajoRealizar",
DROP COLUMN "version",
ADD COLUMN     "condicionesClimaticas" JSONB NOT NULL,
ADD COLUMN     "controlSupervisor" TEXT,
ADD COLUMN     "empresaResponsable" TEXT NOT NULL,
ADD COLUMN     "eppElementos" JSONB NOT NULL,
ADD COLUMN     "etapasTrabajo" JSONB NOT NULL,
ADD COLUMN     "fechaAprobacion" TIMESTAMP(3),
ADD COLUMN     "grupoTrabajo" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "instruccionesEspeciales" TEXT,
ADD COLUMN     "lugarAreaTrabajo" TEXT NOT NULL,
ADD COLUMN     "nombreDocumento" TEXT,
ADD COLUMN     "preguntasIntegrantes" JSONB NOT NULL,
ADD COLUMN     "riesgosPotenciales" JSONB NOT NULL,
ADD COLUMN     "supervisorResponsableId" INTEGER,
ADD COLUMN     "tareaNormadaPor" TEXT NOT NULL,
ADD COLUMN     "tareaRealizar" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CaminataSeguridad" ADD COLUMN     "acompananteId" INTEGER,
ADD COLUMN     "fechaProgramada" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReportePeligro" ADD COLUMN     "comentarioCierre" TEXT,
ADD COLUMN     "comentarioVerificacion" TEXT,
ADD COLUMN     "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ADD COLUMN     "fechaVerificacion" TIMESTAMP(3),
ADD COLUMN     "imagenCierre" TEXT,
ADD COLUMN     "imagenVerificacion" TEXT,
ADD COLUMN     "responsableCierreId" INTEGER,
ADD COLUMN     "responsableVerificacionId" INTEGER,
ALTER COLUMN "creadoPorId" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "TarjetaStop" ADD COLUMN     "comentarioCierre" TEXT,
ADD COLUMN     "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ADD COLUMN     "imagenCierre" TEXT,
ADD COLUMN     "responsableCierreId" INTEGER,
ALTER COLUMN "creadoPorId" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "ControlCalidadART" (
    "id" SERIAL NOT NULL,
    "caminataId" INTEGER,
    "creadoPorId" INTEGER NOT NULL DEFAULT 1,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlCalidadART_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnalisisRiesgo" ADD CONSTRAINT "AnalisisRiesgo_supervisorResponsableId_fkey" FOREIGN KEY ("supervisorResponsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminataSeguridad" ADD CONSTRAINT "CaminataSeguridad_acompananteId_fkey" FOREIGN KEY ("acompananteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportePeligro" ADD CONSTRAINT "ReportePeligro_responsableCierreId_fkey" FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportePeligro" ADD CONSTRAINT "ReportePeligro_responsableVerificacionId_fkey" FOREIGN KEY ("responsableVerificacionId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarjetaStop" ADD CONSTRAINT "TarjetaStop_responsableCierreId_fkey" FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlCalidadART" ADD CONSTRAINT "ControlCalidadART_caminataId_fkey" FOREIGN KEY ("caminataId") REFERENCES "CaminataSeguridad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlCalidadART" ADD CONSTRAINT "ControlCalidadART_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
