import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import AprobacionForm from '@/components/supervisor/AprobacionForm';
import AnalisisRiesgoSupervisorDetalleV2 from '@/components/supervisor/AnalisisRiesgoSupervisorDetalleV2';
import ImageGallery from '@/components/caminatas/ImageGallery';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function SupervisorDetalleServicioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    await requireRole([ROLES.SUPERVISOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    // Obtener el servicio con todos sus detalles
    const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(id) },
        include: {
            empresa: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            operario: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                },
            },
            coordinador: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
            checklistEquipo: true,
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: true,
            aprobacion: {
                include: {
                    supervisor: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                },
            },
        },
    });

    if (!servicio) {
        notFound();
    }

    if (servicio.estado !== 'PENDIENTE_APROBACION' && servicio.estado !== 'APROBADO' && servicio.estado !== 'RECHAZADO') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                            Servicio no disponible para revisión
                        </h2>
                        <p className="text-sm text-yellow-700 mb-4">
                            Este servicio no está en estado de aprobación pendiente.
                        </p>
                        <Link
                            href="/supervisor"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Volver al Panel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (session.rol === ROLES.SUPERVISOR) {
        const supervisorAsignadoId = servicio.analisisRiesgo?.supervisorResponsableId ?? null;
        const supervisorDecisionId = servicio.aprobacion?.supervisor?.id ?? null;
        const accesoPermitido = supervisorAsignadoId === session.id || supervisorDecisionId === session.id;

        if (!accesoPermitido) {
            redirect('/supervisor');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/supervisor"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al Panel
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Revisión de Servicio
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Revisa los checklists completados por el operario y decide si aprobar o rechazar el servicio
                    </p>
                </div>

                {/* Información del Servicio */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Servicio</h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Código</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{servicio.codigo}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{servicio.descripcion}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Ruta</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.origen} → {servicio.destino}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Servicio para</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.empresa?.nombre ?? 'Sin empresa'}
                                    </dd>
                                </div>
                                {servicio.observaciones && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Observaciones</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{servicio.observaciones}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Participantes</h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Operario Asignado</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.operario?.name || servicio.operario?.username}
                                        {servicio.operario?.email && (
                                            <span className="text-gray-500 ml-2">({servicio.operario.email})</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Coordinador</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.coordinador?.name || servicio.coordinador?.username}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Fecha de Asignación</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </dd>
                                </div>
                                {servicio.fechaAceptacion && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fecha de Aceptación</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(servicio.fechaAceptacion).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Checklist de Equipo */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Checklist de Equipo - Rampla Plana/Drop Deck</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${servicio.checklistEquipo?.equipoEnCondiciones ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {servicio.checklistEquipo?.equipoEnCondiciones ? '✓ Aprobado' : '⚠ Con Fallas'}
                        </span>
                    </div>

                    {servicio.checklistEquipo ? (
                        <>
                            {/* Información del Equipo */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Marca/Modelo</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.marcaModelo}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Patente</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.patente}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Año</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.anio}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Conductor</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.conductor}</p>
                                </div>
                            </div>

                            {servicio.checklistEquipo.horometro && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500">Horómetro</p>
                                        <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.horometro}</p>
                                    </div>
                                    {servicio.checklistEquipo.kilometraje && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-500">Kilometraje</p>
                                            <p className="text-sm text-gray-900 mt-1">{servicio.checklistEquipo.kilometraje}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fecha y hora de inspección */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">
                                    Inspección técnica completada
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Fecha: {new Date(servicio.checklistEquipo.fecha).toLocaleDateString('es-CL')} - Hora: {servicio.checklistEquipo.hora}
                                </p>
                            </div>

                            {/* Matriz de Inspección Técnica */}
                            <div className="mb-4">
                                <h4 className="text-md font-semibold text-gray-900 mb-3">Matriz de Inspección Técnica</h4>
                                {servicio.checklistEquipo.items && typeof servicio.checklistEquipo.items === 'object' && (
                                    <div className="space-y-4">
                                        {Object.entries(servicio.checklistEquipo.items as Record<string, Record<string, any>>).map(([categoria, items]) => (
                                            <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="bg-gray-100 px-4 py-2">
                                                    <h5 className="font-semibold text-gray-900">{categoria}</h5>
                                                </div>
                                                <div className="divide-y divide-gray-200">
                                                    {Object.entries(items).map(([itemName, itemData]) => {
                                                        // Manejar tanto el formato nuevo (objeto) como el antiguo (string)
                                                        const valor = typeof itemData === 'object' && itemData !== null ? itemData.valor : itemData;
                                                        const tieneObservacion = typeof itemData === 'object' && itemData !== null ? itemData.tieneObservacion : false;
                                                        const observacion = typeof itemData === 'object' && itemData !== null ? itemData.observacion : '';

                                                        return (
                                                            <div key={itemName} className="px-4 py-2 hover:bg-gray-50">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-gray-700">{itemName}</span>
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${valor === 'SI' || valor === 'OK'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : valor === 'NO' || valor === 'NC'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : valor === 'N/A'
                                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {String(valor)}
                                                                    </span>
                                                                </div>
                                                                {tieneObservacion && observacion && (
                                                                    <div className="mt-2 ml-4 p-2 bg-blue-50 border-l-2 border-blue-300 rounded">
                                                                        <p className="text-xs font-medium text-blue-700">Observación específica:</p>
                                                                        <p className="text-xs text-blue-900 mt-1">{observacion}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {servicio.checklistEquipo.observaciones && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                                    <p className="text-sm text-gray-600">{servicio.checklistEquipo.observaciones}</p>
                                </div>
                            )}

                            {/* Galería de imágenes del checklist de equipo */}
                            <ImageGallery
                                images={extractImagesFromItems(servicio.checklistEquipo.items)}
                                title="Imágenes de la Inspección del Equipo"
                            />
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">No completado</p>
                    )}
                </div>

                {/* Checklist de Tracto Camión */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Checklist de Tracto Camiones</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${servicio.checklistTractoCamion?.equipoEnCondiciones ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {servicio.checklistTractoCamion?.equipoEnCondiciones ? '✓ Aprobado' : '⚠ Con Fallas'}
                        </span>
                    </div>

                    {servicio.checklistTractoCamion ? (
                        <>
                            {/* Antecedentes Generales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Patente</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistTractoCamion.patente}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Año</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistTractoCamion.anio}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">Conductor</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistTractoCamion.nombreConductor}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500">RUT</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistTractoCamion.rut}</p>
                                </div>
                            </div>

                            {/* Fecha y Kilometraje */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">
                                        Fecha de Inspección
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {new Date(servicio.checklistTractoCamion.fecha).toLocaleDateString('es-CL')}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">
                                        Kilometraje
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {servicio.checklistTractoCamion.kilometraje} km
                                    </p>
                                </div>
                            </div>

                            {/* Secciones de Inspección */}
                            <div className="mb-4">
                                <h4 className="text-md font-semibold text-gray-900 mb-3">Secciones de Inspección</h4>
                                {servicio.checklistTractoCamion.items && typeof servicio.checklistTractoCamion.items === 'object' && (
                                    <div className="space-y-4">
                                        {Object.entries(servicio.checklistTractoCamion.items as Record<string, Record<string, any>>).map(([seccion, items]) => {
                                            const nombresSecciones: Record<string, string> = {
                                                'DOCUMENTACION': 'A. DOCUMENTACIÓN',
                                                'EPP': 'B. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)',
                                                'LUCES_Y_MICAS': 'C. LUCES Y MICAS',
                                                'CONDICIONES_GENERALES': 'D. CONDICIONES GENERALES (CABINA Y SEGURIDAD)',
                                                'MECANICA_Y_MOTOR': 'E. MECÁNICA Y MOTOR',
                                            };
                                            return (
                                                <div key={seccion} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-100 px-4 py-2">
                                                        <h5 className="font-semibold text-gray-900">{nombresSecciones[seccion] || seccion}</h5>
                                                    </div>
                                                    <div className="divide-y divide-gray-200">
                                                        {Object.entries(items).map(([itemName, itemData]) => {
                                                            // Manejar tanto el formato nuevo (objeto) como el antiguo (string)
                                                            const valor = typeof itemData === 'object' && itemData !== null ? itemData.valor : itemData;
                                                            const tieneObservacion = typeof itemData === 'object' && itemData !== null ? itemData.tieneObservacion : false;
                                                            const observacion = typeof itemData === 'object' && itemData !== null ? itemData.observacion : '';

                                                            return (
                                                                <div key={itemName} className="px-4 py-2 hover:bg-gray-50">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm text-gray-700">{itemName}</span>
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${valor === 'SI'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : valor === 'NO'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : valor === 'N/A'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {String(valor)}
                                                                        </span>
                                                                    </div>
                                                                    {tieneObservacion && observacion && (
                                                                        <div className="mt-2 ml-4 p-2 bg-blue-50 border-l-2 border-blue-300 rounded">
                                                                            <p className="text-xs font-medium text-blue-700">Observación específica:</p>
                                                                            <p className="text-xs text-blue-900 mt-1">{observacion}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {servicio.checklistTractoCamion.observacionesGenerales && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones Generales:</p>
                                    <p className="text-sm text-gray-600">{servicio.checklistTractoCamion.observacionesGenerales}</p>
                                </div>
                            )}

                            {/* Galería de imágenes del checklist de tracto camión */}
                            <ImageGallery
                                images={extractImagesFromItems(servicio.checklistTractoCamion.items)}
                                title="Imágenes de la Inspección del Tracto Camión"
                            />
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">No completado</p>
                    )}
                </div>

                {/* Checklist de Fatiga */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Checklist de Fatiga y Somnolencia</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${servicio.checklistFatiga?.aptoParaTrabajar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {servicio.checklistFatiga?.aptoParaTrabajar ? '✓ Apto' : '⚠ No Apto'}
                        </span>
                    </div>

                    {servicio.checklistFatiga ? (
                        <>
                            {/* Información General */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Fecha y Hora</p>
                                    <p className="text-sm text-gray-900 mt-1">
                                        {new Date(servicio.checklistFatiga.fecha).toLocaleDateString()} - {servicio.checklistFatiga.hora}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Lugar de Control</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistFatiga.lugarControl}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Conductor</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistFatiga.nombreConductor}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">RUT</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistFatiga.rut}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Licencia de Conducir</p>
                                    <p className="text-sm text-gray-900 mt-1">{servicio.checklistFatiga.licenciaConducir}</p>
                                </div>
                            </div>

                            {/* Cuestionario de Autoevaluación */}
                            {servicio.checklistFatiga.items && (
                                <div className="space-y-4 mb-4">
                                    {/* Sección I */}
                                    {(servicio.checklistFatiga.items as any).SECCION_I && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2 bg-gray-100 p-2 rounded">
                                                I. Autoevaluación
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {Object.entries((servicio.checklistFatiga.items as any).SECCION_I).map(([index, value]) => {
                                                    const preguntas = [
                                                        "¿Durmió tiempo necesario y está apto?",
                                                        "¿Medicamentos con somnolencia?",
                                                        "¿Actividades físicas exigentes?",
                                                        "¿Alcohol en últimas 48 horas?",
                                                        "¿Síntomas de resfriado?",
                                                        "¿Comidas abundantes en última hora?",
                                                        "¿Más de 12 horas manejadas en 24h?"
                                                    ];
                                                    const pregunta = preguntas[parseInt(index)] || `Pregunta ${parseInt(index) + 1}`;
                                                    const respuesta = String(value);
                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                            <span className="text-gray-700">{pregunta}</span>
                                                            <span className={`px-2 py-0.5 rounded font-medium ${respuesta === 'SI' ?
                                                                (parseInt(index) === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800') :
                                                                (parseInt(index) === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')
                                                                }`}>
                                                                {respuesta}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sección II */}
                                    {(servicio.checklistFatiga.items as any).SECCION_II && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2 bg-gray-100 p-2 rounded">
                                                II. Síntomas durante última media hora
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {Object.entries((servicio.checklistFatiga.items as any).SECCION_II).map(([index, value]) => {
                                                    const sintomas = [
                                                        "Dificultad concentrarse/alerta",
                                                        "Movimientos lentos/torpes",
                                                        "Visión borrosa",
                                                        "Dificultad recordar ubicación",
                                                        "Dificultad trayectoria recta",
                                                        "Bostezos frecuentes",
                                                        "Pesadez párpados",
                                                        "Cabeceos",
                                                        "Dolor de cabeza",
                                                        "Mareos",
                                                        "Dolores nuca/espalda",
                                                        "Cambios postura frecuentes"
                                                    ];
                                                    const sintoma = sintomas[parseInt(index)] || `Síntoma ${parseInt(index) + 1}`;
                                                    const respuesta = String(value);
                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                            <span className="text-gray-700">{sintoma}</span>
                                                            <span className={`px-2 py-0.5 rounded font-medium ${respuesta === 'SI' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {respuesta}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {servicio.checklistFatiga.observaciones && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                                    <p className="text-sm text-gray-600">{servicio.checklistFatiga.observaciones}</p>
                                </div>
                            )}

                            {servicio.checklistFatiga.requiereReemplazo && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-900">⚠ Se requiere reemplazo del operario</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">No completado</p>
                    )}
                </div>

                {/* Análisis de Riesgo */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Análisis de Riesgo (A.R.T.)</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${servicio.analisisRiesgo?.completado ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {servicio.analisisRiesgo?.completado ? '✓ Completado' : 'No Completado'}
                        </span>
                    </div>

                    {servicio.analisisRiesgo ? (
                        (() => {
                            const parseJsonObject = (value: unknown): Record<string, unknown> => {
                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                    return value as Record<string, unknown>;
                                }

                                if (typeof value === 'string') {
                                    try {
                                        const parsed = JSON.parse(value);
                                        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                                            return parsed as Record<string, unknown>;
                                        }
                                    } catch {
                                        return {};
                                    }
                                }

                                return {};
                            };

                            const eppData = parseJsonObject(servicio.analisisRiesgo.eppElementos);
                            const condicionesData = parseJsonObject(servicio.analisisRiesgo.condicionesClimaticas);
                            const esFormularioArtV2 =
                                eppData.artVersion === 'ART_V2' || condicionesData.artVersion === 'ART_V2';

                            if (esFormularioArtV2) {
                                return <AnalisisRiesgoSupervisorDetalleV2 analisis={servicio.analisisRiesgo} />;
                            }

                            // Constantes de textos de riesgos potenciales (26 riesgos del formulario)
                            const RIESGOS_POTENCIALES_TEXTOS = [
                                "Atrapamiento Enganche o aprisionamiento del cuerpo, o parte de éste, por mecanismos de las máquinas, objetos, piezas, materiales, equipos o vehículos que han perdido su estabilidad.",
                                "Caída al mismo nivel. Que se produce en el mismo plano de sustentación Ej.: Terreno piso irregular, piso mojado.",
                                "Caída a distinto nivel. Caída a un plano inferior de sustentación desde una altura no superior a 1,8 mts.",
                                "Caída de altura. Caída a un plano inferior de sustentación, desde una altura superior a 1,8 mts.",
                                "Caída de objetos. Caída de elementos que golpean al cuerpo, por ejemplo, materiales, herramientas, estructuras, etc.",
                                "Cortes por objetos / herramientas cortantes, y/o abrasivos. (Esmeriles, sierras, amoladoras, taladros, etc.)",
                                "Golpe por objetos / Herramientas (Ej.: Martillo, alicate, desatornillador, pala, etc.)",
                                "Choque contra objetos Encuentro violento del cuerpo, o de una parte de éste, con uno o varios objetos, estén éstos en movimiento o no.",
                                "Contactos térmicos por calor o frio, contacto físico con superficies o productos a temperaturas extremas (calientes o frías).",
                                "Contacto con energía eléctrica. Ej.: Extensiones, tableros eléctricos generales, herramientas eléctricas, etc.",
                                "Contacto con fluido a presión. Ej.: agua, aire, gases, vapor, aceites hidráulicos.",
                                "Contacto con sustancias cáusticas y/o corrosivas Tocar sustancias que puedan producir reacciones alérgicas y/o lesiones externas en la piel.",
                                "Explosiones Liberación brusca de gran cantidad de energía que produce un incremento violento y rápido de la presión.",
                                "Proyección de fragmentos y/o partículas Contacto violento del cuerpo, o una parte de éste, con elementos proyectados como: piezas, fragmentos, partículas o líquido. (Ej.: virutas, partículas incandescentes, escorias, etc.)",
                                "Atropellos o golpes con vehículos Impacto entre un peatón y un vehículo en movimiento (interacción hombre máquina) Ej.: camión, maquinas, grúa horquilla, etc.",
                                "Choque, colisión o volcamiento Lesiones generadas en el cuerpo de un conductor o pasajero de un vehículo cuando éste se vuelca o impacta con otro vehículo y/o estructura externa.",
                                "Incendios Conjunto de condiciones cuya conjunción en un momento determinado, pueden originar un fuego incontrolado.",
                                "Exposición a sustancias químicas tóxicas (Ej.: Cloro, gas, acido sulfúrico, gases nitrosos, ácido sulfhídrico, monóxido de carbono, etc.).",
                                "Exposición a radiaciones no ionizantes (ultravioleta (UV), láser, Infrarroja (IR), microondas, radiofrecuencias, campos de frecuencia.",
                                "Exposición a radiaciones ionizantes (rayos X, rayos gamma)",
                                "Ingesta de sustancias nocivas (alimentos en mal estado, venenos, sustancias químicas, etc.).",
                                "Inhalación accidental de sustancias nocivas. (humos, productos químicos, contaminación de partículas y gases)",
                                "Sobreesfuerzos por manipulación de cargas Manipulación, transporte, elevación, empuje o tracción de cargas (carros, cajas, etc.) que pueda producir lesiones",
                                "Sobreesfuerzos por otras causas Posturas inadecuadas o movimientos repetitivos o vibraciones mecánicas que puedan producir lesiones músculo-esqueléticas agudas o crónicas.",
                                "Exposición a Ej.: Radiación ultravioleta, ruidos, gases, polvo, humo.",
                                "Derrame de Sustancia y/o Residuo Peligroso: Ej.: filtración de aceite de componente."
                            ];

                            // Mapeo de claves a etiquetas para condiciones climáticas
                            const CONDICIONES_CLIMATICAS_LABELS: Record<string, string> = {
                                viento: "Viento",
                                lluvia: "Lluvia",
                                hielo: "Hielo",
                                barro: "Barro",
                                nieve: "Nieve",
                                terrenoDesnivel: "Terreno en desnivel",
                                otro: "Otro"
                            };

                            // Mapeo de claves a etiquetas para EPP
                            const EPP_ELEMENTOS_LABELS: Record<string, string> = {
                                casco: "Casco",
                                calzadoSeguridad: "Calzado de seguridad",
                                coletoCuero: "Coleto de cuero",
                                chaquetaPantalonCuero: "Chaqueta y pantalón cuero",
                                polainasCuero: "Polainas de cuero",
                                fonoProtectorAuditivo: "Fono protector auditivo",
                                rotuloIdentificacion: "Rotulo de identificación del Residuo/ Sustancia Peligrosa",
                                gafasSeguridad: "Gafas de seguridad",
                                guantes: "Guantes",
                                proteccionRespiratoria: "Protección respiratoria",
                                arnesSeguridad: "Arnés de seguridad",
                                buzoPapel: "Buzo de papel",
                                taponProtectorAuditivo: "Tapón protector auditivo",
                                careta: "Careta",
                                mascaraFacial: "Mascara facial",
                                mascaraFullFace: "Mascara full face",
                                bandejaContencion: "Bandeja de contención de derrames",
                                materialAbsorbente: "Material Absorbente",
                                elementosSegregacion: "Elementos de segregación y/o señalización (Ej.: Conos, cadenas, letreros, etc.)",
                                cascoBarbiquejo: "Casco con barbiquejo",
                                bloqueadorSolar: "Bloqueador solar RUV",
                                gafasProteccionSolar: "Gafas con protección solar RUV",
                                vestimentaProteccionSolar: "Vestimenta con protección solar RUV (manga larga, cabeza, cuello)"
                            };

                            // Helper para parsear objetos de riesgos potenciales
                            const parseRiesgosPotenciales = (field: any): Record<number, 'SI' | 'NO'> => {
                                console.log('🔍 Parseando riesgosPotenciales:', field, 'tipo:', typeof field);

                                if (!field) return {};

                                // Si es string, parsearlo
                                let obj = field;
                                if (typeof field === 'string') {
                                    try {
                                        obj = JSON.parse(field);
                                    } catch (e) {
                                        console.error('Error parseando riesgosPotenciales:', e);
                                        return {};
                                    }
                                }

                                // Debe ser un objeto con índices numéricos (0-25) y valores 'SI' o 'NO'
                                if (typeof obj === 'object' && !Array.isArray(obj)) {
                                    const riesgos: Record<number, 'SI' | 'NO'> = {};
                                    Object.entries(obj).forEach(([index, valor]) => {
                                        const idx = parseInt(index);
                                        if (!isNaN(idx) && idx >= 0 && idx < RIESGOS_POTENCIALES_TEXTOS.length) {
                                            riesgos[idx] = valor as 'SI' | 'NO';
                                        }
                                    });
                                    console.log('✅ Riesgos parseados:', Object.keys(riesgos).length);
                                    return riesgos;
                                }

                                return {};
                            };

                            // Helper para parsear objetos de condiciones climáticas
                            const parseCondicionesClimaticas = (field: any): string[] => {
                                console.log('🔍 Parseando condicionesClimaticas:', field, 'tipo:', typeof field);

                                if (!field) return [];

                                // Si es string, parsearlo
                                let obj = field;
                                if (typeof field === 'string') {
                                    try {
                                        obj = JSON.parse(field);
                                    } catch (e) {
                                        console.error('Error parseando condicionesClimaticas:', e);
                                        return [];
                                    }
                                }

                                // Debe ser un objeto con claves string y valores boolean
                                if (typeof obj === 'object' && !Array.isArray(obj)) {
                                    const condiciones: string[] = [];
                                    Object.entries(obj).forEach(([key, valor]) => {
                                        if (valor === true || valor === 'true') {
                                            condiciones.push(CONDICIONES_CLIMATICAS_LABELS[key] || key);
                                        } else if (key === 'otro' && typeof valor === 'string' && valor.trim()) {
                                            condiciones.push(`Otro: ${valor}`);
                                        }
                                    });
                                    console.log('✅ Condiciones encontradas:', condiciones.length);
                                    return condiciones;
                                }

                                return [];
                            };

                            // Helper para parsear objetos de EPP
                            const parseEppElementos = (field: any): string[] => {
                                console.log('🔍 Parseando eppElementos:', field, 'tipo:', typeof field);

                                if (!field) return [];

                                // Si es string, parsearlo
                                let obj = field;
                                if (typeof field === 'string') {
                                    try {
                                        obj = JSON.parse(field);
                                    } catch (e) {
                                        console.error('Error parseando eppElementos:', e);
                                        return [];
                                    }
                                }

                                // Debe ser un objeto con claves string y valores boolean
                                if (typeof obj === 'object' && !Array.isArray(obj)) {
                                    const epps: string[] = [];
                                    Object.entries(obj).forEach(([key, valor]) => {
                                        if (valor === true || valor === 'true') {
                                            epps.push(EPP_ELEMENTOS_LABELS[key] || key);
                                        }
                                    });
                                    console.log('✅ EPPs encontrados:', epps.length);
                                    return epps;
                                }

                                return [];
                            };

                            // Parsear campos JSON
                            const riesgosPotenciales = parseRiesgosPotenciales(servicio.analisisRiesgo.riesgosPotenciales);
                            const condicionesClimaticas = parseCondicionesClimaticas(servicio.analisisRiesgo.condicionesClimaticas);
                            const eppElementos = parseEppElementos(servicio.analisisRiesgo.eppElementos);

                            // Debug: Log para ver qué datos llegan
                            console.log('📊 Supervisor - ART Datos:', {
                                servicioId: servicio.id,
                                tareaRealizar: servicio.analisisRiesgo.tareaRealizar,
                                riesgosPotenciales,
                                condicionesClimaticas,
                                eppElementos,
                                countRiesgos: Object.keys(riesgosPotenciales).length,
                                countCondiciones: condicionesClimaticas.length,
                                countEpp: eppElementos.length,
                            });

                            return <>
                                {/* PASO 1: Información General */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                        PASO 1: Información General
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-600">Tarea a Realizar</p>
                                            <p className="text-sm text-gray-900 mt-1">{servicio.analisisRiesgo.tareaRealizar}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-600">Fecha</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {new Date(servicio.analisisRiesgo.fecha).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-600">Empresa Responsable</p>
                                            <p className="text-sm text-gray-900 mt-1">{servicio.analisisRiesgo.empresaResponsable}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-600">Lugar/Área de Trabajo</p>
                                            <p className="text-sm text-gray-900 mt-1">{servicio.analisisRiesgo.lugarAreaTrabajo}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-600">Tarea Normada Por</p>
                                            <p className="text-sm text-gray-900 mt-1">{servicio.analisisRiesgo.tareaNormadaPor}</p>
                                        </div>
                                        {servicio.analisisRiesgo.nombreDocumento && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs font-medium text-gray-600">Nombre del Documento</p>
                                                <p className="text-sm text-gray-900 mt-1">{servicio.analisisRiesgo.nombreDocumento}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PASO 2: Preguntas a los Integrantes del Trabajo */}
                                {servicio.analisisRiesgo.preguntasIntegrantes && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                            PASO 2: Preguntas a los Integrantes del Trabajo
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries(servicio.analisisRiesgo.preguntasIntegrantes as Record<string, any>).map(([index, item]: [string, any]) => {
                                                const preguntas = [
                                                    "¿Se cuenta con el personal necesario y entrenado para realizar la tarea?",
                                                    "¿Se bloqueó y comprobó energía cero según procedimiento?",
                                                    "Emergencias: ¿Se identificó las posibles emergencias y su metodología de acción?",
                                                    "EPP Específico: De acuerdo al trabajo a realizar, ¿se requiere de un elemento de protección personal específico, independiente a los básicos? Si su respuesta es SÍ, indíquelos.",
                                                    "Personal y Competencias: ¿Se cuenta con el personal adecuado y capacitado para la actividad y las correspondientes competencias? Si su respuesta es NO, indique medidas de control.",
                                                    "Interferencias y Señalización: ¿El trabajo a ejecutar presenta interferencias con otras especialidades, por lo que se considera su cierre perimetral y/o señalización? Si su respuesta es SI, indique medidas de control.",
                                                    "¿Se realiza pruebas con equipo energizado?",
                                                    "¿Se cuenta con las herramientas e insumos necesarios?",
                                                    "¿Las herramientas están codificadas y chequeadas?",
                                                    "¿Se encuentra en condiciones física y/o psicológicas para realizar la tarea?",
                                                    "¿Los sistemas eléctricos, se encuentran en buen estado?",
                                                    "Existen trabajos simultáneos en el área",
                                                    "¿Cuento con las coordinaciones y autorización para trabajos simultáneos?",
                                                    "¿Se cuenta con el procedimiento en terreno para realizar el trabajo?",
                                                    "¿Conoce el Plan de Emergencia ha identificado las vías de evacuación?",
                                                    "¿Tengo identificado los Aspectos Ambientales de mi Actividad?"
                                                ];
                                                const pregunta = preguntas[parseInt(index)] || `Pregunta ${parseInt(index) + 1}`;
                                                return (
                                                    <div key={index} className="border-l-2 border-blue-400 bg-gray-50 rounded p-3 mb-2">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <span className="text-xs text-gray-700 flex-1 pr-4">{pregunta}</span>
                                                            <span className={`px-2.5 py-1 rounded-full font-semibold text-xs whitespace-nowrap ${item.respuesta === 'SI' ? 'bg-green-100 text-green-800' :
                                                                item.respuesta === 'NO' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {item.respuesta}
                                                            </span>
                                                        </div>
                                                        {item.observacion && (
                                                            <div className="mt-2 pl-3 border-l-2 border-amber-400 bg-amber-50 p-2 rounded">
                                                                <p className="text-xs font-medium text-amber-800 mb-1">Observación:</p>
                                                                <p className="text-xs text-amber-900">{item.observacion}</p>
                                                            </div>
                                                        )}
                                                        {item.aspectosAmbientales && Array.isArray(item.aspectosAmbientales) && item.aspectosAmbientales.length > 0 && (
                                                            <div className="mt-2 pl-3 border-l-2 border-green-400 bg-green-50 p-2 rounded">
                                                                <p className="text-xs font-medium text-green-800 mb-1">Aspectos Ambientales:</p>
                                                                <p className="text-xs text-green-900">{item.aspectosAmbientales.join(', ')}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* PASO 3: Control del Supervisor */}
                                {servicio.analisisRiesgo.controlSupervisor && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                            PASO 3: Control del Supervisor en caso de existir algún "NO"
                                        </h4>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-900">{servicio.analisisRiesgo.controlSupervisor}</p>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 4: Identificación de Riesgos Potenciales */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                        PASO 4: Identificación de Riesgos Potenciales (Marque SI o NO según el riesgo esté presente)
                                    </h4>
                                    {Object.keys(riesgosPotenciales).length > 0 ? (
                                        <div className="space-y-2">
                                            {RIESGOS_POTENCIALES_TEXTOS.map((riesgoTexto, index) => {
                                                const respuesta = riesgosPotenciales[index];
                                                if (!respuesta) return null;
                                                return (
                                                    <div key={index} className="border-l-2 border-orange-400 bg-gray-50 rounded p-3">
                                                        <div className="flex items-start justify-between">
                                                            <span className="text-xs text-gray-700 flex-1 pr-4">
                                                                <span className="font-semibold">{index + 1}.</span> {riesgoTexto}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-full font-semibold text-xs whitespace-nowrap ${respuesta === 'SI'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {respuesta}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-xs text-gray-500 italic">No se han identificado riesgos potenciales</p>
                                        </div>
                                    )}
                                </div>

                                {/* PASO 5: Condiciones Climáticas */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                        PASO 5: Condiciones Climáticas Adversas
                                    </h4>
                                    {condicionesClimaticas.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {condicionesClimaticas.map((condicion: string, index: number) => (
                                                <div key={index} className="flex items-center p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <svg className="h-4 w-4 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-xs text-gray-700 capitalize">{condicion}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-xs text-gray-500 italic">No se han identificado condiciones climáticas adversas</p>
                                        </div>
                                    )}
                                </div>

                                {/* PASO 6: EPP y Elementos Necesarios */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                        PASO 6: Elementos de Protección Personal (EPP)
                                    </h4>
                                    {eppElementos.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {eppElementos.map((epp: string, index: number) => (
                                                <div key={index} className="flex items-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-xs text-gray-700">{epp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-xs text-gray-500 italic">No se han especificado elementos de protección personal</p>
                                        </div>
                                    )}
                                </div>

                                {/* PASO 7: Análisis y Secuencia del Trabajo */}
                                {servicio.analisisRiesgo.etapasTrabajo && Array.isArray(servicio.analisisRiesgo.etapasTrabajo) && (servicio.analisisRiesgo.etapasTrabajo as any[]).length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                            PASO 7: Análisis y Secuencia del Trabajo
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Etapa</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Peligros</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Riesgos</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Medidas Control</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(servicio.analisisRiesgo.etapasTrabajo as any[]).map((etapa: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-900 font-medium">{etapa.etapa}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-700">{etapa.peligros}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-700">{etapa.riesgos}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-700">{etapa.medidasControl}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 8: Instrucciones Especiales del Supervisor */}
                                {servicio.analisisRiesgo.instruccionesEspeciales && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                            PASO 8: Instrucciones Especiales del Supervisor
                                        </h4>
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-900">{servicio.analisisRiesgo.instruccionesEspeciales}</p>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 9: Identificación del Grupo de Trabajo */}
                                {servicio.analisisRiesgo.grupoTrabajo && Array.isArray(servicio.analisisRiesgo.grupoTrabajo) && (servicio.analisisRiesgo.grupoTrabajo as any[]).length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                            PASO 9: Identificación del Grupo de Trabajo
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Nombre Completo</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">RUT</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(servicio.analisisRiesgo.grupoTrabajo as any[]).map((participante: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-900 font-medium">{participante.nombre}</td>
                                                            <td className="px-3 py-2 text-xs text-gray-700 font-mono">{participante.rut}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 10: Firma de Aprobación para Comenzar la Tarea */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                                        PASO 10: Firma de Aprobación para Comenzar la Tarea
                                    </h4>
                                    <div className={`p-4 rounded-lg border-2 ${servicio.analisisRiesgo.riesgosControlados ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`text-sm font-semibold ${servicio.analisisRiesgo.riesgosControlados ? 'text-green-900' : 'text-red-900'}`}>
                                            {servicio.analisisRiesgo.riesgosControlados ? '✓ Todos los riesgos fueron identificados y controlados' : '⚠ Riesgos no controlados o pendientes'}
                                        </p>
                                    </div>
                                </div>
                            </>;
                        })()
                    ) : (
                        <p className="text-sm text-gray-500">No completado</p>
                    )}
                </div>

                {/* Formulario de Aprobación o Estado */}
                {servicio.estado === 'PENDIENTE_APROBACION' ? (
                    <AprobacionForm servicioId={servicio.id} />
                ) : servicio.aprobacion ? (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Estado de Aprobación
                        </h3>
                        <div className={`p-4 rounded-lg ${servicio.estado === 'APROBADO' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <p className={`text-sm font-medium mb-2 ${servicio.estado === 'APROBADO' ? 'text-green-900' : 'text-red-900'}`}>
                                {servicio.estado === 'APROBADO' ? '✓ Servicio Aprobado' : '✗ Servicio Rechazado'}
                            </p>
                            <p className="text-sm text-gray-600">
                                Por: {servicio.aprobacion.supervisor?.name || servicio.aprobacion.supervisor?.username}
                            </p>
                            <p className="text-sm text-gray-500">
                                {servicio.aprobacion.fechaAprobacion && new Date(servicio.aprobacion.fechaAprobacion).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                            {servicio.aprobacion.observaciones && (
                                <p className="text-sm text-gray-700 mt-2">
                                    Observaciones: {servicio.aprobacion.observaciones}
                                </p>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// Componente auxiliar para mostrar items de checklist
function CheckItem({ label, value, inverted = false }: { label: string; value: boolean; inverted?: boolean }) {
    const isOk = inverted ? !value : value;
    return (
        <div className="flex items-center space-x-2">
            <svg className={`h-5 w-5 ${isOk ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                {isOk ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
            </svg>
            <span className={`text-sm ${isOk ? 'text-gray-700' : 'text-red-700'}`}>{label}</span>
        </div>
    );
}

// Función auxiliar para extraer todas las imágenes de los items del checklist
function extractImagesFromItems(items: any): Array<{ url: string; publicId: string }> {
    const images: Array<{ url: string; publicId: string }> = [];

    if (!items || typeof items !== 'object') {
        return images;
    }

    // Recorrer todas las categorías/secciones
    Object.values(items).forEach((section: any) => {
        if (section && typeof section === 'object') {
            // Recorrer todos los items en cada sección
            Object.values(section).forEach((item: any) => {
                // Si es un objeto con imagenes, agregarlas
                if (item && typeof item === 'object' && Array.isArray(item.imagenes)) {
                    images.push(...item.imagenes);
                }
            });
        }
    });

    return images;
}
