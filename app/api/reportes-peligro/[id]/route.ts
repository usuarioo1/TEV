import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE - Eliminar un reporte de peligro (solo prevencionistas)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json(
            { error: 'Solo los prevencionistas pueden eliminar reportes de peligro' },
            { status: 403 }
        );
    }

    try {
        const { id } = await params;
        const reporteId = parseInt(id, 10);

        if (Number.isNaN(reporteId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await prisma.reportePeligro.delete({
            where: { id: reporteId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar reporte de peligro:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el reporte de peligro' },
            { status: 500 }
        );
    }
}
