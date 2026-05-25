-- CreateEnum
CREATE TYPE "EstadoCaminata" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "CaminataSeguridad" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "faena" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "coordinadorId" INTEGER NOT NULL,
    "asignadoId" INTEGER NOT NULL,
    "estado" "EstadoCaminata" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "tieneFotografias" BOOLEAN NOT NULL DEFAULT false,
    "tieneDocumentos" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCompletacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaminataSeguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportePeligro" (
    "id" SERIAL NOT NULL,
    "caminataId" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportePeligro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarjetaStop" (
    "id" SERIAL NOT NULL,
    "caminataId" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarjetaStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaminataSeguridad_codigo_key" ON "CaminataSeguridad"("codigo");

-- AddForeignKey
ALTER TABLE "CaminataSeguridad" ADD CONSTRAINT "CaminataSeguridad_coordinadorId_fkey" FOREIGN KEY ("coordinadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminataSeguridad" ADD CONSTRAINT "CaminataSeguridad_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportePeligro" ADD CONSTRAINT "ReportePeligro_caminataId_fkey" FOREIGN KEY ("caminataId") REFERENCES "CaminataSeguridad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarjetaStop" ADD CONSTRAINT "TarjetaStop_caminataId_fkey" FOREIGN KEY ("caminataId") REFERENCES "CaminataSeguridad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
