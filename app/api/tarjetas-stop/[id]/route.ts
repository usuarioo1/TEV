import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE - Eliminar una tarjeta stop (solo prevencionistas)
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
            { error: 'Solo los prevencionistas pueden eliminar tarjetas stop' },
            { status: 403 }
        );
    }

    try {
        const { id } = await params;
        const tarjetaId = parseInt(id, 10);

        if (Number.isNaN(tarjetaId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await prisma.tarjetaStop.delete({
            where: { id: tarjetaId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar tarjeta stop:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la tarjeta stop' },
            { status: 500 }
        );
    }
}
