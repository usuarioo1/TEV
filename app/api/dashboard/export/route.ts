import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Obtener parámetro de qué datos exportar (por defecto: todos)
        const searchParams = request.nextUrl.searchParams;
        const tipo = searchParams.get('tipo') || 'completo';

        let csvData = '';

        // Agregar encabezado informativo
        csvData += '# EXPORTACION DE DATOS - NEXTMINER\n';
        csvData += `# Fecha de exportacion: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}\n`;
        csvData += `# Tipo de exportacion: ${tipo.toUpperCase()}\n`;
        csvData += '# NOTA: Los datos estan ordenados de mas recientes a mas antiguos\n';
        csvData += '#\n';
        csvData += '# =============================================================\n\n';

        if (tipo === 'servicios' || tipo === 'completo') {
            // Exportar servicios con información relacionada
            const servicios = await prisma.servicio.findMany({
                include: {
                    operario: true,
                    coordinador: true,
                    checklistEquipo: true,
                    checklistTractoCamion: true,
                    checklistFatiga: true,
                    analisisRiesgo: true,
                    aprobacion: {
                        include: {
                            supervisor: true
                        }
                    },
                    guiaDespacho: true
                },
                orderBy: [
                    { fechaAsignacion: 'desc' }, // Más recientes primero
                    { codigo: 'asc' } // Luego por código
                ]
            });

            csvData += '=== SERVICIOS ===\n';
            csvData += '# Ordenados por: Fecha de asignacion (mas recientes primero), luego por codigo\n';
            csvData += 'ID,Codigo,Descripcion,Origen,Destino,Estado,Operario,Coordinador,Fecha Asignacion,Fecha Aceptacion,Fecha Inicio,Fecha Finalizacion,Checklist Equipo OK,Checklist Tracto OK,Checklist Fatiga OK,Analisis Riesgo OK,Estado Aprobacion,Supervisor,Observaciones,Motivo Rechazo\n';

            servicios.forEach(servicio => {
                const row = [
                    servicio.id,
                    `"${servicio.codigo}"`,
                    `"${servicio.descripcion.replace(/"/g, '""')}"`,
                    `"${servicio.origen.replace(/"/g, '""')}"`,
                    `"${servicio.destino.replace(/"/g, '""')}"`,
                    servicio.estado,
                    servicio.operario ? `"${servicio.operario.name || servicio.operario.username}"` : '',
                    `"${servicio.coordinador.name || servicio.coordinador.username}"`,
                    servicio.fechaAsignacion.toISOString(),
                    servicio.fechaAceptacion ? servicio.fechaAceptacion.toISOString() : '',
                    servicio.fechaInicio ? servicio.fechaInicio.toISOString() : '',
                    servicio.fechaFinalizacion ? servicio.fechaFinalizacion.toISOString() : '',
                    servicio.checklistEquipo ? (servicio.checklistEquipo.equipoEnCondiciones ? 'SI' : 'NO') : '',
                    servicio.checklistTractoCamion ? (servicio.checklistTractoCamion.equipoEnCondiciones ? 'SI' : 'NO') : '',
                    servicio.checklistFatiga ? (servicio.checklistFatiga.aptoParaTrabajar ? 'SI' : 'NO') : '',
                    servicio.analisisRiesgo ? (servicio.analisisRiesgo.riesgosControlados ? 'SI' : 'NO') : '',
                    servicio.aprobacion ? (servicio.aprobacion.aprobado ? 'APROBADO' : 'RECHAZADO') : '',
                    servicio.aprobacion ? `"${servicio.aprobacion.supervisor.name || servicio.aprobacion.supervisor.username}"` : '',
                    servicio.observaciones ? `"${servicio.observaciones.replace(/"/g, '""')}"` : '',
                    servicio.motivoRechazo ? `"${servicio.motivoRechazo.replace(/"/g, '""')}"` : ''
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        if (tipo === 'usuarios' || tipo === 'completo') {
            // Exportar usuarios
            const usuarios = await prisma.user.findMany({
                orderBy: [
                    { rol: 'asc' }, // Agrupar por rol
                    { name: 'asc' }, // Luego ordenar por nombre
                    { username: 'asc' } // Si no tienen nombre, por username
                ]
            });

            csvData += '=== USUARIOS ===\n';
            csvData += '# Ordenados por: Rol, luego por nombre alfabeticamente\n';
            csvData += 'ID,Username,Nombre,Email,Rol,RUT,Empresa,Fecha Creacion\n';

            usuarios.forEach(usuario => {
                const row = [
                    usuario.id,
                    `"${usuario.username}"`,
                    usuario.name ? `"${usuario.name.replace(/"/g, '""')}"` : '',
                    usuario.email ? `"${usuario.email}"` : '',
                    usuario.rol,
                    usuario.rut ? `"${usuario.rut}"` : '',
                    usuario.empresa ? `"${usuario.empresa.replace(/"/g, '""')}"` : '',
                    usuario.createdAt.toISOString()
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        if (tipo === 'checklists-equipo' || tipo === 'completo') {
            // Exportar checklists de equipo
            const checklists = await prisma.checklistEquipo.findMany({
                include: {
                    servicio: true
                },
                orderBy: [
                    { fecha: 'desc' }, // Más recientes primero
                    { patente: 'asc' } // Luego por patente
                ]
            });

            csvData += '=== CHECKLISTS EQUIPO ===\n';
            csvData += '# Ordenados por: Fecha de inspeccion (mas recientes primero), luego por patente\n';
            csvData += 'ID,Servicio Codigo,Marca/Modelo,Patente,Año,Conductor,Fecha Inspeccion,Hora,Equipo En Condiciones,Observaciones\n';

            checklists.forEach(checklist => {
                const row = [
                    checklist.id,
                    `"${checklist.servicio.codigo}"`,
                    `"${checklist.marcaModelo.replace(/"/g, '""')}"`,
                    `"${checklist.patente}"`,
                    checklist.anio,
                    `"${checklist.conductor.replace(/"/g, '""')}"`,
                    checklist.fecha.toISOString(),
                    checklist.hora,
                    checklist.equipoEnCondiciones ? 'SI' : 'NO',
                    checklist.observaciones ? `"${checklist.observaciones.replace(/"/g, '""')}"` : ''
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        if (tipo === 'checklists-tracto' || tipo === 'completo') {
            // Exportar checklists de tracto
            const checklists = await prisma.checklistTractoCamion.findMany({
                include: {
                    servicio: true
                },
                orderBy: [
                    { fecha: 'desc' }, // Más recientes primero
                    { patente: 'asc' } // Luego por patente
                ]
            });

            csvData += '=== CHECKLISTS TRACTO CAMION ===\n';
            csvData += '# Ordenados por: Fecha de inspeccion (mas recientes primero), luego por patente\n';
            csvData += 'ID,Servicio Codigo,Patente,Año,Conductor,RUT,Fecha Inspeccion,Kilometraje,Tracto En Condiciones,Observaciones\n';

            checklists.forEach(checklist => {
                const row = [
                    checklist.id,
                    `"${checklist.servicio.codigo}"`,
                    `"${checklist.patente}"`,
                    checklist.anio,
                    `"${checklist.nombreConductor.replace(/"/g, '""')}"`,
                    `"${checklist.rut}"`,
                    checklist.fecha.toISOString(),
                    checklist.kilometraje,
                    checklist.equipoEnCondiciones ? 'SI' : 'NO',
                    checklist.observacionesGenerales ? `"${checklist.observacionesGenerales.replace(/"/g, '""')}"` : ''
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        if (tipo === 'analisis-riesgo' || tipo === 'completo') {
            // Exportar análisis de riesgo
            const analisis = await prisma.analisisRiesgo.findMany({
                include: {
                    servicio: true
                },
                orderBy: [
                    { fecha: 'desc' }, // Más recientes primero
                    { lugarAreaTrabajo: 'asc' } // Luego por área de trabajo
                ]
            });

            csvData += '=== ANALISIS DE RIESGO ===\n';
            csvData += '# Ordenados por: Fecha (mas recientes primero), luego por area de trabajo\n';
            csvData += 'ID,Servicio Codigo,Fecha,Area Trabajo,Tarea Realizar,Riesgos Controlados,Instrucciones Especiales,Supervisor Responsable\n';

            analisis.forEach(item => {
                const row = [
                    item.id,
                    `"${item.servicio.codigo}"`,
                    item.fecha.toISOString(),
                    `"${item.lugarAreaTrabajo.replace(/"/g, '""')}"`,
                    `"${item.tareaRealizar.replace(/"/g, '""')}"`,
                    item.riesgosControlados ? 'SI' : 'NO',
                    item.instruccionesEspeciales ? `"${item.instruccionesEspeciales.replace(/"/g, '""')}"` : '',
                    item.supervisorResponsableId ? item.supervisorResponsableId.toString() : ''
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        if (tipo === 'caminatas' || tipo === 'completo') {
            // Exportar caminatas de seguridad
            const caminatas = await prisma.caminataSeguridad.findMany({
                include: {
                    coordinador: true,
                    asignado: true,
                    reportesPeligro: true,
                    tarjetasStop: true,
                    controlesCalidadART: true
                },
                orderBy: [
                    { fechaCreacion: 'desc' }, // Más recientes primero
                    { estado: 'asc' }, // Luego por estado
                    { zona: 'asc' } // Finalmente por zona
                ]
            });

            csvData += '=== CAMINATAS DE SEGURIDAD ===\n';
            csvData += '# Ordenadas por: Fecha de creacion (mas recientes primero), estado, luego zona\n';
            csvData += 'ID,Codigo,Fecha Creacion,Estado,Coordinador,Asignado,Zona,Faena,Actividad,Reportes Peligro,Tarjetas Stop,Controles ART,Observaciones\n';

            caminatas.forEach(caminata => {
                const row = [
                    caminata.id,
                    `"${caminata.codigo}"`,
                    caminata.fechaCreacion.toISOString(),
                    caminata.estado,
                    `"${caminata.coordinador.name || caminata.coordinador.username}"`,
                    `"${caminata.asignado.name || caminata.asignado.username}"`,
                    `"${(caminata.zona ?? '').replace(/"/g, '""')}"`,
                    `"${(caminata.faena ?? '').replace(/"/g, '""')}"`,
                    `"${(caminata.actividad ?? '').replace(/"/g, '""')}"`,
                    caminata.reportesPeligro.length,
                    caminata.tarjetasStop.length,
                    caminata.controlesCalidadART.length,
                    caminata.observaciones ? `"${caminata.observaciones.replace(/"/g, '""')}"` : ''
                ];
                csvData += row.join(',') + '\n';
            });

            csvData += '\n\n';
        }

        // Configurar headers para descarga
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Content-Disposition', `attachment; filename="export-nextminer-${new Date().toISOString().split('T')[0]}.csv"`);

        return new NextResponse(csvData, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error al exportar datos:', error);
        return NextResponse.json(
            { error: 'Error al exportar los datos' },
            { status: 500 }
        );
    }
}
