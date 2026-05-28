import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Listar todos los semirremolques
export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Coordinadores, supervisores, jefaturas y operarios pueden ver equipos
    const allowedRoles: typeof session.rol[] = [ROLES.COORDINADOR, ROLES.SUPERVISOR, ROLES.JEFATURAS, ROLES.OPERARIO];
    if (!allowedRoles.includes(session.rol)) {
        return NextResponse.json({ error: 'No tienes permisos para ver equipos' }, { status: 403 });
    }

    try {
        const semirremolques = await prisma.semiremolque.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(semirremolques);
    } catch (error) {
        console.error('Error al obtener semirremolques:', error);
        return NextResponse.json({ error: 'Error al obtener semirremolques' }, { status: 500 });
    }
}

// POST - Crear nuevo semirremolque
export async function POST(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo jefaturas puede crear equipos
    if (session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear equipos' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { patente, tipo, marca, año } = body;

        // Validaciones
        if (!patente || !tipo || !marca || !año) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        // Validar formato de patente (sin espacios)
        const patenteFormatted = patente.trim().toUpperCase().replace(/\s+/g, '');
        if (patenteFormatted.length < 5 || patenteFormatted.length > 10) {
            return NextResponse.json({ error: 'Patente inválida' }, { status: 400 });
        }

        // Validar año
        const añoNum = parseInt(año);
        const currentYear = new Date().getFullYear();
        if (añoNum < 1980 || añoNum > currentYear + 1) {
            return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
        }

        // Verificar si la patente ya existe
        const existente = await prisma.semiremolque.findUnique({
            where: { patente: patenteFormatted },
        });

        if (existente) {
            return NextResponse.json({ error: 'Ya existe un semirremolque con esta patente' }, { status: 400 });
        }

        // Crear el semirremolque
        const semiremolque = await prisma.semiremolque.create({
            data: {
                patente: patenteFormatted,
                tipo: tipo.trim(),
                marca: marca.trim(),
                año: añoNum,
            },
        });

        return NextResponse.json(semiremolque, { status: 201 });
    } catch (error) {
        console.error('Error al crear semirremolque:', error);
        return NextResponse.json({ error: 'Error al crear semirremolque' }, { status: 500 });
    }
}
