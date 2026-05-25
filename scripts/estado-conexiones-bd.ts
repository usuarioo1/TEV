import dotenv from 'dotenv';
import pg from 'pg';

// Carga explicita de .env como pidio el usuario.
dotenv.config({ path: '.env' });

const { Pool } = pg;

async function main() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('DATABASE_URL no esta definida. Revisa tu archivo .env');
        process.exitCode = 1;
        return;
    }

    const pool = new Pool({ connectionString: dbUrl });

    try {
        const dbInfo = await pool.query(`
            select
                current_database() as database,
                current_user as user,
                now() as server_time
        `);

        const total = await pool.query(`
            select count(*)::int as total
            from pg_stat_activity
            where datname = current_database()
        `);

        const byState = await pool.query(`
            select coalesce(state, 'unknown') as state, count(*)::int as total
            from pg_stat_activity
            where datname = current_database()
            group by 1
            order by 2 desc
        `);

        const active = await pool.query(`
            select pid, usename, application_name, state, wait_event_type, query_start
            from pg_stat_activity
            where datname = current_database()
            order by query_start desc nulls last
            limit 15
        `);

        console.log('Conexion a BD OK');
        console.log('Base:', dbInfo.rows[0].database);
        console.log('Usuario:', dbInfo.rows[0].user);
        console.log('Hora servidor:', dbInfo.rows[0].server_time);
        console.log('Total conexiones actuales:', total.rows[0].total);

        console.log('\nConexiones por estado:');
        console.table(byState.rows);

        console.log('\nUltimas conexiones/sesiones:');
        console.table(active.rows);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error consultando conexiones:', message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
