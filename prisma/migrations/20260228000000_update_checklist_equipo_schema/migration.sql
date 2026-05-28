-- DropForeignKey (para poder eliminar registros)
-- No es necesario, CASCADE está configurado

-- Eliminar todos los registros existentes de ChecklistEquipo
DELETE FROM "ChecklistEquipo";

-- Eliminar las columnas antiguas
ALTER TABLE "ChecklistEquipo" DROP COLUMN "estadoGeneral",
DROP COLUMN "neumaticos",
DROP COLUMN "luces",
DROP COLUMN "frenos",
DROP COLUMN "espejos",
DROP COLUMN "documentacion",
DROP COLUMN "kitSeguridad",
DROP COLUMN "combustible",
DROP COLUMN "reporteFalla",
DROP COLUMN "requiereMantenimiento";

-- Agregar las nuevas columnas
ALTER TABLE "ChecklistEquipo" ADD COLUMN "marcaModelo" TEXT NOT NULL,
ADD COLUMN "patente" TEXT NOT NULL,
ADD COLUMN "anio" TEXT NOT NULL,
ADD COLUMN "horometro" TEXT,
ADD COLUMN "kilometraje" TEXT,
ADD COLUMN "conductor" TEXT NOT NULL,
ADD COLUMN "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN "hora" TEXT NOT NULL,
ADD COLUMN "items" JSONB NOT NULL;
