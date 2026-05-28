import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function step(message: string): void {
    console.log(`\n[STEP] ${message}`);
}

async function main(): Promise<void> {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL no esta definido en .env');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 15000,
    });

    try {
        step('Asegurando valores de enum EstadoAlerta');
        await pool.query(`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'EstadoAlerta'
    ) THEN
        ALTER TYPE "EstadoAlerta" ADD VALUE IF NOT EXISTS 'PENDIENTE';
        ALTER TYPE "EstadoAlerta" ADD VALUE IF NOT EXISTS 'EN_REVISION';
        ALTER TYPE "EstadoAlerta" ADD VALUE IF NOT EXISTS 'PENDIENTE_VERIFICACION';
        ALTER TYPE "EstadoAlerta" ADD VALUE IF NOT EXISTS 'CERRADO';
    ELSE
        CREATE TYPE "EstadoAlerta" AS ENUM (
            'PENDIENTE',
            'EN_REVISION',
            'PENDIENTE_VERIFICACION',
            'CERRADO'
        );
    END IF;
END
$$;
        `);

        step('Alineando foreign keys con ON DELETE SET NULL en alertas/caminatas');
        await pool.query(`
ALTER TABLE "CaminataSeguridad"
DROP CONSTRAINT IF EXISTS "CaminataSeguridad_acompananteId_fkey";

ALTER TABLE "CaminataSeguridad"
ADD CONSTRAINT "CaminataSeguridad_acompananteId_fkey"
FOREIGN KEY ("acompananteId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        await pool.query(`
ALTER TABLE "ReportePeligro"
DROP CONSTRAINT IF EXISTS "ReportePeligro_responsableCierreId_fkey";

ALTER TABLE "ReportePeligro"
ADD CONSTRAINT "ReportePeligro_responsableCierreId_fkey"
FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        await pool.query(`
ALTER TABLE "ReportePeligro"
DROP CONSTRAINT IF EXISTS "ReportePeligro_responsableVerificacionId_fkey";

ALTER TABLE "ReportePeligro"
ADD CONSTRAINT "ReportePeligro_responsableVerificacionId_fkey"
FOREIGN KEY ("responsableVerificacionId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        await pool.query(`
ALTER TABLE "TarjetaStop"
DROP CONSTRAINT IF EXISTS "TarjetaStop_responsableCierreId_fkey";

ALTER TABLE "TarjetaStop"
ADD CONSTRAINT "TarjetaStop_responsableCierreId_fkey"
FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
        `);

        step('Asegurando tabla ControlCalidadART');
        await pool.query(`
CREATE TABLE IF NOT EXISTS "ControlCalidadART" (
    "id" SERIAL NOT NULL,
    "caminataId" INTEGER,
    "creadoPorId" INTEGER NOT NULL DEFAULT 1,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlCalidadART_pkey" PRIMARY KEY ("id")
);
        `);

        await pool.query(`
ALTER TABLE "ControlCalidadART"
ADD COLUMN IF NOT EXISTS "caminataId" INTEGER,
ADD COLUMN IF NOT EXISTS "creadoPorId" INTEGER,
ADD COLUMN IF NOT EXISTS "datos" JSONB,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
        `);

        await pool.query(`
ALTER TABLE "ControlCalidadART"
ALTER COLUMN "creadoPorId" SET DEFAULT 1,
ALTER COLUMN "creadoPorId" SET NOT NULL,
ALTER COLUMN "datos" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;
        `);

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ControlCalidadART_caminataId_fkey'
    ) THEN
        ALTER TABLE "ControlCalidadART"
        ADD CONSTRAINT "ControlCalidadART_caminataId_fkey"
        FOREIGN KEY ("caminataId") REFERENCES "CaminataSeguridad"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ControlCalidadART_creadoPorId_fkey'
    ) THEN
        ALTER TABLE "ControlCalidadART"
        ADD CONSTRAINT "ControlCalidadART_creadoPorId_fkey"
        FOREIGN KEY ("creadoPorId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        step('Evaluando sincronizacion de AnalisisRiesgo');
        const [countResult, oldColumnsResult, newColumnsResult] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS total FROM "AnalisisRiesgo"'),
            pool.query(`
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'AnalisisRiesgo'
  AND column_name IN (
    'areaTrabajo',
    'autorizaEquiposMayores',
    'codigoDocumento',
    'cuestionarioControl',
    'documentoNormativo',
    'empresa',
    'evaluacionTermino',
    'matrizDesarrollo',
    'observacionesFinales',
    'participantes',
    'responsableTrabajo',
    'supervisorRevisor',
    'trabajoRealizar',
    'version'
  );
            `),
            pool.query(`
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'AnalisisRiesgo'
  AND column_name IN (
    'tareaRealizar',
    'empresaResponsable',
    'lugarAreaTrabajo',
    'tareaNormadaPor',
    'nombreDocumento',
    'preguntasIntegrantes',
    'controlSupervisor',
    'riesgosPotenciales',
    'condicionesClimaticas',
    'eppElementos',
    'etapasTrabajo',
    'instruccionesEspeciales',
    'grupoTrabajo',
    'supervisorResponsableId',
    'fechaAprobacion'
  );
            `),
        ]);

        const totalRows = countResult.rows[0]?.total ?? 0;
        const oldColumnsCount = oldColumnsResult.rowCount ?? oldColumnsResult.rows.length;
        const newColumnsCount = newColumnsResult.rowCount ?? newColumnsResult.rows.length;
        const hasOldLayout = oldColumnsCount > 0;
        const hasNewLayout = newColumnsCount >= 12;

        if (hasOldLayout && !hasNewLayout && totalRows > 0) {
            throw new Error(
                `AnalisisRiesgo tiene layout antiguo y ${totalRows} fila(s). ` +
                'Se requiere migracion con mapeo de datos manual para evitar perdida.'
            );
        }

        if (hasOldLayout && !hasNewLayout) {
            step('Aplicando conversion de AnalisisRiesgo (tabla vacia, sin perdida)');
            await pool.query(`
ALTER TABLE "AnalisisRiesgo"
ADD COLUMN IF NOT EXISTS "tareaRealizar" TEXT,
ADD COLUMN IF NOT EXISTS "empresaResponsable" TEXT,
ADD COLUMN IF NOT EXISTS "lugarAreaTrabajo" TEXT,
ADD COLUMN IF NOT EXISTS "tareaNormadaPor" TEXT,
ADD COLUMN IF NOT EXISTS "nombreDocumento" TEXT,
ADD COLUMN IF NOT EXISTS "preguntasIntegrantes" JSONB,
ADD COLUMN IF NOT EXISTS "controlSupervisor" TEXT,
ADD COLUMN IF NOT EXISTS "riesgosPotenciales" JSONB,
ADD COLUMN IF NOT EXISTS "condicionesClimaticas" JSONB,
ADD COLUMN IF NOT EXISTS "eppElementos" JSONB,
ADD COLUMN IF NOT EXISTS "etapasTrabajo" JSONB,
ADD COLUMN IF NOT EXISTS "instruccionesEspeciales" TEXT,
ADD COLUMN IF NOT EXISTS "grupoTrabajo" JSONB,
ADD COLUMN IF NOT EXISTS "supervisorResponsableId" INTEGER,
ADD COLUMN IF NOT EXISTS "fechaAprobacion" TIMESTAMP(3);
            `);

            await pool.query(`
UPDATE "AnalisisRiesgo"
SET
    "tareaRealizar" = COALESCE("tareaRealizar", "trabajoRealizar", ''),
    "empresaResponsable" = COALESCE("empresaResponsable", "empresa", ''),
    "lugarAreaTrabajo" = COALESCE("lugarAreaTrabajo", "areaTrabajo", ''),
    "tareaNormadaPor" = COALESCE("tareaNormadaPor", "documentoNormativo", ''),
    "nombreDocumento" = COALESCE("nombreDocumento", "codigoDocumento"),
    "preguntasIntegrantes" = COALESCE("preguntasIntegrantes", "participantes", '[]'::jsonb),
    "controlSupervisor" = COALESCE("controlSupervisor", "supervisorRevisor"),
    "riesgosPotenciales" = COALESCE("riesgosPotenciales", "cuestionarioControl", '[]'::jsonb),
    "condicionesClimaticas" = COALESCE("condicionesClimaticas", '[]'::jsonb),
    "eppElementos" = COALESCE("eppElementos", "evaluacionTermino", '[]'::jsonb),
    "etapasTrabajo" = COALESCE("etapasTrabajo", "matrizDesarrollo", '[]'::jsonb),
    "instruccionesEspeciales" = COALESCE("instruccionesEspeciales", "observacionesFinales"),
    "grupoTrabajo" = COALESCE("grupoTrabajo", "participantes", '[]'::jsonb)
WHERE TRUE;
            `);

            await pool.query(`
ALTER TABLE "AnalisisRiesgo"
ALTER COLUMN "tareaRealizar" SET NOT NULL,
ALTER COLUMN "empresaResponsable" SET NOT NULL,
ALTER COLUMN "lugarAreaTrabajo" SET NOT NULL,
ALTER COLUMN "tareaNormadaPor" SET NOT NULL,
ALTER COLUMN "preguntasIntegrantes" SET NOT NULL,
ALTER COLUMN "riesgosPotenciales" SET NOT NULL,
ALTER COLUMN "condicionesClimaticas" SET NOT NULL,
ALTER COLUMN "eppElementos" SET NOT NULL,
ALTER COLUMN "etapasTrabajo" SET NOT NULL,
ALTER COLUMN "grupoTrabajo" SET NOT NULL,
ALTER COLUMN "grupoTrabajo" SET DEFAULT '[]'::jsonb;
            `);

            await pool.query(`
ALTER TABLE "AnalisisRiesgo"
DROP COLUMN IF EXISTS "areaTrabajo",
DROP COLUMN IF EXISTS "autorizaEquiposMayores",
DROP COLUMN IF EXISTS "codigoDocumento",
DROP COLUMN IF EXISTS "cuestionarioControl",
DROP COLUMN IF EXISTS "documentoNormativo",
DROP COLUMN IF EXISTS "empresa",
DROP COLUMN IF EXISTS "evaluacionTermino",
DROP COLUMN IF EXISTS "matrizDesarrollo",
DROP COLUMN IF EXISTS "observacionesFinales",
DROP COLUMN IF EXISTS "participantes",
DROP COLUMN IF EXISTS "responsableTrabajo",
DROP COLUMN IF EXISTS "supervisorRevisor",
DROP COLUMN IF EXISTS "trabajoRealizar",
DROP COLUMN IF EXISTS "version";
            `);
        }

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'AnalisisRiesgo_supervisorResponsableId_fkey'
    ) THEN
        ALTER TABLE "AnalisisRiesgo"
        ADD CONSTRAINT "AnalisisRiesgo_supervisorResponsableId_fkey"
        FOREIGN KEY ("supervisorResponsableId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        step('Chequeo rapido de drift (resumen)');
        const summary = await pool.query(`
SELECT
    table_name,
    COUNT(*)::int AS total_columnas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('AnalisisRiesgo', 'ControlCalidadART', 'CaminataSeguridad', 'ReportePeligro', 'TarjetaStop')
GROUP BY table_name
ORDER BY table_name;
        `);
        console.table(summary.rows);

        console.log('\n[OK] Reparacion segura aplicada. Ejecuta ahora `npm run db:check:drift` para confirmar drift cero.');
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('[ERROR] Fallo durante reparacion segura de drift:', error);
    process.exitCode = 1;
});
