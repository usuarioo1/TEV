import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from 'pg';

const { Pool } = pg;

const globalForPrisma = global as unknown as {
    prisma?: PrismaClient;
    pool?: pg.Pool;
    cleanupRegistered?: boolean;
};

function readPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createPrismaClient(pool: pg.Pool): PrismaClient {
    return new PrismaClient({
        adapter: new PrismaPg(pool),
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}

function hasHallazgoDelegate(client: PrismaClient | undefined): boolean {
    return Boolean(client && typeof (client as unknown as { hallazgo?: unknown }).hallazgo !== 'undefined');
}

// Crear o reutilizar el pool de conexiones (singleton)
if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: readPositiveIntEnv('DB_POOL_MAX', 20),
        min: readPositiveIntEnv('DB_POOL_MIN', 2),
        idleTimeoutMillis: readPositiveIntEnv('DB_POOL_IDLE_TIMEOUT_MS', 30000),
        connectionTimeoutMillis: readPositiveIntEnv('DB_POOL_CONNECT_TIMEOUT_MS', 15000),
    });

    // Manejar errores del pool para evitar crashes
    globalForPrisma.pool.on('error', (err) => {
        console.error('Error inesperado en el pool de conexiones:', err);
    });
}

const pool = globalForPrisma.pool as pg.Pool;

if (!globalForPrisma.prisma || !hasHallazgoDelegate(globalForPrisma.prisma)) {
    if (globalForPrisma.prisma) {
        globalForPrisma.prisma.$disconnect().catch((error) => {
            console.warn('No se pudo cerrar el PrismaClient anterior:', error);
        });
    }

    globalForPrisma.prisma = createPrismaClient(pool);
}

const prisma = globalForPrisma.prisma as PrismaClient;

// Registrar cleanup UNA SOLA VEZ (evitar duplicados en hot reload)
if (process.env.NODE_ENV !== "production" && !globalForPrisma.cleanupRegistered) {
    globalForPrisma.cleanupRegistered = true;

    const cleanup = async () => {
        try {
            await prisma.$disconnect();
            await pool.end();
        } catch {
            // Ignorar errores durante cleanup
        }
    };

    process.on('SIGINT', () => cleanup().then(() => process.exit(0)));
    process.on('SIGTERM', () => cleanup().then(() => process.exit(0)));
}

export default prisma;
