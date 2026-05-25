import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ count: 0 });
    }

    const count = await prisma.caminataSeguridad.count({
        where: { estado: 'PENDIENTE' },
    });

    return NextResponse.json({ count });
}
