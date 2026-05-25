/*
  Warnings:

  - The values [EN_REVISION] on the enum `EstadoNoConformidad` will be removed.
    Existing rows using this value are migrated to ABIERTA first.
*/
-- Ensure prerequisite enums and tables exist in environments with incomplete history.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoChecklistNC') THEN
    CREATE TYPE "TipoChecklistNC" AS ENUM ('TRACTO_CAMION', 'SEMIREMOLQUE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoNoConformidad') THEN
    CREATE TYPE "EstadoNoConformidad" AS ENUM ('ABIERTA', 'CERRADA');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "NoConformidad" (
  "id" SERIAL NOT NULL,
  "servicioId" INTEGER NOT NULL,
  "checklistTipo" "TipoChecklistNC" NOT NULL,
  "seccion" TEXT NOT NULL,
  "itemNombre" TEXT NOT NULL,
  "observacion" TEXT,
  "imagenes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "responsableRol" TEXT NOT NULL,
  "estado" "EstadoNoConformidad" NOT NULL DEFAULT 'ABIERTA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NoConformidad_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComentarioNoConformidad" (
  "id" SERIAL NOT NULL,
  "noConformidadId" INTEGER NOT NULL,
  "autorId" INTEGER NOT NULL,
  "contenido" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ComentarioNoConformidad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NoConformidad_servicioId_checklistTipo_seccion_itemNombre_key"
ON "NoConformidad"("servicioId", "checklistTipo", "seccion", "itemNombre");

DO $$
BEGIN
  ALTER TABLE "NoConformidad"
  ADD CONSTRAINT "NoConformidad_servicioId_fkey"
  FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ComentarioNoConformidad"
  ADD CONSTRAINT "ComentarioNoConformidad_noConformidadId_fkey"
  FOREIGN KEY ("noConformidadId") REFERENCES "NoConformidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ComentarioNoConformidad"
  ADD CONSTRAINT "ComentarioNoConformidad_autorId_fkey"
  FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- If the old enum value EN_REVISION still exists, normalize and replace the enum safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'EstadoNoConformidad'
      AND e.enumlabel = 'EN_REVISION'
  ) THEN
    UPDATE "NoConformidad"
    SET "estado" = 'ABIERTA'
    WHERE "estado"::text = 'EN_REVISION';

    CREATE TYPE "EstadoNoConformidad_new" AS ENUM ('ABIERTA', 'CERRADA');

    ALTER TABLE "NoConformidad"
    ALTER COLUMN "estado" DROP DEFAULT;

    ALTER TABLE "NoConformidad"
    ALTER COLUMN "estado" TYPE "EstadoNoConformidad_new"
    USING ("estado"::text::"EstadoNoConformidad_new");

    ALTER TYPE "EstadoNoConformidad" RENAME TO "EstadoNoConformidad_old";
    ALTER TYPE "EstadoNoConformidad_new" RENAME TO "EstadoNoConformidad";
    DROP TYPE "EstadoNoConformidad_old";

    ALTER TABLE "NoConformidad"
    ALTER COLUMN "estado" SET DEFAULT 'ABIERTA';
  END IF;
END $$;
