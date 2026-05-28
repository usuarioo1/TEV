import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { ServicioPDF } from '@/components/servicios/ServicioPDF';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const servicioId = parseInt(id);
    if (isNaN(servicioId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
        include: {
            empresa: {
                select: { id: true, nombre: true },
            },
            operario: {
                select: { id: true, name: true, username: true, email: true },
            },
            coordinador: {
                select: { id: true, name: true, username: true },
            },
            checklistEquipo: true,
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: {
                include: {
                    supervisorResponsable: {
                        select: { name: true, username: true },
                    },
                },
            },
            aprobacion: {
                include: {
                    supervisor: {
                        select: { name: true, username: true },
                    },
                },
            },
        },
    });

    if (!servicio) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Only allow: the operario of the service, or supervisors/jefaturas/coordinadores/preventionistas
    const isAuthorized =
        session.id === servicio.operarioId ||
        ['supervisor', 'jefaturas', 'coordinador', 'prevencionista'].includes(session.rol);

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Sin permiso para descargar este servicio' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ServicioPDF, { servicio }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `servicio-${servicio.codigo}-${new Date().toISOString().split('T')[0]}.pdf`;

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.byteLength),
        },
    });
}
