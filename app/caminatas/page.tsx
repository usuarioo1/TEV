'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/app/context/SessionContext';

interface Caminata {
    id: number;
    codigo: string;
    zona: string;
    faena: string;
    actividad: string;
    estado: string;
    observaciones: string | null;
    tieneFotografias: boolean;
    tieneDocumentos: boolean;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    fechaCreacion: string;
    fechaCompletacion: string | null;
    coordinador: {
        id: number;
        name: string | null;
        username: string;
    };
    asignado: {
        id: number;
        name: string | null;
        username: string;
        rol: string;
    };
    _count: {
        reportesPeligro: number;
        tarjetasStop: number;
    };
}

// Normaliza fechas programadas/límite como fecha calendario (YYYY-MM-DD)
// para evitar corrimientos por zona horaria al comparar con filtros type="date".
function toScheduledDateKey(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatScheduledDate(dateStr: string | null): string {
    if (!dateStr) return 'No definida';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'No definida';
    return date.toLocaleDateString('es-CL', { timeZone: 'UTC' });
}

export default function CaminatasPage() {
    const router = useRouter();
    const { session } = useSession();
    const userRole = session?.rol ?? '';
    const [caminatas, setCaminatas] = useState<Caminata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        if (session !== undefined && userRole === 'coordinador') {
            router.push('/');
            return;
        }
        fetchCaminatas();
        // Emitir evento para actualizar el contador en el Navbar cuando se visita la página
        window.dispatchEvent(new CustomEvent('caminataEstadoChanged'));
    }, []);

    const fetchCaminatas = async () => {
        try {
            const response = await fetch('/api/caminatas');
            if (!response.ok) throw new Error('Error al cargar caminatas');
            const data = await response.json();
            setCaminatas(data);
        } catch (err) {
            setError('Error al cargar las caminatas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const caminatasFiltradas = caminatas.filter(c => {
        if (!fechaDesde && !fechaHasta) return true;
        if (!c.fechaProgramada) return false;
        const scheduledDate = toScheduledDateKey(c.fechaProgramada);
        if (!scheduledDate) return false;
        if (fechaDesde && scheduledDate < fechaDesde) return false;
        if (fechaHasta && scheduledDate > fechaHasta) return false;
        return true;
    });

    const getEstadoBadge = (estado: string) => {
        const badges = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800',
            EN_PROCESO: 'bg-blue-100 text-blue-800',
            COMPLETADA: 'bg-green-100 text-green-800',
            CANCELADA: 'bg-red-100 text-red-800',
        };
        return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando caminatas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchCaminatas}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Caminatas de Seguridad</h1>
                            <p className="mt-2 text-sm sm:text-base text-gray-600">
                                {userRole === 'prevencionista'
                                    ? 'Caminatas creadas por ti y todas las caminatas completadas'
                                    : 'Tus caminatas asignadas y creadas'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {(userRole === 'supervisor' || userRole === 'jefaturas') && (
                                <>
                                    <Link
                                        href="/caminatas/pendientes"
                                        className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm sm:text-base"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mis Alertas Pendientes
                                    </Link>
                                    <Link
                                        href="/caminatas/alertas"
                                        className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm text-sm sm:text-base"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Todas las Alertas
                                    </Link>
                                </>
                            )}

                           
                        </div>
                    </div>
                </div>

                {/* Filtro por fecha programada */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Inicio programado desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={e => setFechaDesde(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={e => setFechaHasta(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-black"
                            />
                        </div>
                        {(fechaDesde || fechaHasta) && (
                            <button
                                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                                Limpiar filtro
                            </button>
                        )}
                        {(fechaDesde || fechaHasta) && (
                            <span className="text-sm text-gray-500">
                                Mostrando <span className="font-semibold text-gray-800">{caminatasFiltradas.length}</span> de {caminatas.length} caminatas
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{caminatasFiltradas.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {caminatasFiltradas.filter(c => c.estado === 'PENDIENTE').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">En Proceso</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {caminatasFiltradas.filter(c => c.estado === 'EN_PROCESO').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {caminatasFiltradas.filter(c => c.estado === 'COMPLETADA').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Caminatas */}
                {caminatasFiltradas.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay caminatas</h3>
                        <p className="text-gray-600">
                            {userRole === 'coordinador'
                                ? 'Comienza creando tu primera caminata de seguridad'
                                : 'No tienes caminatas asignadas en este momento'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {caminatasFiltradas.map((caminata) => (
                            <Link
                                key={caminata.id}
                                href={`/caminatas/${caminata.id}`}
                                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{caminata.codigo}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{caminata.actividad}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(caminata.estado)}`}>
                                        {caminata.estado.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Zona</p>
                                        <p className="text-sm font-medium text-gray-900">{caminata.zona}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Faena</p>
                                        <p className="text-sm font-medium text-gray-900">{caminata.faena}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Inicio programado</p>
                                        <p className="text-sm font-medium text-gray-900">{formatScheduledDate(caminata.fechaProgramada)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Límite</p>
                                        <p className="text-sm font-medium text-gray-900">{formatScheduledDate(caminata.fechaLimite)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Asignado a</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {caminata.asignado.name || caminata.asignado.username}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Coordinador</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {caminata.coordinador.name || caminata.coordinador.username}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{caminata.tieneFotografias ? 'Con fotos' : 'Sin fotos'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>{caminata.tieneDocumentos ? 'Con docs' : 'Sin docs'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{caminata._count.reportesPeligro} peligros</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        <span>{caminata._count.tarjetasStop} tarjetas stop</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
