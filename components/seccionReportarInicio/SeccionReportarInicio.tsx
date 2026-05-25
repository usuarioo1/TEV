'use client';

import ReportarCards from './ReportarCards';
import type { TipoFormulario } from './types';

interface SeccionReportarInicioProps {
    rol: string;
    onOpenModal: (tipo: TipoFormulario) => void;
}

export default function SeccionReportarInicio({ rol, onOpenModal }: SeccionReportarInicioProps) {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reportar</h2>
            <ReportarCards rol={rol} onOpenModal={onOpenModal} />
        </div>
    );
}
