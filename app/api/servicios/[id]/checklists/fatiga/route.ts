import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import { parseDateInputAsSantiagoDate } from '@/lib/date-chile';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || session.rol !== ROLES.OPERARIO) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            fecha,
            hora,
            lugarControl,
            nombreConductor,
            rut,
            items,
            aptoParaTrabajar,
            observaciones,
            requiereReemplazo,
        } = body;

        const servicioId = parseInt(id);

        // Validar campos requeridos
        if (!fecha || !hora || !lugarControl || !nombreConductor || !rut) {
            return NextResponse.json(
                { message: 'Todos los campos de información general son obligatorios' },
                { status: 400 }
            );
        }

        if (!items || !items.SECCION_I || !items.SECCION_II) {
            return NextResponse.json(
                { message: 'Datos del cuestionario incompletos' },
                { status: 400 }
            );
        }

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: { checklistFatiga: true },
        });

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'No tienes permiso para modificar este servicio' },
                { status: 403 }
            );
        }

        if (servicio.estado !== 'ACEPTADO' && servicio.estado !== 'EN_CHECKLIST') {
            return NextResponse.json(
                { message: 'El servicio no está en el estado correcto para completar checklists' },
                { status: 400 }
            );
        }

        // Validar que si no está apto, se proporcionen observaciones
        if (!aptoParaTrabajar && (!observaciones || !observaciones.trim())) {
            return NextResponse.json(
                { message: 'Debes proporcionar observaciones si presentas síntomas de fatiga' },
                { status: 400 }
            );
        }

        // Crear o actualizar el checklist de fatiga
        const checklistData = {
            fecha: parseDateInputAsSantiagoDate(fecha),
            hora,
            lugarControl,
            nombreConductor,
            rut,
            licenciaConducir: null,
            items,
            aptoParaTrabajar,
            observaciones: observaciones || null,
            requiereReemplazo,
            completado: true,
        };

        let checklist;
        if (servicio.checklistFatiga) {
            // Actualizar existente
            checklist = await prisma.checklistFatiga.update({
                where: { id: servicio.checklistFatiga.id },
                data: checklistData,
            });
        } else {
            // Crear nuevo
            checklist = await prisma.checklistFatiga.create({
                data: {
                    ...checklistData,
                    servicioId,
                },
            });
        }

        // Actualizar el estado del servicio a EN_CHECKLIST si estaba en ACEPTADO
        if (servicio.estado === 'ACEPTADO') {
            await prisma.servicio.update({
                where: { id: servicioId },
                data: { estado: 'EN_CHECKLIST' },
            });
        }

        return NextResponse.json({
            message: 'Checklist de fatiga guardado exitosamente',
            checklist,
        });
    } catch (error) {
        console.error('Error al guardar checklist de fatiga:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
