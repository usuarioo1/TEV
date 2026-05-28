'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TRACTO_CAMION_CRITICAL_ITEMS } from '@/lib/checklist-critical-items';

interface ChecklistTractoCamionFormProps {
    servicioId: number;
    checklistExistente?: any;
}

interface TractoCamion {
    id: number;
    patente: string;
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
        'Licencia de conducir',
        'Permiso de circulación',
        'Revisión técnica',
        'Seguro obligatorio',
        'Padrón',
    ],
    EPP: [
        'Casco de seguridad',
        'Protectores auditivos',
        'Respirador con filtros',
        'Barbiquejo de seguridad',
        'Cubre nuca',
        'Guantes de seguridad',
        'Botín de seguridad',
        'Geólogo reflectante',
        'Gafas de seguridad',
        'Protector solar',
        'Mascarilla',
        'Protector labial',
    ],
    LUCES_Y_MICAS: [
        'Intermitentes izquierdo/derecho',
        'Luces bajas/altas',
        'Neblineros delanteros/traseros',
        'Luces de freno',
        'Luces de estacionamiento',
        'Luces de navegación',
        'Micas',
        'Luz baliza y pértiga',
        'Luz altura y anchura',
        'Luz de cabina',
        'Foco faenero',
        'Luz patente',
    ],
    CONDICIONES_GENERALES: [
        'Asientos',
        'Instrumentos del tablero',
        'Tacógrafo',
        'Plumillas',
        'Manilla de apertura',
        'Pedales',
        'Palanca de cambio',
        'Sapitos (Limpia parabrisas)',
        'Aire acondicionado',
        'Piso',
        'Colchón',
        'Martillo de emergencia',
        'Freno de parqueo',
        'Freno de emergencia',
        'Freno de pedal',
        'Botón Hazard',
        'Viseras',
        'Cortinas',
        'Gráfica corporativa',
        'Bocina',
        'Alarma de retroceso',
        'Botiquín de primeros auxilios',
        'Caja de herramienta',
        'Cuñas de poliuretano x2',
        'Gata hidráulica',
        'Llave de tuerca',
        'Triángulos reflectantes x2',
        'Extintor de cabina',
        'Extintor exterior (10-6 kg)',
        'Espejos',
        'Número de identificación',
        'Sistema corta corriente',
        'Cinturones de seguridad',
        'Airbag frontales / laterales',
        'Parada de emergencia',
        'Cintas reflectantes laterales y portalón',
    ],
    MECANICA_Y_MOTOR: [
        'Nivel aceite motor',
        'Neumáticos (Todos los ejes y repuesto)',
        'Conexión hidráulica / eléctrica / aire',
        'Nivel de batería',
        'Lámina de seguridad con filtro UV',
        'Fugas de aire, líquidos o aceites',
        'Manubrio',
        'Peldaños',
        'Barandas de subida y bajada',
        'Pértiga',
        'Sensor de fatiga/somnolencia',
        'Tercer ojo',
        'Chaleco reflectante x2',
        'Alza vidrios',
        'Patentes x2',
        'Parabrisas',
        'Conos reflectantes x4',
        'GPS',
        'Líquidos (Freno / Embrague / Refrigerante)',
    ],
};

const SECTION_NAMES: Record<string, string> = {
    DOCUMENTACION: 'A. DOCUMENTACIÓN',
    EPP: 'B. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)',
    LUCES_Y_MICAS: 'C. LUCES Y MICAS',
    CONDICIONES_GENERALES: 'D. CONDICIONES GENERALES (CABINA Y SEGURIDAD)',
    MECANICA_Y_MOTOR: 'E. MECÁNICA Y MOTOR',
};

const CRITICAL_ITEMS: ReadonlySet<string> = new Set(TRACTO_CAMION_CRITICAL_ITEMS);

// Tipo de dato para cada item del checklist
type ItemData = {
    valor: 'SI' | 'NO' | 'N/A' | '';
    tieneObservacion: boolean;
    observacion: string;
    imagenes: Array<{ url: string, publicId: string }>;
};

type ItemStatus = 'SI' | 'NO' | 'N/A' | '';

export default function ChecklistTractoCamionForm({
    servicioId,
    checklistExistente
}: ChecklistTractoCamionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados para datos del sistema
    const [tractocamiones, setTractocamiones] = useState<TractoCamion[]>([]);
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Estados para Antecedentes Generales
    const [selectedTractoCamionId, setSelectedTractoCamionId] = useState<number | null>(null);
    const [patente, setPatente] = useState(checklistExistente?.patente || '');
    const [anio, setAnio] = useState(checklistExistente?.anio || '');
    const [nombreConductor, setNombreConductor] = useState(checklistExistente?.nombreConductor || '');
    const [rut, setRut] = useState(checklistExistente?.rut || '');
    const [fecha, setFecha] = useState(
        checklistExistente?.fecha
            ? new Date(checklistExistente.fecha).toISOString().split('T')[0]
            : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
    );
    const [kilometraje, setKilometraje] = useState(checklistExistente?.kilometraje || '');

    // Cargar datos del sistema al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch tractocamiones activos
                const tractocamionesRes = await fetch('/api/equipos/tractocamiones');
                if (tractocamionesRes.ok) {
                    const data = await tractocamionesRes.json();
                    setTractocamiones(data.filter((t: TractoCamion) => t.activo));
                }

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
                console.error('Error al cargar datos:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [checklistExistente]);

    // Manejar selección de tractocamión
    const handleTractoCamionChange = (tractoCamionId: string) => {
        if (!tractoCamionId) {
            setSelectedTractoCamionId(null);
            setPatente('');
            setAnio('');
            return;
        }

        const id = parseInt(tractoCamionId);
        setSelectedTractoCamionId(id);

        const tractoCamion = tractocamiones.find(t => t.id === id);
        if (tractoCamion) {
            setPatente(tractoCamion.patente);
            setAnio(tractoCamion.año.toString());
        }
    };

    // Estado para los items de inspección
    const [items, setItems] = useState<Record<string, Record<string, ItemData>>>(() => {
        // Inicializar con valores vacíos para todas las secciones vigentes.
        // Esto permite incorporar nuevos items en checklists antiguos.
        const initialItems: Record<string, Record<string, ItemData>> = {};
        Object.entries(CHECKLIST_ITEMS).forEach(([seccion, itemList]) => {
            initialItems[seccion] = {};
            itemList.forEach(item => {
                initialItems[seccion][item] = {
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

            Object.entries(existing).forEach(([seccion, itemsObj]: [string, any]) => {
                if (!initialItems[seccion]) {
                    initialItems[seccion] = {};
                }

                Object.entries(itemsObj).forEach(([itemName, value]: [string, any]) => {
                    // Si ya está en el nuevo formato
                    if (typeof value === 'object' && value !== null && 'valor' in value) {
                        initialItems[seccion][itemName] = {
                            ...value,
                            imagenes: value.imagenes || []
                        };
                    } else {
                        // Si está en formato antiguo (solo string)
                        initialItems[seccion][itemName] = {
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

    const [observacionesGenerales, setObservacionesGenerales] = useState(checklistExistente?.observacionesGenerales || '');
    const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

    const conductorSoloLectura = Boolean(checklistExistente) || Boolean(userSession?.name);
    const rutSoloLectura = Boolean(checklistExistente) || Boolean(userSession?.rut);

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
    const handleImagenesChange = async (seccion: string, item: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        const key = `${seccion}-${item}`;
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
                    folder: 'checklists/tracto-camion',
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
                [seccion]: {
                    ...prev[seccion],
                    [item]: {
                        ...prev[seccion][item],
                        imagenes: [...prev[seccion][item].imagenes, ...uploadData.images]
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
    const handleRemoveImagen = (seccion: string, item: string, index: number) => {
        setItems(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                [item]: {
                    ...prev[seccion][item],
                    imagenes: prev[seccion][item].imagenes.filter((_, i) => i !== index)
                }
            }
        }));
    };

    // Función para actualizar el valor principal de un item
    const handleItemChange = (seccion: string, item: string, status: ItemStatus) => {
        setItems(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                [item]: {
                    ...prev[seccion][item],
                    valor: status,
                }
            }
        }));
    };

    // Función para actualizar el checkbox de observación
    const handleObservacionCheckChange = (seccion: string, item: string, checked: boolean) => {
        setItems(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                [item]: {
                    ...prev[seccion][item],
                    tieneObservacion: checked,
                    observacion: checked ? prev[seccion][item].observacion : ''
                }
            }
        }));
    };

    // Función para actualizar el texto de observación específica
    const handleObservacionTextChange = (seccion: string, item: string, text: string) => {
        setItems(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                [item]: {
                    ...prev[seccion][item],
                    observacion: text
                }
            }
        }));
    };

    // Calcular si hay algún item marcado como NO
    const hayItemsNO = () => {
        for (const seccion in items) {
            for (const item in items[seccion]) {
                if (items[seccion][item].valor === 'NO') {
                    return true;
                }
            }
        }
        return false;
    };

    const esItemCritico = (_seccion: string, item: string) => {
        return CRITICAL_ITEMS.has(item);
    };

    const hayItemsCriticosNO = () => {
        for (const seccion in items) {
            for (const item in items[seccion]) {
                if (esItemCritico(seccion, item) && items[seccion][item].valor === 'NO') {
                    return true;
                }
            }
        }
        return false;
    };

    // Validar que todos los items estén completados
    const todosItemsCompletados = () => {
        for (const seccion in items) {
            for (const item in items[seccion]) {
                const itemData = items[seccion][item];
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
        if (!patente || !anio || !nombreConductor || !rut || !fecha || !kilometraje) {
            setError('Todos los campos de antecedentes generales son obligatorios');
            return;
        }

        if (!todosItemsCompletados()) {
            setError('Debes completar todos los items de inspección (SI, NO u OB) y agregar texto en las observaciones específicas marcadas');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/servicios/${servicioId}/checklists/tracto-camion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patente,
                    anio,
                    nombreConductor,
                    rut,
                    fecha,
                    kilometraje,
                    items,
                    observacionesGenerales,
                }),
            });

            let data: { message?: string } | null = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(data?.message || 'Error al guardar el checklist');
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
                    CHECK LIST TRACTO CAMION
                </h2>
                <p className="text-sm text-gray-600 mt-1">BALAP TRANSPORTES</p>
            </div>

            {/* 1. Antecedentes Generales */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    1. ANTECEDENTES GENERALES
                </h3>

                {loadingData ? (
                    <div className="text-center py-4">
                        <p className="text-gray-500">Cargando información...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selector de Tractocamión */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seleccionar Tractocamión <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedTractoCamionId || ''}
                                onChange={(e) => handleTractoCamionChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                                disabled={!!checklistExistente}
                            >
                                <option value="">-- Seleccione un tractocamión --</option>
                                {tractocamiones.map((tracto) => (
                                    <option key={tracto.id} value={tracto.id}>
                                        {tracto.patente} - {tracto.marca} ({tracto.año})
                                    </option>
                                ))}
                            </select>
                            {checklistExistente && (
                                <p className="mt-1 text-sm text-gray-500">
                                    El tractocamión no puede ser modificado en un checklist existente
                                </p>
                            )}
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

                        {/* Nombre del conductor (auto-llenado desde sesión) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del conductor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nombreConductor}
                                readOnly={conductorSoloLectura}
                                onChange={(e) => setNombreConductor(e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${conductorSoloLectura
                                    ? 'bg-gray-50 text-gray-700'
                                    : 'text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    }`}
                                placeholder={conductorSoloLectura ? '' : 'Ingresa nombre del conductor'}
                                required
                            />
                            {userSession?.name && (
                                <p className="mt-1 text-sm text-blue-600">
                                    ✓ Datos obtenidos del usuario actual
                                </p>
                            )}
                            {!checklistExistente && !userSession?.name && (
                                <p className="mt-1 text-sm text-amber-700">
                                    No se encontró nombre en tu perfil. Ingresalo manualmente.
                                </p>
                            )}
                        </div>

                        {/* RUT (auto-llenado desde sesión) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                RUT <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={rut}
                                readOnly={rutSoloLectura}
                                onChange={(e) => setRut(e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${rutSoloLectura
                                    ? 'bg-gray-50 text-gray-700'
                                    : 'text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    }`}
                                placeholder={rutSoloLectura ? '' : 'Ingresa RUT del conductor'}
                                required
                            />
                            {!checklistExistente && !userSession?.rut && (
                                <p className="mt-1 text-sm text-amber-700">
                                    No se encontró RUT en tu perfil. Ingresalo manualmente.
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

                        {/* Kilometraje */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kilometraje <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={kilometraje}
                                onChange={(e) => setKilometraje(e.target.value)}
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
                    2. CRITERIOS DE EVALUACIÓN
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>SI:</strong> Cumple / Buen estado</li>
                    <li><strong>NO:</strong> No cumple / Mal estado</li>
                    <li><strong>N/A:</strong> No aplica</li>
                    <li className="text-blue-700 mt-2">✓ Puedes marcar "Con observación adicional" para agregar detalles específicos a cualquier item</li>
                </ul>
            </div>

            {/* 3. Secciones de Inspección */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    3. SECCIONES DE INSPECCIÓN
                </h3>

                {Object.entries(CHECKLIST_ITEMS).map(([seccion, itemList]) => (
                    <div key={seccion} className="mb-6">
                        <h4 className={`text-md font-bold mb-3 p-2 rounded ${itemList.some((item) => CRITICAL_ITEMS.has(item))
                            ? 'text-red-900 bg-red-100 border border-red-200'
                            : 'text-gray-800 bg-gray-100'
                            }`}>
                            {SECTION_NAMES[seccion]}
                            {itemList.some((item) => CRITICAL_ITEMS.has(item)) && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900">
                                    Incluye items criticos
                                </span>
                            )}
                        </h4>
                        {itemList.some((item) => CRITICAL_ITEMS.has(item)) && (
                            <p className="mb-3 text-sm font-medium text-red-700">
                                Esta seccion incluye items criticos. Si alguno se marca como NO, debe corregirse de inmediato.
                            </p>
                        )}
                        <div className="space-y-3">
                            {itemList.map((item) => {
                                const itemData = items[seccion]?.[item];
                                const itemEsCritico = esItemCritico(seccion, item);
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
                                                            name={`${seccion}-${item}`}
                                                            checked={itemData?.valor === status}
                                                            onChange={() => handleItemChange(seccion, item, status as ItemStatus)}
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
                                                id={`obs-check-${seccion}-${item}`}
                                                checked={itemData?.tieneObservacion || false}
                                                onChange={(e) => handleObservacionCheckChange(seccion, item, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                            />
                                            <label
                                                htmlFor={`obs-check-${seccion}-${item}`}
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
                                                    onChange={(e) => handleObservacionTextChange(seccion, item, e.target.value)}
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
                                                onChange={(e) => handleImagenesChange(seccion, item, e.target.files)}
                                                disabled={uploadingImages[`${seccion}-${item}`]}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                            />
                                            {uploadingImages[`${seccion}-${item}`] && (
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
                                                                onClick={() => handleRemoveImagen(seccion, item, idx)}
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
                            Describe los problemas en el campo de observaciones generales.
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
                            Alerta critica: Hay no conformidades en items criticos del checklist de tracto camion.
                        </span>
                    </div>
                </div>
            )}

            {/* 4. Observaciones Generales */}
            <div className="mb-6">
                <label htmlFor="observacionesGenerales" className="block text-sm font-medium text-gray-700 mb-2">
                    4. OBSERVACIONES GENERALES {hayItemsNO() && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    id="observacionesGenerales"
                    value={observacionesGenerales}
                    onChange={(e) => setObservacionesGenerales(e.target.value)}
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
