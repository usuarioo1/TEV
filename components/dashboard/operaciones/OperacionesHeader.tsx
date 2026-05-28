import Link from 'next/link';

interface OperacionesHeaderProps {
    onExportarExcel: () => void;
    exportandoExcel: boolean;
}

export default function OperacionesHeader({ onExportarExcel, exportandoExcel }: OperacionesHeaderProps) {
    return (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Inicio
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-700">Módulo Operaciones</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Módulo Operaciones</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Estado de servicios, no conformidades y listado completo de operaciones
                </p>
            </div>
            <button
                onClick={onExportarExcel}
                disabled={exportandoExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
                </svg>
                {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
            </button>
        </div>
    );
}
