import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import AceptarServicioForm from '@/components/servicios/AceptarServicioForm';
import Link from 'next/link';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function AceptarServicioPage({
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
            coordinador: {
                select: {
                    name: true,
                    username: true,
                },
            },
        },
    });

    if (!servicio) notFound();

    // Debug: ver qué está pasando
    console.log('=== DEBUG ACEPTAR SERVICIO ===');
    console.log('Servicio ID:', servicio.id);
    console.log('Servicio Estado:', servicio.estado);
    console.log('Servicio OperarioId:', servicio.operarioId);
    console.log('Session ID:', session.id);
    console.log('Session Rol:', session.rol);
    console.log('Comparación:', servicio.operarioId === session.id);
    console.log('==============================');

    // Verificar que el servicio esté asignado al operario actual
    if (servicio.operarioId !== session.id) {
        console.log('❌ Redirección: operarioId no coincide');
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-red-900">No autorizado</h2>
                        </div>
                        <p className="text-red-700 mb-4">Este servicio no está asignado a ti.</p>
                        <Link
                            href="/servicios"
                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        >
                            Volver a Mis Servicios
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Verificar que el servicio esté en estado ASIGNADO
    if (servicio.estado !== 'ASIGNADO') {
        console.log('❌ Redirección: estado no es ASIGNADO, es:', servicio.estado);
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <svg className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-yellow-900">Servicio no disponible para aceptar</h2>
                        </div>
                        <p className="text-yellow-700 mb-2">
                            Este servicio está en estado: <strong>{servicio.estado}</strong>
                        </p>
                        <p className="text-yellow-700 mb-4">
                            {servicio.estado === 'ACEPTADO' && 'El servicio ya fue aceptado. Puedes continuar con los checklists.'}
                            {servicio.estado === 'EN_CHECKLIST' && 'El servicio está en proceso de checklists.'}
                            {servicio.estado === 'PENDIENTE_APROBACION' && 'El servicio está esperando aprobación del supervisor.'}
                            {servicio.estado === 'APROBADO' && 'El servicio ya fue aprobado.'}
                            {servicio.estado === 'EN_EJECUCION' && 'El servicio está en ejecución.'}
                            {servicio.estado === 'COMPLETADO' && 'El servicio ya fue completado.'}
                            {servicio.estado === 'RECHAZADO' && 'Este servicio fue rechazado.'}
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/servicios"
                                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
                            >
                                Volver a Mis Servicios
                            </Link>
                            <Link
                                href={`/servicios/${id}`}
                                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium"
                            >
                                Ver Detalles del Servicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Aceptar Servicio
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Revisa la información del servicio
                    </p>
                </div>

                {/* Información del Servicio */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Información del Servicio
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Código</p>
                                <p className="font-medium text-gray-900">{servicio.codigo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Asignación</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'America/Santiago',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Descripción</p>
                            <p className="text-gray-900">{servicio.descripcion}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Origen</p>
                                <p className="font-medium text-gray-900">{servicio.origen}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Destino</p>
                                <p className="font-medium text-gray-900">{servicio.destino}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Coordinado por</p>
                            <p className="font-medium text-gray-900">
                                {servicio.coordinador?.name || servicio.coordinador?.username}
                            </p>
                        </div>

                        {servicio.observaciones && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Observaciones</p>
                                <p className="text-gray-700 text-sm">{servicio.observaciones}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Información Importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Al aceptar este servicio:
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Deberás completar el Checklist de Equipo</li>
                                    <li>Deberás completar el Checklist de Tracto Camión</li>
                                    <li>Deberás completar el Checklist de Fatiga y Somnolencia</li>
                                    <li>Deberás realizar el Análisis de Riesgo (ART)</li>
                                    <li>Un supervisor deberá aprobar antes de la ejecución</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario de Aceptación/Rechazo */}
                <AceptarServicioForm servicioId={servicio.id} />
            </div>
        </div>
    );
}
