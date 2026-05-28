import Link from 'next/link';

const TaskIcon = (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const WarningIcon = (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export default function GridPrevencionista() {
    return (
        <div className="space-y-8">
            {/* Ver Historial */}
            <div>
                <div className="mb-4">
                    <div className="">
                        <span className="font-bold text-xl">Ver Historial</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Link
                        href="/caminatas"
                        className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group flex flex-col"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-linear-to-br from-cyan-400 to-cyan-600 text-white p-5 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                                    {TaskIcon}
                                </div>
                            </div>
                            <h3 className="text-center text-xl font-bold text-gray-800 mb-2">Caminatas de Seguridad</h3>
                            <p className="text-center text-gray-600 text-sm">Ver todas las caminatas asignadas</p>
                        </div>
                        <div className="h-1 bg-linear-to-r from-cyan-400 to-cyan-600"></div>
                    </Link>

                    <Link
                        href="/caminatas/alertas"
                        className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group flex flex-col"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-linear-to-br from-cyan-400 to-cyan-600 text-white p-5 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                                    {WarningIcon}
                                </div>
                            </div>
                            <h3 className="text-center text-xl font-bold text-gray-800 mb-2">Alertas y Reportes</h3>
                            <p className="text-center text-gray-600 text-sm">Reportes de peligro, tarjetas Stop y controles ART</p>
                        </div>
                        <div className="h-1 bg-linear-to-r from-cyan-400 to-cyan-600"></div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
