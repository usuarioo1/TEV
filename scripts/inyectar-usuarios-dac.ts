import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, isValidRole } from "../lib/auth";
import "dotenv/config";

type UsuarioInput = {
    nombreCompleto: string;
    email: string;
    rut: string;
    empresa: string;
    rol: string;
};

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

const usuarios: UsuarioInput[] = [
    {
        nombreCompleto: "FELIPE ALVAREZ ROCHA",
        email: "FELIPEALVAREZ@EMPRESASDAC.CL",
        rut: "18.709.807-6",
        empresa: "DAC",
        rol: "jefaturas",
    },
];

function normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
}

function obtenerUsernameDesdeEmail(email: string): string {
    const [localPart] = normalizarEmail(email).split("@");
    return localPart || "";
}

function obtenerPrimerNombre(nombreCompleto: string): string {
    const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || "";

    return primerNombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toLowerCase();
}

function obtenerPrimerosCuatroDigitosRut(rut: string): string {
    return rut.replace(/\D/g, "").slice(0, 4);
}

function generarPasswordPlano(nombreCompleto: string, rut: string): string {
    const nombre = obtenerPrimerNombre(nombreCompleto);
    const primerosCuatroDigitosRut = obtenerPrimerosCuatroDigitosRut(rut);

    if (!nombre) {
        throw new Error(`No se pudo obtener un nombre valido desde: "${nombreCompleto}"`);
    }

    if (primerosCuatroDigitosRut.length < 4) {
        throw new Error(`RUT invalido, se esperaban al menos 4 digitos: "${rut}"`);
    }

    return `${nombre}${primerosCuatroDigitosRut}`;
}

async function crearOActualizarUsuario(usuario: UsuarioInput): Promise<void> {
    const email = normalizarEmail(usuario.email);
    const username = obtenerUsernameDesdeEmail(email);
    const rol = usuario.rol.trim().toLowerCase();

    if (!username) {
        throw new Error(`No se pudo construir username desde email: "${usuario.email}"`);
    }

    if (!isValidRole(rol)) {
        throw new Error(`Rol invalido para ${email}: "${usuario.rol}"`);
    }

    const passwordPlana = generarPasswordPlano(usuario.nombreCompleto, usuario.rut);
    const passwordHasheada = await hashPassword(passwordPlana);

    const existente = await prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
        },
        select: {
            id: true,
            username: true,
            email: true,
        },
    });

    if (existente) {
        await prisma.user.update({
            where: { id: existente.id },
            data: {
                username,
                password: passwordHasheada,
                rol,
                name: usuario.nombreCompleto,
                email,
                rut: usuario.rut,
                empresa: usuario.empresa,
            },
        });

        console.log(`[OK] Usuario actualizado: ${username} | password: ${passwordPlana}`);
        return;
    }

    await prisma.user.create({
        data: {
            username,
            password: passwordHasheada,
            rol,
            name: usuario.nombreCompleto,
            email,
            rut: usuario.rut,
            empresa: usuario.empresa,
        },
    });

    console.log(`[OK] Usuario creado: ${username} | password: ${passwordPlana}`);
}

async function main(): Promise<void> {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL no esta definido");
    }

    for (const usuario of usuarios) {
        await crearOActualizarUsuario(usuario);
    }

    console.log("Proceso finalizado.");
}

main()
    .catch((error) => {
        console.error("Error inyectando usuarios:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
