import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';

export default async function RegisterPage() {
    // Solo permitir acceso a usuarios con rol de jefaturas
    await requireRole([ROLES.JEFATURAS]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Crear Nuevo Usuario
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Panel de administración - Solo accesible para Jefaturas
                    </p>
                    <div className="mt-4 text-center">
                        <Link 
                            href="/users" 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver a Gestión de Usuarios
                        </Link>
                    </div>
                </div>
                <RegisterForm />
            </div>
        </div>
    );
}
