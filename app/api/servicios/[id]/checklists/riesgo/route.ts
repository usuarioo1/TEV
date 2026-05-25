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
            // PASO 1: Antecedentes Generales
            tareaRealizar,
            fecha,
            empresaResponsable,
            lugarAreaTrabajo,
            tareaNormadaPor,
            nombreDocumento,
            // PASO 2: Preguntas a los Integrantes
            preguntasIntegrantes,
            // PASO 3: Control del Supervisor
            controlSupervisor,
            // PASO 4: Identificación de Riesgos Potenciales
            riesgosPotenciales,
            // PASO 5: Condiciones Adversas Climáticas
            condicionesClimaticas,
            // PASO 6: EPP y Elementos
            eppElementos,
            // PASO 7: Etapas del Trabajo
            etapasTrabajo,
            // PASO 8: Instrucciones Especiales
            instruccionesEspeciales,
            // PASO 9: Grupo de Trabajo
            grupoTrabajo,
            supervisorResponsableId,
            // Control
            riesgosControlados,
            completado
        } = body;

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: { analisisRiesgo: true },
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

        const supervisorId = Number(supervisorResponsableId);
        if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
            return NextResponse.json(
                { message: 'Debe seleccionar un supervisor responsable válido para la aprobación' },
                { status: 400 }
            );
        }

        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
            select: { id: true, rol: true },
        });

        if (!supervisor || supervisor.rol !== ROLES.SUPERVISOR) {
            return NextResponse.json(
                { message: 'El supervisor seleccionado no es válido' },
                { status: 400 }
            );
        }

        // Validaciones de contenido - PASO 1
        if (!tareaRealizar || !empresaResponsable || !lugarAreaTrabajo || !fecha) {
            return NextResponse.json(
                { message: 'Todos los campos obligatorios del Paso 1 son requeridos' },
                { status: 400 }
            );
        }

        if (tareaNormadaPor === 'Documento' && !nombreDocumento) {
            return NextResponse.json(
                { message: 'Debe especificar el nombre del documento normativo' },
                { status: 400 }
            );
        }

        // Validaciones PASO 2
        if (!preguntasIntegrantes || typeof preguntasIntegrantes !== 'object') {
            return NextResponse.json(
                { message: 'Las preguntas a los integrantes son obligatorias' },
                { status: 400 }
            );
        }

        // Validar que todas las preguntas estén respondidas (12 preguntas)
        const preguntasRequeridas = 12;
        const preguntasRespondidas = Object.keys(preguntasIntegrantes).length;
        if (preguntasRespondidas < preguntasRequeridas) {
            return NextResponse.json(
                { message: 'Debes completar todas las 12 preguntas del Paso 2' },
                { status: 400 }
            );
        }

        // Validaciones PASO 4
        if (!riesgosPotenciales || typeof riesgosPotenciales !== 'object') {
            return NextResponse.json(
                { message: 'La identificación de riesgos potenciales es obligatoria' },
                { status: 400 }
            );
        }

        // Validaciones PASO 5
        if (!condicionesClimaticas || typeof condicionesClimaticas !== 'object') {
            return NextResponse.json(
                { message: 'Debe seleccionar al menos una condición climática' },
                { status: 400 }
            );
        }

        // Validaciones PASO 6
        if (!eppElementos || typeof eppElementos !== 'object') {
            return NextResponse.json(
                { message: 'Debe seleccionar al menos un EPP' },
                { status: 400 }
            );
        }

        // Validaciones PASO 7
        if (!etapasTrabajo || !Array.isArray(etapasTrabajo) || etapasTrabajo.length === 0) {
            return NextResponse.json(
                { message: 'Debe agregar al menos una etapa de trabajo en el Paso 7' },
                { status: 400 }
            );
        }

        // Validar que todas las etapas estén completas
        const etapasIncompletas = etapasTrabajo.find(
            (etapa: any) => !etapa.etapa || !etapa.peligros || !etapa.riesgos || !etapa.medidasControl
        );
        if (etapasIncompletas) {
            return NextResponse.json(
                { message: 'Todas las etapas deben tener descripción, peligros, riesgos y medidas de control' },
                { status: 400 }
            );
        }

        // Crear o actualizar el análisis de riesgo
        const analisisData = {
            // PASO 1
            tareaRealizar,
            fecha: parseDateInputAsSantiagoDate(fecha),
            empresaResponsable,
            lugarAreaTrabajo,
            tareaNormadaPor,
            nombreDocumento: tareaNormadaPor === 'Documento' ? nombreDocumento : null,
            // PASO 2
            preguntasIntegrantes,
            // PASO 3
            controlSupervisor: controlSupervisor || null,
            // PASO 4
            riesgosPotenciales,
            // PASO 5
            condicionesClimaticas,
            // PASO 6
            eppElementos,
            // PASO 7
            etapasTrabajo,
            // PASO 8
            instruccionesEspeciales: instruccionesEspeciales || null,
            // PASO 9
            grupoTrabajo: grupoTrabajo || [],
            supervisorResponsableId: supervisorId,
            // Control
            riesgosControlados: riesgosControlados || true,
            completado: completado || true,
        };

        let analisis;
        if (servicio.analisisRiesgo) {
            // Actualizar existente
            analisis = await prisma.analisisRiesgo.update({
                where: { id: servicio.analisisRiesgo.id },
                data: analisisData,
            });
        } else {
            // Crear nuevo
            analisis = await prisma.analisisRiesgo.create({
                data: {
                    ...analisisData,
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
            message: 'Análisis Seguro de Tarea guardado exitosamente',
            analisis,
        });
    } catch (error) {
        console.error('Error al guardar análisis de riesgo:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
