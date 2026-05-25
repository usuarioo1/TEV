import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import CrearServicioForm from '@/components/servicios/CrearServicioForm';
import { ROLES } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';

// NOTA: Esta página es temporal para crear servicios de prueba durante el desarrollo.
// En producción, la creación de servicios será parte de un módulo más completo de gestión,
// donde se integrarán con sistemas de pedidos, clientes, rutas, etc.
// Por ahora solo permite crear servicios básicos para probar el flujo de validaciones del operario.

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function NuevoServicioPage() {
    const session = await getSession();

    if (!session) redirect('/login');

    // Solo coordinadores y jefaturas pueden crear servicios
    await requireRole([ROLES.COORDINADOR, ROLES.JEFATURAS]);

    // Obtener lista de operarios para asignar
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

    console.log('=== Operarios disponibles ===');
    operarios.forEach(op => console.log(`- ${op.username} (ID: ${op.id})`));

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <a
                        href="/servicios"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Servicios
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Crear Servicio
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Crea un servicio de prueba para validar el flujo de checklists y aprobaciones
                    </p>
                </div>

                {/* Nota de Desarrollo */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Módulo de Desarrollo
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>Esta funcionalidad es temporal para crear servicios de prueba.</p>
                                <p className="mt-1">En producción, la creación de servicios será parte de un sistema más completo de gestión de pedidos y asignación de recursos.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DEBUG INFO - TEMPORAL */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">🔍 Operarios Disponibles</h3>
                    <div className="text-xs space-y-1 text-blue-800 font-mono">
                        {operarios.length === 0 ? (
                            <div className="text-red-600 font-bold">⚠️ No hay operarios disponibles en la base de datos</div>
                        ) : (
                            operarios.map(op => (
                                <div key={op.id}>
                                    • {op.name || op.username} ({op.username}) - ID: {op.id}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Formulario */}
                <CrearServicioForm
                    operarios={operarios}
                />
            </div>
        </div>
    );
}
