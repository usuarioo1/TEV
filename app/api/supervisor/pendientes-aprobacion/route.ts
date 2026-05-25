import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        if (session.rol !== ROLES.SUPERVISOR && session.rol !== ROLES.JEFATURAS) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const where = session.rol === ROLES.SUPERVISOR
            ? {
                estado: 'PENDIENTE_APROBACION' as const,
                analisisRiesgo: {
                    is: {
                        supervisorResponsableId: session.id,
                    },
                },
            }
            : {
                estado: 'PENDIENTE_APROBACION' as const,
            };

        const total = await prisma.servicio.count({
            where,
        });

        return NextResponse.json({ total });
    } catch (error) {
        console.error('Error al contar servicios pendientes de aprobacion:', error);
        return NextResponse.json(
            { message: 'Error al obtener pendientes de aprobacion' },
            { status: 500 }
        );
    }
}
