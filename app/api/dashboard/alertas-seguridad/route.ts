import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fechaInicio = searchParams.get('fechaInicio');
        const fechaFin = searchParams.get('fechaFin');

        // Sin 'Z' → se interpreta como hora local del servidor (Chile),
        // cubriendo el día completo y evitando el desfase de zona horaria.
        const dateFilter = fechaInicio || fechaFin ? {
            createdAt: {
                ...(fechaInicio ? { gte: new Date(fechaInicio + 'T00:00:00') } : {}),
                ...(fechaFin ? { lte: new Date(fechaFin + 'T23:59:59.999') } : {}),
            },
        } : {};

        const userSelect = { id: true, name: true, username: true, rol: true };
        const caminataSelect = { codigo: true, zona: true, faena: true };

        // Ejecutar todas las consultas en paralelo para evitar timeout por uso secuencial del pool
        const [
            tarjetasStop,
            reportesPendientes,
            reportesEnRevision,
            reportesPendientesVerificacion,
            reportesCerrados,
            controlesART,
            cntTarjetasStopTotal,
            cntTarjetasStopCerradas,
            cntReportesCerrados,
            cntControlesARTTotal,
            cntTotalReportesPeligro,
            cntReportesPendientes,
            cntReportesEnRevision,
            cntReportesPendientesVer,
            caminatasAbiertas,
            caminatasCerradas,
            cntCaminatasAbiertas,
            cntCaminatasCerradas,
            cntTarjetasNoProg,
            cntReportesNoProg,
            cntControlesNoProg,
        ] = await Promise.all([
            prisma.tarjetaStop.findMany({
                where: { ...dateFilter },
                include: { creadoPor: { select: userSelect }, responsableCierre: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.reportePeligro.findMany({
                where: { estado: 'PENDIENTE', ...dateFilter },
                include: { creadoPor: { select: userSelect }, responsableCierre: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.reportePeligro.findMany({
                where: { estado: 'EN_REVISION', ...dateFilter },
                include: { creadoPor: { select: userSelect }, responsableCierre: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.reportePeligro.findMany({
                where: { estado: 'PENDIENTE_VERIFICACION', ...dateFilter },
                include: { creadoPor: { select: userSelect }, responsableCierre: { select: userSelect }, responsableVerificacion: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { fechaCierre: 'desc' },
            }),
            prisma.reportePeligro.findMany({
                where: { estado: 'CERRADO', ...dateFilter },
                include: { creadoPor: { select: userSelect }, responsableCierre: { select: userSelect }, responsableVerificacion: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { fechaVerificacion: 'desc' },
                take: 50,
            }),
            prisma.controlCalidadART.findMany({
                where: { ...dateFilter },
                include: { creadoPor: { select: userSelect }, caminata: { select: caminataSelect } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.tarjetaStop.count({ where: { ...dateFilter } }),
            prisma.tarjetaStop.count({ where: { estado: 'CERRADO', ...dateFilter } }),
            prisma.reportePeligro.count({ where: { estado: 'CERRADO', ...dateFilter } }),
            prisma.controlCalidadART.count({ where: { ...dateFilter } }),
            prisma.reportePeligro.count({ where: { ...dateFilter } }),
            prisma.reportePeligro.count({ where: { estado: 'PENDIENTE', ...dateFilter } }),
            prisma.reportePeligro.count({ where: { estado: 'EN_REVISION', ...dateFilter } }),
            prisma.reportePeligro.count({ where: { estado: 'PENDIENTE_VERIFICACION', ...dateFilter } }),
            prisma.caminataSeguridad.findMany({
                where: { estado: { in: ['PENDIENTE', 'EN_PROCESO'] }, ...dateFilter },
                include: { coordinador: { select: userSelect }, asignado: { select: userSelect } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.caminataSeguridad.findMany({
                where: { estado: { in: ['COMPLETADA', 'CANCELADA'] }, ...dateFilter },
                include: { coordinador: { select: userSelect }, asignado: { select: userSelect } },
                orderBy: { updatedAt: 'desc' },
                take: 50,
            }),
            prisma.caminataSeguridad.count({ where: { estado: { in: ['PENDIENTE', 'EN_PROCESO'] }, ...dateFilter } }),
            prisma.caminataSeguridad.count({ where: { estado: { in: ['COMPLETADA', 'CANCELADA'] }, ...dateFilter } }),
            // Conteos de actividades sin caminata (no programadas)
            prisma.tarjetaStop.count({ where: { caminataId: null, ...dateFilter } }),
            prisma.reportePeligro.count({ where: { caminataId: null, ...dateFilter } }),
            prisma.controlCalidadART.count({ where: { caminataId: null, ...dateFilter } }),
        ]);

        // Helper function para formatear reportes
        const formatearReporte = (reporte: any, tipoLabel: string) => {
            let zonaFaena = null;
            if (reporte.caminata) {
                zonaFaena = {
                    codigo: reporte.caminata.codigo,
                    zona: reporte.caminata.zona,
                    faena: reporte.caminata.faena
                };
            } else if (reporte.datos && typeof reporte.datos === 'object') {
                const datos = reporte.datos as any;
                zonaFaena = {
                    codigo: null,
                    zona: datos.zonas || datos.zona || null,
                    faena: datos.faenas || datos.faena || null
                };
            }

            return {
                id: reporte.id,
                tipo: tipoLabel,
                estado: reporte.estado,
                fecha: reporte.createdAt,
                fechaCierre: reporte.fechaCierre || null,
                fechaVerificacion: reporte.fechaVerificacion || null,
                creadoPor: reporte.creadoPor.name || reporte.creadoPor.username,
                rol: reporte.creadoPor.rol,
                responsableCierre: reporte.responsableCierre ?
                    (reporte.responsableCierre.name || reporte.responsableCierre.username) : null,
                responsableVerificacion: reporte.responsableVerificacion ?
                    (reporte.responsableVerificacion.name || reporte.responsableVerificacion.username) : null,
                caminata: zonaFaena,
                esIndependiente: reporte.caminata === null,
                datos: reporte.datos,
                comentarioCierre: reporte.comentarioCierre || null,
                comentarioVerificacion: reporte.comentarioVerificacion || null
            };
        };

        // Formatear los datos para facilitar su uso en el frontend
        const alertasFormateadas = {
            tarjetasStop: tarjetasStop.map(tarjeta => {
                // Si no hay caminata, intentar obtener zona/faena del campo datos
                let zonaFaena = null;
                if (tarjeta.caminata) {
                    zonaFaena = {
                        codigo: tarjeta.caminata.codigo,
                        zona: tarjeta.caminata.zona,
                        faena: tarjeta.caminata.faena
                    };
                } else if (tarjeta.datos && typeof tarjeta.datos === 'object') {
                    // Extraer zona y faena del campo datos JSON
                    const datos = tarjeta.datos as any;
                    zonaFaena = {
                        codigo: null,
                        zona: datos.zonas || datos.zona || null,
                        faena: datos.faenas || datos.faena || null
                    };
                }

                return {
                    id: tarjeta.id,
                    tipo: 'TARJETA_STOP',
                    estado: tarjeta.estado,
                    fecha: tarjeta.createdAt,
                    creadoPor: tarjeta.creadoPor.name || tarjeta.creadoPor.username,
                    rol: tarjeta.creadoPor.rol,
                    responsableCierre: tarjeta.responsableCierre
                        ? (tarjeta.responsableCierre.name || tarjeta.responsableCierre.username)
                        : null,
                    caminata: zonaFaena,
                    esIndependiente: tarjeta.caminata === null,
                    datos: tarjeta.datos
                };
            }),
            // Reportes de peligro agrupados por estado
            reportesPendientes: reportesPendientes.map(r => formatearReporte(r, 'REPORTE_PENDIENTE')),
            reportesEnRevision: reportesEnRevision.map(r => formatearReporte(r, 'REPORTE_EN_REVISION')),
            reportesPendientesVerificacion: reportesPendientesVerificacion.map(r => formatearReporte(r, 'REPORTE_PENDIENTE_VERIFICACION')),
            reportesCerrados: reportesCerrados.map(r => formatearReporte(r, 'REPORTE_CERRADO')),
            controlesART: controlesART.map(control => {
                // Si no hay caminata, intentar obtener zona/faena del campo datos
                let zonaFaena = null;
                if (control.caminata) {
                    zonaFaena = {
                        codigo: control.caminata.codigo,
                        zona: control.caminata.zona,
                        faena: control.caminata.faena
                    };
                } else if (control.datos && typeof control.datos === 'object') {
                    // Extraer zona y faena del campo datos JSON
                    const datos = control.datos as any;
                    zonaFaena = {
                        codigo: null,
                        zona: datos.zonas || datos.zona || null,
                        faena: datos.faenas || datos.faena || null
                    };
                }

                return {
                    id: control.id,
                    tipo: 'CONTROL_ART',
                    fecha: control.createdAt,
                    creadoPor: control.creadoPor.name || control.creadoPor.username,
                    rol: control.creadoPor.rol,
                    responsableCierre: control.creadoPor.name || control.creadoPor.username,
                    caminata: zonaFaena,
                    esIndependiente: control.caminata === null,
                    datos: control.datos
                };
            }),
            caminatasAbiertas: caminatasAbiertas.map(c => ({
                id: c.id,
                tipo: 'CAMINATA_ABIERTA',
                estado: c.estado,
                fecha: c.createdAt,
                creadoPor: c.coordinador.name || c.coordinador.username,
                rol: c.coordinador.rol,
                caminata: { codigo: c.codigo, zona: c.zona, faena: c.faena },
                esIndependiente: c.coordinadorId === c.asignadoId,
                asignadoNombre: c.asignado.name || c.asignado.username,
            })),
            caminatasCerradas: caminatasCerradas.map(c => ({
                id: c.id,
                tipo: 'CAMINATA_CERRADA',
                estado: c.estado,
                fecha: c.createdAt,
                creadoPor: c.coordinador.name || c.coordinador.username,
                rol: c.coordinador.rol,
                caminata: { codigo: c.codigo, zona: c.zona, faena: c.faena },
                esIndependiente: c.coordinadorId === c.asignadoId,
                asignadoNombre: c.asignado.name || c.asignado.username,
            })),
        };

        // Consolidar todas las alertas en una sola lista ordenada por fecha
        const todasLasAlertas = [
            ...alertasFormateadas.tarjetasStop,
            ...alertasFormateadas.reportesPendientes,
            ...alertasFormateadas.reportesEnRevision,
            ...alertasFormateadas.reportesPendientesVerificacion,
            ...alertasFormateadas.reportesCerrados,
            ...alertasFormateadas.controlesART,
            ...alertasFormateadas.caminatasAbiertas,
            ...alertasFormateadas.caminatasCerradas,
        ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Total = TarjetasStop + todos los Reportes de Peligro + ControlesART + Caminatas
        const totalGeneral = cntTarjetasStopTotal + cntTotalReportesPeligro + cntControlesARTTotal;
        // Cerradas = tarjetas stop CERRADAS + reportes peligro CERRADOS + todos los controles ART (se registran al completarse)
        const totalAlertasCerradas = cntTarjetasStopCerradas + cntReportesCerrados + cntControlesARTTotal;

        // Programadas vs no programadas
        // No programadas: tarjetas/reportes/controles sin caminataId (independientes)
        // + caminatas auto-asignadas (coordinadorId === asignadoId), estimado desde la lista limitada
        const cntCaminatasNoProg = [
            ...alertasFormateadas.caminatasAbiertas,
            ...alertasFormateadas.caminatasCerradas,
        ].filter(c => c.esIndependiente).length;
        const totalNoProgramadas = cntTarjetasNoProg + cntReportesNoProg + cntControlesNoProg + cntCaminatasNoProg;
        const totalProgramadas = (totalGeneral + cntCaminatasAbiertas + cntCaminatasCerradas) - totalNoProgramadas;

        return NextResponse.json({
            tarjetasStop: alertasFormateadas.tarjetasStop,
            // Reportes de peligro agrupados por estado
            reportesPendientes: alertasFormateadas.reportesPendientes,
            reportesEnRevision: alertasFormateadas.reportesEnRevision,
            reportesPendientesVerificacion: alertasFormateadas.reportesPendientesVerificacion,
            reportesCerrados: alertasFormateadas.reportesCerrados,
            controlesART: alertasFormateadas.controlesART,
            caminatasAbiertas: alertasFormateadas.caminatasAbiertas,
            caminatasCerradas: alertasFormateadas.caminatasCerradas,
            todasLasAlertas: todasLasAlertas.slice(0, 200),
            estadisticas: {
                totalTarjetasStop: cntTarjetasStopTotal,
                totalTarjetasStopCerradas: cntTarjetasStopCerradas,
                totalReportesPeligro: cntTotalReportesPeligro,
                totalReportesPendientes: cntReportesPendientes,
                totalReportesEnRevision: cntReportesEnRevision,
                totalReportesPendientesVerificacion: cntReportesPendientesVer,
                totalReportesCerrados: cntReportesCerrados,
                totalControlesART: cntControlesARTTotal,
                total: totalGeneral + cntCaminatasAbiertas + cntCaminatasCerradas,
                totalGeneral,
                totalAlertasCerradas,
                totalCaminatas: cntCaminatasAbiertas + cntCaminatasCerradas,
                totalCaminatasAbiertas: cntCaminatasAbiertas,
                totalCaminatasCerradas: cntCaminatasCerradas,
                totalProgramadas,
                totalNoProgramadas,
            }
        });

    } catch (error) {
        console.error('Error al obtener alertas de seguridad:', error);
        return NextResponse.json(
            { error: 'Error al cargar las alertas de seguridad' },
            { status: 500 }
        );
    }
}
