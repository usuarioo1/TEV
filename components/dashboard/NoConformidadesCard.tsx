import { Info, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface NoConformidad {
    categoria: string;
    item: string;
    frecuencia: number;
    tipo: 'equipo' | 'tracto';
    serviciosAfectados: number;
    equiposReincidentes: number;
    ultimaDeteccion: string;
}

type TipoVista = 'todos' | 'equipo' | 'tracto';

interface NoConformidadesCardProps {
    topNC: NoConformidad[];
    totalNC: number;
    porServicio?: NoConformidadPorServicio[];
    fechaDesde?: string;
    fechaHasta?: string;
}

interface NoConformidadPorServicio {
    servicioId: number;
    servicioCodigo: string;
    totalNC: number;
    ncEquipo: number;
    ncTracto: number;
}

interface EquipoConNC {
    id: number;
    patente: string;
    servicioId: number;
    servicioCodigo?: string;
    fecha: string;
    conductor: string;
    observacion?: string;
}

const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
};

export default function NoConformidadesCard({ topNC, totalNC, porServicio = [], fechaDesde, fechaHasta }: NoConformidadesCardProps) {
    const [showInfo, setShowInfo] = useState(false);
    const [selectedNC, setSelectedNC] = useState<NoConformidad | null>(null);
    const [equipos, setEquipos] = useState<EquipoConNC[]>([]);
    const [loadingEquipos, setLoadingEquipos] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [tipoVista, setTipoVista] = useState<TipoVista>('todos');

    const filteredNC = topNC.filter((nc) => {
        if (tipoVista === 'todos') return true;
        return nc.tipo === tipoVista;
    });

    const sortedNC = [...filteredNC].sort((a, b) => {
        if (b.frecuencia !== a.frecuencia) return b.frecuencia - a.frecuencia;
        if (b.serviciosAfectados !== a.serviciosAfectados) return b.serviciosAfectados - a.serviciosAfectados;
        return b.equiposReincidentes - a.equiposReincidentes;
    });

    const visibleNC = expanded ? sortedNC : sortedNC.slice(0, 5);
    const serviciosSemirremolque = porServicio
        .filter(servicio => servicio.ncEquipo > 0)
        .sort((a, b) => b.ncEquipo - a.ncEquipo)
        .slice(0, 5);
    const serviciosTractocamion = porServicio
        .filter(servicio => servicio.ncTracto > 0)
        .sort((a, b) => b.ncTracto - a.ncTracto)
        .slice(0, 5);

    const handleNCClick = async (nc: NoConformidad) => {
        setSelectedNC(nc);
        setShowModal(true);
        setLoadingEquipos(true);

        try {
            const params = new URLSearchParams({
                categoria: nc.categoria,
                item: nc.item,
                tipo: nc.tipo,
            });
            if (fechaDesde) params.set('fechaInicio', fechaDesde);
            if (fechaHasta) params.set('fechaFin', fechaHasta);

            const response = await fetch(`/api/dashboard/no-conformidades?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar equipos');
            const data = await response.json();
            setEquipos(data.equipos || []);
        } catch (error) {
            console.error('Error al cargar equipos:', error);
            setEquipos([]);
        } finally {
            setLoadingEquipos(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedNC(null);
        setEquipos([]);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">Historial de no conformidades</h3>
                        <button
                            onMouseEnter={() => setShowInfo(true)}
                            onMouseLeave={() => setShowInfo(false)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{totalNC}</p>
                        <p className="text-xs text-gray-500">NC abiertas</p>
                    </div>
                </div>
                {showInfo && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                        <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                        <p className="mb-2">Identifica ítems con No Conformidades en estado abierta para el filtro actual.</p>
                        <p className="font-semibold mb-1">Origen de los datos:</p>
                        <p>Se consulta la tabla <span className="font-mono bg-gray-800 px-1 rounded">NoConformidad</span> filtrando por <span className="font-mono bg-gray-800 px-1 rounded">estado = ABIERTA</span>.</p>
                    </div>
                )}
                {topNC.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-green-600 font-semibold text-sm">✅ Sin No Conformidades abiertas</p>
                        <p className="text-xs text-gray-500 mt-1">No hay pendientes de cierre para este filtro</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/70">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                                    {[
                                        { label: 'Todos', value: 'todos' as const },
                                        { label: 'Semirremolque', value: 'equipo' as const },
                                        { label: 'Tractocamión', value: 'tracto' as const },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setTipoVista(option.value);
                                                setExpanded(false);
                                            }}
                                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${tipoVista === option.value
                                                ? 'bg-red-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {sortedNC.length === 0 ? (
                            <div className="text-center py-6 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                                <p className="text-sm text-gray-600">No hay no conformidades para este filtro.</p>
                            </div>
                        ) : (
                            visibleNC.map((nc, index) => (
                                <button
                                    key={`${nc.categoria}-${nc.item}-${nc.tipo}-${index}`}
                                    onClick={() => handleNCClick(nc)}
                                    className={`w-full border-l-4 p-3 rounded-r transition-colors cursor-pointer text-left ${nc.tipo === 'equipo'
                                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                                        : 'border-purple-500 bg-purple-50 hover:bg-purple-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-700 uppercase">{nc.categoria}</p>
                                            <p className="text-sm text-gray-900 font-medium truncate">{nc.item}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${nc.tipo === 'equipo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {nc.tipo === 'equipo' ? 'Semirremolque' : 'Tractocamión'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="px-2 py-1 rounded bg-white text-gray-700 text-xs border border-gray-200">
                                            Servicios: {nc.serviciosAfectados}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-white text-gray-700 text-xs border border-gray-200">
                                            NO: {nc.frecuencia}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-white text-gray-700 text-xs border border-gray-200">
                                            Equipos con más fallas: {nc.equiposReincidentes}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Última detección: {formatDate(nc.ultimaDeteccion)}. Clic para ver equipos afectados.
                                    </p>
                                </button>
                            ))
                        )}

                        {sortedNC.length > 5 && (
                            <div className="pt-2">
                                <button
                                    onClick={() => setExpanded(v => !v)}
                                    className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    {expanded
                                        ? 'Ver menos'
                                        : `Ver más (${sortedNC.length - 5} adicionales)`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {porServicio.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">No conformidades por servicio y tipo</h4>
                            <p className="text-xs text-gray-500">Base: NC abiertas</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-lg border border-blue-200 bg-blue-50/30">
                                <div className="px-3 py-2 border-b border-blue-200 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Semirremolque</p>
                                    <span className="text-xs text-blue-700">{serviciosSemirremolque.length} servicios</span>
                                </div>
                                <div className="p-2 space-y-2">
                                    {serviciosSemirremolque.length === 0 ? (
                                        <p className="text-xs text-blue-700/80 px-1 py-2">Sin no conformidades de semirremolque.</p>
                                    ) : (
                                        serviciosSemirremolque.map((servicio) => (
                                            <a
                                                key={`equipo-${servicio.servicioId}`}
                                                href={`/dashboard/operaciones/${servicio.servicioId}`}
                                                className="block rounded-lg border border-blue-200 bg-white p-3 hover:bg-blue-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">Servicio {servicio.servicioCodigo}</p>
                                                        <p className="text-xs text-gray-500">Total del servicio: {servicio.totalNC} NC</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                                        {servicio.ncEquipo} NC
                                                    </span>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-purple-200 bg-purple-50/30">
                                <div className="px-3 py-2 border-b border-purple-200 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-purple-700 uppercase">Tractocamión</p>
                                    <span className="text-xs text-purple-700">{serviciosTractocamion.length} servicios</span>
                                </div>
                                <div className="p-2 space-y-2">
                                    {serviciosTractocamion.length === 0 ? (
                                        <p className="text-xs text-purple-700/80 px-1 py-2">Sin no conformidades de tractocamión.</p>
                                    ) : (
                                        serviciosTractocamion.map((servicio) => (
                                            <a
                                                key={`tracto-${servicio.servicioId}`}
                                                href={`/dashboard/operaciones/${servicio.servicioId}`}
                                                className="block rounded-lg border border-purple-200 bg-white p-3 hover:bg-purple-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">Servicio {servicio.servicioCodigo}</p>
                                                        <p className="text-xs text-gray-500">Total del servicio: {servicio.totalNC} NC</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                                        {servicio.ncTracto} NC
                                                    </span>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {topNC.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                            💡 Priorizar mantenimiento preventivo en estos ítems
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900">Equipos con No Conformidad</h2>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedNC?.tipo === 'equipo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {selectedNC?.tipo === 'equipo' ? 'Semirremolque' : 'Tractocamión'}
                                        </span>
                                    </div>
                                    {selectedNC && (
                                        <>
                                            <p className="text-sm font-semibold text-gray-700 uppercase">{selectedNC.categoria}</p>
                                            <p className="text-base text-gray-900">{selectedNC.item}</p>
                                            <p className="text-sm text-red-600 font-semibold mt-2">
                                                {equipos.length} {equipos.length === 1 ? 'equipo afectado' : 'equipos afectados'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingEquipos ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="text-gray-600 mt-4">Cargando equipos...</p>
                                </div>
                            ) : equipos.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No se encontraron equipos con esta no conformidad</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {equipos.map((equipo, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg font-bold text-gray-900">{equipo.patente}</span>
                                                        {equipo.servicioCodigo && (
                                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                Servicio {equipo.servicioCodigo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-semibold">Conductor:</span> {equipo.conductor}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-semibold">Fecha:</span> {new Date(equipo.fecha).toLocaleDateString('es-CL')}
                                                    </p>
                                                    {equipo.observacion && (
                                                        <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                                                            <p className="text-xs font-semibold text-yellow-800">Observación:</p>
                                                            <p className="text-xs text-yellow-700">{equipo.observacion}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <a
                                                    href={`/dashboard/operaciones/${equipo.servicioId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-4 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                >
                                                    Ver Detalle
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={closeModal}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
