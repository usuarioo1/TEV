import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import EnviarAprobacionForm from '@/components/servicios/EnviarAprobacionForm';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function EnviarAprobacionPage({
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
            checklistFatiga: true,
            checklistTractoCamion: true,
            analisisRiesgo: true,
            noConformidades: {
                where: {
                    estado: 'ABIERTA',
                    checklistTipo: {
                        in: ['TRACTO_CAMION', 'SEMIREMOLQUE'],
                    },
                },
                select: {
                    checklistTipo: true,
                    itemNombre: true,
                    seccion: true,
                },
            },
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

    // Verificar que el servicio esté en estado EN_CHECKLIST
    if (servicio.estado !== 'EN_CHECKLIST') {
        redirect(`/servicios/${id}/checklists`);
    }

    // Verificar que todos los checklists estén completos
    const checklistsCompletos =
        servicio.checklistEquipo?.completado &&
        servicio.checklistFatiga?.completado &&
        servicio.checklistTractoCamion?.completado &&
        servicio.analisisRiesgo?.completado;

    if (!checklistsCompletos) {
        redirect(`/servicios/${id}/checklists`);
    }

    const noConformidadesCriticasAbiertas = servicio.noConformidades.filter((nc) =>
        isChecklistItemCritico(nc.checklistTipo, nc.itemNombre)
    );
    const bloqueadoPorNoConformidadesCriticas = noConformidadesCriticasAbiertas.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <a
                        href={`/servicios/${id}/checklists`}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Checklists
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Enviar a Aprobación
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Revisa el resumen de validaciones antes de enviar - Servicio {servicio.codigo}
                    </p>
                </div>

                {/* Resumen de Checklists */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Resumen de Validaciones
                    </h2>

                    <div className="space-y-6">
                        {/* Checklist de Equipo */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900">1. Checklist de Equipo - Rampla Plana/Drop Deck</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servicio.checklistEquipo?.completado
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {servicio.checklistEquipo?.completado ? '✓ Completado' : 'No Completado'}
                                </span>
                            </div>

                            {/* Información del vehículo */}
                            <div className="pl-4 mb-3 text-sm text-gray-600">
                                <p><strong>Vehículo:</strong> {servicio.checklistEquipo?.marcaModelo} - Patente: {servicio.checklistEquipo?.patente}</p>
                                <p><strong>Conductor:</strong> {servicio.checklistEquipo?.conductor}</p>
                            </div>

                            {/* Resumen de items por estado */}
                            {servicio.checklistEquipo?.items && typeof servicio.checklistEquipo.items === 'object' && (
                                <div className="pl-4 mb-3">
                                    {(() => {
                                        type ItemChecklistResumen = {
                                            valor?: string;
                                            tieneObservacion?: boolean;
                                            observacion?: string;
                                        };

                                        const items = servicio.checklistEquipo.items as Record<string, Record<string, unknown>>;
                                        let countSI = 0;
                                        let countNO = 0;
                                        let countOB = 0;
                                        let countObservaciones = 0;
                                        const noItems: string[] = [];
                                        const observacionesItems: string[] = [];

                                        Object.entries(items).forEach(([categoria, itemsObj]) => {
                                            Object.entries(itemsObj).forEach(([itemName, itemData]) => {
                                                // Manejar tanto el formato nuevo (objeto) como el antiguo (string)
                                                const itemDataObject =
                                                    typeof itemData === 'object' && itemData !== null && !Array.isArray(itemData)
                                                        ? (itemData as ItemChecklistResumen)
                                                        : null;

                                                const valorRaw = itemDataObject?.valor ?? itemData;
                                                const valor = typeof valorRaw === 'string' ? valorRaw : '';
                                                const tieneObservacion = itemDataObject?.tieneObservacion === true;
                                                const observacion = typeof itemDataObject?.observacion === 'string'
                                                    ? itemDataObject.observacion
                                                    : '';

                                                if (valor === 'SI' || valor === 'OK') countSI++;
                                                else if (valor === 'NO' || valor === 'NC') {
                                                    countNO++;
                                                    noItems.push(`${categoria}: ${itemName}`);
                                                }
                                                else if (valor === 'OB' || valor === 'N/A') countOB++;

                                                if (tieneObservacion && observacion) {
                                                    countObservaciones++;
                                                    observacionesItems.push(`${categoria}: ${itemName} - ${observacion}`);
                                                }
                                            });
                                        });

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-green-700">✓ SI: {countSI}</span>
                                                    <span className="text-red-700">✗ NO: {countNO}</span>
                                                    <span className="text-yellow-700">⊙ N/A: {countOB}</span>
                                                    {countObservaciones > 0 && (
                                                        <span className="text-blue-700">📝 Con observaciones: {countObservaciones}</span>
                                                    )}
                                                </div>

                                                {noItems.length > 0 && (
                                                    <div className="bg-red-50 border border-red-200 rounded p-3">
                                                        <p className="text-sm font-medium text-red-900 mb-1">Items que necesitan corrección:</p>
                                                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                                                            {noItems.map((item, idx) => (
                                                                <li key={idx}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {observacionesItems.length > 0 && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                                        <p className="text-sm font-medium text-blue-900 mb-1">Items con observaciones específicas:</p>
                                                        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                                                            {observacionesItems.map((item, idx) => (
                                                                <li key={idx}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                        </div>

                        {/* Checklist de Tracto Camión */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900">2. Checklist de Tracto Camión</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servicio.checklistTractoCamion?.completado
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {servicio.checklistTractoCamion?.completado ? '✓ Completado' : 'No Completado'}
                                </span>
                            </div>
                        </div>

                        {/* Checklist de Fatiga */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900">3. Checklist de Fatiga y Somnolencia</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servicio.checklistFatiga?.completado
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {servicio.checklistFatiga?.completado ? '✓ Completado' : 'No Completado'}
                                </span>
                            </div>
                        </div>

                        {/* Análisis de Riesgo */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900">4. Análisis de Riesgo (AST/ART)</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servicio.analisisRiesgo?.completado
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {servicio.analisisRiesgo?.completado ? '✓ Completado' : 'No Completado'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {bloqueadoPorNoConformidadesCriticas && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    No conformidades críticas detectadas
                                </h3>
                                <div className="mt-2 text-sm text-red-700 space-y-1">
                                    <p>
                                        Se detectaron {noConformidadesCriticasAbiertas.length} no conformidad(es) crítica(s) abiertas en tracto camión o semirremolque.
                                    </p>
                                    <p>
                                        Se está trabajando para corregirlas antes de iniciar el servicio. Este envío se marcará como volver a enviar y serás redirigido a servicios.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información del Proceso */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                ¿Qué sucede después?
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 space-y-1">
                                <p>• El servicio será enviado a un supervisor para su revisión</p>
                                <p>• El supervisor revisará todas las validaciones realizadas</p>
                                <p>• Si todo está correcto, aprobará el servicio con firma digital</p>
                                <p>• Una vez aprobado, podrás iniciar la ejecución del servicio</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario de Confirmación */}
                <EnviarAprobacionForm
                    servicioId={servicio.id}
                    initialSupervisorResponsableId={servicio.analisisRiesgo?.supervisorResponsableId ?? null}
                    bloqueadoPorNoConformidadesCriticas={bloqueadoPorNoConformidadesCriticas}
                />
            </div>
        </div>
    );
}
