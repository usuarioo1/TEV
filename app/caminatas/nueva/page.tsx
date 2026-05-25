'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Usuario {
    id: number;
    username: string;
    name: string | null;
    rol: string;
}

interface Session {
    id: number;
    rol: string;
    name: string | null;
    username: string;
}

const TIPO_ACTIVIDAD_LABELS: Record<string, string> = {
    caminata: 'Caminata de Seguridad',
    reporte_peligro: 'Reporte de Peligro',
    tarjeta_stop: 'Tarjeta Alto/Stop',
    control_art: 'Control de Calidad ART',
};

export default function NuevaCaminataPage() {
    const [loadingSession, setLoadingSession] = useState(true);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [loadingForm, setLoadingForm] = useState(false);

    const [session, setSession] = useState<Session | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Actividad asignada correctamente.');

    const [formData, setFormData] = useState({
        tipo: '',
        asignadoId: '',
        fechaProgramada: '',
        fechaLimite: '',
        descripcion: '',
    });

    useEffect(() => {
        fetchSession().then((rol) => {
            if (rol === 'prevencionista') {
                fetchUsuariosAsignables();
            } else {
                setLoadingUsuarios(false);
            }
        });
    }, []);

    const fetchSession = async (): Promise<string | null> => {
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                setSession(data);
                return data.rol ?? null;
            }
        } catch (err) {
            console.error('Error al cargar sesión:', err);
        } finally {
            setLoadingSession(false);
        }
        return null;
    };

    const fetchUsuariosAsignables = async () => {
        try {
            const response = await fetch('/api/caminatas/asignables');
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsuarios(data);
        } catch (err) {
            console.error('Error al cargar usuarios asignables:', err);
        } finally {
            setLoadingUsuarios(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        setError(null);
        setSuccess(false);
        setSuccessMessage('Actividad asignada correctamente.');

        try {
            const response = await fetch('/api/tareas-asignadas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: formData.tipo,
                    asignadoId: parseInt(formData.asignadoId),
                    fechaProgramada: formData.fechaProgramada,
                    fechaLimite: formData.fechaLimite,
                    descripcion: formData.descripcion || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al asignar actividad');
            }

            if (data.tipo === 'caminata') {
                setSuccessMessage('Caminata creada y asignada correctamente.');
                window.dispatchEvent(new CustomEvent('caminataEstadoChanged'));
            } else {
                setSuccessMessage('Actividad asignada correctamente.');
            }

            setSuccess(true);
            setFormData({ tipo: '', asignadoId: '', fechaProgramada: '', fechaLimite: '', descripcion: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingForm(false);
        }
    };

    if (loadingSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a Inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Asignar Actividad</h1>
                    <p className="mt-2 text-gray-600">
                        Unifica el envío de actividades: caminatas y reportes asignados en un solo formulario.
                    </p>
                </div>

                {session?.rol !== 'prevencionista' ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                            Solo los prevencionistas pueden asignar actividades desde esta ruta.
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6">
                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                {successMessage}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Actividad *</label>
                                <select
                                    id="tipo"
                                    name="tipo"
                                    required
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                >
                                    <option value="">Selecciona un tipo</option>
                                    {Object.entries(TIPO_ACTIVIDAD_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="asignadoId" className="block text-sm font-medium text-gray-700 mb-2">Asignar a *</label>
                                {loadingUsuarios ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : (
                                    <select
                                        id="asignadoId"
                                        name="asignadoId"
                                        required
                                        value={formData.asignadoId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    >
                                        <option value="">Selecciona un supervisor, coordinador, jefatura o prevencionista</option>
                                        {usuarios
                                            .filter((u) => u.rol === 'jefaturas')
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>{u.name || u.username} (Jefatura)</option>
                                            ))}
                                        {usuarios
                                            .filter((u) => u.rol === 'supervisor')
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>{u.name || u.username} (Supervisor)</option>
                                            ))}
                                        {usuarios
                                            .filter((u) => u.rol === 'coordinador')
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>{u.name || u.username} (Coordinador)</option>
                                            ))}
                                        {usuarios
                                            .filter((u) => u.rol === 'prevencionista')
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>{u.name || u.username} (Prevencionista)</option>
                                            ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fechaProgramada" className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de inicio programada *
                                    </label>
                                    <input
                                        type="date"
                                        id="fechaProgramada"
                                        name="fechaProgramada"
                                        required
                                        value={formData.fechaProgramada}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="fechaLimite" className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha límite término *
                                    </label>
                                    <input
                                        type="date"
                                        id="fechaLimite"
                                        name="fechaLimite"
                                        required
                                        min={formData.fechaProgramada || undefined}
                                        value={formData.fechaLimite}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                                    Instrucciones extras (Opcional)
                                </label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    rows={3}
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-black"
                                    placeholder="Indicaciones específicas para quien deba completar esta actividad..."
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loadingForm || loadingUsuarios}
                                    className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loadingForm ? 'Asignando...' : 'Asignar Actividad'}
                                </button>
                                <Link
                                    href="/caminatas"
                                    className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium text-center"
                                >
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}