-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoHallazgo') THEN
        CREATE TYPE "EstadoHallazgo" AS ENUM ('ABIERTA', 'CERRADA');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Hallazgo" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "checklistTipo" "TipoChecklistNC" NOT NULL,
    "seccion" TEXT NOT NULL,
    "itemNombre" TEXT NOT NULL,
    "observacion" TEXT,
    "imagenes" JSONB NOT NULL DEFAULT '[]',
    "responsableRol" TEXT NOT NULL,
    "estado" "EstadoHallazgo" NOT NULL DEFAULT 'ABIERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ComentarioHallazgo" (
    "id" SERIAL NOT NULL,
    "hallazgoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioHallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Hallazgo_servicioId_checklistTipo_seccion_itemNombre_key" ON "Hallazgo"("servicioId", "checklistTipo", "seccion", "itemNombre");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "Hallazgo" ADD CONSTRAINT "Hallazgo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "ComentarioHallazgo" ADD CONSTRAINT "ComentarioHallazgo_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "Hallazgo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "ComentarioHallazgo" ADD CONSTRAINT "ComentarioHallazgo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
