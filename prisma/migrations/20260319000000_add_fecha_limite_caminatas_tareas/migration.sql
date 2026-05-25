-- Add deadline date fields for scheduled caminatas and assigned report tasks
-- Ensure TareaAsignada exists in environments where it was not created previously.
CREATE TABLE IF NOT EXISTS "TareaAsignada" (
	"id" SERIAL NOT NULL,
	"tipo" TEXT NOT NULL,
	"fechaProgramada" TIMESTAMP(3),
	"descripcion" TEXT,
	"asignadoId" INTEGER NOT NULL,
	"creadoPorId" INTEGER NOT NULL,
	"estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "TareaAsignada_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
	ALTER TABLE "TareaAsignada"
	ADD CONSTRAINT "TareaAsignada_asignadoId_fkey"
	FOREIGN KEY ("asignadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE "TareaAsignada"
	ADD CONSTRAINT "TareaAsignada_creadoPorId_fkey"
	FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CaminataSeguridad"
ADD COLUMN IF NOT EXISTS "fechaLimite" TIMESTAMP(3);

ALTER TABLE "TareaAsignada"
ADD COLUMN IF NOT EXISTS "fechaLimite" TIMESTAMP(3);
