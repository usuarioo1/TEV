import Link from 'next/link';

interface InicioHeaderProps {
    name: string | null;
    rol: string;
    welcomeMessage: string;
}

export default function InicioHeader({ name, rol, welcomeMessage }: InicioHeaderProps) {
    const showDashboardButtons = rol === 'jefaturas' || rol === 'prevencionista';

    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {welcomeMessage}, {name}
                        </h1>
                        {rol === 'prevencionista' && (
                            <p className="text-gray-600 mt-1">Panel Prevencionista</p>
                        )}
                        {showDashboardButtons && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Link
                                    href="/dashboard/operaciones"
                                    className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cyan-700"
                                >
                                    Dashboard Operaciones
                                </Link>
                                <Link
                                    href="/dashboard/gestion-desempeno"
                                    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-orange-600"
                                >
                                    Dashboard Seguridad
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
