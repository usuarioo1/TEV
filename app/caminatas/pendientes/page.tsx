'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Usuario {
    id: number;
    name: string | null;
    username: string;
    rol: string;
}

interface Caminata {
    id: number;
    codigo: string;
    zona: string;
}

interface TareaAsignada {
    id: number;
    tipo: string;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    descripcion: string | null;
    estado: string;
    createdAt: string;
    asignado: Usuario;
    creadoPor: Usuario;
}

interface ReportePeligro {
    id: number;
    estado: string;
    createdAt: string;
    fechaCierre?: string;
    comentarioCierre?: string;
    imagenCierre?: string;
    fechaVerificacion?: string;
    comentarioVerificacion?: string;
    imagenVerificacion?: string;
    datos: any;
    creadoPor: Usuario;
    responsableCierre?: Usuario;
    responsableVerificacion?: Usuario;
    caminata: Caminata | null;
}

interface TarjetaStop {
    id: number;
    estado: string;
    createdAt: string;
    fechaCierre?: string;
    comentarioCierre?: string;
    imagenCierre?: string;
    datos: any;
    creadoPor: Usuario;
    responsableCierre?: Usuario;
    caminata: Caminata | null;
}

interface AlertasData {
    pendientes: {
        reportes: ReportePeligro[];
        tarjetas: TarjetaStop[];
        total: number;
    };
    pendientesVerificacion: {
        reportes: ReportePeligro[];
        total: number;
    };
    cerradas: {
        reportes: ReportePeligro[];
        tarjetas: TarjetaStop[];
        total: number;
    };
}

const TIPO_REPORTE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    caminata: { label: 'Caminata de Seguridad', color: 'cyan', icon: '🚶' },
    reporte_peligro: { label: 'Reporte de Peligro', color: 'orange', icon: '⚠️' },
    tarjeta_stop: { label: 'Tarjeta Alto/Stop', color: 'red', icon: '🛑' },
    control_art: { label: 'Control de Calidad ART', color: 'blue', icon: '📋' },
};

export default function AlertasPendientesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isQueryDrivenFlow = !!(searchParams.get('cerrar') || searchParams.get('verificar'));
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState<AlertasData>({
        pendientes: { reportes: [], tarjetas: [], total: 0 },
        pendientesVerificacion: { reportes: [], total: 0 },
        cerradas: { reportes: [], tarjetas: [], total: 0 }
    });
    const [tareasAsignadas, setTareasAsignadas] = useState<TareaAsignada[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [selectedItem, setSelectedItem] = useState<{ type: 'reporte' | 'tarjeta', item: ReportePeligro | TarjetaStop } | null>(null);
    const [viewingDetail, setViewingDetail] = useState<{ type: 'reporte' | 'tarjeta', item: ReportePeligro | TarjetaStop } | null>(null);
    const [verificandoItem, setVerificandoItem] = useState<ReportePeligro | null>(null);
    const [comentarioCierre, setComentarioCierre] = useState('');
    const [comentarioVerificacion, setComentarioVerificacion] = useState('');
    const [responsableVerificacionId, setResponsableVerificacionId] = useState('');
    const [imagenCierre, setImagenCierre] = useState<File | null>(null);
    const [imagenVerificacion, setImagenVerificacion] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [devolviendo, setDevolviendo] = useState<ReportePeligro | null>(null);
    const [motivoDevolucion, setMotivoDevolucion] = useState('');

    useEffect(() => {
        fetchAlertas();
        fetchUsuarios();
        fetchTareasAsignadas();
    }, []);

    // Auto-abrir panel de verificación si viene con ?verificar=<id>
    useEffect(() => {
        const verificarId = searchParams.get('verificar');
        if (!verificarId || loading) return;
        const reporte = alertas.pendientesVerificacion.reportes.find(
            (r: any) => r.id === Number(verificarId)
        );
        if (reporte) setVerificandoItem(reporte);
    }, [loading, searchParams]);

    // Auto-abrir formulario de cierre si viene con ?cerrar=<id>&tipo=<reporte|tarjeta>
    useEffect(() => {
        const cerrarId = searchParams.get('cerrar');
        const tipo = searchParams.get('tipo') as 'reporte' | 'tarjeta' | null;
        if (!cerrarId || !tipo || loading) return;
        if (tipo === 'reporte') {
            const item = alertas.pendientes.reportes.find((r: any) => r.id === Number(cerrarId));
            if (item) setSelectedItem({ type: 'reporte', item });
        } else if (tipo === 'tarjeta') {
            const item = alertas.pendientes.tarjetas.find((t: any) => t.id === Number(cerrarId));
            if (item) setSelectedItem({ type: 'tarjeta', item });
        }
    }, [loading, searchParams]);

    // Función para obtener lista de usuarios
    const fetchUsuarios = async () => {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    // Función para obtener tareas asignadas al usuario
    const fetchTareasAsignadas = async () => {
        try {
            const response = await fetch('/api/tareas-asignadas');
            if (response.ok) {
                const data = await response.json();
                setTareasAsignadas(data);
            }
        } catch (error) {
            console.error('Error al cargar tareas asignadas:', error);
        }
    };

    // Función para convertir File a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const fetchAlertas = async () => {
        try {
            const response = await fetch('/api/alertas/pendientes');
            if (response.ok) {
                const data = await response.json();
                setAlertas(data);
            } else if (response.status === 401) {
                router.push('/login');
            }
        } catch (error) {
            console.error('Error al cargar alertas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCerrar = async () => {
        if (!selectedItem || !comentarioCierre.trim()) {
            alert('Por favor ingresa un comentario de cierre');
            return;
        }

        // Validar responsable de verificación para reportes de peligro
        if (selectedItem.type === 'reporte' && !responsableVerificacionId) {
            alert('Por favor selecciona un responsable de verificación');
            return;
        }

        setSubmitting(true);
        try {
            let imagenCierreUrl = null;

            // Si hay imagen, subirla a Cloudinary primero
            if (imagenCierre) {
                const base64Image = await fileToBase64(imagenCierre);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        images: [base64Image],
                        folder: 'caminatas/cierres-alertas',
                    }),
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    throw new Error(uploadError.error || 'Error al subir imagen');
                }

                const uploadData = await uploadResponse.json();
                imagenCierreUrl = uploadData.images[0].url;
            }

            const endpoint = selectedItem.type === 'reporte'
                ? `/api/reportes-peligro/${selectedItem.item.id}/cerrar`
                : `/api/tarjetas-stop/${selectedItem.item.id}/cerrar`;

            // Construir el body - incluir responsableVerificacionId solo para reportes
            const bodyData: any = {
                comentarioCierre,
                imagenCierre: imagenCierreUrl
            };

            if (selectedItem.type === 'reporte') {
                bodyData.responsableVerificacionId = responsableVerificacionId;
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });

            if (response.ok) {
                alert(selectedItem.type === 'reporte'
                    ? 'Reporte cerrado y pendiente de verificación'
                    : 'Tarjeta cerrada exitosamente');
                setSelectedItem(null);
                setComentarioCierre('');
                setImagenCierre(null);
                setResponsableVerificacionId('');

                if (isQueryDrivenFlow || selectedItem.type === 'tarjeta') {
                    router.push('/');
                    return;
                }

                fetchAlertas(); // Recargar lista
            } else {
                const data = await response.json();
                alert(data.error || 'Error al cerrar alerta');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error instanceof Error ? error.message : 'Error al cerrar alerta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerificar = async () => {
        if (!verificandoItem || !comentarioVerificacion.trim()) {
            alert('Por favor ingresa un comentario de verificación');
            return;
        }

        setSubmitting(true);
        try {
            let imagenVerificacionUrl = null;

            // Si hay imagen, subirla a Cloudinary primero
            if (imagenVerificacion) {
                const base64Image = await fileToBase64(imagenVerificacion);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        images: [base64Image],
                        folder: 'caminatas/verificaciones-alertas',
                    }),
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    throw new Error(uploadError.error || 'Error al subir imagen');
                }

                const uploadData = await uploadResponse.json();
                imagenVerificacionUrl = uploadData.images[0].url;
            }

            const response = await fetch(`/api/reportes-peligro/${verificandoItem.id}/verificar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comentarioVerificacion,
                    imagenVerificacion: imagenVerificacionUrl,
                }),
            });

            if (response.ok) {
                alert('Reporte verificado y cerrado completamente');
                setVerificandoItem(null);
                setComentarioVerificacion('');
                setImagenVerificacion(null);
                router.push('/');
                return;
            } else {
                const data = await response.json();
                alert(data.error || 'Error al verificar reporte');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error instanceof Error ? error.message : 'Error al verificar reporte');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolver = async () => {
        if (!devolviendo || !motivoDevolucion.trim()) {
            alert('Por favor ingresa el motivo de la devolución');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/reportes-peligro/${devolviendo.id}/devolver`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivoDevolucion }),
            });

            if (response.ok) {
                alert('Reporte devuelto al responsable de cierre por inconformidades');
                setDevolviendo(null);
                setMotivoDevolucion('');

                if (isQueryDrivenFlow) {
                    router.push('/');
                    return;
                }

                fetchAlertas();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al devolver reporte');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al devolver reporte');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/caminatas"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Caminatas
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Mis Alertas de Seguridad</h1>
                    <p className="text-gray-600 mt-2">
                        Gestiona tus alertas pendientes y revisa las cerradas
                    </p>
                </div>

                {/* ===== SECCIÓN: ACTIVIDADES ASIGNADAS ===== */}
                {tareasAsignadas.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-7 h-7 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Actividades Asignadas ({tareasAsignadas.length})
                        </h2>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {tareasAsignadas.map((tarea) => {
                                    const tipoInfo = TIPO_REPORTE_LABELS[tarea.tipo] || { label: tarea.tipo, color: 'gray', icon: '📄' };
                                    return (
                                        <div key={tarea.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                                                        {tipoInfo.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded">
                                                                {tipoInfo.label.toUpperCase()}
                                                            </span>
                                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                                                                PENDIENTE
                                                            </span>
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                            {tipoInfo.label} asignado por {tarea.creadoPor.name || tarea.creadoPor.username}
                                                        </h3>
                                                        {tarea.descripcion && (
                                                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                                                <strong>Instrucciones:</strong> {tarea.descripcion}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            Asignado el {new Date(tarea.createdAt).toLocaleDateString('es-CL')}
                                                        </p>
                                                        {tarea.fechaProgramada && (
                                                            <p className="text-xs text-purple-700">
                                                                Inicio programado: {new Date(tarea.fechaProgramada).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                                                            </p>
                                                        )}
                                                        {tarea.fechaLimite && (
                                                            <p className="text-xs text-rose-700">
                                                                Fecha límite: {new Date(tarea.fechaLimite).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <Link
                                                        href={`/caminatas/completar/${tarea.id}`}
                                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                                                    >
                                                        Completar
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* SECCIÓN: ALERTAS PENDIENTES */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg className="w-7 h-7 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Alertas Pendientes de Cierre ({alertas.pendientes.total})
                    </h2>

                    {alertas.pendientes.total === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500">No tienes alertas pendientes</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {/* Reportes Pendientes */}
                                {alertas.pendientes.reportes.map((reporte) => (
                                    <div key={`reporte-${reporte.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded">
                                                            REPORTE DE PELIGRO
                                                        </span>
                                                        {reporte.caminata && (
                                                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                                                                {reporte.caminata.codigo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                        {reporte.datos.tipoPeligro || 'Reporte de Peligro'}
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600">
                                                        <p><strong>Zona:</strong> {reporte.datos.zonas || 'N/A'}</p>
                                                        <p><strong>Nivel:</strong> {reporte.datos.nivelHallazgo || 'N/A'}</p>
                                                        <p><strong>Creado por:</strong> {reporte.creadoPor.name || reporte.creadoPor.username}</p>
                                                        <p><strong>Fecha:</strong> {new Date(reporte.createdAt).toLocaleDateString('es-CL')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingDetail({ type: 'reporte', item: reporte });
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                                                >
                                                    Ver Timeline
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItem({ type: 'reporte', item: reporte });
                                                    }}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium whitespace-nowrap"
                                                >
                                                    Revisar y Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Tarjetas Pendientes */}
                                {alertas.pendientes.tarjetas.map((tarjeta) => (
                                    <div key={`tarjeta-${tarjeta.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">
                                                            TARJETA ALTO/STOP
                                                        </span>
                                                        {tarjeta.caminata && (
                                                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                                                                {tarjeta.caminata.codigo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                        {tarjeta.datos.causa || 'Tarjeta Alto/Stop'}
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600">
                                                        <p><strong>Zona:</strong> {tarjeta.datos.zonas || 'N/A'}</p>
                                                        <p><strong>Causal:</strong> {tarjeta.datos.causalDetencion || 'N/A'}</p>
                                                        <p><strong>Creado por:</strong> {tarjeta.creadoPor.name || tarjeta.creadoPor.username}</p>
                                                        <p><strong>Fecha:</strong> {new Date(tarjeta.createdAt).toLocaleDateString('es-CL')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingDetail({ type: 'tarjeta', item: tarjeta });
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                                                >
                                                    Ver Timeline
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItem({ type: 'tarjeta', item: tarjeta });
                                                    }}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                                                >
                                                    Revisar y Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECCIÓN: REPORTES PENDIENTES DE VERIFICACIÓN */}
                {alertas.pendientesVerificacion.total > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-7 h-7 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reportes Pendientes de Verificación ({alertas.pendientesVerificacion.total})
                        </h2>
                        <p className="text-gray-600 mb-4 text-sm">
                            Estos reportes fueron cerrados y requieren tu verificación para el cierre completo.
                        </p>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Zona/Faena</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Cerrado por</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Fecha Cierre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {alertas.pendientesVerificacion.reportes.map((reporte) => (
                                            <tr key={reporte.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{reporte.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                                                        {reporte.datos.tipoPeligro || 'Reporte'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {reporte.datos.zonas} • {reporte.datos.faena}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {reporte.responsableCierre?.name || reporte.responsableCierre?.username || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {reporte.fechaCierre ? formatDate(reporte.fechaCierre) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingDetail({ type: 'reporte', item: reporte })}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Ver Timeline
                                                        </button>
                                                        <button
                                                            onClick={() => setDevolviendo(reporte)}
                                                            className="bg-amber-500 text-white px-4 py-1 rounded hover:bg-amber-600 transition-colors font-medium"
                                                        >
                                                            Devolver
                                                        </button>
                                                        <button
                                                            onClick={() => setVerificandoItem(reporte)}
                                                            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors font-medium"
                                                        >
                                                            Verificar y Cerrar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Modal de Línea de Tiempo */}
            {viewingDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {viewingDetail.type === 'reporte' ? 'Reporte de Peligro' : 'Tarjeta Alto/Stop'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    ID: #{viewingDetail.item.id} • Estado: <span className={`font-semibold ${viewingDetail.item.estado === 'CERRADO' ? 'text-green-600' : 'text-orange-600'}`}>{viewingDetail.item.estado}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingDetail(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Información Completa */}
                            <div className="mb-6">
                                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-blue-600 text-white px-3 py-1 rounded-md font-semibold text-sm">
                                                ID #{viewingDetail.item.id}
                                            </span>
                                            <span className={`px-3 py-1 rounded-md font-semibold text-sm ${viewingDetail.item.estado === 'CERRADO'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {viewingDetail.item.estado}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {viewingDetail.item.caminata ? (
                                                <span className="bg-white px-3 py-1 rounded-md border">
                                                    📍 {viewingDetail.item.caminata.codigo}
                                                </span>
                                            ) : (
                                                <span className="bg-white px-3 py-1 rounded-md border text-gray-500">
                                                    Reporte Independiente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Información Completa del Formulario
                                </h3>

                                {viewingDetail.type === 'reporte' ? (
                                    <div className="space-y-4">
                                        {/* Sección: Información General */}
                                        <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                                            <h4 className="font-semibold text-orange-900 mb-3 text-sm uppercase tracking-wide">📋 Información General</h4>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Tipo de Peligro</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.tipoPeligro || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Zona</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.zonas || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Faena</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.faena || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Ubicación</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.ubicacion || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Actividad</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.actividad || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Tarea</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.tarea || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Clasificación del Riesgo */}
                                        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                                            <h4 className="font-semibold text-red-900 mb-3 text-sm uppercase tracking-wide">⚠️ Clasificación del Riesgo</h4>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Tipo de Riesgo</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.tipoRiesgo || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Nivel de Hallazgo</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.nivelHallazgo || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Plazo de Cierre</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as ReportePeligro).datos.plazoCierre || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Descripciones Detalladas */}
                                        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                            <h4 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">📝 Descripciones</h4>
                                            <div className="space-y-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Descripción del Peligro</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as ReportePeligro).datos.descripcionPeligro || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Consecuencia Potencial</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as ReportePeligro).datos.consecuenciaPotencial || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Medidas Sugeridas</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as ReportePeligro).datos.medidasSugeridas || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Imágenes del Reporte */}
                                        {(viewingDetail.item as ReportePeligro).datos.imagenes && (viewingDetail.item as ReportePeligro).datos.imagenes.length > 0 && (
                                            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                                                <h4 className="font-semibold text-purple-900 mb-3 text-sm uppercase tracking-wide">📸 Imágenes Adjuntas ({(viewingDetail.item as ReportePeligro).datos.imagenes.length})</h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {(viewingDetail.item as ReportePeligro).datos.imagenes.map((img: any, idx: number) => (
                                                        <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img
                                                                src={img.url}
                                                                alt={`Imagen ${idx + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all hover:scale-105"
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Sección: Información General */}
                                        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
                                            <h4 className="font-semibold text-red-900 mb-3 text-sm uppercase tracking-wide">📋 Información General</h4>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Zona</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as TarjetaStop).datos.zonas || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Faenas</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as TarjetaStop).datos.faenas || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Causa</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as TarjetaStop).datos.causa || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Detalles de la Detención */}
                                        <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
                                            <h4 className="font-semibold text-orange-900 mb-3 text-sm uppercase tracking-wide">🛑 Detalles de la Detención</h4>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Causal de Detención</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as TarjetaStop).datos.causalDetencion || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Motivo de Aplicación</p>
                                                    <p className="text-gray-900 font-semibold">{(viewingDetail.item as TarjetaStop).datos.motivoAplicacionFinal || (viewingDetail.item as TarjetaStop).datos.motivoAplicacion || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Descripciones y Medidas */}
                                        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                                            <h4 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">📝 Descripciones y Medidas</h4>
                                            <div className="space-y-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Descripción Detallada</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as TarjetaStop).datos.descripcionDetallada || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Medida Correctiva</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as TarjetaStop).datos.medidaCorrectiva || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 font-medium mb-1">Solución Implementada</p>
                                                    <p className="text-gray-900 bg-white p-2 rounded border">{(viewingDetail.item as TarjetaStop).datos.solucionImplementada || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Imágenes de la Tarjeta */}
                                        {(viewingDetail.item as TarjetaStop).datos.imagenes && (viewingDetail.item as TarjetaStop).datos.imagenes.length > 0 && (
                                            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                                                <h4 className="font-semibold text-purple-900 mb-3 text-sm uppercase tracking-wide">📸 Imágenes Adjuntas ({(viewingDetail.item as TarjetaStop).datos.imagenes.length})</h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {(viewingDetail.item as TarjetaStop).datos.imagenes.map((img: any, idx: number) => (
                                                        <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img
                                                                src={img.url}
                                                                alt={`Imagen ${idx + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all hover:scale-105"
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Línea de Tiempo - Compacta */}
                            <div className="border-t mt-6 pt-6">
                                <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Línea de Tiempo
                                </h3>

                                <div className="relative pl-6 space-y-3">
                                    {/* Línea vertical */}
                                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-300"></div>

                                    {/* Evento 1: Creación */}
                                    <div className="relative">
                                        <div className="absolute -left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <div className="bg-blue-50 rounded p-2 text-xs border-l-2 border-blue-500">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-blue-900">
                                                    {viewingDetail.item.datos?._completadoPorId ? 'Asignada como tarea' : 'Creada'}
                                                </span>
                                                <span className="text-gray-500 text-[10px]">
                                                    {new Date(viewingDetail.item.createdAt).toLocaleString('es-CL', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">
                                                <strong>{viewingDetail.item.datos?._completadoPorId ? 'Asignada por:' : 'Por:'}</strong>{' '}
                                                {viewingDetail.item.creadoPor.name || viewingDetail.item.creadoPor.username} ({viewingDetail.item.creadoPor.rol})
                                            </p>
                                            {viewingDetail.item.caminata && (
                                                <p className="text-gray-600 mt-1">
                                                    📍 {viewingDetail.item.caminata.codigo}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Evento 1b: Completado por (solo cuando fue creado desde una tarea asignada) */}
                                    {viewingDetail.item.datos?._completadoPorId && (
                                        <div className="relative">
                                            <div className="absolute -left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div className="bg-purple-50 rounded p-2 text-xs border-l-2 border-purple-500">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-purple-900">Formulario completado</span>
                                                    <span className="text-gray-500 text-[10px]">
                                                        {new Date(viewingDetail.item.createdAt).toLocaleString('es-CL', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700">
                                                    <strong>Completado por:</strong> {viewingDetail.item.datos._completadoPorNombre}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Evento 2: Asignación */}
                                    {viewingDetail.item.responsableCierre && (
                                        <div className="relative">
                                            <div className="absolute -left-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div className="bg-orange-50 rounded p-2 text-xs border-l-2 border-orange-500">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-orange-900">Asignada</span>
                                                    <span className="text-gray-500 text-[10px]">
                                                        {new Date(viewingDetail.item.createdAt).toLocaleString('es-CL', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700">
                                                    <strong>A:</strong> {viewingDetail.item.responsableCierre.name || viewingDetail.item.responsableCierre.username} ({viewingDetail.item.responsableCierre.rol})
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Eventos históricos: devoluciones previas (solo para reportes de peligro) */}
                                    {viewingDetail.type === 'reporte' &&
                                        ((viewingDetail.item as ReportePeligro).datos?.historialDevoluciones || []).map((dev: any, i: number) => (
                                            <>
                                                {/* Sub-evento: Cierre anterior */}
                                                {dev.cierreAnterior?.fecha && (
                                                    <div key={`cierre-ant-${i}`} className="relative">
                                                        <div className="absolute -left-2 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center ring-2 ring-white">
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                        <div className="bg-orange-50 rounded p-2 text-xs border-l-2 border-orange-400">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-semibold text-orange-800">Cierre realizado (intento {i + 1})</span>
                                                                <span className="text-gray-500 text-[10px]">
                                                                    {new Date(dev.cierreAnterior.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700"><strong>Por:</strong> {dev.cierreAnterior.responsableNombre || 'N/A'}</p>
                                                            {dev.cierreAnterior.comentario && (
                                                                <p className="text-gray-700 mt-1"><strong>Comentario:</strong> {dev.cierreAnterior.comentario}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Sub-evento: Devolución */}
                                                <div key={`dev-${i}`} className="relative">
                                                    <div className="absolute -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                    </div>
                                                    <div className="bg-red-50 rounded p-2 text-xs border-l-2 border-red-500">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-red-900">Devuelto por inconformidades</span>
                                                            <span className="text-gray-500 text-[10px]">
                                                                {new Date(dev.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700"><strong>Por:</strong> {dev.devueltoPorNombre}</p>
                                                        <p className="text-gray-700 mt-1"><strong>Motivo:</strong> {dev.motivo}</p>
                                                    </div>
                                                </div>
                                            </>
                                        ))
                                    }

                                    {/* Evento 3: Cierre */}
                                    {(viewingDetail.item.fechaCierre || (viewingDetail.item.estado === 'CERRADO' && viewingDetail.type === 'tarjeta')) && (
                                        <div className="relative">
                                            <div className={`absolute -left-2 w-5 h-5 ${viewingDetail.type === 'reporte' && (viewingDetail.item as ReportePeligro).responsableVerificacion ? 'bg-orange-500' : 'bg-green-500'} rounded-full flex items-center justify-center ring-2 ring-white`}>
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className={`${viewingDetail.type === 'reporte' && (viewingDetail.item as ReportePeligro).responsableVerificacion ? 'bg-orange-50 border-l-2 border-orange-500' : 'bg-green-50 border-l-2 border-green-500'} rounded p-2 text-xs`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`font-semibold ${viewingDetail.type === 'reporte' && (viewingDetail.item as ReportePeligro).responsableVerificacion ? 'text-orange-900' : 'text-green-900'}`}>
                                                        {viewingDetail.type === 'reporte' && (viewingDetail.item as ReportePeligro).responsableVerificacion
                                                            ? 'Cierre Realizado (Pendiente verificación)'
                                                            : 'Cerrada Completamente'}
                                                    </span>
                                                    <span className="text-gray-500 text-[10px]">
                                                        {viewingDetail.item.fechaCierre && new Date(viewingDetail.item.fechaCierre).toLocaleString('es-CL', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {viewingDetail.item.comentarioCierre && (
                                                    <p className="text-gray-700 mb-1">
                                                        <strong>Comentario:</strong> {viewingDetail.item.comentarioCierre}
                                                    </p>
                                                )}
                                                {viewingDetail.item.imagenCierre && (
                                                    <div className="mt-2">
                                                        <p className="text-gray-700 font-semibold mb-1">📸 Evidencia:</p>
                                                        <a href={viewingDetail.item.imagenCierre} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img
                                                                src={viewingDetail.item.imagenCierre}
                                                                alt="Evidencia"
                                                                className="rounded w-32 h-20 object-cover border hover:opacity-90 transition-opacity"
                                                            />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evento 4: Verificación (solo para reportes de peligro) */}
                                    {viewingDetail.type === 'reporte' && (viewingDetail.item as ReportePeligro).fechaVerificacion && (
                                        <div className="relative">
                                            <div className="absolute -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            </div>
                                            <div className="bg-green-50 rounded p-2 text-xs border-l-2 border-green-500">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-green-900">✓ Verificada y Cerrada</span>
                                                    <span className="text-gray-500 text-[10px]">
                                                        {new Date((viewingDetail.item as ReportePeligro).fechaVerificacion!).toLocaleString('es-CL', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700">
                                                    <strong>Verificado por:</strong> {(viewingDetail.item as ReportePeligro).responsableVerificacion?.name || (viewingDetail.item as ReportePeligro).responsableVerificacion?.username}
                                                </p>
                                                {(viewingDetail.item as ReportePeligro).comentarioVerificacion && (
                                                    <p className="text-gray-700 mt-1">
                                                        <strong>Comentario:</strong> {(viewingDetail.item as ReportePeligro).comentarioVerificacion}
                                                    </p>
                                                )}
                                                {(viewingDetail.item as ReportePeligro).imagenVerificacion && (
                                                    <div className="mt-2">
                                                        <p className="text-gray-700 font-semibold mb-1">📸 Evidencia:</p>
                                                        <a href={(viewingDetail.item as ReportePeligro).imagenVerificacion} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img
                                                                src={(viewingDetail.item as ReportePeligro).imagenVerificacion}
                                                                alt="Evidencia de verificación"
                                                                className="rounded w-32 h-20 object-cover border hover:opacity-90 transition-opacity"
                                                            />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botón cerrar */}
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setViewingDetail(null)}
                                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cerrar Vista
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Devolución por Inconformidades */}
            {devolviendo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-6 h-6 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Devolver Reporte por Inconformidades
                        </h2>

                        <div className="bg-amber-50 rounded-lg p-4 mb-5 border-l-4 border-amber-500">
                            <p className="text-sm text-amber-800">
                                El reporte <strong>#{devolviendo.id}</strong> volverá al estado de{' '}
                                <strong>Pendiente de Cierre</strong>. El responsable de cierre deberá
                                implementar nuevamente las medidas correctivas y volver a enviarlo a
                                verificación.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo de Devolución *
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Describe qué no fue satisfactorio en el cierre realizado.
                            </p>
                            <textarea
                                value={motivoDevolucion}
                                onChange={(e) => setMotivoDevolucion(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
                                placeholder="Ej: Las medidas implementadas no son suficientes, falta evidencia fotográfica..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setDevolviendo(null);
                                    setMotivoDevolucion('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDevolver}
                                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:bg-gray-400"
                                disabled={submitting || !motivoDevolucion.trim()}
                            >
                                {submitting ? 'Devolviendo...' : 'Confirmar Devolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Verificación */}
            {verificandoItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-7 h-7 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verificar Cierre del Reporte
                        </h2>

                        {/* Información del reporte */}
                        <div className="bg-blue-50 rounded-lg p-5 mb-6 border-l-4 border-blue-500">
                            <h3 className="font-semibold text-blue-900 mb-3 text-base">Reporte #{verificandoItem.id}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-blue-600 text-xs">Tipo de Peligro</p>
                                    <p className="text-gray-900 font-medium">{verificandoItem.datos.tipoPeligro || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-600 text-xs">Zona/Faena</p>
                                    <p className="text-gray-900 font-medium">{verificandoItem.datos.zonas} • {verificandoItem.datos.faena}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-blue-600 text-xs">Cerrado por</p>
                                    <p className="text-gray-900 font-medium">
                                        {verificandoItem.responsableCierre?.name || verificandoItem.responsableCierre?.username}
                                        {verificandoItem.fechaCierre && ` • ${formatDate(verificandoItem.fechaCierre)}`}
                                    </p>
                                </div>
                                {verificandoItem.comentarioCierre && (
                                    <div className="col-span-2">
                                        <p className="text-blue-600 text-xs">Comentario de Cierre</p>
                                        <p className="text-gray-900 bg-white p-2 rounded border">{verificandoItem.comentarioCierre}</p>
                                    </div>
                                )}
                                {verificandoItem.imagenCierre && (
                                    <div className="col-span-2">
                                        <p className="text-blue-600 text-xs mb-2">Evidencia de Cierre</p>
                                        <a href={verificandoItem.imagenCierre} target="_blank" rel="noopener noreferrer" className="block">
                                            <img
                                                src={verificandoItem.imagenCierre}
                                                alt="Evidencia"
                                                className="rounded-lg max-w-sm border hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Formulario de verificación */}
                        <div className="mb-6">
                            <label htmlFor="comentarioVerificacion" className="block text-sm font-medium text-gray-700 mb-2">
                                Comentario de Verificación *
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Confirma que el cierre del reporte fue adecuado y las medidas fueron efectivas.
                            </p>
                            <textarea
                                id="comentarioVerificacion"
                                value={comentarioVerificacion}
                                onChange={(e) => setComentarioVerificacion(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                placeholder="Describe tu verificación del cierre (ej: verificado en terreno, medidas implementadas correctamente...)"
                                required
                            />
                        </div>

                        {/* Campo de imagen de verificación */}
                        <div className="mb-6">
                            <label htmlFor="imagenVerificacion" className="block text-sm font-medium text-gray-700 mb-2">
                                Imagen de Evidencia (Opcional)
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Adjunta una foto que evidencie la verificación del cierre.
                            </p>
                            <input
                                type="file"
                                id="imagenVerificacion"
                                accept="image/*"
                                onChange={(e) => setImagenVerificacion(e.target.files?.[0] || null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            />
                            {imagenVerificacion && (
                                <p className="text-sm text-green-600 mt-2">
                                    ✓ Imagen seleccionada: {imagenVerificacion.name}
                                </p>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={() => {
                                    setVerificandoItem(null);
                                    setComentarioVerificacion('');
                                    setImagenVerificacion(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setDevolviendo(verificandoItem);
                                    setVerificandoItem(null);
                                    setComentarioVerificacion('');
                                    setImagenVerificacion(null);
                                }}
                                className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
                                disabled={submitting}
                            >
                                Devolver por Inconformidades
                            </button>
                            <button
                                onClick={handleVerificar}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                                disabled={submitting || !comentarioVerificacion.trim()}
                            >
                                {submitting ? 'Verificando...' : 'Verificar y Cerrar Completamente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cierre */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Cerrar {selectedItem.type === 'reporte' ? 'Reporte de Peligro' : 'Tarjeta Alto/Stop'}
                        </h2>

                        {/* Detalles del item */}
                        <div className="bg-gray-50 rounded-lg p-5 mb-6 max-h-96 overflow-y-auto">
                            <h3 className="font-semibold text-gray-900 mb-3 text-base">Información Completa del Reporte:</h3>
                            {selectedItem.type === 'reporte' ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs">Tipo de Peligro</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.tipoPeligro || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Zona</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.zonas || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Faena</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.faena || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Ubicación</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.ubicacion || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Actividad</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.actividad || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Tarea</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.tarea || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Tipo de Riesgo</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.tipoRiesgo || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Nivel de Hallazgo</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.nivelHallazgo || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Plazo de Cierre</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.plazoCierre || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Descripción del Peligro</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.descripcionPeligro || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Consecuencia Potencial</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.consecuenciaPotencial || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Medidas Sugeridas</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as ReportePeligro).datos.medidasSugeridas || 'N/A'}</p>
                                    </div>
                                    {(selectedItem.item as ReportePeligro).datos.imagenes && (selectedItem.item as ReportePeligro).datos.imagenes.length > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-gray-500 text-xs mb-2">Imágenes Adjuntas</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedItem.item as ReportePeligro).datos.imagenes.map((img: any, idx: number) => (
                                                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                                        <img src={img.url} alt={`Imagen ${idx + 1}`} className="h-20 w-20 object-cover rounded border hover:opacity-75" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs">Zona</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.zonas || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Faenas</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.faenas || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Causa</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.causa || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Causal de Detención</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.causalDetencion || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Motivo de Aplicación</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.motivoAplicacionFinal || (selectedItem.item as TarjetaStop).datos.motivoAplicacion || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Descripción Detallada</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.descripcionDetallada || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Medida Correctiva</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.medidaCorrectiva || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 text-xs">Solución Implementada</p>
                                        <p className="text-gray-900 font-medium">{(selectedItem.item as TarjetaStop).datos.solucionImplementada || 'N/A'}</p>
                                    </div>
                                    {(selectedItem.item as TarjetaStop).datos.imagenes && (selectedItem.item as TarjetaStop).datos.imagenes.length > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-gray-500 text-xs mb-2">Imágenes Adjuntas</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedItem.item as TarjetaStop).datos.imagenes.map((img: any, idx: number) => (
                                                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                                        <img src={img.url} alt={`Imagen ${idx + 1}`} className="h-20 w-20 object-cover rounded border hover:opacity-75" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Formulario de cierre */}
                        <div className="mb-6">
                            <label htmlFor="comentarioCierre" className="block text-sm font-medium text-gray-700 mb-2">
                                Comentario de Cierre *
                            </label>
                            <textarea
                                id="comentarioCierre"
                                value={comentarioCierre}
                                onChange={(e) => setComentarioCierre(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                placeholder="Describe la solución implementada o el motivo del cierre..."
                                required
                            />
                        </div>

                        {/* Input de imagen (opcional) */}
                        <div className="mb-6">
                            <label htmlFor="imagenCierre" className="block text-sm font-medium text-gray-700 mb-2">
                                Imagen de Evidencia (Opcional)
                            </label>
                            <input
                                id="imagenCierre"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImagenCierre(e.target.files?.[0] || null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                            {imagenCierre && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Archivo seleccionado: {imagenCierre.name}
                                </p>
                            )}
                        </div>

                        {/* Selector de Responsable de Verificación (solo para reportes de peligro) */}
                        {selectedItem.type === 'reporte' && (
                            <div className="mb-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Responsable de Verificación
                                </h3>
                                <p className="text-xs text-blue-700 mb-3">
                                    Los reportes de peligro requieren una verificación adicional antes del cierre completo.
                                </p>
                                <select
                                    value={responsableVerificacionId}
                                    onChange={(e) => setResponsableVerificacionId(e.target.value)}
                                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                                    required
                                >
                                    <option value="">Selecciona un responsable de verificación *</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.name || usuario.username} ({usuario.rol})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setSelectedItem(null);
                                    setComentarioCierre('');
                                    setImagenCierre(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCerrar}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                disabled={submitting || !comentarioCierre.trim()}
                            >
                                {submitting ? 'Cerrando...' : 'Cerrar Alerta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
