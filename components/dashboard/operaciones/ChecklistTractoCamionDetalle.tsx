'use client';

import { ChecklistTractoCamion } from './types';

interface Props {
    checklist: ChecklistTractoCamion;
}

// Estructura del checklist según el componente del formulario
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

type ItemStatus = 'SI' | 'NO' | 'OB' | 'N/A';

const getBadgeColor = (status: ItemStatus) => {
    switch (status) {
        case 'SI':
            return 'bg-green-100 text-green-800';
        case 'NO':
            return 'bg-red-100 text-red-800';
        case 'OB':
            return 'bg-yellow-100 text-yellow-800';
        case 'N/A':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusText = (status: ItemStatus) => {
    switch (status) {
        case 'SI':
            return 'SÍ';
        case 'NO':
            return 'NO';
        case 'OB':
            return 'OBSERVACIÓN';
        case 'N/A':
            return 'N/A';
        default:
            return status;
    }
};

export default function ChecklistTractoCamionDetalle({ checklist }: Props) {
    const items = checklist.items as Record<string, Record<string, ItemStatus>>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                            CHECK LIST TRACTO CAMIONES - SEMANAL
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Inspección semanal de tracto camión
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${checklist.equipoEnCondiciones
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                    >
                        {checklist.equipoEnCondiciones ? '✓ Equipo OK' : '✗ Con Fallas'}
                    </span>
                </div>
            </div>

            {/* Antecedentes Generales */}
            <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                    Antecedentes Generales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Patente</p>
                        <p className="text-sm font-semibold text-gray-900">{checklist.patente}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Año</p>
                        <p className="text-sm font-semibold text-gray-900">{checklist.anio}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Nombre Conductor</p>
                        <p className="text-sm font-semibold text-gray-900">{checklist.nombreConductor}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">RUT</p>
                        <p className="text-sm font-semibold text-gray-900">{checklist.rut}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Fecha</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {new Date(checklist.fecha).toLocaleDateString('es-CL')}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Kilometraje</p>
                        <p className="text-sm font-semibold text-gray-900">{checklist.kilometraje} km</p>
                    </div>
                </div>
            </div>

            {/* Secciones de Inspección */}
            {Object.entries(CHECKLIST_ITEMS).map(([sectionKey, itemsList]) => {
                const sectionData = items[sectionKey] || {};

                return (
                    <div key={sectionKey} className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                            {SECTION_NAMES[sectionKey]}
                        </h4>
                        <div className="space-y-2">
                            {itemsList.map((item) => {
                                const itemData: any = sectionData[item];

                                // Manejar tanto el formato nuevo (objeto) como el antiguo (string)
                                const valor = typeof itemData === 'object' && itemData !== null ? itemData.valor : itemData;
                                const tieneObservacion = typeof itemData === 'object' && itemData !== null ? itemData.tieneObservacion : false;
                                const observacion = typeof itemData === 'object' && itemData !== null ? itemData.observacion : '';
                                const imagenes = typeof itemData === 'object' && itemData !== null && itemData.imagenes ? itemData.imagenes : [];

                                return (
                                    <div key={item} className="py-2 px-3 hover:bg-gray-50 rounded">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">{item}</span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(
                                                    valor as ItemStatus
                                                )}`}
                                            >
                                                {getStatusText(valor as ItemStatus)}
                                            </span>
                                        </div>
                                        {tieneObservacion && observacion && (
                                            <div className="mt-2 ml-4 p-2 bg-blue-50 border-l-2 border-blue-300 rounded">
                                                <p className="text-xs font-medium text-blue-700">Observación específica:</p>
                                                <p className="text-xs text-blue-900 mt-1">{observacion}</p>
                                            </div>
                                        )}
                                        {imagenes && imagenes.length > 0 && (
                                            <div className="mt-2 ml-4">
                                                <p className="text-xs font-medium text-gray-700 mb-2">Fotografías:</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {imagenes.map((img: any, idx: number) => (
                                                        <a
                                                            key={idx}
                                                            href={img.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                                                        >
                                                            <img
                                                                src={img.url}
                                                                alt={`Foto ${idx + 1} de ${item}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Observaciones Generales */}
            {checklist.observacionesGenerales && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">Observaciones Generales</h4>
                    <p className="text-sm text-yellow-800">{checklist.observacionesGenerales}</p>
                </div>
            )}
        </div>
    );
}
