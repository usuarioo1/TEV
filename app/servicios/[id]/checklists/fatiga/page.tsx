import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import ChecklistFatigaForm from '@/components/servicios/checklists/ChecklistFatigaForm';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function ChecklistFatigaPage({
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
            checklistFatiga: true,
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        Checklist de Fatiga y Somnolencia
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Evaluación del estado del operario - Servicio {servicio.codigo}
                    </p>
                </div>

                {/* Información Importante */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                                Importante
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>Responde con sinceridad sobre tu estado físico y mental.</p>
                                <p className="mt-1">Si no te encuentras en condiciones óptimas, por tu seguridad y la de otros, debes indicarlo.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <ChecklistFatigaForm
                    servicioId={servicio.id}
                    checklistExistente={servicio.checklistFatiga || undefined}
                />
            </div>
        </div>
    );
}
