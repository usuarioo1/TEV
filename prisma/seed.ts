import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

// Datos de usuarios con contraseñas en texto plano (se hashearán en tiempo de ejecución)
const usersData = [
    {
        username: "alice",
        password: "alice123",
        rol: "jefaturas",
        name: "Alice",
        email: "alice@prisma.io",
        posts: [
            {
                title: "Join the Prisma Discord",
                content: "https://pris.ly/discord",
                published: true,
            },
            {
                title: "Prisma on YouTube",
                content: "https://pris.ly/youtube",
            },
        ],
    },
    {
        username: "bob",
        password: "bob123",
        rol: "jefaturas",
        name: "Bob",
        email: "bob@prisma.io",
        posts: [
            {
                title: "Follow Prisma on Twitter",
                content: "https://www.twitter.com/prisma",
                published: true,
            },
            {
                title: "Getting Started with Prisma ORM",
                content: "https://www.prisma.io/docs/getting-started",
                published: true,
            },
        ],
    },
    {
        username: "charlie",
        password: "charlie123",
        rol: "coordinador",
        name: "Charlie Coordinador",
        email: "charlie@prisma.io",
        posts: [
            {
                title: "Building Modern Web Applications",
                content: "Learn how to build scalable web applications with Next.js and Prisma",
                published: true,
            },
            {
                title: "Database Design Best Practices",
                content: "Essential tips for designing efficient database schemas",
                published: false,
            },
        ],
    },
    {
        username: "diana",
        password: "diana123",
        rol: "operario",
        name: "Diana",
        email: "diana@prisma.io",
        posts: [
            {
                title: "TypeScript Tips and Tricks",
                content: "Advanced TypeScript patterns for better code quality",
                published: true,
            },
            {
                title: "API Development with Next.js",
                content: "Creating robust APIs using Next.js Route Handlers",
                published: true,
            },
        ],
    },
    {
        username: "edward",
        password: "edward123",
        rol: "operario",
        name: "Edward",
        email: "edward@prisma.io",
        posts: [
            {
                title: "Optimizing Database Queries",
                content: "Performance tips for your Prisma queries",
                published: false,
            },
            {
                title: "Full-Stack Development in 2026",
                content: "The latest trends and technologies in web development",
                published: true,
            },
        ],
    },
    {
        username: "francisco",
        password: "francisco123",
        rol: "supervisor",
        name: "Francisco García",
        email: "francisco@prisma.io",
        posts: [
            {
                title: "Supervisión Efectiva en Transporte",
                content: "Mejores prácticas para supervisar operaciones de transporte",
                published: true,
            },
        ],
    },
    {
        username: "gabriela",
        password: "gabriela123",
        rol: "operario",
        name: "Gabriela López",
        email: "gabriela@prisma.io",
        posts: [
            {
                title: "Seguridad en Carretera",
                content: "Tips para conductores profesionales",
                published: true,
            },
        ],
    },
    {
        username: "hector",
        password: "hector123",
        rol: "operario",
        name: "Héctor Muñoz",
        email: "hector@prisma.io",
        posts: [
            {
                title: "Mantenimiento Preventivo",
                content: "Guía de revisiones diarias del vehículo",
                published: true,
            },
        ],
    },
    {
        username: "isabel",
        password: "isabel123",
        rol: "coordinador",
        name: "Isabel Martínez",
        email: "isabel@prisma.io",
        posts: [
            {
                title: "Coordinación de Caminatas",
                content: "Estrategias para gestionar caminatas de seguridad",
                published: true,
            },
        ],
    },
    {
        username: "pedro",
        password: "pedro123",
        rol: "prevencionista",
        name: "Pedro Silva",
        email: "pedro@prisma.io",
        posts: [
            {
                title: "Prevención de Riesgos Laborales",
                content: "Guía completa de prevención de riesgos en el transporte",
                published: true,
            },
            {
                title: "Normativas de Seguridad 2026",
                content: "Actualizaciones en regulaciones de seguridad laboral",
                published: true,
            },
        ],
    },
];

export async function main() {
    // Limpiar la base de datos antes de insertar nuevos datos
    await prisma.servicio.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    console.log("Base de datos limpiada");

    // Crear usuarios con contraseñas hasheadas
    const createdUsers: any = {};
    for (const userData of usersData) {
        const hashedPassword = await hashPassword(userData.password);

        const user = await prisma.user.create({
            data: {
                username: userData.username,
                password: hashedPassword,
                rol: userData.rol,
                name: userData.name,
                email: userData.email,
                posts: {
                    create: userData.posts,
                },
            },
        });

        createdUsers[userData.username] = user;
        console.log(`✓ Usuario creado: ${userData.username} (contraseña: ${userData.password})`);
    }

    // Crear servicios de prueba
    console.log("\nCreando servicios de prueba...");

    // Servicio 1: ASIGNADO a Diana (para que pueda aceptar)
    await prisma.servicio.create({
        data: {
            codigo: "SRV-2026-001",
            descripcion: "Transporte de mercancía general desde bodega central a sucursal norte",
            origen: "Bodega Central, Santiago",
            destino: "Sucursal Norte, La Serena",
            estado: "ASIGNADO",
            operarioId: createdUsers["diana"].id,
            coordinadorId: createdUsers["bob"].id,
            observaciones: "Carga de 1500 kg aproximadamente",
        },
    });

    // Servicio 2: ASIGNADO a Edward
    await prisma.servicio.create({
        data: {
            codigo: "SRV-2026-002",
            descripcion: "Entrega urgente de documentos legales",
            origen: "Oficina Central, Santiago",
            destino: "Corte Suprema, Santiago Centro",
            estado: "ASIGNADO",
            operarioId: createdUsers["edward"].id,
            coordinadorId: createdUsers["bob"].id,
            observaciones: "Requiere entrega antes de las 15:00 hrs",
        },
    });

    // Servicio 3: PENDIENTE (sin asignar)
    await prisma.servicio.create({
        data: {
            codigo: "SRV-2026-003",
            descripcion: "Transporte de equipos médicos",
            origen: "Proveedor MedEquip, Viña del Mar",
            destino: "Hospital Regional, Valparaíso",
            estado: "PENDIENTE",
            coordinadorId: createdUsers["bob"].id,
            observaciones: "Requiere vehículo con clima controlado",
        },
    });

    console.log("✓ 3 servicios de prueba creados");

    console.log("\n✓ Seed completado: 9 usuarios con posts y 3 servicios creados");
    console.log("\nCredenciales de prueba:");
    console.log("  - Coordinadores: charlie / charlie123, isabel / isabel123");
    console.log("  - Jefaturas: alice / alice123, bob / bob123");
    console.log("  - Supervisores: francisco / francisco123");
    console.log("  - Operarios: diana / diana123, edward / edward123, gabriela / gabriela123, hector / hector123");
}

main();
