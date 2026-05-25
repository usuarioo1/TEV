import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import AnalisisRiesgoForm from '@/components/servicios/checklists/AnalisisRiesgoForm';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function AnalisisRiesgoPage({
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
            analisisRiesgo: true,
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

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        Análisis de Riesgos del Trabajo (ART)
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Identificación de peligros, controles y aprobación del equipo - Servicio {servicio.codigo}
                    </p>
                </div>

                {/* Información Importante */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-purple-800">
                                Estructura del ART
                            </h3>
                            <div className="mt-2 text-sm text-purple-700 space-y-1">
                                <p>• Sección A: información general y personal</p>
                                <p>• Matriz ART: actividad, peligro, evento, control y verificación</p>
                                <p>• Mejoramientos y comentarios del procedimiento</p>
                                <p>• Sección C: aprobación del análisis</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Formulario */}
                <AnalisisRiesgoForm
                    servicioId={servicio.id}
                    analisisExistente={servicio.analisisRiesgo || undefined}
                />
            </div>
        </div>
    );
}
