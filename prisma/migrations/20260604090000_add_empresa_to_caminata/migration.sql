-- Add optional company relation to safety walks.
ALTER TABLE "CaminataSeguridad"
ADD COLUMN "empresaId" INTEGER;

CREATE INDEX "CaminataSeguridad_empresaId_idx" ON "CaminataSeguridad"("empresaId");

ALTER TABLE "CaminataSeguridad"
ADD CONSTRAINT "CaminataSeguridad_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
