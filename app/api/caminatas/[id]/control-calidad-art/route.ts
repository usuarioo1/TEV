import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Crear control de calidad ART
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo prevencionistas, coordinadores, supervisores y jefaturas pueden crear controles
    if (session.rol !== ROLES.PREVENCIONISTA &&
        session.rol !== ROLES.COORDINADOR &&
        session.rol !== ROLES.SUPERVISOR &&
        session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear controles de calidad ART' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const caminataId = parseInt(id);
        const body = await request.json();

        // Verificar que la caminata existe
        const caminata = await prisma.caminataSeguridad.findUnique({
            where: { id: caminataId },
        });

        if (!caminata) {
            return NextResponse.json({ error: 'Caminata no encontrada' }, { status: 404 });
        }

        const empresaIdParsed = Number.parseInt(String(body?.empresaId ?? ''), 10);
        if (!Number.isInteger(empresaIdParsed) || empresaIdParsed <= 0) {
            return NextResponse.json({ error: 'Empresa invalida' }, { status: 400 });
        }

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaIdParsed },
            select: { id: true, nombre: true },
        });

        if (!empresa) {
            return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
        }

        const datosControlConEmpresa = {
            ...body,
            empresaId: empresa.id,
            empresaNombre: empresa.nombre,
        };

        // Crear control de calidad ART
        const control = await prisma.controlCalidadART.create({
            data: {
                caminataId,
                creadoPorId: session.id,
                datos: datosControlConEmpresa as any, // Guardamos todo el formulario como JSON
            },
        });

        return NextResponse.json(control);
    } catch (error) {
        console.error('Error al crear control de calidad ART:', error);
        return NextResponse.json(
            { error: 'Error al crear control de calidad ART' },
            { status: 500 }
        );
    }
}
