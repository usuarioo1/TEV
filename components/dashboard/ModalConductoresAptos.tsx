'use client';

import Link from 'next/link';

interface ChecklistFatigaResumen {
    checklistId: number;
    aptoParaTrabajar: boolean;
    requiereReemplazo: boolean;
    observaciones: string | null;
    fechaChecklist: string;
    servicioId: number;
    servicioCodigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estadoServicio: string;
    fechaAsignacion: string;
    operario: string;
    coordinador: string;
}

interface ModalConductoresAptosProps {
    open: boolean;
    onClose: () => void;
    loading: boolean;
    error: string | null;
    checklists: ChecklistFatigaResumen[];
    resumen: {
        total: number;
        aptos: number;
        noAptos: number;
        conReemplazo: number;
    };
}

export default function ModalConductoresAptos({
    open,
    onClose,
    loading,
    error,
    checklists,
    resumen,
}: ModalConductoresAptosProps) {
    if (!open) return null;

    const formatChecklistDate = (value: string) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString('es-CL', {
            timeZone: 'UTC',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                className="absolute inset-0 bg-black/50"
                aria-label="Cerrar modal"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Conductores aptos: detalle básico</h2>
                        <p className="text-sm text-gray-500">Checklists de fatiga contestados en el filtro actual.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="px-5 pt-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Total: {resumen.total}</span>
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aptos: {resumen.aptos}</span>
                        <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">No aptos: {resumen.noAptos}</span>
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">Con reemplazo: {resumen.conReemplazo}</span>
                    </div>
                </div>

                <div className="p-5 overflow-auto max-h-[65vh]">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Cargando checklists...</div>
                    ) : error ? (
                        <div className="py-10 text-center text-sm text-red-600">{error}</div>
                    ) : checklists.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">No se encontraron checklists para este filtro.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Servicio</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Resultado</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Reemplazo</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Operario</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Coordinador</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha checklist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {checklists.map((checklist) => (
                                        <tr key={checklist.checklistId} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-900">
                                                <Link
                                                    href={`/dashboard/operaciones/${checklist.servicioId}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                                >
                                                    {checklist.servicioCodigo}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-0.5">{checklist.origen} → {checklist.destino}</p>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${checklist.aptoParaTrabajar ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {checklist.aptoParaTrabajar ? 'Apto' : 'No apto'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${checklist.requiereReemplazo ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {checklist.requiereReemplazo ? 'Sí' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{checklist.operario}</td>
                                            <td className="px-3 py-2 text-gray-700">{checklist.coordinador}</td>
                                            <td className="px-3 py-2 text-gray-700">{formatChecklistDate(checklist.fechaChecklist)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
