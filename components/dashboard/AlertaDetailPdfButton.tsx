'use client';

import { useState } from 'react';
import { exportDetailPdf } from '@/components/seccionReportarInicio/pdfExport';

interface Props {
    tipo: 'reporte-peligro' | 'tarjeta-stop' | 'control-art';
    id: number;
}

export default function AlertaDetailPdfButton({ tipo, id }: Props) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            await exportDetailPdf(tipo, id);
        } catch (err) {
            console.error('Error generando PDF:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {loading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
    );
}
