import Link from 'next/link';
import type { ServicioCompletado } from '../dashboard-types';
import { formatDateTime } from '../dashboard-utils';

interface ServiciosPorEstadoModalProps {
    open: boolean;
    loading: boolean;
    error: string | null;
    servicios: ServicioCompletado[];
    onClose: () => void;
}

export default function ServiciosPorEstadoModal({
    open,
    loading,
    error,
    servicios,
    onClose,
}: ServiciosPorEstadoModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                className="absolute inset-0 bg-black/50"
                aria-label="Cerrar modal"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Servicios por estado</h2>
                        <p className="text-sm text-gray-500">Detalle de servicios de todos los estados para el filtro actual.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-5 overflow-auto max-h-[70vh]">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Cargando servicios...</div>
                    ) : error ? (
                        <div className="py-10 text-center text-sm text-red-600">{error}</div>
                    ) : servicios.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">No se encontraron servicios para este filtro.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Servicio</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Origen / Destino</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Operario</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Coordinador</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha asignación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {servicios.map((servicio) => (
                                        <tr key={servicio.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-900">
                                                <Link
                                                    href={`/dashboard/operaciones/${servicio.id}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                                >
                                                    {servicio.codigo}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-0.5">{servicio.descripcion}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.estado}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.origen} → {servicio.destino}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.operario?.name || servicio.operario?.username || 'Sin operario'}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.coordinador?.name || servicio.coordinador?.username || 'Sin coordinador'}</td>
                                            <td className="px-3 py-2 text-gray-700">{formatDateTime(servicio.fechaAsignacion)}</td>
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
