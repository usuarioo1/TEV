import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function logStep(message: string): void {
    console.log(`\n[STEP] ${message}`);
}

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL no esta definido en .env');
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 15000,
    });

    try {
        logStep('Asegurando enum EstadoAlerta');
        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'EstadoAlerta'
    ) THEN
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

        logStep('Agregando columnas faltantes en CaminataSeguridad');
        await pool.query(`
ALTER TABLE "CaminataSeguridad"
ADD COLUMN IF NOT EXISTS "acompananteId" INTEGER,
ADD COLUMN IF NOT EXISTS "fechaProgramada" TIMESTAMP(3);
        `);

        logStep('Agregando columnas faltantes en ReportePeligro');
        await pool.query(`
ALTER TABLE "ReportePeligro"
ADD COLUMN IF NOT EXISTS "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS "responsableCierreId" INTEGER,
ADD COLUMN IF NOT EXISTS "fechaCierre" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "comentarioCierre" TEXT,
ADD COLUMN IF NOT EXISTS "imagenCierre" TEXT,
ADD COLUMN IF NOT EXISTS "responsableVerificacionId" INTEGER,
ADD COLUMN IF NOT EXISTS "fechaVerificacion" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "comentarioVerificacion" TEXT,
ADD COLUMN IF NOT EXISTS "imagenVerificacion" TEXT;
        `);

        logStep('Agregando columnas faltantes en TarjetaStop');
        await pool.query(`
ALTER TABLE "TarjetaStop"
ADD COLUMN IF NOT EXISTS "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS "responsableCierreId" INTEGER,
ADD COLUMN IF NOT EXISTS "fechaCierre" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "comentarioCierre" TEXT,
ADD COLUMN IF NOT EXISTS "imagenCierre" TEXT;
        `);

        logStep('Alineando defaults de creadoPorId');
        await pool.query(`
ALTER TABLE "ReportePeligro"
ALTER COLUMN "creadoPorId" SET DEFAULT 1;
        `);
        await pool.query(`
ALTER TABLE "TarjetaStop"
ALTER COLUMN "creadoPorId" SET DEFAULT 1;
        `);

        logStep('Asegurando llaves foraneas faltantes');
        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'CaminataSeguridad_acompananteId_fkey'
    ) THEN
        ALTER TABLE "CaminataSeguridad"
        ADD CONSTRAINT "CaminataSeguridad_acompananteId_fkey"
        FOREIGN KEY ("acompananteId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ReportePeligro_responsableCierreId_fkey'
    ) THEN
        ALTER TABLE "ReportePeligro"
        ADD CONSTRAINT "ReportePeligro_responsableCierreId_fkey"
        FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ReportePeligro_responsableVerificacionId_fkey'
    ) THEN
        ALTER TABLE "ReportePeligro"
        ADD CONSTRAINT "ReportePeligro_responsableVerificacionId_fkey"
        FOREIGN KEY ("responsableVerificacionId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        await pool.query(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'TarjetaStop_responsableCierreId_fkey'
    ) THEN
        ALTER TABLE "TarjetaStop"
        ADD CONSTRAINT "TarjetaStop_responsableCierreId_fkey"
        FOREIGN KEY ("responsableCierreId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
        `);

        logStep('Resumen de columnas clave');
        const result = await pool.query(`
SELECT
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('CaminataSeguridad', 'ReportePeligro', 'TarjetaStop')
ORDER BY table_name, ordinal_position;
        `);

        const grouped = result.rows.reduce<Record<string, string[]>>((acc, row) => {
            const tableName = row.table_name as string;
            const columnName = row.column_name as string;

            if (!acc[tableName]) {
                acc[tableName] = [];
            }

            acc[tableName].push(columnName);
            return acc;
        }, {});

        console.log(JSON.stringify(grouped, null, 2));
        console.log('\n[OK] Parche aplicado correctamente.');
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('[ERROR] Fallo aplicando parche:', error);
    process.exitCode = 1;
});
