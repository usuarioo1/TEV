import Link from 'next/link';
import { CaminataPendiente, TareaAsignada, AlertaResumen, ARTResumen, TIPO_TAREA_LABELS } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getChileTodayKey(now: Date = new Date()): string {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function getStoredDateKey(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateKeyToUtcDate(dateKey: string): Date {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function addDaysToDateKey(dateKey: string, days: number): string {
    const base = dateKeyToUtcDate(dateKey);
    base.setUTCDate(base.getUTCDate() + days);
    const year = base.getUTCFullYear();
    const month = String(base.getUTCMonth() + 1).padStart(2, '0');
    const day = String(base.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function diffDaysBetweenKeys(fromDateKey: string, toDateKey: string): number {
    const from = dateKeyToUtcDate(fromDateKey).getTime();
    const to = dateKeyToUtcDate(toDateKey).getTime();
    return Math.round((to - from) / MS_PER_DAY);
}

// Atrasado solo si la fecha límite ya pasó (antes de hoy).
// El día exacto NO se considera atrasado, solo el día siguiente en adelante.
const isOverdue = (fechaLimite: string | null | undefined): boolean => {
    const limiteKey = getStoredDateKey(fechaLimite);
    if (!limiteKey) return false;
    return limiteKey < getChileTodayKey();
};

// Visible si no tiene fecha inicio O si faltan 3 días o menos para el inicio
const isVisible = (fechaProgramada: string | null | undefined): boolean => {
    const inicioKey = getStoredDateKey(fechaProgramada);
    if (!inicioKey) return true;
    const limitKey = addDaysToDateKey(getChileTodayKey(), 3);
    return inicioKey <= limitKey;
};

// Se puede iniciar si no tiene fecha inicio O si la fecha ya llegó
const canStart = (fechaProgramada: string | null | undefined): boolean => {
    const inicioKey = getStoredDateKey(fechaProgramada);
    if (!inicioKey) return true;
    return inicioKey <= getChileTodayKey();
};

const daysUntil = (fechaProgramada: string): number => {
    const inicioKey = getStoredDateKey(fechaProgramada);
    if (!inicioKey) return 0;
    return Math.max(0, diffDaysBetweenKeys(getChileTodayKey(), inicioKey));
};

interface ActividadesPendientesProps {
    caminatasPendientes: CaminataPendiente[];
    tareasAsignadas: TareaAsignada[];
    reportesCierre: AlertaResumen[];
    reportesVerificacion: AlertaResumen[];
    controlesART: ARTResumen[];
    serviciosPendientesAprobacion?: number;
    noConformidadesPendientes?: number;
    hallazgosPendientes?: number;
    loading: boolean;
    expandedTareas: boolean;
    onToggleTareas: () => void;
    expandedCaminatas: boolean;
    onToggleCaminatas: () => void;
    expandedCierre: boolean;
    onToggleCierre: () => void;
    expandedVerificacion: boolean;
    onToggleVerificacion: () => void;
    expandedARTs: boolean;
    onToggleARTs: () => void;
    singleCardMode?: boolean;
}

export default function ActividadesPendientes({
    caminatasPendientes,
    tareasAsignadas,
    reportesCierre,
    reportesVerificacion,
    controlesART,
    serviciosPendientesAprobacion = 0,
    noConformidadesPendientes = 0,
    hallazgosPendientes = 0,
    loading,
    expandedTareas,
    onToggleTareas,
    expandedCaminatas,
    onToggleCaminatas,
    expandedCierre,
    onToggleCierre,
    expandedVerificacion,
    onToggleVerificacion,
    expandedARTs,
    onToggleARTs,
    singleCardMode = false,
}: ActividadesPendientesProps) {
    const tareasVisibles = tareasAsignadas.filter(t => isVisible(t.fechaProgramada));
    const caminatasVisibles = caminatasPendientes.filter(c => isVisible(c.fechaProgramada));
    const pendientesCierreTotal = reportesCierre.length + noConformidadesPendientes + hallazgosPendientes;

    const totalPendiente =
        tareasVisibles.length +
        caminatasVisibles.length +
        pendientesCierreTotal +
        reportesVerificacion.length +
        controlesART.length +
        serviciosPendientesAprobacion;

    return (
        <div className="mb-8">
            {/* Header con badge */}
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900"> Actividades Pendientes</h2>
                {totalPendiente > 0 && (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold shadow">
                        {totalPendiente}
                    </span>
                )}

            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
            ) : totalPendiente === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-3 text-green-700">
                    <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">¡Sin actividades pendientes! Todo al día.</p>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ======= GRUPO: Caminatas Pendientes (un solo elemento) ======= */}
                    {(tareasVisibles.length > 0 || caminatasVisibles.length > 0 || controlesART.length > 0 || serviciosPendientesAprobacion > 0 || (singleCardMode && (pendientesCierreTotal > 0 || reportesVerificacion.length > 0))) && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-cyan-100">


                            <div className="divide-y divide-gray-100">
                                {serviciosPendientesAprobacion > 0 && (
                                    <div className="px-4 py-3">
                                        <div className="flex items-center px-3 py-2.5 gap-3 rounded-lg border border-blue-100 bg-blue-50/70">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                                        SUPERVISOR
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    Servicios pendientes de aprobacion ({serviciosPendientesAprobacion})
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Servicios listos para revision del supervisor.
                                                </p>
                                            </div>
                                            <Link
                                                href="/supervisor"
                                                className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                            >
                                                Revisar
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {tareasVisibles.length > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleTareas}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-purple-800">
                                                Actividades asignadas a completar ({tareasVisibles.length})
                                            </span>
                                            <svg className={`ml-auto w-4 h-4 text-purple-400 shrink-0 transition-transform ${expandedTareas ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedTareas && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-purple-100 overflow-hidden">
                                                {tareasVisibles.map(tarea => {
                                                    const atrasada = isOverdue(tarea.fechaLimite);
                                                    const iniciable = canStart(tarea.fechaProgramada);
                                                    const diasRestantes = !iniciable && tarea.fechaProgramada ? daysUntil(tarea.fechaProgramada) : 0;
                                                    return (
                                                        <div key={tarea.id} className={`flex items-center px-3 py-2.5 gap-3 transition-colors ${atrasada ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' : !iniciable ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-300' : 'hover:bg-purple-50'}`}>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{TIPO_TAREA_LABELS[tarea.tipo] || tarea.tipo}</p>
                                                                    {atrasada && <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">ATRASADO</span>}
                                                                    {!iniciable && <span className="shrink-0 text-[10px] font-bold text-white bg-blue-400 px-1.5 py-0.5 rounded">EN {diasRestantes} DÍAS</span>}
                                                                </div>
                                                                <p className="text-xs text-gray-500 truncate">Asignado por {tarea.creadoPor.name || tarea.creadoPor.username} · {new Date(tarea.createdAt).toLocaleDateString('es-CL')}</p>
                                                                {tarea.fechaProgramada && (
                                                                    <p className="text-xs text-purple-600 truncate">Inicio programado: {new Date(tarea.fechaProgramada).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p>
                                                                )}
                                                                {tarea.fechaLimite && (
                                                                    <p className={`text-xs truncate font-medium ${atrasada ? 'text-red-600' : 'text-rose-600'}`}>Límite: {new Date(tarea.fechaLimite).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p>
                                                                )}
                                                                {tarea.descripcion && <p className="text-xs text-gray-400 truncate">{tarea.descripcion}</p>}
                                                            </div>
                                                            {iniciable ? (
                                                                <Link
                                                                    href={`/caminatas/completar/${tarea.id}`}
                                                                    className="shrink-0 bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                                                                >
                                                                    Completar
                                                                </Link>
                                                            ) : (
                                                                <span className="shrink-0 bg-gray-200 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap cursor-not-allowed">
                                                                    Completar
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}

                                {caminatasVisibles.length > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleCaminatas}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-cyan-800">Caminatas pendientes ({caminatasVisibles.length})</span>
                                            <svg className={`ml-auto w-4 h-4 text-cyan-400 shrink-0 transition-transform ${expandedCaminatas ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedCaminatas && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-cyan-100 overflow-hidden">
                                                {caminatasVisibles.map(cam => {
                                                    const atrasada = isOverdue(cam.fechaLimite);
                                                    const iniciable = canStart(cam.fechaProgramada);
                                                    const diasRestantes = !iniciable && cam.fechaProgramada ? daysUntil(cam.fechaProgramada) : 0;
                                                    return (
                                                        <div key={cam.id} className={`flex items-center px-3 py-2.5 gap-3 transition-colors ${atrasada ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' : !iniciable ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-300' : 'hover:bg-cyan-50'}`}>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{cam.codigo}</p>
                                                                    {atrasada && <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">ATRASADO</span>}
                                                                    {!iniciable && <span className="shrink-0 text-[10px] font-bold text-white bg-blue-400 px-1.5 py-0.5 rounded">EN {diasRestantes} DÍAS</span>}
                                                                </div>
                                                                <p className="text-xs text-gray-500 truncate">{cam.zona} · Asignada por {cam.coordinador?.name || cam.coordinador?.username}</p>
                                                                {cam.fechaProgramada && (
                                                                    <p className="text-xs text-cyan-600 truncate">Inicio programado: {new Date(cam.fechaProgramada).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p>
                                                                )}
                                                                {cam.fechaLimite && (
                                                                    <p className={`text-xs truncate font-medium ${atrasada ? 'text-red-600' : 'text-rose-600'}`}>Límite: {new Date(cam.fechaLimite).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p>
                                                                )}
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-2">
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${atrasada ? 'bg-red-100 text-red-700' : !iniciable ? 'bg-blue-100 text-blue-700' : cam.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {atrasada ? 'Atrasada' : !iniciable ? 'Próxima' : cam.estado === 'EN_PROCESO' ? 'En proceso' : 'Pendiente'}
                                                                </span>
                                                                {iniciable ? (
                                                                    <Link
                                                                        href={`/caminatas/${cam.id}`}
                                                                        className="bg-cyan-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap"
                                                                    >
                                                                        Ir
                                                                    </Link>
                                                                ) : (
                                                                    <span className="bg-gray-200 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap cursor-not-allowed">
                                                                        Ir
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}

                                {controlesART.length > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleARTs}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-green-800">Control de Calidad ART ({controlesART.length})</span>
                                            <svg className={`ml-auto w-4 h-4 text-green-400 shrink-0 transition-transform ${expandedARTs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedARTs && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-green-100 overflow-hidden">
                                                {controlesART.map(art => (
                                                    <div key={art.id} className="flex items-center px-3 py-2.5 gap-3 hover:bg-green-50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">ART #{art.id}{art.caminata ? ` · ${art.caminata.codigo}` : ''}</p>
                                                            <p className="text-xs text-gray-500 truncate">{art.caminata?.zona ?? 'N/A'} · Por: {art.creadoPor.name || art.creadoPor.username} · {new Date(art.createdAt).toLocaleDateString('es-CL')}</p>
                                                        </div>
                                                        {art.caminata && (
                                                            <Link
                                                                href={`/caminatas/${art.caminata.id}`}
                                                                className="shrink-0 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                                            >
                                                                Ver
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {singleCardMode && pendientesCierreTotal > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleCierre}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-orange-800">Pendientes de cierre ({pendientesCierreTotal})</span>
                                            <svg className={`ml-auto w-4 h-4 text-orange-400 shrink-0 transition-transform ${expandedCierre ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedCierre && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-orange-100 overflow-hidden">
                                                {hallazgosPendientes > 0 && (
                                                    <div className="flex items-center px-3 py-2.5 gap-3 bg-blue-50/70 hover:bg-blue-100 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">HALLAZGO</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">Hallazgos pendientes</p>
                                                            <p className="text-xs text-gray-500 truncate">{hallazgosPendientes} hallazgos abiertos por gestionar</p>
                                                        </div>
                                                        <Link
                                                            href="/hallazgoschecklist"
                                                            className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Gestionar
                                                        </Link>
                                                    </div>
                                                )}
                                                {noConformidadesPendientes > 0 && (
                                                    <div className="flex items-center px-3 py-2.5 gap-3 bg-red-50/70 hover:bg-red-100 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">NC</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">No conformidades pendientes</p>
                                                            <p className="text-xs text-gray-500 truncate">{noConformidadesPendientes} NC abiertas por gestionar</p>
                                                        </div>
                                                        <Link
                                                            href="/no-conformidades"
                                                            className="shrink-0 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Gestionar
                                                        </Link>
                                                    </div>
                                                )}
                                                {reportesCierre.slice(0, 5).map(alerta => (
                                                    <div key={`${alerta.tipo}-${alerta.id}`} className="flex items-center px-3 py-2.5 gap-3 hover:bg-orange-50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${alerta.tipo === 'reporte' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {alerta.tipo === 'reporte' ? 'REPORTE' : 'STOP'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">{alerta.titulo}</p>
                                                            <p className="text-xs text-gray-500 truncate">Zona: {alerta.zona} · Por: {alerta.creadoPor.name || alerta.creadoPor.username}</p>
                                                        </div>
                                                        <Link
                                                            href={`/caminatas/pendientes?cerrar=${alerta.id}&tipo=${alerta.tipo}`}
                                                            className="shrink-0 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                                                        >
                                                            Cerrar
                                                        </Link>
                                                    </div>
                                                ))}
                                                {reportesCierre.length > 5 && (
                                                    <div className="px-3 py-2 text-center">
                                                        <Link href="/caminatas/pendientes" className="text-xs text-orange-600 hover:underline">+{reportesCierre.length - 5} más →</Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {singleCardMode && reportesVerificacion.length > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleVerificacion}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-blue-800">Pendientes de verificación ({reportesVerificacion.length})</span>
                                            <svg className={`ml-auto w-4 h-4 text-blue-400 shrink-0 transition-transform ${expandedVerificacion ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedVerificacion && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-blue-100 overflow-hidden">
                                                {reportesVerificacion.slice(0, 5).map(alerta => (
                                                    <div key={alerta.id} className="flex items-center px-3 py-2.5 gap-3 hover:bg-blue-50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{alerta.titulo}</p>
                                                            <p className="text-xs text-gray-500 truncate">Zona: {alerta.zona} · Por: {alerta.creadoPor.name || alerta.creadoPor.username}</p>
                                                        </div>
                                                        <Link
                                                            href={`/caminatas/pendientes?verificar=${alerta.id}`}
                                                            className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Verificar
                                                        </Link>
                                                    </div>
                                                ))}
                                                {reportesVerificacion.length > 5 && (
                                                    <div className="px-3 py-2 text-center">
                                                        <Link href="/caminatas/pendientes" className="text-xs text-blue-600 hover:underline">+{reportesVerificacion.length - 5} más →</Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ======= GRUPO: Reportes Pendientes (un solo elemento) ======= */}
                    {!singleCardMode && (pendientesCierreTotal > 0 || reportesVerificacion.length > 0) && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-orange-100">
                            <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex items-center gap-2">
                                <div className="h-5 w-1 bg-orange-500 rounded-full"></div>
                                <h3 className="text-sm font-semibold text-orange-800 uppercase tracking-wider">Reportes Pendientes</h3>
                                <span className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {pendientesCierreTotal + reportesVerificacion.length}
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {pendientesCierreTotal > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleCierre}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-orange-800">Pendientes de cierre ({pendientesCierreTotal})</span>
                                            <svg className={`ml-auto w-4 h-4 text-orange-400 shrink-0 transition-transform ${expandedCierre ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedCierre && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-orange-100 overflow-hidden">
                                                {hallazgosPendientes > 0 && (
                                                    <div className="flex items-center px-3 py-2.5 gap-3 bg-blue-50/70 hover:bg-blue-100 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">HALLAZGO</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">Hallazgos pendientes</p>
                                                            <p className="text-xs text-gray-500 truncate">{hallazgosPendientes} hallazgos abiertos por gestionar</p>
                                                        </div>
                                                        <Link
                                                            href="/hallazgoschecklist"
                                                            className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Gestionar
                                                        </Link>
                                                    </div>
                                                )}
                                                {noConformidadesPendientes > 0 && (
                                                    <div className="flex items-center px-3 py-2.5 gap-3 bg-red-50/70 hover:bg-red-100 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">NC</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">No conformidades pendientes</p>
                                                            <p className="text-xs text-gray-500 truncate">{noConformidadesPendientes} NC abiertas por gestionar</p>
                                                        </div>
                                                        <Link
                                                            href="/no-conformidades"
                                                            className="shrink-0 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Gestionar
                                                        </Link>
                                                    </div>
                                                )}
                                                {reportesCierre.slice(0, 5).map(alerta => (
                                                    <div key={`${alerta.tipo}-${alerta.id}`} className="flex items-center px-3 py-2.5 gap-3 hover:bg-orange-50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${alerta.tipo === 'reporte' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {alerta.tipo === 'reporte' ? 'REPORTE' : 'STOP'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 truncate">{alerta.titulo}</p>
                                                            <p className="text-xs text-gray-500 truncate">Zona: {alerta.zona} · Por: {alerta.creadoPor.name || alerta.creadoPor.username}</p>
                                                        </div>
                                                        <Link
                                                            href={`/caminatas/pendientes?cerrar=${alerta.id}&tipo=${alerta.tipo}`}
                                                            className="shrink-0 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                                                        >
                                                            Cerrar
                                                        </Link>
                                                    </div>
                                                ))}
                                                {reportesCierre.length > 5 && (
                                                    <div className="px-3 py-2 text-center">
                                                        <Link href="/caminatas/pendientes" className="text-xs text-orange-600 hover:underline">+{reportesCierre.length - 5} más →</Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {reportesVerificacion.length > 0 && (
                                    <div className="px-4 py-3">
                                        <button
                                            onClick={onToggleVerificacion}
                                            className="w-full flex items-center gap-2 text-left"
                                        >
                                            <span className="text-sm font-semibold text-blue-800">Pendientes de verificación ({reportesVerificacion.length})</span>
                                            <svg className={`ml-auto w-4 h-4 text-blue-400 shrink-0 transition-transform ${expandedVerificacion ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {expandedVerificacion && (
                                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-blue-100 overflow-hidden">
                                                {reportesVerificacion.slice(0, 5).map(alerta => (
                                                    <div key={alerta.id} className="flex items-center px-3 py-2.5 gap-3 hover:bg-blue-50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{alerta.titulo}</p>
                                                            <p className="text-xs text-gray-500 truncate">Zona: {alerta.zona} · Por: {alerta.creadoPor.name || alerta.creadoPor.username}</p>
                                                        </div>
                                                        <Link
                                                            href={`/caminatas/pendientes?verificar=${alerta.id}`}
                                                            className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                        >
                                                            Verificar
                                                        </Link>
                                                    </div>
                                                ))}
                                                {reportesVerificacion.length > 5 && (
                                                    <div className="px-3 py-2 text-center">
                                                        <Link href="/caminatas/pendientes" className="text-xs text-blue-600 hover:underline">+{reportesVerificacion.length - 5} más →</Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
