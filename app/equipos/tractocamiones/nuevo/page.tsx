import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import CrearTractoCamionForm from '@/components/equipos/CrearTractoCamionForm';

export const dynamic = 'force-dynamic';

export default async function NuevoTractoCamionPage() {
    // Solo jefaturas puede crear equipos
    await requireRole([ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Agregar Tractocamión
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Registrar un nuevo tractocamión en el sistema
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                    <CrearTractoCamionForm />
                </div>
            </div>
        </div>
    );
}
