import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="mx-auto h-24 w-24 text-red-500 mb-4">
                        <svg
                            className="h-full w-full"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Acceso Denegado
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        No tienes permisos para acceder a esta página
                    </p>
                    <p className="text-sm text-gray-500">
                        Esta sección está restringida a usuarios con rol de <span className="font-semibold">Jefaturas</span>.
                    </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                        Si crees que esto es un error, contacta al administrador del sistema.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Volver al Inicio
                    </Link>
                    <Link
                        href="/test"
                        className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                    >
                        Ir al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
