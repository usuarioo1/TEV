import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, ROLES } from "../lib/auth";
import "dotenv/config";

const MASTER_USER = {
    username: "admin",
    password: "admin999",
    rol: ROLES.JEFATURAS,
    name: "Administrador Master",
};

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main(): Promise<void> {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL no esta definido");
    }

    const passwordHasheada = await hashPassword(MASTER_USER.password);

    const user = await prisma.user.upsert({
        where: { username: MASTER_USER.username },
        update: {
            password: passwordHasheada,
            rol: MASTER_USER.rol,
            name: MASTER_USER.name,
        },
        create: {
            username: MASTER_USER.username,
            password: passwordHasheada,
            rol: MASTER_USER.rol,
            name: MASTER_USER.name,
        },
        select: {
            id: true,
            username: true,
            rol: true,
        },
    });

    console.log(`[OK] Usuario master listo: ${user.username} (rol: ${user.rol})`);
    console.log(`[INFO] Password vigente: ${MASTER_USER.password}`);
}

main()
    .catch((error) => {
        console.error("Error inyectando usuario master:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
