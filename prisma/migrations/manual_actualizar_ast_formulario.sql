-- Migration: actualizar_ast_formulario
-- 
-- IMPORTANTE: Esta migración requiere un reset de la base de datos ya que
-- los cambios en el modelo AnalisisRiesgo son incompatibles con la estructura anterior.
-- 
-- Hay 4 registros existentes en AnalisisRiesgo que se perderán.
-- Si necesita conservar esos datos, haga un backup antes de ejecutar esta migración.
--
-- Para aplicar esta migración, ejecute uno de los siguientes comandos:
--
-- OPCIÓN 1 (Recomendada para desarrollo - borra todo):
--   npx prisma migrate reset
--   npx prisma migrate deploy
--
-- OPCIÓN 2 (Solo push - borra y recrea):
--   npx prisma db push --force-reset
--
-- OPCIÓN 3 (Migración manual - más control):
--   1. Haga backup de datos importantes si es necesario
--   2. Ejecute este SQL manualmente en su base de datos
--   3. Ejecute: npx prisma migrate resolve --applied actualizar_ast_formulario

-- Paso 1: Eliminar la tabla existente AnalisisRiesgo (perderá datos)
DROP TABLE IF EXISTS "AnalisisRiesgo" CASCADE;

-- Paso 2: Crear la nueva estructura del modelo AnalisisRiesgo
CREATE TABLE "AnalisisRiesgo" (
  "id" SERIAL NOT NULL,
  "servicioId" INTEGER NOT NULL,
  
  -- PASO 1: ANTECEDENTES GENERALES DEL TRABAJO
  "tareaRealizar" TEXT NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL,
  "empresaResponsable" TEXT NOT NULL,
  "lugarAreaTrabajo" TEXT NOT NULL,
  "tareaNormadaPor" TEXT NOT NULL,
  "nombreDocumento" TEXT,
  
  -- PASO 2: PREGUNTAS A LOS INTEGRANTES DEL TRABAJO (12 preguntas SI/NO)
  "preguntasIntegrantes" JSONB NOT NULL,
  
  -- PASO 3: CONTROL DEL SUPERVISOR
  "controlSupervisor" TEXT,
  
  -- PASO 4: IDENTIFICACIÓN DE RIESGOS POTENCIALES (26 riesgos SI/NO)
  "riesgosPotenciales" JSONB NOT NULL,
  
  -- PASO 5: CONDICIONES ADVERSAS CLIMÁTICAS Y/O TERRENO
  "condicionesClimaticas" JSONB NOT NULL,
  
  -- PASO 6: EQUIPOS DE PROTECCIÓN PERSONAL Y ELEMENTOS REQUERIDOS
  "eppElementos" JSONB NOT NULL,
  
  -- PASO 7: ETAPAS, IDENTIFICACIÓN DE PELIGROS, RIESGOS Y MEDIDAS DE CONTROL
  "etapasTrabajo" JSONB NOT NULL,
  
  -- PASO 8: INSTRUCCIONES ESPECIALES DEL SUPERVISOR
  "instruccionesEspeciales" TEXT,
  
  -- PASO 9: IDENTIFICACIÓN DEL GRUPO DE TRABAJO
  "grupoTrabajo" JSONB NOT NULL DEFAULT '[]',
  
  -- PASO 10: FIRMA DE APROBACIÓN
  "supervisorResponsableId" INTEGER,
  "fechaAprobacion" TIMESTAMP(3),
  
  -- Control interno
  "riesgosControlados" BOOLEAN NOT NULL,
  "completado" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AnalisisRiesgo_pkey" PRIMARY KEY ("id")
);

-- Paso 3: Crear índices y constraints
CREATE UNIQUE INDEX "AnalisisRiesgo_servicioId_key" ON "AnalisisRiesgo"("servicioId");

-- Paso 4: Agregar foreign keys
ALTER TABLE "AnalisisRiesgo" ADD CONSTRAINT "AnalisisRiesgo_servicioId_fkey" 
  FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalisisRiesgo" ADD CONSTRAINT "AnalisisRiesgo_supervisorResponsableId_fkey" 
  FOREIGN KEY ("supervisorResponsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Paso 5: Actualizar el modelo User para agregar la relación inversa (ya está en el schema, solo documentativo)
-- La relación "analisisRiesgoAprobados" ya está definida en el schema de Prisma

COMMENT ON TABLE "AnalisisRiesgo" IS 'Análisis Seguro de la Tarea (AST) - Formulario de 10 pasos para identificación y control de riesgos';
