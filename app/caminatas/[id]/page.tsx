'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReportePeligroForm from '@/components/caminatas/ReportePeligroForm';
import TarjetaStopForm from '@/components/caminatas/TarjetaStopForm';
import ImageGallery from '@/components/caminatas/ImageGallery';
import AlertTimeline from '@/components/caminatas/AlertTimeline';
import { useSession } from '@/app/context/SessionContext';

interface ReportePeligro {
    id: number;
    estado: string;
    datos: any;
    createdAt: string;
    fechaCierre?: string | null;
    comentarioCierre?: string | null;
    imagenCierre?: string | null;
    fechaVerificacion?: string | null;
    comentarioVerificacion?: string | null;
    imagenVerificacion?: string | null;
    creadoPor: { id: number; name: string | null; username: string; rol: string };
    responsableCierre?: { id: number; name: string | null; username: string } | null;
    responsableVerificacion?: { id: number; name: string | null; username: string } | null;
}

interface TarjetaStop {
    id: number;
    estado: string;
    datos: any;
    createdAt: string;
    fechaCierre?: string | null;
    comentarioCierre?: string | null;
    imagenCierre?: string | null;
    creadoPor: { id: number; name: string | null; username: string; rol: string };
    responsableCierre?: { id: number; name: string | null; username: string } | null;
}

interface ControlCalidadART {
    id: number;
    datos: any;
    createdAt: string;
    creadoPor: { id: number; name: string | null; username: string; rol: string };
}

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
    fechaProgramada?: string | null;
    fechaLimite?: string | null;
    fechaCreacion: string;
    fechaCompletacion: string | null;
    updatedAt: string;
    coordinador: {
        id: number;
        username: string;
        name: string | null;
        rol: string;
    };
    asignado: {
        id: number;
        username: string;
        name: string | null;
        rol: string;
    };
    acompanante?: {
        id: number;
        username: string;
        name: string | null;
        rol: string;
    } | null;
    reportesPeligro: ReportePeligro[];
    tarjetasStop: TarjetaStop[];
    controlesCalidadART: ControlCalidadART[];
}

interface Session {
    id: number;
    rol: string;
}

export default function DetalleCaminataPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { session } = useSession();

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [caminata, setCaminata] = useState<Caminata | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'seleccion' | 'peligro' | 'stop'>('seleccion');
    const [trabajadores, setTrabajadores] = useState<{ id: number; name: string | null; username: string; rol: string }[]>([]);

    const [formData, setFormData] = useState({
        observaciones: '',
        tieneFotografias: false,
        tieneDocumentos: false,
        zona: '',
        faena: '',
        actividad: '',
        acompananteId: '',
    });

    useEffect(() => {
        fetchCaminata();
        fetch('/api/users')
            .then((r) => r.json())
            .then((data) => setTrabajadores(Array.isArray(data) ? data : []))
            .catch(() => setTrabajadores([]));
    }, [id]);
    const fetchCaminata = async () => {
        try {
            const response = await fetch(`/api/caminatas/${id}`);
            if (!response.ok) throw new Error('Error al cargar caminata');
            const data = await response.json();
            setCaminata(data);
            setFormData({
                observaciones: data.observaciones || '',
                tieneFotografias: data.tieneFotografias,
                tieneDocumentos: data.tieneDocumentos,
                zona: data.zona || '',
                faena: data.faena || '',
                actividad: data.actividad || '',
                acompananteId: data.acompanante?.id?.toString() || '',
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!caminata) return;
        setUpdating(true);
        setError(null);

        try {
            const response = await fetch(`/api/caminatas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al actualizar');
            }

            await fetchCaminata();
            alert('Caminata actualizada correctamente');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleChangeEstado = async (nuevoEstado: string) => {
        if (!caminata) return;
        setUpdating(true);
        setError(null);

        try {
            const response = await fetch(`/api/caminatas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al cambiar estado');
            }

            // Emitir evento para actualizar el contador en el Navbar
            window.dispatchEvent(new CustomEvent('caminataEstadoChanged'));

            if (nuevoEstado === 'COMPLETADA') {
                router.push('/');
                return;
            }

            await fetchCaminata();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/caminatas/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al eliminar');
            }

            // Emitir evento para actualizar el contador en el Navbar
            window.dispatchEvent(new CustomEvent('caminataEstadoChanged'));

            router.push('/caminatas');
        } catch (err: any) {
            setError(err.message);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        const styles = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800',
            EN_PROCESO: 'bg-blue-100 text-blue-800',
            COMPLETADA: 'bg-green-100 text-green-800',
            CANCELADA: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {estado.replace('_', ' ')}
            </span>
        );
    };

    const isAsignado = session && caminata && session.id === caminata.asignado.id;
    const isCoordinador = session && caminata && session.id === caminata.coordinador.id;
    const canEdit = isAsignado && caminata?.estado !== 'COMPLETADA' && caminata?.estado !== 'CANCELADA';

    const isPendingCaminataValue = (value?: string | null) => {
        if (!value) return false;
        const cleanValue = value.trim().toLowerCase();
        return cleanValue === 'pendiente por definir' || cleanValue === 'actividad pendiente por definir';
    };

    const isCaminataInfoComplete = (value?: string | null) => {
        if (!value) return false;
        const cleanValue = value.trim().toLowerCase();
        if (!cleanValue) return false;
        if (isPendingCaminataValue(value)) return false;
        return true;
    };

    const showMiniInfoForm = !!(
        canEdit &&
        caminata &&
        !(
            isCaminataInfoComplete(caminata.zona) &&
            isCaminataInfoComplete(caminata.faena) &&
            isCaminataInfoComplete(caminata.actividad)
        )
    );

    const showObservacionesInput = !!(canEdit && caminata?.estado === 'EN_PROCESO');

    const buildCaminataTimeline = (c: Caminata) => {
        const events: any[] = [];

        // ── Creación ──────────────────────────────────────────────────────────
        events.push({
            timestamp: new Date(c.fechaCreacion),
            title: 'Caminata Creada',
            description: `Se creó la caminata ${c.codigo} en ${c.zona} — ${c.faena}`,
            user: c.coordinador,
            status: 'PENDIENTE',
            type: 'creation',
        });

        // ── Asignación ────────────────────────────────────────────────────────
        events.push({
            timestamp: new Date(c.fechaCreacion),
            title: 'Caminata Asignada',
            description: `Asignada a ${c.asignado.name || c.asignado.username}`,
            user: c.asignado,
            type: 'assignment',
        });

        // ── Acompañante ───────────────────────────────────────────────────────
        if (c.acompanante) {
            events.push({
                timestamp: new Date(c.fechaCreacion),
                title: 'Acompañante Designado',
                description: `${c.acompanante.name || c.acompanante.username} fue designado como acompañante`,
                user: c.acompanante,
                type: 'assignment',
            });
        }

        // ── Reportes de Peligro ───────────────────────────────────────────────
        c.reportesPeligro.forEach((r: ReportePeligro, idx: number) => {
            const datos = r.datos || {};
            const createdAt = new Date(r.createdAt);
            const label = datos.tipoPeligro || `Reporte de Peligro #${idx + 1}`;

            // Construir formDetails con los campos del formulario
            const formDetails: any[] = [];
            if (datos.tipoPeligro) formDetails.push({ label: 'Tipo de Peligro', value: datos.tipoPeligro });
            if (datos.zonas) formDetails.push({ label: 'Zonas Afectadas', value: datos.zonas });
            if (datos.faena || datos.faenas) formDetails.push({ label: 'Faena', value: datos.faena || datos.faenas });
            if (datos.actividad) formDetails.push({ label: 'Actividad', value: datos.actividad });
            if (datos.tarea) formDetails.push({ label: 'Tarea', value: datos.tarea });
            if (datos.tipoRiesgo) formDetails.push({
                label: 'Tipo de Riesgo',
                value: datos.tipoRiesgo,
                highlight: datos.tipoRiesgo === 'Alto' ? 'red' : datos.tipoRiesgo === 'Medio' ? 'orange' : 'green',
            });
            if (datos.nivelHallazgo) formDetails.push({
                label: 'Nivel de Hallazgo',
                value: datos.nivelHallazgo,
                highlight: datos.nivelHallazgo === 'Crítico' ? 'red' : datos.nivelHallazgo === 'Mayor' ? 'orange' : datos.nivelHallazgo === 'Menor' ? 'yellow' : 'blue',
            });
            if (datos.plazoCierre) formDetails.push({
                label: 'Plazo de Cierre',
                value: new Date(datos.plazoCierre).toLocaleDateString('es-CL'),
            });
            if (datos.descripcionPeligro) formDetails.push({ label: 'Descripción del Peligro', value: datos.descripcionPeligro, wide: true });
            else if (datos.descripcionDetallada) formDetails.push({ label: 'Descripción Detallada', value: datos.descripcionDetallada, wide: true });
            if (datos.consecuenciaPotencial) formDetails.push({ label: 'Consecuencia Potencial', value: datos.consecuenciaPotencial, wide: true });
            if (datos.medidasSugeridas) formDetails.push({ label: 'Medidas Sugeridas', value: datos.medidasSugeridas, wide: true });

            // Evento de creación del reporte
            events.push({
                timestamp: createdAt,
                title: `Reporte de Peligro: ${label}`,
                description: `${r.creadoPor.name || r.creadoPor.username} registró un reporte de peligro`,
                user: r.creadoPor,
                type: 'status_change',
                formDetails: formDetails.length > 0 ? formDetails : undefined,
            });

            // Responsable de cierre asignado
            if (r.responsableCierre) {
                events.push({
                    timestamp: new Date(createdAt.getTime() + 1000),
                    title: 'Responsable de Cierre Asignado',
                    description: `Se asignó a ${r.responsableCierre.name || r.responsableCierre.username} para implementar medidas correctivas`,
                    user: r.creadoPor,
                    type: 'assignment',
                });
            }

            // Cierre del reporte
            if (r.fechaCierre) {
                const cierreTs = new Date(r.fechaCierre);
                const pendienteVerifTs = r.fechaVerificacion
                    ? new Date(new Date(r.fechaVerificacion).getTime() - 60000)
                    : cierreTs;

                events.push({
                    timestamp: pendienteVerifTs,
                    title: 'Medidas Correctivas Implementadas',
                    description: 'El responsable de cierre implementó las medidas correctivas — pendiente de verificación',
                    user: r.responsableCierre || undefined,
                    comment: r.comentarioCierre || undefined,
                    image: r.imagenCierre || undefined,
                    status: 'PENDIENTE_VERIFICACION',
                    type: 'status_change',
                });

                // Verificador asignado
                if (r.responsableVerificacion) {
                    events.push({
                        timestamp: new Date(pendienteVerifTs.getTime() + 30000),
                        title: 'Verificador Asignado',
                        description: `Se asignó a ${r.responsableVerificacion.name || r.responsableVerificacion.username} para verificar el cierre`,
                        user: r.creadoPor,
                        type: 'assignment',
                    });
                }

                // Verificación realizada
                if (r.fechaVerificacion) {
                    events.push({
                        timestamp: new Date(r.fechaVerificacion),
                        title: 'Verificación Realizada',
                        description: 'El verificador revisó las medidas implementadas',
                        user: r.responsableVerificacion || undefined,
                        comment: r.comentarioVerificacion || undefined,
                        image: r.imagenVerificacion || undefined,
                        status: r.estado,
                        type: 'verification',
                    });

                    if (r.estado === 'CERRADO') {
                        events.push({
                            timestamp: new Date(new Date(r.fechaVerificacion).getTime() + 10000),
                            title: 'Reporte de Peligro Cerrado',
                            description: `El reporte "${label}" fue cerrado exitosamente`,
                            user: r.responsableVerificacion || undefined,
                            status: 'CERRADO',
                            type: 'closure',
                        });
                    }
                }
            }
        });

        // ── Tarjetas Stop ─────────────────────────────────────────────────────
        c.tarjetasStop.forEach((t: TarjetaStop, idx: number) => {
            const datos = t.datos || {};
            const createdAt = new Date(t.createdAt);
            const label = datos.causa || datos.motivoAplicacionFinal || `Tarjeta Stop #${idx + 1}`;

            const formDetails: any[] = [];
            if (datos.motivoAplicacionFinal || datos.motivoAplicacion) formDetails.push({ label: 'Motivo de Aplicación', value: datos.motivoAplicacionFinal || datos.motivoAplicacion });
            if (datos.causa) formDetails.push({ label: 'Causa', value: datos.causa });
            if (datos.zonas) formDetails.push({ label: 'Zona', value: datos.zonas });
            if (datos.faenas) formDetails.push({ label: 'Faena', value: datos.faenas });
            if (datos.causalDetencion) formDetails.push({ label: 'Causal de Detención', value: datos.causalDetencion, wide: true, highlight: 'red' as const });
            if (datos.descripcionDetallada) formDetails.push({ label: 'Descripción Detallada', value: datos.descripcionDetallada, wide: true });
            if (datos.medidaCorrectiva) formDetails.push({ label: 'Medida Correctiva', value: datos.medidaCorrectiva, wide: true });
            if (datos.solucionImplementada) formDetails.push({ label: 'Solución Implementada', value: datos.solucionImplementada, wide: true, highlight: 'green' as const });

            events.push({
                timestamp: createdAt,
                title: `Tarjeta Alto/Stop: ${label}`,
                description: `${t.creadoPor.name || t.creadoPor.username} emitió una tarjeta de detención de trabajo`,
                user: t.creadoPor,
                type: 'verification',
                formDetails: formDetails.length > 0 ? formDetails : undefined,
            });

            if (t.responsableCierre) {
                events.push({
                    timestamp: new Date(createdAt.getTime() + 1000),
                    title: 'Responsable de Cierre Asignado',
                    description: `Se asignó a ${t.responsableCierre.name || t.responsableCierre.username} como responsable de cierre`,
                    user: t.creadoPor,
                    type: 'assignment',
                });
            }

            if (t.fechaCierre) {
                events.push({
                    timestamp: new Date(t.fechaCierre),
                    title: 'Tarjeta Alto/Stop Cerrada',
                    description: `La tarjeta "${label}" fue cerrada`,
                    user: t.responsableCierre || undefined,
                    comment: t.comentarioCierre || undefined,
                    image: t.imagenCierre || undefined,
                    status: t.estado,
                    type: 'closure',
                });
            }
        });

        // ── Controles de Calidad ART ──────────────────────────────────────────
        c.controlesCalidadART.forEach((ctrl: ControlCalidadART, idx: number) => {
            const datos = ctrl.datos || {};
            events.push({
                timestamp: new Date(ctrl.createdAt),
                title: `Control de Calidad ART #${idx + 1}`,
                description: `${ctrl.creadoPor.name || ctrl.creadoPor.username} realizó un control de calidad ART`,
                user: ctrl.creadoPor,
                status: 'COMPLETADO',
                type: 'creation',
                formDetails: [
                    ...(datos.area ? [{ label: 'Área', value: datos.area }] : []),
                    ...(datos.tareaActividad ? [{ label: 'Tarea/Actividad', value: datos.tareaActividad }] : []),
                    ...(datos.zonas ? [{ label: 'Zona', value: datos.zonas }] : []),
                    ...(datos.faenas ? [{ label: 'Faena', value: datos.faenas }] : []),
                ].length > 0 ? [
                    ...(datos.area ? [{ label: 'Área', value: datos.area }] : []),
                    ...(datos.tareaActividad ? [{ label: 'Tarea/Actividad', value: datos.tareaActividad }] : []),
                    ...(datos.zonas ? [{ label: 'Zona', value: datos.zonas }] : []),
                    ...(datos.faenas ? [{ label: 'Faena', value: datos.faenas }] : []),
                ] : undefined,
            });
        });

        // ── Estado final ──────────────────────────────────────────────────────
        if (c.estado === 'COMPLETADA') {
            const fechaCompletada = c.fechaCompletacion || c.updatedAt || c.fechaCreacion;
            events.push({
                timestamp: new Date(fechaCompletada),
                title: 'Caminata Completada',
                description: 'La caminata de seguridad fue completada exitosamente',
                user: c.asignado,
                status: 'COMPLETADA',
                type: 'closure',
            });
        } else if (c.estado === 'CANCELADA') {
            events.push({
                timestamp: new Date(c.fechaCompletacion || c.updatedAt || c.fechaCreacion),
                title: 'Caminata Cancelada',
                description: 'La caminata fue cancelada',
                status: 'CANCELADA',
                type: 'closure',
            });
        } else if (c.estado === 'EN_PROCESO') {
            events.push({
                timestamp: new Date(c.fechaCreacion),
                title: 'Caminata en Proceso',
                description: 'La caminata fue iniciada y está en ejecución',
                user: c.asignado,
                status: 'EN_PROCESO',
                type: 'status_change',
            });
        }

        return events;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !caminata) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href="/" className="text-blue-600 hover:text-blue-700">
                        Inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (!caminata) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Inicio
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{caminata.codigo}</h1>
                            <p className="mt-2 text-gray-600">{caminata.zona} - {caminata.faena}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {getEstadoBadge(caminata.estado)}
                            {isCoordinador && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Eliminar caminata"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información Básica */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la Caminata</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Actividad</label>
                                    <p className="mt-1 text-gray-900">{caminata.actividad}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Zona</label>
                                        <p className="mt-1 text-gray-900">{caminata.zona}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Faena</label>
                                        <p className="mt-1 text-gray-900">{caminata.faena}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Fecha de Inicio Programada</label>
                                        <p className="mt-1 text-gray-900">
                                            {caminata.fechaProgramada
                                                ? new Date(caminata.fechaProgramada).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    timeZone: 'UTC',
                                                })
                                                : 'No definida'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
                                        <p className="mt-1 text-gray-900">
                                            {caminata.fechaLimite
                                                ? new Date(caminata.fechaLimite).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    timeZone: 'UTC',
                                                })
                                                : 'No definida'}
                                        </p>
                                    </div>
                                    {caminata.fechaCompletacion && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Fecha de Finalización</label>
                                            <p className="mt-1 text-gray-900">
                                                {new Date(caminata.fechaCompletacion).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {showMiniInfoForm && (
                            <div className="bg-amber-50 border border-amber-300 rounded-lg shadow p-6 ring-1 ring-amber-200">
                                <h2 className="text-xl font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.33 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Completar Información de la Caminata
                                </h2>
                                <p className="text-sm text-amber-800 mb-4">
                                    Atencion: completa estos datos antes de continuar con la caminata.
                                </p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                                            <input
                                                type="text"
                                                value={isPendingCaminataValue(formData.zona) ? '' : formData.zona}
                                                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                                placeholder="Completar zona..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Faena</label>
                                            <input
                                                type="text"
                                                value={isPendingCaminataValue(formData.faena) ? '' : formData.faena}
                                                onChange={(e) => setFormData({ ...formData, faena: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                                placeholder="Completar faena..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Actividad a Realizar</label>
                                        <textarea
                                            value={isPendingCaminataValue(formData.actividad) ? '' : formData.actividad}
                                            onChange={(e) => setFormData({ ...formData, actividad: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                                            placeholder="Completar actividad a realizar..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Acompañante (Opcional)</label>
                                        <select
                                            value={formData.acompananteId}
                                            onChange={(e) => setFormData({ ...formData, acompananteId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                        >
                                            <option value="">Seleccionar acompañante (opcional)</option>
                                            {trabajadores.map((trabajador) => (
                                                <option key={trabajador.id} value={trabajador.id.toString()}>
                                                    {trabajador.name || trabajador.username} ({trabajador.rol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleUpdate}
                                        disabled={updating}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {updating ? 'Guardando...' : 'Guardar Información de Caminata'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Observaciones */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Observaciones</h2>
                            {showObservacionesInput ? (
                                <>
                                    <textarea
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                                        placeholder="Agrega observaciones sobre la caminata..."
                                    />
                                    <button
                                        onClick={handleUpdate}
                                        disabled={updating}
                                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {updating ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </>
                            ) : (
                                <div>
                                    {caminata.observaciones ? (
                                        <p className="text-gray-900 whitespace-pre-wrap">{caminata.observaciones}</p>
                                    ) : canEdit && caminata.estado === 'PENDIENTE' ? (
                                        <p className="text-gray-500 italic">Las observaciones se habilitan cuando la caminata esté en proceso de completarse.</p>
                                    ) : (
                                        <p className="text-gray-500 italic">Sin observaciones</p>
                                    )}

                                </div>
                            )}
                        </div>

                        {/* Reportes y Tarjetas */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Reportes de Peligro y Tarjetas Alto/Stop</h2>
                                {canEdit && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Agregar
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Reportes de Peligro */}
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                                        <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Reportes de Peligro ({caminata.reportesPeligro.length})
                                    </h3>
                                    {caminata.reportesPeligro.length > 0 ? (
                                        <div className="space-y-3">
                                            {caminata.reportesPeligro.map((reporte: any, idx: number) => {
                                                const datos = reporte.datos || {};
                                                return (
                                                    <div key={reporte.id || idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                                    {datos.tipoPeligro || 'Reporte de Peligro'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {datos.zonas && `Zonas: ${datos.zonas}`}
                                                                </p>
                                                            </div>
                                                            {datos.tipoRiesgo && (
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${datos.tipoRiesgo === 'Alto' ? 'bg-red-100 text-red-800' :
                                                                    datos.tipoRiesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {datos.tipoRiesgo}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {datos.descripcionDetallada && (
                                                            <p className="text-sm text-gray-700 mb-3">
                                                                {datos.descripcionDetallada}
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            {datos.faena && (
                                                                <div>
                                                                    <span className="text-gray-500">Faena:</span>
                                                                    <span className="ml-1 text-gray-900">{datos.faena}</span>
                                                                </div>
                                                            )}
                                                            {datos.actividad && (
                                                                <div>
                                                                    <span className="text-gray-500">Actividad:</span>
                                                                    <span className="ml-1 text-gray-900">{datos.actividad}</span>
                                                                </div>
                                                            )}
                                                            {datos.responsableCierre && (
                                                                <div>
                                                                    <span className="text-gray-500">Responsable:</span>
                                                                    <span className="ml-1 text-gray-900">{datos.responsableCierre}</span>
                                                                </div>
                                                            )}
                                                            {datos.plazoCierre && (
                                                                <div>
                                                                    <span className="text-gray-500">Plazo:</span>
                                                                    <span className="ml-1 text-gray-900">
                                                                        {new Date(datos.plazoCierre).toLocaleDateString('es-ES')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {datos.nivelHallazgo && (
                                                                <div className="col-span-2">
                                                                    <span className="text-gray-500">Nivel de Hallazgo:</span>
                                                                    <span className="ml-1 text-gray-900 font-medium">{datos.nivelHallazgo}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Galería de imágenes */}
                                                        {datos.imagenes && datos.imagenes.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-orange-300">
                                                                <ImageGallery
                                                                    images={datos.imagenes}
                                                                    title="Evidencia fotográfica"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="mt-3 pt-3 border-t border-orange-300 text-xs text-gray-500">
                                                            Reportado el {new Date(reporte.createdAt).toLocaleString('es-ES')}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hay reportes de peligro</p>
                                    )}
                                </div>

                                {/* Tarjetas Stop */}
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        Tarjetas Alto/Stop ({caminata.tarjetasStop.length})
                                    </h3>
                                    {caminata.tarjetasStop.length > 0 ? (
                                        <div className="space-y-3">
                                            {caminata.tarjetasStop.map((tarjeta: any, idx: number) => {
                                                const datos = tarjeta.datos || {};
                                                return (
                                                    <div key={tarjeta.id || idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center mb-2">
                                                                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">
                                                                        TARJETA ALTO/STOP
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                                    {datos.causa || 'Detención de Trabajo'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {datos.zonas && `Zona: ${datos.zonas}`}
                                                                    {datos.faenas && ` - ${datos.faenas}`}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Motivo de Aplicación */}
                                                        {datos.motivoAplicacionFinal && (
                                                            <div className="mb-3 p-3 bg-white border border-red-300 rounded">
                                                                <span className="text-xs font-medium text-red-700">MOTIVO DE APLICACIÓN:</span>
                                                                <p className="text-sm text-gray-900 font-medium mt-1">
                                                                    {datos.motivoAplicacionFinal}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Causal de Detención */}
                                                        {datos.causalDetencion && (
                                                            <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded">
                                                                <span className="text-xs font-medium text-red-800">CAUSAL DE DETENCIÓN:</span>
                                                                <p className="text-sm text-gray-900 mt-1">
                                                                    {datos.causalDetencion}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Descripción Detallada */}
                                                        {datos.descripcionDetallada && (
                                                            <div className="mb-3">
                                                                <span className="text-xs font-medium text-gray-700">DESCRIPCIÓN:</span>
                                                                <p className="text-sm text-gray-900 mt-1">
                                                                    {datos.descripcionDetallada}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Medida Correctiva */}
                                                        {datos.medidaCorrectiva && (
                                                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                                                                <span className="text-xs font-medium text-yellow-900">MEDIDA CORRECTIVA:</span>
                                                                <p className="text-sm text-gray-900 mt-1">
                                                                    {datos.medidaCorrectiva}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Solución Implementada */}
                                                        {datos.solucionImplementada && (
                                                            <div className="mb-3 p-3 bg-green-50 border border-green-300 rounded">
                                                                <span className="text-xs font-medium text-green-900">SOLUCIÓN IMPLEMENTADA:</span>
                                                                <p className="text-sm text-gray-900 mt-1">
                                                                    {datos.solucionImplementada}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Responsable */}
                                                        <div className="grid grid-cols-1 gap-2 text-sm border-t border-red-300 pt-3">
                                                            {datos.responsableCierre && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Responsable de Cierre:</span>
                                                                    <span className="text-gray-900 font-medium">{datos.responsableCierre}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Galería de imágenes */}
                                                        {datos.imagenes && datos.imagenes.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-red-300">
                                                                <ImageGallery
                                                                    images={datos.imagenes}
                                                                    title="Evidencia fotográfica"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="mt-3 pt-3 border-t border-red-300 text-xs text-gray-500">
                                                            Tarjeta emitida el {new Date(tarjeta.fechaTarjeta || tarjeta.createdAt).toLocaleString('es-ES')}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hay tarjetas alto/stop</p>
                                    )}
                                </div>
                            </div>

                            {canEdit && caminata.reportesPeligro.length === 0 && (
                                <button
                                    className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    No hay reportes de peligro
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Información de Personas */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personas Involucradas</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Creado por</label>
                                    <p className="mt-1 text-gray-900 font-medium">
                                        {caminata.coordinador.name || caminata.coordinador.username}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{caminata.coordinador.rol}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <label className="text-sm font-medium text-gray-500">Asignado a</label>
                                    <p className="mt-1 text-gray-900 font-medium">
                                        {caminata.asignado.name || caminata.asignado.username}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{caminata.asignado.rol}</p>
                                </div>
                                {caminata.acompanante && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <label className="text-sm font-medium text-gray-500">Acompañante</label>
                                        <p className="mt-1 text-gray-900 font-medium">
                                            {caminata.acompanante.name || caminata.acompanante.username}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{caminata.acompanante.rol}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Acciones */}
                        {canEdit && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
                                <div className="space-y-3">
                                    {caminata.estado === 'PENDIENTE' && (
                                        <button
                                            onClick={() => handleChangeEstado('EN_PROCESO')}
                                            disabled={updating}
                                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                        >
                                            Iniciar Caminata
                                        </button>
                                    )}
                                    {caminata.estado === 'EN_PROCESO' && (
                                        <button
                                            onClick={() => handleChangeEstado('COMPLETADA')}
                                            disabled={updating}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                                        >
                                            Completar Caminata
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Generar PDF (Placeholder) */}
                        {/* <div className="bg-white rounded-lg shadow p-6">
                            <button
                                disabled
                                className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                                title="Próximamente"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Generar PDF (Próximamente)
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Línea de Tiempo */}
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Línea de Tiempo
                    </h2>
                    <AlertTimeline events={buildCaminataTimeline(caminata)} />
                </div>

                {/* Modal de confirmación de eliminación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro de que deseas eliminar esta caminata? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                                >
                                    {deleting ? 'Eliminando...' : 'Eliminar'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de agregar reporte/tarjeta */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                            {tipoFormulario === 'seleccion' && (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Seleccionar Tipo de Registro</h3>
                                        <button
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setTipoFormulario('seleccion');
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-gray-600 mb-6">
                                        ¿Qué tipo de registro deseas crear?
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setTipoFormulario('peligro')}
                                            className="p-6 border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-all group"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <svg className="w-12 h-12 text-orange-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Peligro</h4>
                                                <p className="text-sm text-gray-600">
                                                    Reportar condiciones peligrosas identificadas durante la caminata
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setTipoFormulario('stop')}
                                            className="p-6 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-all group"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <svg className="w-12 h-12 text-red-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Tarjeta Alto/Stop</h4>
                                                <p className="text-sm text-gray-600">
                                                    Detener trabajo por condiciones inseguras
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {tipoFormulario === 'peligro' && caminata && (
                                <ReportePeligroForm
                                    caminataId={caminata.id}
                                    onSuccess={() => {
                                        setShowAddModal(false);
                                        setTipoFormulario('seleccion');
                                        fetchCaminata();
                                    }}
                                    onCancel={() => setTipoFormulario('seleccion')}
                                />
                            )}

                            {tipoFormulario === 'stop' && caminata && (
                                <TarjetaStopForm
                                    caminataId={caminata.id}
                                    onSuccess={() => {
                                        setShowAddModal(false);
                                        setTipoFormulario('seleccion');
                                        fetchCaminata();
                                    }}
                                    onCancel={() => setTipoFormulario('seleccion')}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
