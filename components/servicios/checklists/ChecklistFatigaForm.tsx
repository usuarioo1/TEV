'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ChecklistFatigaFormProps {
    servicioId: number;
    checklistExistente?: any;
}

interface UserSession {
    id: number;
    username: string;
    name: string | null;
    rut: string | null;
    rol: string;
}

// Estructura de preguntas y síntomas
const AUTOEVALUACION_SECCION_I = [
    "Confirma que ha dormido el tiempo necesario en las últimas 24 horas y se encuentra apto para las labores de conducción",
    "¿Actualmente está tomando medicamentos que provocan somnolencia o sensación de fatiga?",
    "¿Ha realizado actividades físicas exigentes o prolongadas antes de conducir?",
    "¿Ha ingerido alcohol en las últimas 48 horas?",
    "¿Presenta síntomas de resfriado común?",
    "¿Ha ingerido comidas abundantes en la última hora?",
    "¿Ha manejado más de 12 horas acumuladas en las últimas 24 horas?"
];

const AUTOEVALUACION_SECCION_II = [
    "Dificultad para concentrarse o permanecer alerta",
    "Movimientos lentos o torpes",
    "Visión borrosa",
    "Dificultad para recordar cómo se ha alcanzado la localización actual",
    "Dificultad para mantener una trayectoria recta (invasiones de la calzada contraria o conducir por el centro de la carretera)",
    "Bostezos frecuentes",
    "Pesadez en los párpados",
    'Muchas ganas de dormir que impide concentrarse ("cabeceos")',
    "Dolor de cabeza (pequeñas migrañas y sensaciones de presión, especialmente en las sienes)",
    "Sensación de mareos",
    "Dolores de nuca y de espalda que hacen incómoda la conducción",
    "Cambios de postura con frecuencia, estiramientos, acomodos en el asiento"
];

export default function ChecklistFatigaForm({
    servicioId,
    checklistExistente
}: ChecklistFatigaFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estado para datos del sistema
    const [userSession, setUserSession] = useState<UserSession | null>(null);

    // Información general
    const [fecha, setFecha] = useState<string>(
        checklistExistente?.fecha
            ? new Date(checklistExistente.fecha).toISOString().split('T')[0]
            : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
    );
    const [hora, setHora] = useState<string>(
        checklistExistente?.hora ||
        new Date().toTimeString().slice(0, 5)
    );
    const [lugarControl, setLugarControl] = useState(checklistExistente?.lugarControl || '');
    const [nombreConductor, setNombreConductor] = useState(checklistExistente?.nombreConductor || '');
    const [rut, setRut] = useState(checklistExistente?.rut || '');
    const [licenciaConducir, setLicenciaConducir] = useState(checklistExistente?.licenciaConducir || '');

    // Items - Inicializar desde checklistExistente o vacío
    const itemsExistentes = checklistExistente?.items || {};
    const seccionIExistente = itemsExistentes.SECCION_I || {};
    const seccionIIExistente = itemsExistentes.SECCION_II || {};

    const [seccionI, setSeccionI] = useState<Record<number, string>>(() => {
        const initial: Record<number, string> = {};
        AUTOEVALUACION_SECCION_I.forEach((_, index) => {
            initial[index] = seccionIExistente[index] || '';
        });
        return initial;
    });

    const [seccionII, setSeccionII] = useState<Record<number, string>>(() => {
        const initial: Record<number, string> = {};
        AUTOEVALUACION_SECCION_II.forEach((_, index) => {
            initial[index] = seccionIIExistente[index] || '';
        });
        return initial;
    });

    const [observaciones, setObservaciones] = useState(checklistExistente?.observaciones || '');

    // Cargar datos del usuario actual al montar el componente
    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                // Fetch sesión del usuario actual para obtener nombre y RUT
                const sessionRes = await fetch('/api/auth/session');
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    setUserSession(sessionData);

                    // Auto-llenar nombre del conductor y RUT si no están ya en el checklist existente
                    if (!checklistExistente) {
                        if (sessionData.name) {
                            setNombreConductor(sessionData.name);
                        }
                        if (sessionData.rut) {
                            setRut(sessionData.rut);
                        }
                    }
                }
            } catch (error) {
                console.error('Error al cargar sesión del usuario:', error);
            }
        };

        fetchUserSession();
    }, [checklistExistente]);

    // Verificar si todos los items están completados
    const todosItemsCompletados = () => {
        const seccionICompleta = AUTOEVALUACION_SECCION_I.every((_, index) => seccionI[index] !== '');
        const seccionIICompleta = AUTOEVALUACION_SECCION_II.every((_, index) => seccionII[index] !== '');
        return seccionICompleta && seccionIICompleta;
    };

    // Verificar si hay síntomas de fatiga (respuestas "SI" preocupantes)
    // Para Sección I: la pregunta 1 debería ser "SI" (apto), el resto "NO" es lo ideal
    // Para Sección II: todos deberían ser "NO" (sin síntomas)
    const hayIndicadoresFatiga = () => {
        // Pregunta 1 de Sección I debería ser SI
        if (seccionI[0] === 'NO') return true;

        // Preguntas 2-7 de Sección I deberían ser NO
        for (let i = 1; i < AUTOEVALUACION_SECCION_I.length; i++) {
            if (seccionI[i] === 'SI') return true;
        }

        // Todos los síntomas de Sección II deberían ser NO
        for (let i = 0; i < AUTOEVALUACION_SECCION_II.length; i++) {
            if (seccionII[i] === 'SI') return true;
        }

        return false;
    };

    const aptoParaTrabajar = todosItemsCompletados() && !hayIndicadoresFatiga();

    const handleSeccionIChange = (index: number, value: string) => {
        setSeccionI(prev => ({ ...prev, [index]: value }));
    };

    const handleSeccionIIChange = (index: number, value: string) => {
        setSeccionII(prev => ({ ...prev, [index]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones con mensajes específicos
        const camposFaltantes = [];
        if (!fecha || fecha.trim() === '') camposFaltantes.push('Fecha');
        if (!hora || hora.trim() === '') camposFaltantes.push('Hora');
        if (!lugarControl || lugarControl.trim() === '') camposFaltantes.push('Lugar de Control');
        if (!nombreConductor || nombreConductor.trim() === '') camposFaltantes.push('Nombre del Conductor');
        if (!rut || rut.trim() === '') camposFaltantes.push('RUT');

        if (camposFaltantes.length > 0) {
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`);
            return;
        }

        if (!todosItemsCompletados()) {
            setError('Debes responder todas las preguntas del cuestionario');
            return;
        }

        if (!aptoParaTrabajar && !observaciones.trim()) {
            setError('Si presentas síntomas de fatiga, debes proporcionar observaciones');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/servicios/${servicioId}/checklists/fatiga`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: new Date(fecha).toISOString(),
                    hora,
                    lugarControl,
                    nombreConductor,
                    rut,
                    items: {
                        SECCION_I: seccionI,
                        SECCION_II: seccionII
                    },
                    aptoParaTrabajar,
                    observaciones: observaciones.trim() || null,
                    requiereReemplazo: !aptoParaTrabajar,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar el checklist');
            }

            router.push(`/servicios/${servicioId}/checklists`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Título del formulario */}
            <div className="mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                    EVALUACIÓN DE FATIGA Y SOMNOLENCIA EN CONDUCTORES
                </h2>

            </div>

            {/* 1. INFORMACIÓN GENERAL */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mr-2">1</span>
                    INFORMACIÓN GENERAL
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="fecha"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
                            Hora <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            id="hora"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="lugarControl" className="block text-sm font-medium text-gray-700 mb-1">
                            Lugar de Control <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="lugarControl"
                            value={lugarControl}
                            onChange={(e) => setLugarControl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Ej: Terminal Puerto, Base Operaciones..."
                            required
                        />
                    </div>

                    {/* Nombre del conductor (auto-llenado desde sesión) */}
                    <div className="md:col-span-2">
                        <label htmlFor="nombreConductor" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Conductor <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="nombreConductor"
                            value={nombreConductor}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            placeholder="Nombre completo del conductor"
                            required
                        />
                        {userSession && (
                            <p className="mt-1 text-sm text-blue-600">
                                ✓ Datos obtenidos del usuario actual
                            </p>
                        )}
                    </div>

                    {/* RUT (auto-llenado desde sesión) */}
                    <div>
                        <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                            RUT <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="rut"
                            value={rut}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            placeholder="12.345.678-9"
                            required
                        />
                    </div>

                </div>
            </div>

            {/* 2. CUESTIONARIO DE AUTOEVALUACIÓN */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mr-2">2</span>
                    CUESTIONARIO DE AUTOEVALUACIÓN
                </h3>

                {/* Sección I */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 bg-gray-50 p-2 rounded">
                        I. Responda a las preguntas
                    </h4>
                    <div className="space-y-3">
                        {AUTOEVALUACION_SECCION_I.map((pregunta, index) => (
                            <div key={`secI-${index}`} className="border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-900 mb-3">
                                    {index + 1}. {pregunta}
                                </p>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`seccionI-${index}`}
                                            value="SI"
                                            checked={seccionI[index] === 'SI'}
                                            onChange={() => handleSeccionIChange(index, 'SI')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">SI</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`seccionI-${index}`}
                                            value="NO"
                                            checked={seccionI[index] === 'NO'}
                                            onChange={() => handleSeccionIChange(index, 'NO')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">NO</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección II */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 bg-gray-50 p-2 rounded">
                        II. ¿Durante la última media hora de conducción ha presentado algunos de estos síntomas?
                    </h4>
                    <div className="space-y-3">
                        {AUTOEVALUACION_SECCION_II.map((sintoma, index) => (
                            <div key={`secII-${index}`} className="border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-900 mb-3">
                                    {index + 1}. {sintoma}
                                </p>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`seccionII-${index}`}
                                            value="SI"
                                            checked={seccionII[index] === 'SI'}
                                            onChange={() => handleSeccionIIChange(index, 'SI')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">SI</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`seccionII-${index}`}
                                            value="NO"
                                            checked={seccionII[index] === 'NO'}
                                            onChange={() => handleSeccionIIChange(index, 'NO')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">NO</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. VALIDACIÓN */}
            {todosItemsCompletados() && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mr-2">3</span>
                        VALIDACIÓN
                    </h3>

                    <div className={`p-4 rounded-lg border-2 ${aptoParaTrabajar
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                        }`}>
                        <div className="flex items-start">
                            {aptoParaTrabajar ? (
                                <>
                                    <svg className="h-6 w-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-bold text-green-800">CONDUCTOR APTO PARA CONDUCIR</h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            No presenta síntomas de fatiga o somnolencia que impidan la conducción segura.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <svg className="h-6 w-6 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-bold text-red-800">SÍNTOMAS DE FATIGA DETECTADOS</h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            <strong>IMPORTANTE:</strong> Si presenta algunas de las condiciones descritas anteriormente es altamente probable que esté presentando síntomas de fatiga, por lo cual debe establecer acciones para su control.
                                        </p>
                                        <p className="text-sm text-red-700 mt-2 font-semibold">
                                            ⚠️ Se requiere evaluación adicional o reemplazo del conductor.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Observaciones */}
            <div className="mb-6">
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones {!aptoParaTrabajar && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder={aptoParaTrabajar
                        ? "Cualquier comentario adicional sobre la evaluación..."
                        : "Describa los síntomas presentados y las acciones de control recomendadas..."}
                    required={!aptoParaTrabajar}
                />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Guardando...' : 'Guardar Evaluación'}
                </button>
            </div>
        </form>
    );
}

