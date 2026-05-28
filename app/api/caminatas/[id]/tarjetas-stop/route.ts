import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Crear tarjeta alto/stop
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

        // Verificar que el usuario es el asignado
        if (caminata.asignadoId !== session.id) {
            return NextResponse.json(
                { error: 'Solo el asignado puede crear tarjetas stop' },
                { status: 403 }
            );
        }

        // Extraer el responsableCierre del body
        const { responsableCierre, empresaId, ...datosTarjeta } = body;
        let datosTarjetaConEmpresa = { ...datosTarjeta };

        if (empresaId !== undefined && empresaId !== null && String(empresaId).trim() !== '') {
            const empresaIdParsed = Number.parseInt(String(empresaId), 10);
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

            datosTarjetaConEmpresa = {
                ...datosTarjetaConEmpresa,
                empresaId: empresa.id,
                empresaNombre: empresa.nombre,
            };
        }

        // Crear tarjeta stop
        const tarjeta = await prisma.tarjetaStop.create({
            data: {
                caminataId,
                creadoPorId: session.id,
                datos: datosTarjetaConEmpresa as any, // Guardamos todo el formulario como JSON (sin responsableCierre)
                estado: 'PENDIENTE',
                responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
            },
        });

        return NextResponse.json(tarjeta);
    } catch (error) {
        console.error('Error al crear tarjeta stop:', error);
        return NextResponse.json(
            { error: 'Error al crear tarjeta stop' },
            { status: 500 }
        );
    }
}
