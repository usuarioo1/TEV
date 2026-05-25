'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';
import { SEMIREMOLQUE_CRITICAL_ITEMS } from '@/lib/checklist-critical-items';

interface ChecklistEquipoFormProps {
    servicioId: number;
    checklistExistente?: any;
}

interface Semiremolque {
    id: number;
    patente: string;
    tipo: string;
    marca: string;
    año: number;
    activo: boolean;
}

interface UserSession {
    id: number;
    username: string;
    name: string | null;
    rut: string | null;
    rol: string;
}

// Estructura del checklist según el documento
const CHECKLIST_ITEMS = {
    DOCUMENTACION: [
        'Permiso de circulación',
        'Revisión técnica',
        'Seguro obligatorio',
        'Padrón',
    ],
    CONEXIONES: [
        'Conexión de aire (mangueras x2)',
        'Conexión eléctrica (Enchufe y chicote eléctrico)',
        'Sin fugas de aire',
        'Manos de acople',
    ],
    NEUMÁTICOS: [
        'Estado de neumáticos por eje',
        'Presión de Aire de neumáticos por eje',
        'Neumáticos de repuesto',
        'Tuercas de neumáticos',
        'Seguro de tuercas',
    ],
    GENERAL: [
        'Aseo General',
        'Código interno empresa',
        'Cinta reflectante lateral',
        'Cintas reflectante portalón (roja y blanca)',
        'Luces (Estacionamiento, intermitentes, freno, focos, etc.)',
        'Alarma de retroceso',
        'Escalera de acceso',
        'Caja de herramientas',
        'Estado de plataforma',
        'Barandas y pilares',
        'Fijadores de barandas y seguros',
        'Patas de apoyo',
        'Parapeto',
        'Barras anti-empotramiento',
        'Extintor PQS',
        'Cadena antiestática',
        'Perfil protector baranda',
    ],
    ESTRUCTURA: [
        'Soldaduras y uniones',
        'Bujes de tensores de ejes',
        'Pulmón de suspensión y bases',
        'Paquete de resortes (hojas quebradas)',
        'Viga H madre',
        'Juego de balancín',
        'Perno rey',
        'Parachoques',
    ],
    FIJACIÓN: [
        'Ojales o puntos de amarre',
        'Conos de Seguridad (x4)',
    ],
};

const SECTION_NAMES: Record<string, string> = {
    DOCUMENTACION: 'DOCUMENTACION',
    CONEXIONES: 'CONEXIONES',
    NEUMÁTICOS: 'NEUMÁTICOS',
    GENERAL: 'GENERAL',
    ESTRUCTURA: 'ESTRUCTURA',
    FIJACIÓN: 'FIJACIÓN',
};

const CRITICAL_ITEMS: ReadonlySet<string> = new Set(SEMIREMOLQUE_CRITICAL_ITEMS);

// Tipo de dato para cada item del checklist
type ItemData = {
    valor: 'SI' | 'NO' | 'N/A' | '';
    tieneObservacion: boolean;
    observacion: string;
    imagenes: Array<{ url: string, publicId: string }>;
};

type ItemStatus = 'SI' | 'NO' | 'N/A' | '';

export default function ChecklistEquipoForm({
    servicioId,
    checklistExistente
}: ChecklistEquipoFormProps) {
    const router = useRouter();
    const { session: userSession } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados para datos del sistema
    const [semiremolques, setSemiremolques] = useState<Semiremolque[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Estados para Identificación del Equipo y Personal
    const [selectedSemiremolqueId, setSelectedSemiremolqueId] = useState<number | null>(null);
    const [marcaModelo, setMarcaModelo] = useState(checklistExistente?.marcaModelo || '');
    const [patente, setPatente] = useState(checklistExistente?.patente || '');
    const [anio, setAnio] = useState(checklistExistente?.anio || '');
    const [horometro, setHorometro] = useState(checklistExistente?.horometro || '');
    const [kilometraje, setKilometraje] = useState(checklistExistente?.kilometraje || '');
    const [conductor, setConductor] = useState(checklistExistente?.conductor || '');
    const [fecha, setFecha] = useState(
        checklistExistente?.fecha
            ? new Date(checklistExistente.fecha).toISOString().split('T')[0]
            : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
    );
    const [hora, setHora] = useState(() => {
        if (checklistExistente?.hora) {
            return checklistExistente.hora;
        }
        // Obtener hora actual en formato HH:mm para el input type="time"
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    });

    // Cargar datos del sistema al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch semirremolques activos
                const semiremolquesRes = await fetch('/api/equipos/semirremolques');
                if (semiremolquesRes.ok) {
                    const data = await semiremolquesRes.json();
                    setSemiremolques(data.filter((s: Semiremolque) => s.activo));
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [checklistExistente]);

    // Auto-llenar conductor cuando la sesión esté disponible
    useEffect(() => {
        if (!checklistExistente && userSession?.name) {
            setConductor(userSession.name);
        }
    }, [userSession, checklistExistente]);

    // Manejar selección de semirremolque
    const handleSemiremolqueChange = (semiremolqueId: string) => {
        if (!semiremolqueId) {
            setSelectedSemiremolqueId(null);
            setMarcaModelo('');
            setPatente('');
            setAnio('');
            return;
        }

        const id = parseInt(semiremolqueId);
        setSelectedSemiremolqueId(id);

        const semiremolque = semiremolques.find(s => s.id === id);
        if (semiremolque) {
            setMarcaModelo(`${semiremolque.marca} - ${getTipoLabel(semiremolque.tipo)}`);
            setPatente(semiremolque.patente);
            setAnio(semiremolque.año.toString());
        }
    };

    // Helper para obtener el label del tipo de semirremolque
    const getTipoLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            'rampa_plana': 'Rampa Plana',
            'drop_deck': 'Drop Deck',
            'lowboy': 'Lowboy',
            'portacontenedor': 'Portacontenedor',
            'porta_contenedor': 'Porta Contenedor',
            'tolva': 'Tolva',
            'refrigerado': 'Refrigerado',
            'palote': 'Palote',
            'neumatiquera': 'Neumatiquera',
        };
        return tipos[tipo] || tipo;
    };

    // Estado para los items de inspección
    const [items, setItems] = useState<Record<string, Record<string, ItemData>>>(() => {
        // Inicializar con valores vacíos para todas las secciones vigentes.
        // Esto permite incorporar nuevas secciones en checklists antiguos.
        const initialItems: Record<string, Record<string, ItemData>> = {};
        Object.entries(CHECKLIST_ITEMS).forEach(([categoria, itemList]) => {
            initialItems[categoria] = {};
            itemList.forEach(item => {
                initialItems[categoria][item] = {
                    valor: '',
                    tieneObservacion: false,
                    observacion: '',
                    imagenes: []
                };
            });
        });

        if (checklistExistente?.items) {
            // Convertir datos existentes al nuevo formato si es necesario
            const existing = checklistExistente.items;

            Object.entries(existing).forEach(([categoria, itemsObj]: [string, any]) => {
                if (!initialItems[categoria]) {
                    initialItems[categoria] = {};
                }

                Object.entries(itemsObj).forEach(([itemName, value]: [string, any]) => {
                    // Si ya está en el nuevo formato
                    if (typeof value === 'object' && value !== null && 'valor' in value) {
                        initialItems[categoria][itemName] = {
                            ...value,
                            imagenes: value.imagenes || []
                        };
                    } else {
                        // Si está en formato antiguo (solo string)
                        initialItems[categoria][itemName] = {
                            valor: value as ItemStatus,
                            tieneObservacion: false,
                            observacion: '',
                            imagenes: []
                        };
                    }
                });
            });
            return initialItems;
        }

        return initialItems;
    });

    const [observaciones, setObservaciones] = useState(checklistExistente?.observaciones || '');
    const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

    // Función para convertir File a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Función para manejar la subida de imágenes para un item
    const handleImagenesChange = async (categoria: string, item: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        const key = `${categoria}-${item}`;
        setUploadingImages(prev => ({ ...prev, [key]: true }));
        setError('Subiendo imágenes...');

        try {
            // Convertir todas las imágenes a base64
            const base64Images = await Promise.all(
                Array.from(files).map(img => fileToBase64(img))
            );

            // Subir a Cloudinary
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: base64Images,
                    folder: 'checklists/equipo',
                }),
            });

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.json();
                throw new Error(uploadError.error || 'Error al subir imágenes');
            }

            const uploadData = await uploadResponse.json();

            // Agregar las nuevas imágenes al item
            setItems(prev => ({
                ...prev,
                [categoria]: {
                    ...prev[categoria],
                    [item]: {
                        ...prev[categoria][item],
                        imagenes: [...prev[categoria][item].imagenes, ...uploadData.images]
                    }
                }
            }));

            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingImages(prev => ({ ...prev, [key]: false }));
        }
    };

    // Función para eliminar una imagen de un item
    const handleRemoveImagen = (categoria: string, item: string, index: number) => {
        setItems(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                [item]: {
                    ...prev[categoria][item],
                    imagenes: prev[categoria][item].imagenes.filter((_, i) => i !== index)
                }
            }
        }));
    };

    // Función para actualizar el valor principal de un item
    const handleItemChange = (categoria: string, item: string, status: ItemStatus) => {
        setItems(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                [item]: {
                    ...prev[categoria][item],
                    valor: status,
                }
            }
        }));
    };

    // Función para actualizar el checkbox de observación
    const handleObservacionCheckChange = (categoria: string, item: string, checked: boolean) => {
        setItems(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                [item]: {
                    ...prev[categoria][item],
                    tieneObservacion: checked,
                    observacion: checked ? prev[categoria][item].observacion : ''
                }
            }
        }));
    };

    // Función para actualizar el texto de observación específica
    const handleObservacionTextChange = (categoria: string, item: string, text: string) => {
        setItems(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                [item]: {
                    ...prev[categoria][item],
                    observacion: text
                }
            }
        }));
    };

    // Calcular si hay algún item marcado como NO
    const hayItemsNO = () => {
        for (const categoria in items) {
            for (const item in items[categoria]) {
                if (items[categoria][item].valor === 'NO') {
                    return true;
                }
            }
        }
        return false;
    };

    const esItemCritico = (_categoria: string, item: string) => {
        return CRITICAL_ITEMS.has(item);
    };

    const hayItemsCriticosNO = () => {
        for (const categoria in items) {
            for (const item in items[categoria]) {
                if (esItemCritico(categoria, item) && items[categoria][item].valor === 'NO') {
                    return true;
                }
            }
        }
        return false;
    };

    // Validar que todos los items estén completados
    const todosItemsCompletados = () => {
        for (const categoria in items) {
            for (const item in items[categoria]) {
                const itemData = items[categoria][item];
                // Validar que tenga valor
                if (!itemData.valor) {
                    return false;
                }
                // Si tiene observación marcada, debe tener texto
                if (itemData.tieneObservacion && !itemData.observacion.trim()) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!marcaModelo || !patente || !anio || !conductor || !fecha || !hora) {
            setError('Todos los campos de identificación del equipo son obligatorios');
            return;
        }

        if (!todosItemsCompletados()) {
            setError('Debes completar todos los items de inspección (SI, NO o OB) y agregar texto en las observaciones específicas marcadas');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/servicios/${servicioId}/checklists/equipo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marcaModelo,
                    patente,
                    anio,
                    kilometraje,
                    conductor,
                    fecha,
                    hora,
                    items,
                    observaciones,
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

            {/* Título */}
            <div className="mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                    CHECK LIST OPERATIVO RAMPLA PLANA Y DROP DECK
                </h2>
            </div>

            {/* 1. Identificación del Equipo y Personal */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    1. Identificación del Equipo y Personal
                </h3>

                {loadingData ? (
                    <div className="text-center py-4">
                        <p className="text-gray-500">Cargando información...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selector de Semirremolque */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seleccionar Semirremolque <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedSemiremolqueId || ''}
                                onChange={(e) => handleSemiremolqueChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                                disabled={!!checklistExistente}
                            >
                                <option value="">-- Seleccione un semirremolque --</option>
                                {semiremolques.map((semi) => (
                                    <option key={semi.id} value={semi.id}>
                                        {semi.patente} - {semi.marca} {getTipoLabel(semi.tipo)} ({semi.año})
                                    </option>
                                ))}
                            </select>
                            {checklistExistente && (
                                <p className="mt-1 text-sm text-gray-500">
                                    El semirremolque no puede ser modificado en un checklist existente
                                </p>
                            )}
                        </div>

                        {/* Marca/Modelo (auto-llenado) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marca/Modelo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={marcaModelo}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                                required
                            />
                        </div>

                        {/* Patente (auto-llenado) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Patente <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={patente}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                                required
                            />
                        </div>

                        {/* Año (auto-llenado) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Año <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={anio}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                                required
                            />
                        </div>

                        {/* Kilometraje (opcional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kilometraje
                            </label>
                            <input
                                type="text"
                                value={kilometraje}
                                onChange={(e) => setKilometraje(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            />
                        </div>

                        {/* Conductor (auto-llenado desde sesión) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Conductor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={conductor}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                                required
                            />
                            {userSession && (
                                <p className="mt-1 text-sm text-blue-600">
                                    ✓ Datos obtenidos del usuario actual
                                </p>
                            )}
                        </div>

                        {/* Fecha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                            />
                        </div>

                        {/* Hora */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hora <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Criterios de Evaluación */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Criterios de Evaluación
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>SI:</strong> Cumple / Buen estado</li>
                    <li><strong>NO:</strong> No cumple / Requiere atención</li>
                    <li><strong>N/A:</strong> No aplica</li>
                    <li className="text-blue-700 mt-2">✓ Puedes marcar "Con observación adicional" para agregar detalles específicos a cualquier item</li>
                </ul>
            </div>

            {/* 3. Matriz de Inspección Técnica */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    3. Matriz de Inspección Técnica
                </h3>

                {Object.entries(CHECKLIST_ITEMS).map(([categoria, itemList]) => (
                    <div key={categoria} className="mb-6">
                        <h4 className={`text-md font-bold mb-3 p-2 rounded ${categoria === 'DOCUMENTACION'
                            ? 'text-red-900 bg-red-100 border border-red-200'
                            : 'text-gray-800 bg-gray-100'
                            }`}>
                            {SECTION_NAMES[categoria] || categoria}
                            {categoria === 'DOCUMENTACION' && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900">
                                    Ambito critico
                                </span>
                            )}
                        </h4>
                        {categoria === 'DOCUMENTACION' && (
                            <p className="mb-3 text-sm font-medium text-red-700">
                                Esta seccion es critica. Si algun documento se marca como NO, debe corregirse de inmediato.
                            </p>
                        )}
                        <div className="space-y-3">
                            {itemList.map((item) => {
                                const itemData = items[categoria]?.[item];
                                const itemEsCritico = esItemCritico(categoria, item);
                                return (
                                    <div key={item} className={`border rounded-lg p-3 hover:bg-gray-50 ${itemEsCritico ? 'border-red-200 bg-red-50/40' : 'border-gray-200'}`}>
                                        {/* Línea principal con el item y los radio buttons */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm flex-1 ${itemEsCritico ? 'font-semibold text-red-800' : 'text-gray-700'}`}>
                                                {item}
                                                {itemEsCritico && (
                                                    <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                                                        Critico
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex items-center space-x-4 ml-4">
                                                {['SI', 'NO', 'N/A'].map((status) => (
                                                    <label key={status} className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`${categoria}-${item}`}
                                                            checked={itemData?.valor === status}
                                                            onChange={() => handleItemChange(categoria, item, status as ItemStatus)}
                                                            className={`h-4 w-4 focus:ring-2 ${status === 'SI'
                                                                ? 'text-green-600 focus:ring-green-500'
                                                                : status === 'NO'
                                                                    ? 'text-red-600 focus:ring-red-500'
                                                                    : 'text-yellow-600 focus:ring-yellow-500'
                                                                }`}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 min-w-8">
                                                            {status}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Checkbox para observación adicional */}
                                        <div className="flex items-center mt-2 ml-2">
                                            <input
                                                type="checkbox"
                                                id={`obs-check-${categoria}-${item}`}
                                                checked={itemData?.tieneObservacion || false}
                                                onChange={(e) => handleObservacionCheckChange(categoria, item, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                            />
                                            <label
                                                htmlFor={`obs-check-${categoria}-${item}`}
                                                className="ml-2 text-xs text-gray-600 cursor-pointer"
                                            >
                                                Con observación adicional
                                            </label>
                                        </div>

                                        {/* Campo de texto condicional */}
                                        {itemData?.tieneObservacion && (
                                            <div className="mt-2 ml-2">
                                                <textarea
                                                    value={itemData.observacion}
                                                    onChange={(e) => handleObservacionTextChange(categoria, item, e.target.value)}
                                                    placeholder="Describe la observación específica para este item..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-black"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Input de imágenes */}
                                        <div className="mt-3 ml-2">
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Adjuntar imágenes (opcional)
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => handleImagenesChange(categoria, item, e.target.files)}
                                                disabled={uploadingImages[`${categoria}-${item}`]}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                            />
                                            {uploadingImages[`${categoria}-${item}`] && (
                                                <p className="mt-1 text-xs text-blue-600">Subiendo imágenes...</p>
                                            )}
                                        </div>

                                        {/* Vista previa de imágenes */}
                                        {itemData?.imagenes && itemData.imagenes.length > 0 && (
                                            <div className="mt-2 ml-2">
                                                <p className="text-xs text-gray-600 mb-2">Imágenes adjuntas:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {itemData.imagenes.map((imagen, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img
                                                                src={imagen.url}
                                                                alt={`Imagen ${idx + 1}`}
                                                                className="w-20 h-20 object-cover rounded border border-gray-300"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImagen(categoria, item, idx)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Eliminar imagen"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerta si hay NO */}
            {hayItemsNO() && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-sm font-medium text-red-800">
                            Atención: Se han detectado items marcados como NO.
                            Describe los problemas en el campo de observaciones.
                        </span>
                    </div>
                </div>
            )}

            {hayItemsCriticosNO() && (
                <div className="mb-6 bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-sm font-semibold text-red-800">
                            Alerta critica: Hay no conformidades en items criticos del checklist de equipo.
                        </span>
                    </div>
                </div>
            )}

            {/* 4. Observaciones */}
            <div className="mb-6">
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                    4. Observaciones {hayItemsNO() && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Describe cualquier hallazgo, especialmente si hay items marcados como NO..."
                    required={hayItemsNO()}
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
                    {loading ? 'Guardando...' : 'Guardar Checklist'}
                </button>
            </div>
        </form>
    );
}
