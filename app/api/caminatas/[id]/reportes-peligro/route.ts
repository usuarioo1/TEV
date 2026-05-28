import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { notifyReportePeligroPendienteCierre } from '@/lib/notifications/reporte-peligro-pendiente-cierre';

export const dynamic = 'force-dynamic';

// POST - Crear reporte de peligro
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
                { error: 'Solo el asignado puede crear reportes' },
                { status: 403 }
            );
        }

        // Extraer el responsableCierre del body
        const { responsableCierre, empresaId, ...datosReporte } = body;
        let datosReporteConEmpresa = { ...datosReporte };

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

            datosReporteConEmpresa = {
                ...datosReporteConEmpresa,
                empresaId: empresa.id,
                empresaNombre: empresa.nombre,
            };
        }

        // Crear reporte de peligro
        const reporte = await prisma.reportePeligro.create({
            data: {
                caminataId,
                creadoPorId: session.id,
                datos: datosReporteConEmpresa, // Guardamos todo el formulario como JSON (sin responsableCierre)
                estado: 'PENDIENTE',
                responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
            },
            include: {
                creadoPor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                responsableCierre: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                caminata: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });

        await notifyReportePeligroPendienteCierre({
            reporteId: reporte.id,
            estado: reporte.estado,
            datos: reporte.datos,
            responsableCierre: reporte.responsableCierre,
            creadoPorNombre: reporte.creadoPor.name || reporte.creadoPor.username,
            caminataCodigo: reporte.caminata?.codigo || null,
        });

        return NextResponse.json(reporte);
    } catch (error) {
        console.error('Error al crear reporte de peligro:', error);
        return NextResponse.json(
            { error: 'Error al crear reporte de peligro' },
            { status: 500 }
        );
    }
}
