import Link from 'next/link';

interface GridTallerProps {
    noConformidadesPendientes: number;
    hallazgosPendientes: number;
}

function formatBadgeCount(count: number): string {
    if (count > 99) return '99+';
    return String(Math.max(0, count));
}

export default function GridTaller({
    noConformidadesPendientes,
    hallazgosPendientes,
}: GridTallerProps) {
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Mantenimiento</span>
                <div className="flex-1 border-t border-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link
                    href="/no-conformidades"
                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group"
                >
                    <div className="p-6">
                        <div className="flex justify-end mb-2">
                            <span
                                className={`inline-flex min-w-7 h-7 items-center justify-center rounded-full px-2 text-xs font-bold ${noConformidadesPendientes > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                aria-label={`No conformidades pendientes: ${formatBadgeCount(noConformidadesPendientes)}`}
                            >
                                {formatBadgeCount(noConformidadesPendientes)}
                            </span>
                        </div>
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-linear-to-br from-orange-400 to-orange-600 text-white p-5 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-center text-xl font-bold text-gray-800 mb-2">No Conformidades</h3>
                        <p className="text-center text-gray-600 text-sm">Gestiona no conformidades mecánicas y de equipos en checklists</p>
                    </div>
                    <div className="h-1 bg-linear-to-r from-orange-400 to-orange-600"></div>
                </Link>

                <Link
                    href="/hallazgoschecklist"
                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group"
                >
                    <div className="p-6">
                        <div className="flex justify-end mb-2">
                            <span
                                className={`inline-flex min-w-7 h-7 items-center justify-center rounded-full px-2 text-xs font-bold ${hallazgosPendientes > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                aria-label={`Hallazgos pendientes: ${formatBadgeCount(hallazgosPendientes)}`}
                            >
                                {formatBadgeCount(hallazgosPendientes)}
                            </span>
                        </div>
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-linear-to-br from-blue-500 to-blue-700 text-white p-5 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-center text-xl font-bold text-gray-800 mb-2">Hallazgos</h3>
                        <p className="text-center text-gray-600 text-sm">Gestiona hallazgos detectados en items marcados como SI con observación adicional</p>
                    </div>
                    <div className="h-1 bg-linear-to-r from-blue-500 to-blue-700"></div>
                </Link>
            </div>
        </div>
    );
}
