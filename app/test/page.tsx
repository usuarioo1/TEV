import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function TestPage() {
    const session = await getSession();

    // Si no hay sesión, redirigir al login
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        ¡Hola {session.username}!
                    </h1>
                    <p className="text-xl text-gray-700">
                        Estás logueado y tienes acceso al sistema
                    </p>
                </div>

                {/* User Info Card */}
                <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Información de tu sesión
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Usuario</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {session.username}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Rol</p>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                                {session.rol}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">ID de usuario</p>
                            <p className="text-lg font-semibold text-gray-900">
                                #{session.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role Info */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Permisos de tu rol
                    </h2>
                    <div className="space-y-3">
                        {session.rol === 'jefaturas' && (
                            <div className="text-sm text-gray-600">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                                    Jefaturas
                                </span>
                                <p>Como parte de Jefaturas, tienes acceso completo a todas las funcionalidades del sistema, incluyendo la gestión de usuarios.</p>
                            </div>
                        )}
                        {session.rol === 'jefaturas' && (
                            <div className="text-sm text-gray-600">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                                    Jefaturas
                                </span>
                                <p>Como Jefatura, tienes acceso a las funciones de gestión y supervisión del sistema.</p>
                            </div>
                        )}
                        {session.rol === 'supervisor' && (
                            <div className="text-sm text-gray-600">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                                    Supervisor
                                </span>
                                <p>Como Supervisor, puedes supervisar operaciones y gestionar tareas asignadas.</p>
                            </div>
                        )}
                        {session.rol === 'operario' && (
                            <div className="text-sm text-gray-600">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-2">
                                    Operario
                                </span>
                                <p>Como Operario, tienes acceso a las funciones operativas del sistema.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
