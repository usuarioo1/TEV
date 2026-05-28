-- Create table for companies that can be assigned to services.
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- Ensure company names are unique.
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- Add optional company relation to services.
ALTER TABLE "Servicio"
ADD COLUMN "empresaId" INTEGER;

CREATE INDEX "Servicio_empresaId_idx" ON "Servicio"("empresaId");

ALTER TABLE "Servicio"
ADD CONSTRAINT "Servicio_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
