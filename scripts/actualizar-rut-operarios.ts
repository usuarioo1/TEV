import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

// RUTs de ejemplo para los operarios (puedes modificarlos según necesites)
const rutsPorUsuario: Record<string, string> = {
    diana: "12.345.678-9",
    edward: "23.456.789-0",
    gabriela: "34.567.890-1",
    hector: "45.678.901-2",
    // Agrega más usuarios según necesites
};

async function actualizarRuts() {
    console.log('🔄 Actualizando RUTs de operarios...\n');

    try {
        for (const [username, rut] of Object.entries(rutsPorUsuario)) {
            const usuario = await prisma.user.findUnique({
                where: { username },
            });

            if (usuario) {
                await prisma.user.update({
                    where: { username },
                    data: { rut },
                });
                console.log(`✅ Usuario "${username}" actualizado con RUT: ${rut}`);
            } else {
                console.log(`⚠️  Usuario "${username}" no encontrado`);
            }
        }

        console.log('\n✨ Actualización completada');
        console.log('\n⚠️  IMPORTANTE: Debes cerrar sesión y volver a iniciar sesión');
        console.log('   para que el RUT se incluya en el token JWT\n');
    } catch (error) {
        console.error('❌ Error al actualizar RUTs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

actualizarRuts();
