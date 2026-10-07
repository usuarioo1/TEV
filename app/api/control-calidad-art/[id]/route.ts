import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE - Eliminar un control de calidad ART (solo prevencionistas)
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
            { error: 'Solo los prevencionistas pueden eliminar controles de calidad ART' },
            { status: 403 }
        );
    }

    try {
        const { id } = await params;
        const controlId = parseInt(id, 10);

        if (Number.isNaN(controlId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await prisma.controlCalidadART.delete({
            where: { id: controlId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar control de calidad ART:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el control de calidad ART' },
            { status: 500 }
        );
    }
}
