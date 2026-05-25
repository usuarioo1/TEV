import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import EditarServicioForm from '@/components/servicios/EditarServicioForm';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditarServicioPage({ params }: PageProps) {
    // Verificar que el usuario tenga acceso (solo coordinadores y jefaturas)
    await requireRole([ROLES.COORDINADOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    // Await params en Next.js 15+
    const resolvedParams = await params;
    const servicioId = parseInt(resolvedParams.id);

    if (isNaN(servicioId)) {
        notFound();
    }

    // Obtener el servicio
    const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
    });

    if (!servicio) {
        notFound();
    }

    // Verificar que el usuario sea el coordinador que creó el servicio (o jefaturas)
    if (session.rol === ROLES.COORDINADOR && servicio.coordinadorId !== session.id) {
        redirect('/unauthorized');
    }

    // Verificar que el servicio esté en un estado editable
    const estadosEditables = ['PENDIENTE', 'ASIGNADO'];
    if (!estadosEditables.includes(servicio.estado)) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex">
                            <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-red-800">
                                    No se puede editar este servicio
                                </h3>
                                <p className="mt-2 text-sm text-red-700">
                                    Este servicio está en estado <strong>{servicio.estado}</strong> y ya no puede ser editado.
                                    Solo se pueden editar servicios en estado PENDIENTE o ASIGNADO, antes de que el operario los acepte.
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/servicios"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                    >
                                        Volver a Servicios
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Obtener lista de operarios disponibles
    const operarios = await prisma.user.findMany({
        where: {
            rol: ROLES.OPERARIO,
        },
        select: {
            id: true,
            username: true,
            name: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Editar Servicio
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Modifica los detalles del servicio <strong>{servicio.codigo}</strong>
                    </p>
                </div>

                {/* Formulario */}
                <EditarServicioForm servicio={servicio} operarios={operarios} />
            </div>
        </div>
    );
}
