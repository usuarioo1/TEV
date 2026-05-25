'use client';

import { useEffect, useState, useCallback } from 'react';

interface UsuarioActividades {
    id: number;
    name: string;
    rol: string;
    total: number;
    breakdown: {
        caminatas: number;
        cierre: number;
        controlART: number;
        tarjetaStop: number;
        reportePeligro: number;
    };
}

interface Data {
    usuarios: UsuarioActividades[];
}

const ACTIVITY_TYPES = [
    { key: 'caminatas', label: 'Caminatas', color: '#0891B2', getVal: (u: UsuarioActividades) => u.breakdown.caminatas },
    { key: 'cierre', label: 'Pend. Cierre', color: '#F59E0B', getVal: (u: UsuarioActividades) => u.breakdown.cierre },
    { key: 'controlART', label: 'Control ART', color: '#10B981', getVal: (u: UsuarioActividades) => u.breakdown.controlART },
    { key: 'tarjetaStop', label: 'Tarjeta Stop', color: '#EF4444', getVal: (u: UsuarioActividades) => u.breakdown.tarjetaStop },
    { key: 'reportePeligro', label: 'Reporte Peligro', color: '#F97316', getVal: (u: UsuarioActividades) => u.breakdown.reportePeligro },
];

const ROL_LABELS: Record<string, string> = {
    jefaturas: 'Jefatura',
    supervisor: 'Supervisor',
};

// SVG pie chart helpers
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x.toFixed(4)} ${start.y.toFixed(4)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(4)} ${end.y.toFixed(4)} Z`;
}

function buildSlices(data: { value: number; color: string; label: string }[]) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    let cumAngle = -Math.PI / 2;
    return data.map(d => {
        const angle = (d.value / total) * 2 * Math.PI;
        const startAngle = cumAngle;
        const endAngle = cumAngle + angle;
        cumAngle = endAngle;
        return { ...d, startAngle, endAngle, pct: Math.round((d.value / total) * 100) };
    });
}

export default function ActividadesPorUsuarioChart() {
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [hover, setHover] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<UsuarioActividades | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/actividades-por-usuario')
            .then(r => r.json())
            .then(d => setData(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleUserClick = useCallback((usuario: UsuarioActividades) => {
        setSelectedUser(usuario);
    }, []);

    const closeModal = useCallback(() => setSelectedUser(null), []);

    const closeTypeModal = useCallback(() => setSelectedType(null), []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
            </div>
        );
    }

    if (!data) return null;

    const totalGeneral = data.usuarios.reduce((s, u) => s + u.total, 0);

    const cx = 110;
    const cy = 110;
    const r = 90;
    const rHover = 95;

    const slicesInput = ACTIVITY_TYPES.map(type => ({
        value: data.usuarios.reduce((s, u) => s + (type.getVal(u) ?? 0), 0),
        color: type.color,
        label: type.label,
    }));
    const slices = buildSlices(slicesInput);

    const selectedTypeInfo = ACTIVITY_TYPES.find(t => t.key === selectedType) ?? null;
    const typeModalUsers = selectedTypeInfo
        ? data.usuarios
            .filter(u => selectedTypeInfo.getVal(u) > 0)
            .sort((a, b) => selectedTypeInfo.getVal(b) - selectedTypeInfo.getVal(a))
        : [];

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">
                Actividades Pendientes por Usuario
            </h3>
            <p className="text-xs text-gray-400 mb-5">
                Supervisores y Jefaturas · Total: {totalGeneral} · <span className="text-blue-500">Haz clic en un segmento o en un usuario para ver el detalle</span>
            </p>

            {totalGeneral === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">Sin actividades pendientes</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Gráfico de torta SVG */}
                    <div className="shrink-0 mx-auto lg:mx-0">
                        <svg width={220} height={220} viewBox="0 0 220 220">
                            {slices.length === 1 ? (
                                // Círculo completo cuando hay un solo usuario
                                <circle
                                    cx={cx} cy={cy} r={hover === 0 ? rHover : r}
                                    fill={slices[0].color}
                                    onMouseEnter={() => setHover(0)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => setSelectedType(ACTIVITY_TYPES[0].key)}
                                    style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                                />
                            ) : (
                                slices.map((slice, i) => (
                                    <path
                                        key={i}
                                        d={arcPath(cx, cy, hover === i ? rHover : r, slice.startAngle, slice.endAngle)}
                                        fill={slice.color}
                                        stroke="white"
                                        strokeWidth={2}
                                        onMouseEnter={() => setHover(i)}
                                        onMouseLeave={() => setHover(null)}
                                        onClick={() => setSelectedType(ACTIVITY_TYPES[i].key)}
                                        style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                                    />
                                ))
                            )}
                            {/* Centro */}
                            <circle cx={cx} cy={cy} r={48} fill="white" />
                            {hover !== null && slices[hover] ? (
                                <>
                                    <text x={cx} y={cy - 8} textAnchor="middle" className="text-xs" fontSize={22} fontWeight="bold" fill="#111827">
                                        {slices[hover].pct}%
                                    </text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#6B7280">
                                        {slices[hover].value} act.
                                    </text>
                                </>
                            ) : (
                                <>
                                    <text x={cx} y={cy - 8} textAnchor="middle" fontSize={26} fontWeight="bold" fill="#111827">
                                        {totalGeneral}
                                    </text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#6B7280">
                                        pendientes
                                    </text>
                                </>
                            )}
                        </svg>
                        {/* Leyenda de tipos */}
                        <div className="mt-4 space-y-1.5">
                            {ACTIVITY_TYPES.map((type, i) => (
                                <button
                                    key={type.key}
                                    onClick={() => setSelectedType(type.key)}
                                    className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                                    <span className="truncate">{type.label}</span>
                                    <span className="ml-auto font-semibold text-gray-800">{slicesInput[i].value}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabla de usuarios */}
                    <div className="flex-1 w-full overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                    <th className="pb-2 text-left font-medium">Usuario</th>
                                    <th className="pb-2 text-center font-medium">Rol</th>
                                    <th className="pb-2 text-center font-medium">Caminatas</th>
                                    <th className="pb-2 text-center font-medium">Cierre</th>
                                    <th className="pb-2 text-center font-medium">ART</th>
                                    <th className="pb-2 text-center font-medium">Stop</th>
                                    <th className="pb-2 text-center font-medium">Peligro</th>
                                    <th className="pb-2 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.usuarios.map((u) => {
                                    return (
                                        <tr
                                            key={u.id}
                                            className="border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleUserClick(u)}
                                        >
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full shrink-0 ${u.total > 0 ? 'bg-blue-400' : 'bg-gray-200'}`} />
                                                    <span className="font-medium text-gray-900 truncate max-w-35">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-center">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.rol === 'jefaturas' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {ROL_LABELS[u.rol] ?? u.rol}
                                                </span>
                                            </td>
                                            <td className="py-2 text-center text-gray-600">{u.breakdown.caminatas || '—'}</td>
                                            <td className="py-2 text-center text-gray-600">{u.breakdown.cierre || '—'}</td>
                                            <td className="py-2 text-center text-gray-600">{u.breakdown.controlART || '—'}</td>
                                            <td className="py-2 text-center text-gray-600">{u.breakdown.tarjetaStop || '—'}</td>
                                            <td className="py-2 text-center text-gray-600">{u.breakdown.reportePeligro || '—'}</td>
                                            <td className="py-2 text-right">
                                                <span className={`font-bold text-base ${u.total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                                    {u.total}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de tipo de actividad */}
            {selectedType && selectedTypeInfo && !selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={closeTypeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: selectedTypeInfo.color }} />
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{selectedTypeInfo.label}</h2>
                                    <p className="text-xs text-gray-500">
                                        {typeModalUsers.reduce((s, u) => s + selectedTypeInfo.getVal(u), 0)} pendientes &middot; {typeModalUsers.length} usuario{typeModalUsers.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeTypeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {typeModalUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">Sin actividades pendientes de este tipo</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {typeModalUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => { closeTypeModal(); handleUserClick(u); }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 truncate">{u.name}</p>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${u.rol === 'jefaturas' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {ROL_LABELS[u.rol] ?? u.rol}
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold shrink-0" style={{ color: selectedTypeInfo.color }}>
                                                {selectedTypeInfo.getVal(u)}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de detalle por usuario */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selectedUser.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedUser.rol === 'jefaturas' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {ROL_LABELS[selectedUser.rol] ?? selectedUser.rol}
                                    </span>
                                    <span className="text-xs text-gray-500">{selectedUser.total} actividades pendientes</span>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body — resumen de desglose */}
                        <div className="p-5">
                            {selectedUser.total === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">Sin actividades pendientes</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ACTIVITY_TYPES.map(type => {
                                        const count = type.getVal(selectedUser) ?? 0;
                                        if (count === 0) return null;
                                        return (
                                            <div key={type.key} className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                                                    <span className="text-sm text-gray-700">{type.label}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900" style={{ color: type.color }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 mt-1">
                                        <span className="text-sm font-semibold text-gray-700">Total</span>
                                        <span className="text-sm font-bold text-gray-900">{selectedUser.total}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
