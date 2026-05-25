'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/app/context/SessionContext';
import { useRouter } from 'next/navigation';
import NoConformidadDetailModal from '@/components/no-conformidades/NoConformidadDetailModal';

interface ServicioResumen {
    id: number;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estado: string;
    fechaAsignacion: string;
    operario: { id: number; name: string | null; username: string; rut: string | null } | null;
    coordinador: { id: number; name: string | null; username: string };
    aprobacion: {
        fechaAprobacion: string;
        supervisor: { id: number; name: string | null; username: string };
    } | null;
}

export interface NoConformidad {
    id: number;
    servicioId: number;
    checklistTipo: 'TRACTO_CAMION' | 'SEMIREMOLQUE';
    seccion: string;
    itemNombre: string;
    observacion: string | null;
    imagenes: { url: string; publicId: string }[];
    responsableRol: string;
    estado: 'ABIERTA' | 'CERRADA';
    createdAt: string;
    updatedAt: string;
    servicio: ServicioResumen;
    comentarios: {
        id: number;
        contenido: string;
        createdAt: string;
        autor: { id: number; name: string | null; username: string; rol: true };
    }[];
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
    ABIERTA: { label: 'Abierta', color: 'bg-red-100 text-red-800' },
    CERRADA: { label: 'Cerrada', color: 'bg-green-100 text-green-800' },
};

const SERVICIO_ESTADO_LABELS: Record<string, { label: string; color: string }> = {
    PENDIENTE: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
    ASIGNADO: { label: 'Asignado', color: 'bg-blue-100 text-blue-700' },
    ACEPTADO: { label: 'Aceptado', color: 'bg-sky-100 text-sky-700' },
    EN_CHECKLIST: { label: 'En Checklist', color: 'bg-yellow-100 text-yellow-700' },
    PENDIENTE_APROBACION: { label: 'Pend. Aprobación', color: 'bg-orange-100 text-orange-700' },
    APROBADO: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
    EN_EJECUCION: { label: 'En Ejecución', color: 'bg-teal-100 text-teal-700' },
    COMPLETADO: { label: 'Completado', color: 'bg-green-200 text-green-800' },
    RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
    CANCELADO: { label: 'Cancelado', color: 'bg-gray-200 text-gray-500' },
};

const CHECKLIST_LABELS: Record<string, string> = {
    TRACTO_CAMION: 'Tractocamión',
    SEMIREMOLQUE: 'Semirremolque',
};

const SECCION_LABELS: Record<string, string> = {
    DOCUMENTACION: 'Documentación',
    EPP: 'EPP',
    LUCES_Y_MICAS: 'Luces y Micas',
    CONDICIONES_GENERALES: 'Condiciones Generales',
    MECANICA_Y_MOTOR: 'Mecánica y Motor',
    CONEXIONES: 'Conexiones',
    'NEUMÁTICOS': 'Neumáticos',
    GENERAL: 'General',
    ESTRUCTURA: 'Estructura',
    'FIJACIÓN': 'Fijación',
};

export default function NoConformidadesPage() {
    const { session, loading } = useSession();
    const router = useRouter();

    const [noConformidades, setNoConformidades] = useState<NoConformidad[]>([]);
    const [hallazgosAbiertos, setHallazgosAbiertos] = useState(0);
    const [fetchingHallazgosAbiertos, setFetchingHallazgosAbiertos] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [busqueda, setBusqueda] = useState<string>('');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [vistaMode, setVistaMode] = useState<'items' | 'servicios'>('items');
    const [expandedServicio, setExpandedServicio] = useState<number | null>(null);
    const [selected, setSelected] = useState<NoConformidad | null>(null);

    const fetchNC = useCallback(async () => {
        setFetching(true);
        try {
            const params = new URLSearchParams();
            if (filtroEstado) params.set('estado', filtroEstado);
            if (filtroTipo) params.set('checklistTipo', filtroTipo);
            if (busqueda.trim()) params.set('codigo', busqueda.trim());
            const res = await fetch(`/api/no-conformidades?${params}`);
            if (res.ok) {
                const data = await res.json();
                setNoConformidades(data);
            }
        } finally {
            setFetching(false);
        }
    }, [filtroEstado, filtroTipo, busqueda]);

    const fetchHallazgosAbiertos = useCallback(async () => {
        if (session?.rol !== 'taller') return;

        setFetchingHallazgosAbiertos(true);
        try {
            const res = await fetch('/api/hallazgoschecklist?estado=ABIERTA');
            if (!res.ok) return;

            const data = await res.json();
            if (Array.isArray(data)) {
                setHallazgosAbiertos(data.length);
            }
        } finally {
            setFetchingHallazgosAbiertos(false);
        }
    }, [session?.rol]);

    useEffect(() => {
        if (loading) return;
        if (!session) { router.push('/login'); return; }
        const allowed = ['taller', 'coordinador', 'prevencionista', 'jefaturas'];
        if (!allowed.includes(session.rol)) { router.push('/unauthorized'); return; }
        fetchNC();
    }, [session, loading, router, fetchNC]);

    useEffect(() => {
        if (loading || !session) return;
        if (session.rol !== 'taller') {
            setHallazgosAbiertos(0);
            return;
        }
        fetchHallazgosAbiertos();
    }, [session, loading, fetchHallazgosAbiertos]);

    // Filtro local por fecha en hora chilena
    const ncFiltradas = useMemo(() => {
        return noConformidades.filter(nc => {
            if (fechaDesde || fechaHasta) {
                const ncDate = new Date(nc.servicio.fechaAsignacion).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
                if (fechaDesde && ncDate < fechaDesde) return false;
                if (fechaHasta && ncDate > fechaHasta) return false;
            }
            return true;
        });
    }, [noConformidades, fechaDesde, fechaHasta]);

    // Agrupado por servicio
    const ncPorServicio = useMemo(() => {
        const map = new Map<number, { servicio: ServicioResumen; ncs: NoConformidad[] }>();
        for (const nc of ncFiltradas) {
            if (!map.has(nc.servicioId)) {
                map.set(nc.servicioId, { servicio: nc.servicio, ncs: [] });
            }
            map.get(nc.servicioId)!.ncs.push(nc);
        }
        return Array.from(map.values()).sort((a, b) => b.ncs.length - a.ncs.length);
    }, [ncFiltradas]);

    const counts = {
        ABIERTA: ncFiltradas.filter(nc => nc.estado === 'ABIERTA').length,
        CERRADA: ncFiltradas.filter(nc => nc.estado === 'CERRADA').length,
    };

    if (loading || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">No Conformidades</h1>
                        <p className="text-gray-500 mt-1">
                            Ítems con respuesta &quot;No&quot; detectados en checklists de equipos
                        </p>
                    </div>

                    {session?.rol === 'taller' && (
                        <button
                            type="button"
                            onClick={() => router.push('/hallazgoschecklist')}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            <span>Ir a Hallazgos</span>
                            <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                                {fetchingHallazgosAbiertos
                                    ? '...'
                                    : hallazgosAbiertos > 99
                                        ? '99+'
                                        : hallazgosAbiertos}
                            </span>
                        </button>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {(['ABIERTA', 'CERRADA'] as const).map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
                            className={`rounded-xl p-4 text-left border-2 transition-all ${filtroEstado === estado
                                ? 'border-blue-500 shadow-md'
                                : 'border-transparent shadow-sm bg-white'
                                }`}
                        >
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${ESTADO_LABELS[estado].color}`}>
                                {ESTADO_LABELS[estado].label}
                            </span>
                            <p className="text-3xl font-bold text-gray-900">{counts[estado]}</p>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
                    {/* Búsqueda por código */}
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por código de servicio..."
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 w-56"
                    />

                    {/* Filtro tipo checklist */}
                    <select
                        value={filtroTipo}
                        onChange={e => setFiltroTipo(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                        <option value="">Todos los equipos</option>
                        <option value="TRACTO_CAMION">Tractocamión</option>
                        <option value="SEMIREMOLQUE">Semirremolque</option>
                    </select>

                    {/* Filtro fecha desde */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 whitespace-nowrap">Desde</span>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {/* Filtro fecha hasta */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 whitespace-nowrap">Hasta</span>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {/* Limpiar filtros */}
                    {(filtroEstado || filtroTipo || busqueda || fechaDesde || fechaHasta) && (
                        <button
                            onClick={() => { setFiltroEstado(''); setFiltroTipo(''); setBusqueda(''); setFechaDesde(''); setFechaHasta(''); }}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    )}

                    <span className="ml-auto text-xs text-gray-400">
                        {ncFiltradas.length} resultado{ncFiltradas.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Toggle vista */}
                <div className="flex gap-1 mb-4 bg-white rounded-xl shadow-sm p-2 w-fit">
                    <button
                        onClick={() => setVistaMode('items')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${vistaMode === 'items'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Por ítem
                    </button>
                    <button
                        onClick={() => setVistaMode('servicios')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${vistaMode === 'servicios'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Por servicio
                    </button>
                </div>

                {/* Vista por ítem */}
                {vistaMode === 'items' && (
                    ncFiltradas.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500">No hay no conformidades con los filtros seleccionados</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado serv.</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Checklist</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sección / Ítem</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Operario</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Detectada</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">NC Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ncFiltradas.map(nc => (
                                        <tr
                                            key={nc.id}
                                            onClick={() => setSelected(nc)}
                                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{nc.servicio.codigo}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-40">{nc.servicio.descripcion}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(SERVICIO_ESTADO_LABELS[nc.servicio.estado] ?? { color: 'bg-gray-100 text-gray-600' }).color}`}>
                                                    {(SERVICIO_ESTADO_LABELS[nc.servicio.estado] ?? { label: nc.servicio.estado }).label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {CHECKLIST_LABELS[nc.checklistTipo]}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{SECCION_LABELS[nc.seccion] ?? nc.seccion}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-50">{nc.itemNombre}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {nc.servicio.operario?.name ?? nc.servicio.operario?.username ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(nc.servicio.fechaAsignacion).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_LABELS[nc.estado].color}`}>
                                                    {ESTADO_LABELS[nc.estado].label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Vista por servicio */}
                {vistaMode === 'servicios' && (
                    ncPorServicio.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500">No hay no conformidades con los filtros seleccionados</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado serv.</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-red-500 uppercase tracking-wide">Abiertas</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wide">Cerradas</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ncPorServicio.map(({ servicio, ncs }) => {
                                        const isExp = expandedServicio === servicio.id;
                                        const abiertas = ncs.filter(n => n.estado === 'ABIERTA').length;
                                        const cerradas = ncs.filter(n => n.estado === 'CERRADA').length;
                                        return (
                                            <Fragment key={servicio.id}>
                                                <tr
                                                    onClick={() => setExpandedServicio(isExp ? null : servicio.id)}
                                                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900">{servicio.codigo}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-40">{servicio.descripcion}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(SERVICIO_ESTADO_LABELS[servicio.estado] ?? { color: 'bg-gray-100 text-gray-600' }).color}`}>
                                                            {(SERVICIO_ESTADO_LABELS[servicio.estado] ?? { label: servicio.estado }).label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center"><span className="font-bold text-red-600">{abiertas}</span></td>
                                                    <td className="px-4 py-3 text-center"><span className="font-bold text-green-600">{cerradas}</span></td>
                                                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{ncs.length}</td>
                                                    <td className="px-4 py-3 text-gray-400">
                                                        <svg className={`w-4 h-4 transition-transform ${isExp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </td>
                                                </tr>
                                                {isExp && ncs.map(nc => (
                                                    <tr
                                                        key={nc.id}
                                                        onClick={() => setSelected(nc)}
                                                        className="bg-blue-50/40 border-b border-gray-100 hover:bg-blue-100 cursor-pointer transition-colors"
                                                    >
                                                        <td className="px-4 py-2 pl-10 text-xs text-gray-600" colSpan={2}>
                                                            <span className="font-medium">{CHECKLIST_LABELS[nc.checklistTipo]}</span>
                                                            {' · '}
                                                            <span>{SECCION_LABELS[nc.seccion] ?? nc.seccion}</span>
                                                            {' · '}
                                                            <span className="text-gray-500">{nc.itemNombre}</span>
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-gray-500" colSpan={2}>
                                                            {new Date(nc.servicio.fechaAsignacion).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                                                            {' · '}
                                                            {servicio.operario?.name ?? servicio.operario?.username ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-2" colSpan={2}>
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_LABELS[nc.estado].color}`}>
                                                                {ESTADO_LABELS[nc.estado].label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Detail modal */}
            {selected && (
                <NoConformidadDetailModal
                    nc={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={() => { setSelected(null); fetchNC(); }}
                />
            )}
        </div>
    );
}
