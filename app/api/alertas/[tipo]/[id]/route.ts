import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ tipo: string; id: string }> }
) {
    try {
        const { tipo, id } = await params;
        const alertaId = parseInt(id);

        if (isNaN(alertaId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const creadoPorSelect = { name: true, username: true, rol: true };
        const responsableSelect = { name: true, username: true };
        const caminataSelect = {
            id: true,
            codigo: true,
            zona: true,
            faena: true,
            estado: true,
            empresa: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        };

        let alerta: any = null;

        switch (tipo) {
            case 'tarjeta-stop':
                alerta = await prisma.tarjetaStop.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: { select: creadoPorSelect },
                        responsableCierre: { select: responsableSelect },
                        caminata: { select: caminataSelect },
                    },
                });
                break;

            case 'reporte-peligro':
                alerta = await prisma.reportePeligro.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: { select: creadoPorSelect },
                        responsableCierre: { select: responsableSelect },
                        responsableVerificacion: { select: responsableSelect },
                        caminata: { select: caminataSelect },
                    },
                });
                break;

            case 'control-art':
                alerta = await prisma.controlCalidadART.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: { select: creadoPorSelect },
                        caminata: { select: caminataSelect },
                    },
                });
                break;

            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        if (!alerta) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json({ tipo, alerta });
    } catch (error) {
        console.error('Error fetching alert detail:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
