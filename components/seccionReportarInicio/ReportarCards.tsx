import Link from 'next/link';
import type { TipoFormulario } from './types';

interface ReportarCardsProps {
    rol: string;
    onOpenModal: (tipo: TipoFormulario) => void;
}

const WarningIcon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const BinocularsIcon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ClipboardIcon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export default function ReportarCards({ rol, onOpenModal }: ReportarCardsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
                onClick={() => onOpenModal('peligro')}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-3 shadow-lg">
                        {WarningIcon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Reportes de</h3>
                    <h3 className="text-sm font-semibold text-gray-800">Peligros</h3>
                </div>
            </button>

            <Link
                href="/caminatas/nueva"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-3 shadow-lg">
                        {BinocularsIcon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Caminatas de</h3>
                    <h3 className="text-sm font-semibold text-gray-800">Seguridad</h3>
                </div>
            </Link>

            <button
                onClick={() => onOpenModal('stop')}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-3 shadow-lg">
                        {WarningIcon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Tarjeta Alto/Stop</h3>
                </div>
            </button>

            <button
                onClick={() => onOpenModal('art')}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-3 shadow-lg">
                        {ClipboardIcon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Controles de</h3>
                    <h3 className="text-sm font-semibold text-gray-800">Calidad ART</h3>
                </div>
            </button>
        </div>
    );
}
