import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendServicioAsignadoEmail } from '@/lib/resend';
import { ROLES } from '@/lib/auth';

// NOTA: Este endpoint es temporal para desarrollo.
// Actualmente está restringido a coordinadores y jefaturas.
// En producción, la creación de servicios debería integrar validaciones y flujos adicionales.

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        if (session.rol !== ROLES.COORDINADOR && session.rol !== ROLES.JEFATURAS) {
            return NextResponse.json(
                { message: 'No tienes permisos para crear servicios' },
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

        // El coordinador es el usuario que está creando el servicio
        const coordinadorId = session.id;

        console.log('Session ID:', coordinadorId);
        console.log('Session user:', {
            id: session.id,
            username: session.username,
            rol: session.rol,
        });

        // Verificar que el coordinador existe
        const coordinador = await prisma.user.findUnique({
            where: { id: coordinadorId },
        });

        console.log('Coordinador encontrado:', coordinador ? {
            id: coordinador.id,
            username: coordinador.username,
            rol: coordinador.rol,
        } : null);

        if (!coordinador) {
            return NextResponse.json(
                { message: 'Usuario no encontrado en el sistema' },
                { status: 404 }
            );
        }

        // Validaciones básicas
        if (!codigo || !codigo.trim()) {
            return NextResponse.json(
                { message: 'El código del servicio es requerido' },
                { status: 400 }
            );
        }

        if (!descripcion || !descripcion.trim()) {
            return NextResponse.json(
                { message: 'La descripción es requerida' },
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

        if (!origen || !origen.trim()) {
            return NextResponse.json(
                { message: 'El origen es requerido' },
                { status: 400 }
            );
        }

        if (!destino || !destino.trim()) {
            return NextResponse.json(
                { message: 'El destino es requerido' },
                { status: 400 }
            );
        }

        if (!operarioId) {
            return NextResponse.json(
                { message: 'Debes seleccionar un operario' },
                { status: 400 }
            );
        }

        // Verificar que el código no exista
        const servicioExistente = await prisma.servicio.findUnique({
            where: { codigo },
        });

        if (servicioExistente) {
            return NextResponse.json(
                { message: 'Ya existe un servicio con ese código' },
                { status: 400 }
            );
        }

        // Verificar que el operario existe y es operario
        const operario = await prisma.user.findUnique({
            where: { id: operarioId },
        });

        console.log('Operario ID:', operarioId);
        console.log('Operario encontrado:', operario ? {
            id: operario.id,
            username: operario.username,
            rol: operario.rol,
        } : null);

        if (!operario) {
            return NextResponse.json(
                { message: 'El operario seleccionado no existe' },
                { status: 404 }
            );
        }

        if (operario.rol !== 'operario') {
            return NextResponse.json(
                { message: 'El usuario seleccionado no es un operario' },
                { status: 400 }
            );
        }

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaIdNumber },
            select: {
                id: true,
                nombre: true,
            },
        });

        if (!empresa) {
            return NextResponse.json(
                { message: 'La empresa seleccionada no existe' },
                { status: 400 }
            );
        }

        // Crear el servicio
        const fechaAsignacion = new Date();
        console.log('Intentando crear servicio con datos:', {
            codigo: codigo.trim(),
            descripcion: descripcion.trim(),
            empresaId: empresaIdNumber,
            empresaNombre: empresa.nombre,
            origen: origen.trim(),
            destino: destino.trim(),
            telefonoOrigen: telefonoOrigen?.trim() || null,
            telefonoDestino: telefonoDestino?.trim() || null,
            estado: 'ASIGNADO',
            operarioId,
            coordinadorId,
            observaciones: observaciones?.trim() || null,
            fechaAsignacion,
        });

        const nuevoServicio = await prisma.servicio.create({
            data: {
                codigo: codigo.trim(),
                descripcion: descripcion.trim(),
                empresaId: empresaIdNumber,
                origen: origen.trim(),
                destino: destino.trim(),
                telefonoOrigen: telefonoOrigen?.trim() || null,
                telefonoDestino: telefonoDestino?.trim() || null,
                estado: 'ASIGNADO', // El servicio se crea directamente asignado
                operarioId,
                coordinadorId,
                observaciones: observaciones?.trim() || null,
                fechaAsignacion,
            },
            include: {
                operario: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
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

        console.log('Servicio creado exitosamente:', nuevoServicio.id);
        console.log('Detalles del servicio creado:');
        console.log('  - Código:', nuevoServicio.codigo);
        console.log('  - Operario ID:', nuevoServicio.operarioId, '(', nuevoServicio.operario?.username, ')');
        console.log('  - Coordinador ID:', nuevoServicio.coordinadorId, '(', nuevoServicio.coordinador?.username, ')');
        console.log('  - Estado:', nuevoServicio.estado);

        if (operario.email) {
            try {
                await sendServicioAsignadoEmail({
                    to: operario.email,
                    operarioNombre: operario.name || operario.username,
                    codigo: nuevoServicio.codigo,
                    descripcion: nuevoServicio.descripcion,
                    origen: nuevoServicio.origen,
                    destino: nuevoServicio.destino,
                    telefonoOrigen: nuevoServicio.telefonoOrigen,
                    telefonoDestino: nuevoServicio.telefonoDestino,
                    observaciones: nuevoServicio.observaciones,
                    coordinadorNombre: nuevoServicio.coordinador?.name || nuevoServicio.coordinador?.username,
                    fechaAsignacion: nuevoServicio.fechaAsignacion,
                });

                console.log('Correo de asignación enviado a:', operario.email);
            } catch (emailError) {
                console.error('No se pudo enviar correo de asignación:', emailError);
            }
        } else {
            console.warn(`Operario ${operario.id} no tiene email. Se omite notificación.`);
        }

        return NextResponse.json({
            message: 'Servicio creado exitosamente',
            servicio: nuevoServicio,
        }, { status: 201 });
    } catch (error) {
        console.error('Error al crear servicio:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
