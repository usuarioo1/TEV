import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { hasChecklistNoCritico } from '@/lib/checklist-critical-items';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function ChecklistsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getSession();

    if (!session) redirect('/login');

    const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(id) },
        include: {
            checklistEquipo: true,
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: true,
            coordinador: {
                select: {
                    name: true,
                    username: true,
                },
            },
        },
    });

    if (!servicio) notFound();

    // Verificar que el servicio esté asignado al operario actual
    if (servicio.operarioId !== session.id) {
        redirect('/servicios');
    }

    // Verificar que el servicio esté en estado ACEPTADO o EN_CHECKLIST
    if (servicio.estado !== 'ACEPTADO' && servicio.estado !== 'EN_CHECKLIST') {
        redirect(`/servicios/${id}`);
    }

    // Determinar qué checklists están completos
    // Un checklist está completo si existe Y tiene el campo completado en true
    const checklistEquipoCompleto = servicio.checklistEquipo?.completado === true;
    const checklistTractoCamionCompleto = servicio.checklistTractoCamion?.completado === true;
    const checklistFatigaCompleto = servicio.checklistFatiga?.completado === true;
    const checklistFatigaNoApto =
        checklistFatigaCompleto && servicio.checklistFatiga?.aptoParaTrabajar === false;
    const analisisRiesgoCompleto = servicio.analisisRiesgo?.completado === true;

    const tractoCriticoNo =
        checklistTractoCamionCompleto &&
        hasChecklistNoCritico(
            'TRACTO_CAMION',
            servicio.checklistTractoCamion?.items as Record<string, Record<string, unknown>>,
        );

    const equipoCriticoNo =
        checklistEquipoCompleto &&
        hasChecklistNoCritico(
            'SEMIREMOLQUE',
            servicio.checklistEquipo?.items as Record<string, Record<string, unknown>>,
        );

    // Al menos uno de los checklists de vehículo debe estar completo (rampla o tracto)
    const checklistVehiculoCompleto = checklistEquipoCompleto || checklistTractoCamionCompleto;

    const todosLosChecklistsCompletos =
        checklistVehiculoCompleto &&
        checklistFatigaCompleto &&
        analisisRiesgoCompleto;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Checklists de Validación
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Completa todas las validaciones antes de enviar a aprobación
                    </p>
                    <div className="mt-2">
                        <span className="text-sm text-gray-500">Servicio: </span>
                        <span className="text-sm font-medium text-gray-900">{servicio.codigo}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Progreso
                    </h2>
                    <div className="flex items-center space-x-2">
                        <div className={`flex-1 h-2 rounded-full ${checklistFatigaCompleto ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        <div className={`flex-1 h-2 rounded-full ${checklistTractoCamionCompleto ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        <div className={`flex-1 h-2 rounded-full ${checklistEquipoCompleto ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        <div className={`flex-1 h-2 rounded-full ${analisisRiesgoCompleto ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>Fatiga</span>
                        <span>Tracto</span>
                        <span>Rampla</span>
                        <span>Riesgos</span>
                    </div>
                </div>

                {/* Checklist Cards */}
                <div className="space-y-4">
                    {/* Checklist de Fatiga */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    1. Checklist de Fatiga y Somnolencia
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Evaluación del estado del operario
                                </p>
                            </div>
                            {checklistFatigaCompleto && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${checklistFatigaNoApto ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {checklistFatigaNoApto ? 'Completado - No apto' : 'Completado'}
                                </span>
                            )}
                        </div>

                        {checklistFatigaNoApto && (
                            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-red-700">
                                        Advertencia: conductor no apto.
                                    </p>
                                </div>
                            </div>
                        )}

                        <a
                            href={`/servicios/${id}/checklists/fatiga`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {checklistFatigaCompleto ? 'Ver/Editar' : 'Completar Checklist'}
                        </a>
                    </div>

                    {/* Checklist de Tracto Camiones */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    2. Checklist Tracto Camiones
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Inspección tracto camión
                                </p>
                            </div>
                            {checklistTractoCamionCompleto && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tractoCriticoNo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {tractoCriticoNo ? 'Completado - Critico' : 'Completado'}
                                </span>
                            )}
                        </div>

                        {tractoCriticoNo && (
                            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-red-700">
                                        Advertencia: Hay no conformidades criticas en checklist de tracto camion.
                                    </p>
                                </div>
                            </div>
                        )}

                        <a
                            href={`/servicios/${id}/checklists/tracto-camion`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {checklistTractoCamionCompleto ? 'Ver/Editar' : 'Completar Checklist'}
                        </a>
                    </div>

                    {/* Checklist de Rampla Plana/Drop Deck */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    3. Checklist Semi-remolque
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Inspección equipos de transporte
                                </p>
                            </div>
                            {checklistEquipoCompleto && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${equipoCriticoNo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {equipoCriticoNo ? 'Completado - Critico' : 'Completado'}
                                </span>
                            )}
                        </div>

                        {equipoCriticoNo && (
                            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-red-700">
                                        Advertencia: Hay no conformidades criticas en checklist de semi-remolque (incluida documentacion).
                                    </p>
                                </div>
                            </div>
                        )}

                        <a
                            href={`/servicios/${id}/checklists/equipo`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {checklistEquipoCompleto ? 'Ver/Editar' : 'Completar Checklist'}
                        </a>
                    </div>

                    {/* Análisis de Riesgo (AST/ART) */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    4. Análisis de Riesgo (ART)
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Identificación de riesgos y medidas de control
                                </p>
                            </div>
                            {analisisRiesgoCompleto && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Completado
                                </span>
                            )}
                        </div>
                        <a
                            href={`/servicios/${id}/checklists/riesgo`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            {analisisRiesgoCompleto ? 'Ver/Editar' : 'Completar Análisis'}
                        </a>
                    </div>
                </div>

                {/* Botón de Enviar a Aprobación */}
                {todosLosChecklistsCompletos && (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <div className="shrink-0">
                                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-green-800">
                                    ¡Todos los checklists completados!
                                </h3>
                                <p className="mt-2 text-sm text-green-700">
                                    Ya puedes enviar el servicio para aprobación del supervisor.
                                </p>
                                <div className="mt-4">
                                    <a
                                        href={`/servicios/${id}/enviar-aprobacion`}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        Enviar a Aprobación
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botón Volver */}
                <div className="mt-6">
                    <a
                        href="/servicios"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Servicios
                    </a>
                </div>
            </div>
        </div>
    );
}
