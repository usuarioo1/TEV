import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

// GET - Obtener detalles de un servicio específico
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const resolvedParams = await params;
        const servicioId = parseInt(resolvedParams.id);

        if (isNaN(servicioId)) {
            return NextResponse.json(
                { message: 'ID de servicio inválido' },
                { status: 400 }
            );
        }

        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                operario: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                empresa: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                checklistEquipo: true,
                checklistTractoCamion: true,
                checklistFatiga: true,
                analisisRiesgo: true,
            },
        });

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos: el usuario debe ser el coordinador, el operario asignado, o tener rol superior
        const tieneAcceso =
            servicio.coordinadorId === session.id ||
            servicio.operarioId === session.id ||
            session.rol === ROLES.SUPERVISOR ||
            session.rol === ROLES.JEFATURAS;

        if (!tieneAcceso) {
            return NextResponse.json(
                { message: 'No tienes permisos para ver este servicio' },
                { status: 403 }
            );
        }

        return NextResponse.json(servicio);
    } catch (error) {
        console.error('Error al obtener servicio:', error);
        return NextResponse.json(
            { message: 'Error al obtener el servicio' },
            { status: 500 }
        );
    }
}

// PATCH - Editar un servicio existente
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        // Solo coordinadores y jefaturas pueden editar servicios
        if (session.rol !== ROLES.COORDINADOR && session.rol !== ROLES.JEFATURAS) {
            return NextResponse.json(
                { message: 'No tienes permisos para editar servicios' },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        const servicioId = parseInt(resolvedParams.id);

        if (isNaN(servicioId)) {
            return NextResponse.json(
                { message: 'ID de servicio inválido' },
                { status: 400 }
            );
        }

        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
        });

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        // Verificar que el usuario sea el coordinador que creó el servicio (o jefaturas)
        if (session.rol === ROLES.COORDINADOR && servicio.coordinadorId !== session.id) {
            return NextResponse.json(
                { message: 'Solo el coordinador que creó el servicio puede editarlo' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            codigo,
            descripcion,
            empresaId,
            origen,
            destino,
            telefonoOrigen,
            telefonoDestino,
            operarioId,
            observaciones,
        } = body;

        const estadosEdicionCompleta = ['PENDIENTE', 'ASIGNADO'];
        const estadosEdicionEmpresaPostAceptacion = [
            'ACEPTADO',
            'EN_CHECKLIST',
            'PENDIENTE_APROBACION',
            'APROBADO',
            'EN_EJECUCION',
            'COMPLETADO',
        ];

        const permiteEdicionCompleta = estadosEdicionCompleta.includes(servicio.estado);
        const esCoordinadorPropietario = session.rol === ROLES.COORDINADOR && servicio.coordinadorId === session.id;
        const permiteEdicionSoloEmpresa =
            estadosEdicionEmpresaPostAceptacion.includes(servicio.estado)
            && esCoordinadorPropietario;

        if (!permiteEdicionCompleta && !permiteEdicionSoloEmpresa) {
            return NextResponse.json(
                { message: 'Este servicio ya no permite edición para tu perfil' },
                { status: 400 }
            );
        }

        if (empresaId === undefined || empresaId === null) {
            return NextResponse.json(
                { message: 'Debes seleccionar una empresa' },
                { status: 400 }
            );
        }

        const empresaIdNumber = Number(empresaId);
        if (!Number.isInteger(empresaIdNumber) || empresaIdNumber <= 0) {
            return NextResponse.json(
                { message: 'La empresa seleccionada es inválida' },
                { status: 400 }
            );
        }

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaIdNumber },
            select: { id: true },
        });

        if (!empresa) {
            return NextResponse.json(
                { message: 'La empresa seleccionada no existe' },
                { status: 400 }
            );
        }

        if (!permiteEdicionCompleta) {
            const intentoEditarCamposGenerales =
                codigo !== undefined
                || descripcion !== undefined
                || origen !== undefined
                || destino !== undefined
                || telefonoOrigen !== undefined
                || telefonoDestino !== undefined
                || operarioId !== undefined
                || observaciones !== undefined;

            if (intentoEditarCamposGenerales) {
                return NextResponse.json(
                    { message: 'En este estado solo se permite editar la empresa del servicio' },
                    { status: 400 }
                );
            }

            const servicioActualizado = await prisma.servicio.update({
                where: { id: servicioId },
                data: {
                    empresaId: empresaIdNumber,
                },
                include: {
                    operario: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                    coordinador: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                    empresa: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                message: 'Empresa del servicio actualizada exitosamente',
                servicio: servicioActualizado,
            });
        }

        // Validaciones básicas
        if (codigo && !codigo.trim()) {
            return NextResponse.json(
                { message: 'El código del servicio no puede estar vacío' },
                { status: 400 }
            );
        }

        if (descripcion && !descripcion.trim()) {
            return NextResponse.json(
                { message: 'La descripción no puede estar vacía' },
                { status: 400 }
            );
        }

        if (origen && !origen.trim()) {
            return NextResponse.json(
                { message: 'El origen no puede estar vacío' },
                { status: 400 }
            );
        }

        if (destino && !destino.trim()) {
            return NextResponse.json(
                { message: 'El destino no puede estar vacío' },
                { status: 400 }
            );
        }

        // Si se está cambiando el código, verificar que no exista otro servicio con ese código
        if (codigo && codigo !== servicio.codigo) {
            const servicioConCodigo = await prisma.servicio.findUnique({
                where: { codigo },
            });

            if (servicioConCodigo) {
                return NextResponse.json(
                    { message: 'Ya existe un servicio con ese código' },
                    { status: 400 }
                );
            }
        }

        // Si se está cambiando el operario, verificar que exista
        if (operarioId && operarioId !== servicio.operarioId) {
            const operario = await prisma.user.findUnique({
                where: { id: operarioId },
            });

            if (!operario) {
                return NextResponse.json(
                    { message: 'El operario seleccionado no existe' },
                    { status: 400 }
                );
            }

            // Verificar que tenga rol de operario
            if (operario.rol !== ROLES.OPERARIO) {
                return NextResponse.json(
                    { message: 'El usuario seleccionado no es un operario' },
                    { status: 400 }
                );
            }
        }

        // Actualizar el servicio
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                ...(codigo && { codigo }),
                ...(descripcion && { descripcion }),
                empresaId: empresaIdNumber,
                ...(origen && { origen }),
                ...(destino && { destino }),
                ...(telefonoOrigen !== undefined && { telefonoOrigen: telefonoOrigen?.trim() || null }),
                ...(telefonoDestino !== undefined && { telefonoDestino: telefonoDestino?.trim() || null }),
                ...(operarioId !== undefined && { operarioId }),
                ...(observaciones !== undefined && { observaciones: observaciones?.trim() || null }),
            },
            include: {
                operario: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                empresa: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: 'Servicio actualizado exitosamente',
            servicio: servicioActualizado,
        });
    } catch (error) {
        console.error('Error al editar servicio:', error);
        return NextResponse.json(
            { message: 'Error al editar el servicio' },
            { status: 500 }
        );
    }
}
