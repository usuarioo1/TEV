interface MatrizControlBase {
    id: number;
    paso: number;
    actividad: string;
    peligro: string;
    eventoNoDeseado: string;
    control: string;
    especificacion: string;
}

interface MatrizControlView extends MatrizControlBase {
    respuesta: 'SI' | 'NO' | 'NA' | '';
    observacion: string;
}

const MATRIZ_CONTROLES_BASE: MatrizControlBase[] = [
    {
        id: 1,
        paso: 1,
        actividad: 'Transporte de carga (cama baja, equipo modular y rampla)',
        peligro: 'Fuego',
        eventoNoDeseado: 'Incendio en tracto, cama baja, modular o rampla',
        control: 'Operatividad de equipo de extincion de incendio',
        especificacion: 'El extintor de mi equipo se encuentra operativo y vigente?',
    },
    {
        id: 2,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Gravitacional',
        eventoNoDeseado: 'Caidas de distinto nivel',
        control: 'Uso 3 puntos de apoyo',
        especificacion: 'Los pasamanos y peldanos se encuentran en buenas condiciones y se que debo utilizar los 3 puntos de apoyo?',
    },
    {
        id: 3,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Inspeccion de pre-uso equipo',
        especificacion: 'Realice el checklist del equipo, previo a su uso?',
    },
    {
        id: 4,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Toma de Alcotest',
        especificacion: 'Realice el testeo de alcohol al inicio del turno?',
    },
    {
        id: 5,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Entrenamiento y capacitacion',
        especificacion: 'Fui capacitado por el instructor de la empresa para utilizar los distintos equipos?',
    },
    {
        id: 6,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Autoevaluacion de fatiga y somnolencia',
        especificacion: 'Realice la encuesta de fatiga y somnolencia?',
    },
    {
        id: 7,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Conduccion defensiva',
        especificacion: 'Mantengo distancia, respeto velocidad y senalizacion?',
    },
    {
        id: 8,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento, desbarrancamiento',
        control: 'Sistema ABS - EBS',
        especificacion: 'El tracto cuenta con el cable ABS - EBS y lo utilizo?',
    },
    {
        id: 9,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Gravitacional / Potencial',
        eventoNoDeseado: 'Caida de carga, golpeado por, atrapamiento',
        control: 'Verificacion de amarre y estiba',
        especificacion: 'El sistema de amarre esta en buen estado y certificado?',
    },
    {
        id: 10,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Radiacion UV de origen solar',
        eventoNoDeseado: 'Quemaduras de piel',
        control: 'Uso de ropa manga larga y bloqueador FPS 50+',
        especificacion: 'Cuento y utilizo ropa manga larga y bloqueador solar?',
    },
    {
        id: 11,
        paso: 1,
        actividad: 'Transporte de carga',
        peligro: 'Ambiental',
        eventoNoDeseado: 'Derrame de aceite u otros fluidos',
        control: 'Preparacion ante emergencias',
        especificacion: 'El equipo de apoyo cuenta con kit de contencion de derrames?',
    },
    {
        id: 12,
        paso: 2,
        actividad: 'Acople y desacople de semirremolque',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Atropello, golpeado por, atrapamiento',
        control: 'Uso de elementos de proteccion personal',
        especificacion: 'Cuento con ropa de alta visibilidad, guantes, casco, lentes y zapatos de seguridad?',
    },
    {
        id: 13,
        paso: 2,
        actividad: 'Acople y desacople de semirremolque',
        peligro: 'Neumatica / Mecanica',
        eventoNoDeseado: 'Bloqueo de semirremolque',
        control: 'Inspeccion de pre-uso equipo',
        especificacion: 'Se verifico si existe perdida de aire?',
    },
    {
        id: 14,
        paso: 2,
        actividad: 'Acople y desacople de semirremolque',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, atropello',
        control: 'Verificar condicion del entorno',
        especificacion: 'Existe una adecuada segregacion de areas?',
    },
    {
        id: 15,
        paso: 2,
        actividad: 'Acople y desacople de semirremolque',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Movimiento inesperado del equipo',
        control: 'Aislacion y bloqueo de energias',
        especificacion: 'Se realizo el bloqueo del equipo?',
    },
    {
        id: 16,
        paso: 2,
        actividad: 'Acople y desacople de semirremolque',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Desacople y/o caida a desnivel',
        control: 'Candado de bloqueo',
        especificacion: 'Cuento y utilizo el candado de bloqueo quinta rueda/perno rey?',
    },
    {
        id: 17,
        paso: 3,
        actividad: 'Carga y descarga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision',
        control: 'Manejo defensivo',
        especificacion: 'Mantengo distancias seguras con vehiculos en el area?',
    },
    {
        id: 18,
        paso: 3,
        actividad: 'Carga y descarga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Atropello, golpeado por, atrapamiento',
        control: 'No exponerse a linea de fuego',
        especificacion: 'Se que debo retirarme de la linea de fuego?',
    },
    {
        id: 19,
        paso: 3,
        actividad: 'Carga y descarga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Caida de carga, golpeado por',
        control: 'Reportar condiciones sub-estandar',
        especificacion: 'Informo anomalias que impidan la carga o descarga?',
    },
    {
        id: 20,
        paso: 3,
        actividad: 'Carga y descarga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, atropello',
        control: 'Verificar condicion del entorno',
        especificacion: 'Existe adecuada segregacion de areas?',
    },
    {
        id: 21,
        paso: 3,
        actividad: 'Carga y descarga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Recepcion de carga en mal estado',
        control: 'Verificar estado de la carga',
        especificacion: 'Se que puedo rechazar la carga deteriorada?',
    },
    {
        id: 22,
        paso: 4,
        actividad: 'Amarre y desamarre de carga',
        peligro: 'Gravitacional',
        eventoNoDeseado: 'Caida de carga',
        control: 'Amarra y estiba',
        especificacion: 'El amarre fue realizado con cadenas certificadas y correctamente tensadas?',
    },
    {
        id: 23,
        paso: 4,
        actividad: 'Amarre y desamarre de carga',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, atropello',
        control: 'Verificar condicion del entorno',
        especificacion: 'Las condiciones del entorno se encuentran libres y despejadas?',
    },
    {
        id: 24,
        paso: 5,
        actividad: 'Preparacion y respuesta ante emergencias',
        peligro: 'Evento Climatico / Natural',
        eventoNoDeseado: 'Avalancha con afectacion a personas',
        control: 'Dispositivo de rastreo',
        especificacion: 'Cuento con dispositivo de rastreo con bateria cargada?',
    },
    {
        id: 25,
        paso: 5,
        actividad: 'Preparacion y respuesta ante emergencias',
        peligro: 'Evento Climatico / Natural',
        eventoNoDeseado: 'Avalancha y tormenta electrica',
        control: 'Reglamento Operacion Invierno',
        especificacion: 'Conozco las alertas de operacion invierno y tormentas electricas?',
    },
    {
        id: 26,
        paso: 5,
        actividad: 'Preparacion y respuesta ante emergencias',
        peligro: 'Fuego',
        eventoNoDeseado: 'Incendio en tracto o semirremolque',
        control: 'Operatividad de equipo de extincion',
        especificacion: 'Conozco el plan de emergencia y como actuar?',
    },
    {
        id: 27,
        paso: 5,
        actividad: 'Preparacion y respuesta ante emergencias',
        peligro: 'Cinetica / Mecanica',
        eventoNoDeseado: 'Choque, colision, volcamiento',
        control: 'Diagrama de flujo de emergencias',
        especificacion: 'Se como activar una emergencia?',
    },
];

const asObject = (value: unknown): Record<string, unknown> => {
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

const asArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
};

const normalizeRespuesta = (value: unknown): 'SI' | 'NO' | 'NA' | '' => {
    if (value === 'SI' || value === 'NO' || value === 'NA') {
        return value;
    }
    return '';
};

const formatDate = (value: unknown) => {
    if (typeof value !== 'string' || !value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('es-ES');
};

const getListFromString = (value: unknown) => {
    if (typeof value !== 'string') {
        return [] as string[];
    }

    return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
};

export default function AnalisisRiesgoSupervisorDetalleV2({ analisis }: { analisis: any }) {
    const preguntas = asObject(analisis?.preguntasIntegrantes);
    const riesgos = asObject(analisis?.riesgosPotenciales);
    const condiciones = asObject(analisis?.condicionesClimaticas);
    const impacto = asObject(condiciones.impacto);
    const mejoramientos = asObject(condiciones.mejoramientos);
    const epp = asObject(analisis?.eppElementos);
    const nombreLiderArea =
        (typeof epp.liderArea === 'string' && epp.liderArea.trim()) ||
        (typeof epp.liderAreaNombre === 'string' && epp.liderAreaNombre.trim()) ||
        (typeof epp.liderEquipoArt === 'string' && epp.liderEquipoArt.trim()) ||
        '-';

    const equiposListado = asArray(epp.equiposHerramientasListado)
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

    const equipos = equiposListado.length > 0
        ? equiposListado
        : getListFromString(epp.equiposHerramientas);

    const matriz: MatrizControlView[] = MATRIZ_CONTROLES_BASE.map((base, index) => {
        const pregunta = asObject(preguntas[String(index)]);

        return {
            ...base,
            paso: typeof pregunta.paso === 'number' ? pregunta.paso : base.paso,
            actividad: typeof pregunta.actividad === 'string' ? pregunta.actividad : base.actividad,
            especificacion:
                typeof pregunta.pregunta === 'string' ? pregunta.pregunta : base.especificacion,
            respuesta:
                normalizeRespuesta(pregunta.respuesta) ||
                normalizeRespuesta(riesgos[String(index)]),
            observacion:
                typeof pregunta.observacion === 'string' ? pregunta.observacion : '',
        };
    });

    const grupo = asArray(analisis?.grupoTrabajo).map((item) => asObject(item));
    const supervisorResponsable = asObject(analisis?.supervisorResponsable);
    const nombreSupervisorResponsable =
        (typeof supervisorResponsable.name === 'string' && supervisorResponsable.name.trim()) ||
        (typeof supervisorResponsable.username === 'string' && supervisorResponsable.username.trim()) ||
        '';

    const lider =
        grupo.find(
            (item) =>
                typeof item.ocupacion === 'string' &&
                item.ocupacion.toLowerCase().includes('lider')
        ) ||
        grupo[0] ||
        {};

    const miembros = grupo.filter((item) => item !== lider);
    const nombreLiderSeccionC =
        nombreSupervisorResponsable ||
        (typeof lider.nombre === 'string' && lider.nombre ? lider.nombre : '-');

    const mejoramientosActivos = [
        {
            label: 'Cambio de tareas',
            active: Boolean(mejoramientos.cambioTareas),
        },
        {
            label: 'Cambio de herramientas o equipos',
            active: Boolean(mejoramientos.cambioHerramientasEquipos),
        },
        {
            label: 'Reciclaje o capacitacion adicional',
            active: Boolean(mejoramientos.reciclajeCapacitacion),
        },
        {
            label: 'Otras acciones correctivas',
            active: Boolean(mejoramientos.otrasAccionesCorrectivas),
        },
    ].filter((item) => item.active);

    return (
        <>
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    SECCION A - INFORMACION GENERAL Y PERSONAL
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Descripcion de la tarea / trabajo</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.tareaRealizar || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Objetivo de la tarea / trabajo</p>
                        <p className="text-sm text-gray-900 mt-1">{String(epp.objetivoTarea || '-')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Existe procedimiento para la tarea?</p>
                        <p className="text-sm text-gray-900 mt-1">
                            {analisis.tareaNormadaPor === 'Documento' ? 'SI' : 'NO'}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Nombre del procedimiento</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.nombreDocumento || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Area / Faena / Lugar</p>
                        <p className="text-sm text-gray-900 mt-1">{analisis.lugarAreaTrabajo || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Lider de area</p>
                        <p className="text-sm text-gray-900 mt-1">{nombreLiderArea}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Supervisor responsable (Sección C)</p>
                        <p className="text-sm text-gray-900 mt-1">{nombreLiderSeccionC}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">ART registrado por</p>
                        <p className="text-sm text-gray-900 mt-1">{String(epp.artRegistradoPor || analisis.empresaResponsable || '-')}</p>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Lista de equipos y herramientas para la tarea</p>
                    {equipos.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-gray-900 space-y-1">
                            {equipos.map((equipo, index) => (
                                <li key={`${equipo}-${index}`}>{equipo}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">Sin equipos/herramientas registrados</p>
                    )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-700">Impacto sobre otras personas o trabajos</p>
                    <p className="text-sm text-blue-900 mt-1">
                        Respuesta: {String(impacto.respuesta || 'No informado')}
                    </p>
                    {Array.isArray(impacto.opciones) && impacto.opciones.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-blue-900 mt-2 space-y-1">
                            {impacto.opciones.map((item, index) => (
                                <li key={`${String(item)}-${index}`}>{String(item)}</li>
                            ))}
                        </ul>
                    )}
                    {typeof impacto.detalle === 'string' && impacto.detalle.trim() && (
                        <p className="text-sm text-blue-900 mt-2">Detalle: {impacto.detalle}</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    ART - ANALISIS DE RIESGOS DEL TRABAJO
                </h4>

                <div className="space-y-3 lg:hidden">
                    {matriz.map((fila) => (
                        <div key={fila.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">Paso {fila.paso}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${fila.respuesta === 'SI'
                                    ? 'bg-green-100 text-green-800'
                                    : fila.respuesta === 'NO'
                                        ? 'bg-red-100 text-red-800'
                                        : fila.respuesta === 'NA'
                                            ? 'bg-gray-200 text-gray-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {fila.respuesta || 'Sin respuesta'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-700"><span className="font-semibold">Actividad:</span> {fila.actividad}</p>
                            <p className="text-xs text-gray-700"><span className="font-semibold">Peligro:</span> {fila.peligro}</p>
                            <p className="text-xs text-gray-700"><span className="font-semibold">Evento:</span> {fila.eventoNoDeseado}</p>
                            <p className="text-xs text-gray-700"><span className="font-semibold">Control:</span> {fila.control}</p>
                            <p className="text-xs text-gray-700"><span className="font-semibold">Especificacion:</span> {fila.especificacion}</p>
                            {fila.observacion && (
                                <p className="text-xs text-amber-900 mt-2"><span className="font-semibold">Observacion:</span> {fila.observacion}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full min-w-280 border-collapse border border-gray-200 text-xs">
                        <thead>
                            <tr className="bg-gray-100 text-left text-gray-700">
                                <th className="border border-gray-200 px-2 py-2">Paso</th>
                                <th className="border border-gray-200 px-2 py-2">Actividad</th>
                                <th className="border border-gray-200 px-2 py-2">Peligro</th>
                                <th className="border border-gray-200 px-2 py-2">Evento No Deseado</th>
                                <th className="border border-gray-200 px-2 py-2">Control</th>
                                <th className="border border-gray-200 px-2 py-2">Especificacion</th>
                                <th className="border border-gray-200 px-2 py-2">Respuesta</th>
                                <th className="border border-gray-200 px-2 py-2">Observacion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matriz.map((fila) => (
                                <tr key={fila.id} className="align-top hover:bg-gray-50">
                                    <td className="border border-gray-200 px-2 py-2">{fila.paso}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.actividad}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.peligro}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.eventoNoDeseado}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.control}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.especificacion}</td>
                                    <td className="border border-gray-200 px-2 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${fila.respuesta === 'SI'
                                            ? 'bg-green-100 text-green-800'
                                            : fila.respuesta === 'NO'
                                                ? 'bg-red-100 text-red-800'
                                                : fila.respuesta === 'NA'
                                                    ? 'bg-gray-200 text-gray-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {fila.respuesta || 'Sin respuesta'}
                                        </span>
                                    </td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.observacion || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    Mejoramientos sugeridos / acciones correctivas
                </h4>
                {mejoramientosActivos.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-gray-900 space-y-1">
                        {mejoramientosActivos.map((item) => (
                            <li key={item.label}>{item.label}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No se registraron mejoramientos sugeridos.</p>
                )}
                {typeof mejoramientos.otrasAccionesDetalle === 'string' && mejoramientos.otrasAccionesDetalle.trim() && (
                    <p className="text-sm text-gray-800 mt-2">
                        <span className="font-semibold">Detalle otras acciones:</span> {mejoramientos.otrasAccionesDetalle}
                    </p>
                )}
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    Comentarios y notas al procedimiento
                </h4>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-900">{analisis.instruccionesEspeciales || 'Sin comentarios registrados'}</p>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                    SECCION C - APROBACION
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-180 border-collapse border border-gray-200 text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left text-gray-700">
                                <th className="border border-gray-200 px-3 py-2">Ocupacion / Designacion</th>
                                <th className="border border-gray-200 px-3 py-2">Nombre</th>
                                <th className="border border-gray-200 px-3 py-2">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">Lider del Equipo</td>
                                <td className="border border-gray-200 px-3 py-2">{nombreLiderSeccionC}</td>
                                <td className="border border-gray-200 px-3 py-2">{formatDate(lider.fecha || lider.rut)}</td>
                            </tr>
                            {miembros.map((item, index) => (
                                <tr key={`miembro-${index}`}>
                                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                                        {typeof item.ocupacion === 'string'
                                            ? `${item.ocupacion}${index === 0 ? ' (Operario)' : ''}`
                                            : `Miembro del Equipo ${index + 1}${index === 0 ? ' (Operario)' : ''}`}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2">{typeof item.nombre === 'string' && item.nombre ? item.nombre : '-'}</td>
                                    <td className="border border-gray-200 px-3 py-2">{formatDate(item.fecha || item.rut)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${analisis.riesgosControlados ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-semibold ${analisis.riesgosControlados ? 'text-green-900' : 'text-red-900'}`}>
                    {analisis.riesgosControlados
                        ? '✓ Riesgos controlados segun formulario ART'
                        : '⚠ Riesgos no controlados o pendientes en formulario ART'}
                </p>
            </div>
        </>
    );
}
