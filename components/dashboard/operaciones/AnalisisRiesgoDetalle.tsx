import { AnalisisRiesgo } from './types';
import AnalisisRiesgoSupervisorDetalleV2 from '@/components/supervisor/AnalisisRiesgoSupervisorDetalleV2';

// Constantes de textos de riesgos potenciales (26 riesgos del formulario)
const RIESGOS_POTENCIALES_TEXTOS = [
    "Atrapamiento Enganche o aprisionamiento del cuerpo, o parte de éste, por mecanismos de las máquinas, objetos, piezas, materiales, equipos o vehículos que han perdido su estabilidad.",
    "Caída al mismo nivel. Que se produce en el mismo plano de sustentación Ej.: Terreno piso irregular, piso mojado.",
    "Caída a distinto nivel. Caída a un plano inferior de sustentación desde una altura no superior a 1,8 mts.",
    "Caída de altura. Caída a un plano inferior de sustentación, desde una altura superior a 1,8 mts.",
    "Caída de objetos. Caída de elementos que golpean al cuerpo, por ejemplo, materiales, herramientas, estructuras, etc.",
    "Cortes por objetos / herramientas cortantes, y/o abrasivos. (Esmeriles, sierras, amoladoras, taladros, etc.)",
    "Golpe por objetos / Herramientas (Ej.: Martillo, alicate, desatornillador, pala, etc.)",
    "Choque contra objetos Encuentro violento del cuerpo, o de una parte de éste, con uno o varios objetos, estén éstos en movimiento o no.",
    "Contactos térmicos por calor o frio, contacto físico con superficies o productos a temperaturas extremas (calientes o frías).",
    "Contacto con energía eléctrica. Ej.: Extensiones, tableros eléctricos generales, herramientas eléctricas, etc.",
    "Contacto con fluido a presión. Ej.: agua, aire, gases, vapor, aceites hidráulicos.",
    "Contacto con sustancias cáusticas y/o corrosivas Tocar sustancias que puedan producir reacciones alérgicas y/o lesiones externas en la piel.",
    "Explosiones Liberación brusca de gran cantidad de energía que produce un incremento violento y rápido de la presión.",
    "Proyección de fragmentos y/o partículas Contacto violento del cuerpo, o una parte de éste, con elementos proyectados como: piezas, fragmentos, partículas o líquido. (Ej.: virutas, partículas incandescentes, escorias, etc.)",
    "Atropellos o golpes con vehículos Impacto entre un peatón y un vehículo en movimiento (interacción hombre máquina) Ej.: camión, maquinas, grúa horquilla, etc.",
    "Choque, colisión o volcamiento Lesiones generadas en el cuerpo de un conductor o pasajero de un vehículo cuando éste se vuelca o impacta con otro vehículo y/o estructura externa.",
    "Incendios Conjunto de condiciones cuya conjunción en un momento determinado, pueden originar un fuego incontrolado.",
    "Exposición a sustancias químicas tóxicas (Ej.: Cloro, gas, acido sulfúrico, gases nitrosos, ácido sulfhídrico, monóxido de carbono, etc.).",
    "Exposición a radiaciones no ionizantes (ultravioleta (UV), láser, Infrarroja (IR), microondas, radiofrecuencias, campos de frecuencia.",
    "Exposición a radiaciones ionizantes (rayos X, rayos gamma)",
    "Ingesta de sustancias nocivas (alimentos en mal estado, venenos, sustancias químicas, etc.).",
    "Inhalación accidental de sustancias nocivas. (humos, productos químicos, contaminación de partículas y gases)",
    "Sobreesfuerzos por manipulación de cargas Manipulación, transporte, elevación, empuje o tracción de cargas (carros, cajas, etc.) que pueda producir lesiones",
    "Sobreesfuerzos por otras causas Posturas inadecuadas o movimientos repetitivos o vibraciones mecánicas que puedan producir lesiones músculo-esqueléticas agudas o crónicas.",
    "Exposición a Ej.: Radiación ultravioleta, ruidos, gases, polvo, humo.",
    "Derrame de Sustancia y/o Residuo Peligroso: Ej.: filtración de aceite de componente."
];

// Mapeo de claves a etiquetas para condiciones climáticas
const CONDICIONES_CLIMATICAS_LABELS: Record<string, string> = {
    viento: "Viento",
    lluvia: "Lluvia",
    hielo: "Hielo",
    barro: "Barro",
    nieve: "Nieve",
    terrenoDesnivel: "Terreno en desnivel",
    otro: "Otro"
};

// Mapeo de claves a etiquetas para EPP
const EPP_ELEMENTOS_LABELS: Record<string, string> = {
    casco: "Casco",
    calzadoSeguridad: "Calzado de seguridad",
    coletoCuero: "Coleto de cuero",
    chaquetaPantalonCuero: "Chaqueta y pantalón cuero",
    polainasCuero: "Polainas de cuero",
    fonoProtectorAuditivo: "Fono protector auditivo",
    rotuloIdentificacion: "Rotulo de identificación del Residuo/ Sustancia Peligrosa",
    gafasSeguridad: "Gafas de seguridad",
    guantes: "Guantes",
    proteccionRespiratoria: "Protección respiratoria",
    arnesSeguridad: "Arnés de seguridad",
    buzoPapel: "Buzo de papel",
    taponProtectorAuditivo: "Tapón protector auditivo",
    careta: "Careta",
    mascaraFacial: "Mascara facial",
    mascaraFullFace: "Mascara full face",
    bandejaContencion: "Bandeja de contención de derrames",
    materialAbsorbente: "Material Absorbente",
    elementosSegregacion: "Elementos de segregación y/o señalización (Ej.: Conos, cadenas, letreros, etc.)",
    cascoBarbiquejo: "Casco con barbiquejo",
    bloqueadorSolar: "Bloqueador solar RUV",
    gafasProteccionSolar: "Gafas con protección solar RUV",
    vestimentaProteccionSolar: "Vestimenta con protección solar RUV (manga larga, cabeza, cuello)"
};

export default function AnalisisRiesgoDetalle({ analisis }: { analisis: AnalisisRiesgo }) {
    // Debug: Log para ver qué datos llegan
    console.log('📊 AnalisisRiesgoDetalle - Datos recibidos:', {
        id: analisis?.id,
        tareaRealizar: analisis?.tareaRealizar,
        riesgosPotenciales: analisis?.riesgosPotenciales,
        condicionesClimaticas: analisis?.condicionesClimaticas,
        eppElementos: analisis?.eppElementos,
        tipoRiesgos: typeof analisis?.riesgosPotenciales,
        tipoCondiciones: typeof analisis?.condicionesClimaticas,
        tipoEpp: typeof analisis?.eppElementos,
    });

    if (!analisis) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <p className="text-gray-500">No hay datos del análisis de riesgo disponibles</p>
            </div>
        );
    }

    const parseJsonObject = (value: unknown): Record<string, unknown> => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value as Record<string, unknown>;
        }

        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    return parsed as Record<string, unknown>;
                }
            } catch {
                return {};
            }
        }

        return {};
    };

    const eppData = parseJsonObject(analisis.eppElementos);
    const condicionesData = parseJsonObject(analisis.condicionesClimaticas);
    const esFormularioArtV2 =
        eppData.artVersion === 'ART_V2' || condicionesData.artVersion === 'ART_V2';

    if (esFormularioArtV2) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Análisis de Riesgo (A.R.T.)</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${analisis.completado ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {analisis.completado ? '✓ Completado' : 'No Completado'}
                    </span>
                </div>

                <AnalisisRiesgoSupervisorDetalleV2 analisis={analisis} />
            </div>
        );
    }

    // Preguntas del formulario actual (12 preguntas)
    const preguntasTexto = [
        "¿Se cuenta con el personal necesario y entrenado para realizar la tarea?",
        "¿Se bloqueó y comprobó energía cero según procedimiento?",
        "¿Se realiza pruebas con equipo energizado?",
        "¿Se cuenta con las herramientas e insumos necesarios?",
        "¿Las herramientas están codificadas y chequeadas?",
        "¿Se encuentra en condiciones física y/o psicológicas para realizar la tarea? (si su respuesta es No comuníquese con su supervisor directo y no comience la tarea)",
        "¿Los sistemas eléctricos, se encuentran en buen estado? (Ej: extensiones, enchufes, tableros etc.)",
        "Existen trabajos simultáneos en el área. Especificar:",
        "¿Cuento con las coordinaciones y autorización para trabajos simultáneos?",
        "¿Se cuenta con el procedimiento en terreno para realizar el trabajo? (en físico o digital)",
        "¿Conoce el Plan de Emergencia ha identificado las vías de evacuación y el punto de encuentro de emergencia más cercano?",
        "¿Tengo identificado los Aspectos Ambientales de mi Actividad?"
    ];

    // Helper para parsear objetos de riesgos potenciales
    const parseRiesgosPotenciales = (field: any): Record<number, 'SI' | 'NO'> => {
        console.log('🔍 Parseando riesgosPotenciales:', field, 'tipo:', typeof field);

        if (!field) return {};

        // Si es string, parsearlo
        let obj = field;
        if (typeof field === 'string') {
            try {
                obj = JSON.parse(field);
            } catch (e) {
                console.error('Error parseando riesgosPotenciales:', e);
                return {};
            }
        }

        // Debe ser un objeto con índices numéricos (0-25) y valores 'SI' o 'NO'
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            const riesgos: Record<number, 'SI' | 'NO'> = {};
            Object.entries(obj).forEach(([index, valor]) => {
                const idx = parseInt(index);
                if (!isNaN(idx) && idx >= 0 && idx < RIESGOS_POTENCIALES_TEXTOS.length) {
                    riesgos[idx] = valor as 'SI' | 'NO';
                }
            });
            console.log('✅ Riesgos parseados:', Object.keys(riesgos).length);
            return riesgos;
        }

        return {};
    };

    // Helper para parsear objetos de condiciones climáticas
    const parseCondicionesClimaticas = (field: any): string[] => {
        console.log('🔍 Parseando condicionesClimaticas:', field, 'tipo:', typeof field);

        if (!field) return [];

        // Si es string, parsearlo
        let obj = field;
        if (typeof field === 'string') {
            try {
                obj = JSON.parse(field);
            } catch (e) {
                console.error('Error parseando condicionesClimaticas:', e);
                return [];
            }
        }

        // Debe ser un objeto con claves string y valores boolean
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            const condiciones: string[] = [];
            Object.entries(obj).forEach(([key, valor]) => {
                if (valor === true || valor === 'true') {
                    condiciones.push(CONDICIONES_CLIMATICAS_LABELS[key] || key);
                } else if (key === 'otro' && typeof valor === 'string' && valor.trim()) {
                    condiciones.push(`Otro: ${valor}`);
                }
            });
            console.log('✅ Condiciones encontradas:', condiciones.length);
            return condiciones;
        }

        return [];
    };

    // Helper para parsear objetos de EPP
    const parseEppElementos = (field: any): string[] => {
        console.log('🔍 Parseando eppElementos:', field, 'tipo:', typeof field);

        if (!field) return [];

        // Si es string, parsearlo
        let obj = field;
        if (typeof field === 'string') {
            try {
                obj = JSON.parse(field);
            } catch (e) {
                console.error('Error parseando eppElementos:', e);
                return [];
            }
        }

        // Debe ser un objeto con claves string y valores boolean
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            const epps: string[] = [];
            Object.entries(obj).forEach(([key, valor]) => {
                if (valor === true || valor === 'true') {
                    epps.push(EPP_ELEMENTOS_LABELS[key] || key);
                }
            });
            console.log('✅ EPPs encontrados:', epps.length);
            return epps;
        }

        return [];
    };

    // Parsear campos JSON
    const riesgosPotenciales = parseRiesgosPotenciales(analisis.riesgosPotenciales);
    const condicionesClimaticas = parseCondicionesClimaticas(analisis.condicionesClimaticas);
    const eppElementos = parseEppElementos(analisis.eppElementos);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Riesgo (A.R.T.)</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${analisis.completado ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {analisis.completado ? '✓ Completado' : 'No Completado'}
                </span>
            </div>

            {/* PASO 1: Información General */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    PASO 1: Información General
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Tarea a Realizar</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.tareaRealizar}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Fecha</p>
                        <p className="text-sm text-gray-900 mt-1">
                            {new Date(analisis.fecha).toLocaleDateString('es-ES')}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Empresa Responsable</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.empresaResponsable}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Lugar/Área de Trabajo</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.lugarAreaTrabajo}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Tarea Normada Por</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.tareaNormadaPor}</p>
                    </div>
                    {analisis.nombreDocumento && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-600">Nombre del Documento</p>
                            <p className="text-sm text-gray-900 mt-1">{analisis.nombreDocumento}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PASO 2: Preguntas a los Integrantes del Trabajo */}
            {analisis.preguntasIntegrantes && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        PASO 2: Preguntas a los Integrantes del Trabajo
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(analisis.preguntasIntegrantes as Record<string, any>).map(([index, item]: [string, any]) => {
                            const pregunta = preguntasTexto[parseInt(index)] || `Pregunta ${parseInt(index) + 1}`;
                            return (
                                <div key={index} className="border-l-2 border-blue-400 bg-gray-50 rounded p-3 mb-2">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs text-gray-700 flex-1 pr-4">{pregunta}</span>
                                        <span className={`px-2.5 py-1 rounded-full font-semibold text-xs whitespace-nowrap ${item.respuesta === 'SI' ? 'bg-green-100 text-green-800' :
                                            item.respuesta === 'NO' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.respuesta}
                                        </span>
                                    </div>
                                    {item.observacion && (
                                        <div className="mt-2 pl-3 border-l-2 border-amber-400 bg-amber-50 p-2 rounded">
                                            <p className="text-xs font-medium text-amber-800 mb-1">Observación:</p>
                                            <p className="text-xs text-amber-900">{item.observacion}</p>
                                        </div>
                                    )}
                                    {item.aspectosAmbientales && Array.isArray(item.aspectosAmbientales) && item.aspectosAmbientales.length > 0 && (
                                        <div className="mt-2 pl-3 border-l-2 border-green-400 bg-green-50 p-2 rounded">
                                            <p className="text-xs font-medium text-green-800 mb-1">Aspectos Ambientales:</p>
                                            <p className="text-xs text-green-900">{item.aspectosAmbientales.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* PASO 3: Control del Supervisor */}
            {analisis.controlSupervisor && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        PASO 3: Control del Supervisor en caso de existir algún "NO"
                    </h4>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">{analisis.controlSupervisor}</p>
                    </div>
                </div>
            )}

            {/* PASO 4: Identificación de Riesgos Potenciales */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    PASO 4: Identificación de Riesgos Potenciales (Marque SI o NO según el riesgo esté presente)
                </h4>
                {Object.keys(riesgosPotenciales).length > 0 ? (
                    <div className="space-y-2">
                        {RIESGOS_POTENCIALES_TEXTOS.map((riesgoTexto, index) => {
                            const respuesta = riesgosPotenciales[index];
                            if (!respuesta) return null;
                            return (
                                <div key={index} className="border-l-2 border-orange-400 bg-gray-50 rounded p-3">
                                    <div className="flex items-start justify-between">
                                        <span className="text-xs text-gray-700 flex-1 pr-4">
                                            <span className="font-semibold">{index + 1}.</span> {riesgoTexto}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full font-semibold text-xs whitespace-nowrap ${respuesta === 'SI'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {respuesta}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 italic">No se han identificado riesgos potenciales</p>
                    </div>
                )}
            </div>

            {/* PASO 5: Condiciones Climáticas */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    PASO 5: Condiciones Climáticas Adversas
                </h4>
                {condicionesClimaticas.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {condicionesClimaticas.map((condicion: string, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <svg className="h-4 w-4 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-gray-700 capitalize">{condicion}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 italic">No se han identificado condiciones climáticas adversas</p>
                    </div>
                )}
            </div>

            {/* PASO 6: EPP y Elementos Necesarios */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    PASO 6: Elementos de Protección Personal (EPP)
                </h4>
                {eppElementos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {eppElementos.map((epp: string, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <svg className="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-gray-700">{epp}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 italic">No se han especificado elementos de protección personal</p>
                    </div>
                )}
            </div>

            {/* PASO 7: Análisis y Secuencia del Trabajo */}
            {analisis.etapasTrabajo && Array.isArray(analisis.etapasTrabajo) && (analisis.etapasTrabajo as any[]).length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        PASO 7: Análisis y Secuencia del Trabajo
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Etapa</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Peligros</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Riesgos</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Medidas Control</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(analisis.etapasTrabajo as any[]).map((etapa: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-medium">{etapa.etapa}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700">{etapa.peligros}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700">{etapa.riesgos}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700">{etapa.medidasControl}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PASO 8: Instrucciones Especiales del Supervisor */}
            {analisis.instruccionesEspeciales && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        PASO 8: Instrucciones Especiales del Supervisor
                    </h4>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-900">{analisis.instruccionesEspeciales}</p>
                    </div>
                </div>
            )}

            {/* PASO 9: Identificación del Grupo de Trabajo */}
            {analisis.grupoTrabajo && Array.isArray(analisis.grupoTrabajo) && (analisis.grupoTrabajo as any[]).length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        PASO 9: Identificación del Grupo de Trabajo
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Nombre Completo</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">RUT</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(analisis.grupoTrabajo as any[]).map((participante: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-medium">{participante.nombre}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 font-mono">{participante.rut}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PASO 10: Firma de Aprobación para Comenzar la Tarea */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    PASO 10: Firma de Aprobación para Comenzar la Tarea
                </h4>
                <div className={`p-4 rounded-lg border-2 ${analisis.riesgosControlados ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className={`text-sm font-semibold mb-3 ${analisis.riesgosControlados ? 'text-green-900' : 'text-red-900'}`}>
                        {analisis.riesgosControlados ? '✓ Todos los riesgos fueron identificados y controlados' : '⚠ Riesgos no controlados o pendientes'}
                    </p>
                    {analisis.supervisorResponsable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-500">Supervisor Responsable</p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {analisis.supervisorResponsable.name || analisis.supervisorResponsable.username}
                                </p>
                            </div>
                            {analisis.fechaAprobacion && (
                                <div className="p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500">Fecha de Aprobación</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {new Date(analisis.fechaAprobacion).toLocaleDateString('es-ES', {
                                            day: '2-digit', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {!analisis.supervisorResponsable && (
                        <p className="text-xs text-gray-500 mt-2 italic">Supervisor aún no asignado</p>
                    )}
                </div>
            </div>
        </div>
    );
}
