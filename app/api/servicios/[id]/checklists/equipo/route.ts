import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import { sincronizarNoConformidades } from '@/lib/no-conformidades';
import { sincronizarHallazgos } from '@/lib/hallazgos';
import { notifyNoConformidadesLevantadasPorRol } from '@/lib/notifications/no-conformidades-levantadas-rol';
import { notifyHallazgosLevantadosPorRol } from '@/lib/notifications/hallazgos-levantados-rol';
import { parseDateInputAsSantiagoDate } from '@/lib/date-chile';
import { hasChecklistNoCritico } from '@/lib/checklist-critical-items';

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
            marcaModelo,
            patente,
            anio,
            horometro,
            kilometraje,
            conductor,
            fecha,
            hora,
            items,
            observaciones,
        } = body;

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: { checklistEquipo: true },
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

        // Validar campos requeridos
        if (!marcaModelo || !patente || !anio || !conductor || !fecha || !hora || !items) {
            return NextResponse.json(
                { message: 'Faltan campos requeridos para el checklist' },
                { status: 400 }
            );
        }

        // En condiciones: no tiene NO/NC en ítems críticos.
        const equipoEnCondiciones = !hasChecklistNoCritico(
            'SEMIREMOLQUE',
            items as Record<string, Record<string, unknown>>,
        );

        // Crear o actualizar el checklist de equipo
        const checklistData = {
            marcaModelo,
            patente,
            anio,
            horometro: horometro || null,
            kilometraje: kilometraje || null,
            conductor,
            fecha: parseDateInputAsSantiagoDate(fecha),
            hora,
            items,
            observaciones: observaciones || null,
            equipoEnCondiciones,
            completado: true,
        };

        const {
            checklist,
            noConformidadesLevantadas,
            hallazgosLevantados,
        } = await prisma.$transaction(async (tx) => {
            let checklistGuardado;

            if (servicio.checklistEquipo) {
                // Actualizar existente
                checklistGuardado = await tx.checklistEquipo.update({
                    where: { id: servicio.checklistEquipo.id },
                    data: checklistData,
                });
            } else {
                // Crear nuevo
                checklistGuardado = await tx.checklistEquipo.create({
                    data: {
                        ...checklistData,
                        servicioId,
                    },
                });
            }

            // Detectar y persistir no conformidades (ítems con valor "NO" o "NC")
            const nc = await sincronizarNoConformidades(servicioId, 'SEMIREMOLQUE', items, tx);

            // Detectar y persistir hallazgos (items con valor "SI" + informacion adicional)
            const hallazgos = await sincronizarHallazgos(servicioId, 'SEMIREMOLQUE', items, tx);

            // Actualizar el estado del servicio a EN_CHECKLIST si estaba en ACEPTADO
            if (servicio.estado === 'ACEPTADO') {
                await tx.servicio.update({
                    where: { id: servicioId },
                    data: { estado: 'EN_CHECKLIST' },
                });
            }

            return {
                checklist: checklistGuardado,
                noConformidadesLevantadas: nc,
                hallazgosLevantados: hallazgos,
            };
        });

        await notifyNoConformidadesLevantadasPorRol({
            checklistTipo: 'SEMIREMOLQUE',
            servicio: {
                id: servicio.id,
                codigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
            },
            noConformidades: noConformidadesLevantadas,
            operarioNombre: session.name || session.username,
        });

        await notifyHallazgosLevantadosPorRol({
            checklistTipo: 'SEMIREMOLQUE',
            servicio: {
                id: servicio.id,
                codigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
            },
            hallazgos: hallazgosLevantados,
            operarioNombre: session.name || session.username,
        });

        console.log(
            `[Checklist semirremolque] servicio=${servicio.codigo} nc=${noConformidadesLevantadas.length} hallazgos=${hallazgosLevantados.length}`
        );

        return NextResponse.json({
            message: 'Checklist de equipo guardado exitosamente',
            checklist,
            noConformidadesLevantadas: noConformidadesLevantadas.length,
            hallazgosLevantados: hallazgosLevantados.length,
        });
    } catch (error) {
        console.error('Error al guardar checklist de equipo:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
