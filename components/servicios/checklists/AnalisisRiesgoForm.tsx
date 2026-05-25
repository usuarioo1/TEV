'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';

type RespuestaControl = 'SI' | 'NO' | 'NA' | '';

type MejoramientosState = {
    cambioTareas: boolean;
    cambioHerramientasEquipos: boolean;
    reciclajeCapacitacion: boolean;
    otrasAccionesCorrectivas: boolean;
};

interface MatrizControlBase {
    id: number;
    paso: number;
    actividad: string;
    peligro: string;
    eventoNoDeseado: string;
    control: string;
    especificacion: string;
}

interface MatrizControlRow extends MatrizControlBase {
    respuesta: RespuestaControl;
    observacion: string;
}

interface AprobacionRow {
    ocupacion: string;
    nombre: string;
    fecha: string;
}

interface Supervisor {
    id: number;
    name: string | null;
    username: string;
}

interface AnalisisRiesgoFormProps {
    servicioId: number;
    analisisExistente?: any;
}

const IMPACTO_OPCIONES = [
    'Proveedores externos',
    'Cliente AA',
    'Ingreso de equipos a las areas de carguio',
    'Descarga e interaccion con terceros en la via publica',
];

const EQUIPOS_HERRAMIENTAS_OTROS = 'Otros';
const EQUIPOS_HERRAMIENTAS_OPCIONES = [
    'Eslinga de agarre',
    'Cadenas',
    'Tensores',
    'Grilletes',
    'Almohadillas',
    'Cubrecantos',
    'Goma anti deslizante',
    EQUIPOS_HERRAMIENTAS_OTROS,
] as const;

const OCUPACION_LIDER = 'Lider del Equipo';
const OCUPACION_MIEMBRO = 'Miembro del Equipo';

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const safeObject = (value: unknown): Record<string, unknown> => {
    if (isRecord(value)) {
        return value;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return isRecord(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }

    return {};
};

const safeArray = (value: unknown): unknown[] => {
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

const todayChile = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const toDateInput = (value: unknown): string => {
    if (typeof value !== 'string') {
        return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString().split('T')[0];
};

const normalizeRespuesta = (value: unknown): RespuestaControl => {
    if (value === 'SI' || value === 'NO' || value === 'NA') {
        return value;
    }
    return '';
};

const parseEquiposHerramientas = (value: unknown): string[] => {
    if (typeof value !== 'string') {
        return [];
    }

    return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const normalizeListValue = (value: string) =>
    value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ');

const uniqueListValues = (values: string[]): string[] => {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const value of values) {
        const normalized = normalizeListValue(value);
        if (!normalized || seen.has(normalized)) {
            continue;
        }

        seen.add(normalized);
        unique.push(value.trim());
    }

    return unique;
};

const EQUIPOS_HERRAMIENTAS_LOOKUP = new Map<string, string>(
    EQUIPOS_HERRAMIENTAS_OPCIONES.map((opcion) => [normalizeListValue(opcion), opcion])
);

const getFechaAprobacion = (fuente: Record<string, unknown>) =>
    toDateInput(
        typeof fuente.fecha === 'string'
            ? fuente.fecha
            : typeof fuente.rut === 'string'
                ? fuente.rut
                : ''
    ) || todayChile();

const getSupervisorDisplayName = (supervisor: Supervisor): string =>
    supervisor.name?.trim() || supervisor.username;

export default function AnalisisRiesgoForm({
    servicioId,
    analisisExistente,
}: AnalisisRiesgoFormProps) {
    const router = useRouter();
    const { session } = useSession();

    const condicionesGuardadas = safeObject(analisisExistente?.condicionesClimaticas);
    const impactoGuardado = safeObject(condicionesGuardadas.impacto);
    const mejoramientosGuardados = safeObject(condicionesGuardadas.mejoramientos);
    const eppGuardado = safeObject(analisisExistente?.eppElementos);
    const preguntasGuardadas = safeObject(analisisExistente?.preguntasIntegrantes);
    const riesgosGuardados = safeObject(analisisExistente?.riesgosPotenciales);
    const grupoGuardado = safeArray(analisisExistente?.grupoTrabajo).map((item) => safeObject(item));

    const [loading, setLoading] = useState(false);
    const [loadingPrevencionistas, setLoadingPrevencionistas] = useState(true);
    const [loadingSupervisores, setLoadingSupervisores] = useState(true);
    const [error, setError] = useState('');
    const [prevencionistas, setPrevencionistas] = useState<Supervisor[]>([]);
    const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
    const [supervisorResponsableId, setSupervisorResponsableId] = useState<number | ''>(() => {
        const idGuardado = Number(analisisExistente?.supervisorResponsableId);
        return Number.isInteger(idGuardado) && idGuardado > 0 ? idGuardado : '';
    });

    const [descripcionTarea, setDescripcionTarea] = useState(
        (typeof analisisExistente?.tareaRealizar === 'string' && analisisExistente.tareaRealizar) || ''
    );
    const [objetivoTarea, setObjetivoTarea] = useState(
        typeof eppGuardado.objetivoTarea === 'string' ? eppGuardado.objetivoTarea : ''
    );
    const [existeProcedimiento, setExisteProcedimiento] = useState<'SI' | 'NO' | ''>(() => {
        const guardado = normalizeRespuesta(impactoGuardado.existeProcedimiento);
        if (guardado) {
            return guardado === 'NA' ? '' : guardado;
        }
        if (analisisExistente?.tareaNormadaPor === 'Documento') {
            return 'SI';
        }
        if (analisisExistente?.tareaNormadaPor === 'AST') {
            return 'NO';
        }
        return analisisExistente ? '' : 'SI';
    });
    const [nombreProcedimiento, setNombreProcedimiento] = useState(
        (typeof analisisExistente?.nombreDocumento === 'string' && analisisExistente.nombreDocumento) || ''
    );
    const [fechaRealizacionArt, setFechaRealizacionArt] = useState(
        toDateInput(analisisExistente?.fecha ? String(analisisExistente.fecha) : '') || todayChile()
    );
    const [areaFaenaLugar, setAreaFaenaLugar] = useState(
        (typeof analisisExistente?.lugarAreaTrabajo === 'string' && analisisExistente.lugarAreaTrabajo) || ''
    );
    const [liderAreaId, setLiderAreaId] = useState<number | ''>(() => {
        const idGuardado = Number(eppGuardado.liderAreaId);
        return Number.isInteger(idGuardado) && idGuardado > 0 ? idGuardado : '';
    });
    const [liderEquipoArt, setLiderEquipoArt] = useState(
        typeof eppGuardado.liderEquipoArt === 'string' ? eppGuardado.liderEquipoArt : ''
    );
    const [artRegistradoPor, setArtRegistradoPor] = useState(
        (typeof eppGuardado.artRegistradoPor === 'string' && eppGuardado.artRegistradoPor) ||
        (typeof analisisExistente?.empresaResponsable === 'string' ? analisisExistente.empresaResponsable : '')
    );
    const equiposHerramientasGuardados = (() => {
        const listadoGuardado = safeArray(eppGuardado.equiposHerramientasListado)
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);

        if (listadoGuardado.length > 0) {
            return listadoGuardado;
        }

        return parseEquiposHerramientas(eppGuardado.equiposHerramientas);
    })();

    const equiposHerramientasIniciales = (() => {
        const seleccionados = new Set<string>();
        const otros: string[] = [];

        for (const item of equiposHerramientasGuardados) {
            const opcion = EQUIPOS_HERRAMIENTAS_LOOKUP.get(normalizeListValue(item));
            if (opcion) {
                seleccionados.add(opcion);
                continue;
            }

            otros.push(item);
        }

        if (otros.length > 0) {
            seleccionados.add(EQUIPOS_HERRAMIENTAS_OTROS);
        }

        return {
            seleccionados: Array.from(seleccionados),
            otrosTexto: uniqueListValues(otros).join(', '),
        };
    })();

    const [equiposHerramientasSeleccionados, setEquiposHerramientasSeleccionados] = useState<string[]>(
        equiposHerramientasIniciales.seleccionados
    );
    const [equiposHerramientasOtros, setEquiposHerramientasOtros] = useState<string>(
        equiposHerramientasIniciales.otrosTexto
    );

    const [impactoRespuesta, setImpactoRespuesta] = useState<'SI' | 'NO' | ''>(() => {
        const respuesta = normalizeRespuesta(impactoGuardado.respuesta);
        if (respuesta) {
            return respuesta === 'NA' ? '' : respuesta;
        }
        return '';
    });

    const [impactoOpciones, setImpactoOpciones] = useState<string[]>(() => {
        const opcionesGuardadas = safeArray(impactoGuardado.opciones).filter(
            (item): item is string => typeof item === 'string'
        );

        if (opcionesGuardadas.length > 0) {
            return opcionesGuardadas;
        }

        return [];
    });

    const [impactoDetalle, setImpactoDetalle] = useState(
        typeof impactoGuardado.detalle === 'string' ? impactoGuardado.detalle : ''
    );

    const [matrizControles, setMatrizControles] = useState<MatrizControlRow[]>(() =>
        MATRIZ_CONTROLES_BASE.map((item, index) => {
            const pregunta = safeObject(preguntasGuardadas[index]);
            const respuestaPregunta = normalizeRespuesta(pregunta.respuesta);
            const respuestaRiesgo = normalizeRespuesta(riesgosGuardados[index]);

            return {
                ...item,
                respuesta: respuestaPregunta || respuestaRiesgo,
                observacion: typeof pregunta.observacion === 'string' ? pregunta.observacion : '',
            };
        })
    );

    const [mejoramientos, setMejoramientos] = useState<MejoramientosState>({
        cambioTareas: Boolean(mejoramientosGuardados.cambioTareas),
        cambioHerramientasEquipos: Boolean(mejoramientosGuardados.cambioHerramientasEquipos),
        reciclajeCapacitacion: Boolean(mejoramientosGuardados.reciclajeCapacitacion),
        otrasAccionesCorrectivas: Boolean(mejoramientosGuardados.otrasAccionesCorrectivas),
    });

    const [otrasAccionesDetalle, setOtrasAccionesDetalle] = useState(
        typeof mejoramientosGuardados.otrasAccionesDetalle === 'string'
            ? mejoramientosGuardados.otrasAccionesDetalle
            : ''
    );

    const [comentariosNotas, setComentariosNotas] = useState(
        (typeof analisisExistente?.instruccionesEspeciales === 'string' &&
            analisisExistente.instruccionesEspeciales) ||
        ''
    );

    const [liderAprobacion, setLiderAprobacion] = useState<AprobacionRow>(() => {
        const liderGuardado = grupoGuardado.find(
            (fila) => typeof fila.ocupacion === 'string' && fila.ocupacion.toLowerCase().includes('lider')
        );
        const fallbackLider = grupoGuardado[1] || {};
        const fuente = liderGuardado || fallbackLider;

        return {
            ocupacion: OCUPACION_LIDER,
            nombre:
                typeof fuente.nombre === 'string' && fuente.nombre
                    ? fuente.nombre
                    : liderEquipoArt,
            fecha: getFechaAprobacion(fuente),
        };
    });

    const [miembrosEquipo, setMiembrosEquipo] = useState<AprobacionRow[]>(() => {
        const miembrosGuardados = grupoGuardado.filter((fila, index) => {
            if (typeof fila.ocupacion !== 'string') {
                return index === 0;
            }
            return !fila.ocupacion.toLowerCase().includes('lider');
        });

        if (miembrosGuardados.length === 0) {
            return [
                {
                    ocupacion: OCUPACION_MIEMBRO,
                    nombre: (session?.name || session?.username || '').trim(),
                    fecha: todayChile(),
                },
            ];
        }

        return miembrosGuardados.map((fila) => ({
            ocupacion: OCUPACION_MIEMBRO,
            nombre: typeof fila.nombre === 'string' ? fila.nombre : '',
            fecha: getFechaAprobacion(fila),
        }));
    });

    useEffect(() => {
        if (artRegistradoPor.trim()) {
            return;
        }

        const fallback = session?.name || session?.username || session?.empresa || '';
        if (fallback) {
            setArtRegistradoPor(fallback);
        }
    }, [artRegistradoPor, session]);

    useEffect(() => {
        let isMounted = true;

        const fetchPrevencionistas = async () => {
            try {
                const response = await fetch('/api/users?rol=prevencionista');
                if (!response.ok) {
                    throw new Error('No se pudieron cargar los prevencionistas');
                }

                const data = await response.json();
                if (isMounted) {
                    setPrevencionistas(Array.isArray(data) ? data : []);
                }
            } catch (fetchError) {
                if (isMounted) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : 'Error al cargar prevencionistas'
                    );
                }
            } finally {
                if (isMounted) {
                    setLoadingPrevencionistas(false);
                }
            }
        };

        fetchPrevencionistas();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchSupervisores = async () => {
            try {
                const response = await fetch('/api/users?rol=supervisor');
                if (!response.ok) {
                    throw new Error('No se pudieron cargar los supervisores');
                }

                const data = await response.json();
                if (isMounted) {
                    setSupervisores(Array.isArray(data) ? data : []);
                }
            } catch (fetchError) {
                if (isMounted) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : 'Error al cargar supervisores'
                    );
                }
            } finally {
                if (isMounted) {
                    setLoadingSupervisores(false);
                }
            }
        };

        fetchSupervisores();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const operarioNombre = (session?.name || session?.username || '').trim();
        if (!operarioNombre) {
            return;
        }

        setMiembrosEquipo((prev) => {
            if (prev.length === 0) {
                return [
                    {
                        ocupacion: OCUPACION_MIEMBRO,
                        nombre: operarioNombre,
                        fecha: todayChile(),
                    },
                ];
            }

            if (
                normalizeListValue(prev[0].nombre) === normalizeListValue(operarioNombre)
            ) {
                return prev;
            }

            const actualizado = [...prev];
            actualizado[0] = {
                ...actualizado[0],
                nombre: operarioNombre,
            };
            return actualizado;
        });
    }, [session]);

    useEffect(() => {
        if (supervisores.length === 0) {
            return;
        }

        if (supervisorResponsableId) {
            const supervisorSeleccionado = supervisores.find(
                (item) => item.id === supervisorResponsableId
            );

            if (!supervisorSeleccionado) {
                return;
            }

            const nombreSupervisor = getSupervisorDisplayName(supervisorSeleccionado);
            setLiderAprobacion((prev) =>
                prev.nombre === nombreSupervisor
                    ? prev
                    : {
                        ...prev,
                        nombre: nombreSupervisor,
                    }
            );
            return;
        }

        const nombreLiderActual = liderAprobacion.nombre.trim();
        if (!nombreLiderActual) {
            return;
        }

        const supervisorDesdeNombre = supervisores.find(
            (item) =>
                normalizeListValue(getSupervisorDisplayName(item)) ===
                normalizeListValue(nombreLiderActual)
        );

        if (supervisorDesdeNombre) {
            setSupervisorResponsableId(supervisorDesdeNombre.id);
        }
    }, [supervisorResponsableId, supervisores, liderAprobacion.nombre]);

    useEffect(() => {
        if (prevencionistas.length === 0) {
            return;
        }

        if (liderAreaId) {
            const prevencionistaSeleccionado = prevencionistas.find(
                (item) => item.id === liderAreaId
            );

            if (!prevencionistaSeleccionado) {
                return;
            }

            const nombrePrevencionista = getSupervisorDisplayName(prevencionistaSeleccionado);
            setLiderEquipoArt((prev) =>
                prev === nombrePrevencionista ? prev : nombrePrevencionista
            );
            return;
        }

        const nombreLiderActual = liderEquipoArt.trim();
        if (!nombreLiderActual) {
            return;
        }

        const prevencionistaDesdeNombre = prevencionistas.find(
            (item) =>
                normalizeListValue(getSupervisorDisplayName(item)) ===
                normalizeListValue(nombreLiderActual)
        );

        if (prevencionistaDesdeNombre) {
            setLiderAreaId(prevencionistaDesdeNombre.id);
        }
    }, [liderAreaId, prevencionistas, liderEquipoArt]);

    const toggleImpactoOpcion = (opcion: string) => {
        setImpactoOpciones((prev) =>
            prev.includes(opcion) ? prev.filter((item) => item !== opcion) : [...prev, opcion]
        );
    };

    const setRespuestaMatriz = (id: number, respuesta: Exclude<RespuestaControl, ''>) => {
        setMatrizControles((prev) =>
            prev.map((fila) => (fila.id === id ? { ...fila, respuesta } : fila))
        );
    };

    const setObservacionMatriz = (id: number, observacion: string) => {
        setMatrizControles((prev) =>
            prev.map((fila) => (fila.id === id ? { ...fila, observacion } : fila))
        );
    };

    const setMejoramiento = (key: keyof MejoramientosState) => {
        setMejoramientos((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleEquipoHerramienta = (opcion: string) => {
        setEquiposHerramientasSeleccionados((prev) =>
            prev.includes(opcion)
                ? prev.filter((item) => item !== opcion)
                : [...prev, opcion]
        );
    };

    const getEquiposHerramientasSeleccionados = () => {
        const equiposBase = equiposHerramientasSeleccionados.filter(
            (item) => item !== EQUIPOS_HERRAMIENTAS_OTROS
        );
        const equiposOtros = parseEquiposHerramientas(equiposHerramientasOtros);

        return uniqueListValues([...equiposBase, ...equiposOtros]);
    };

    const getNombreSupervisorResponsable = (): string => {
        if (!supervisorResponsableId) {
            return '';
        }

        const supervisor = supervisores.find((item) => item.id === supervisorResponsableId);
        return supervisor ? getSupervisorDisplayName(supervisor) : '';
    };

    const getNombreLiderArea = (): string => {
        if (!liderAreaId) {
            return '';
        }

        const prevencionista = prevencionistas.find((item) => item.id === liderAreaId);
        return prevencionista ? getSupervisorDisplayName(prevencionista) : '';
    };

    const actualizarMiembroEquipo = (index: number, field: 'nombre', value: string) => {
        setMiembrosEquipo((prev) =>
            prev.map((fila, filaIndex) =>
                filaIndex === index ? { ...fila, [field]: value } : fila
            )
        );
    };

    const agregarMiembroEquipo = () => {
        setMiembrosEquipo((prev) => [
            ...prev,
            {
                ocupacion: OCUPACION_MIEMBRO,
                nombre: '',
                fecha: todayChile(),
            },
        ]);
    };

    const eliminarMiembroEquipo = (index: number) => {
        setMiembrosEquipo((prev) => {
            if (prev.length <= 1) {
                return prev;
            }
            return prev.filter((_, filaIndex) => filaIndex !== index);
        });
    };

    const validarFormulario = () => {
        if (!descripcionTarea.trim()) {
            setError('Debe ingresar la descripcion de la tarea / trabajo.');
            return false;
        }

        if (!objetivoTarea.trim()) {
            setError('Debe ingresar el objetivo de la tarea / trabajo.');
            return false;
        }

        if (existeProcedimiento === '') {
            setError('Debe indicar si existe procedimiento para la tarea evaluada.');
            return false;
        }

        if (existeProcedimiento === 'SI' && !nombreProcedimiento.trim()) {
            setError('Debe ingresar el nombre del procedimiento.');
            return false;
        }

        if (!fechaRealizacionArt) {
            setError('Debe ingresar la fecha de realizacion del ART.');
            return false;
        }

        if (!areaFaenaLugar.trim()) {
            setError('Debe ingresar el area / faena / lugar.');
            return false;
        }

        if (!liderAreaId) {
            setError('Debe seleccionar el lider de area (prevencionista).');
            return false;
        }

        if (!getNombreLiderArea()) {
            setError(
                loadingPrevencionistas
                    ? 'Se estan cargando los prevencionistas. Intenta nuevamente en unos segundos.'
                    : 'El prevencionista seleccionado no es valido.'
            );
            return false;
        }

        if (!artRegistradoPor.trim()) {
            setError('Debe ingresar quien registra el ART.');
            return false;
        }

        if (!supervisorResponsableId) {
            setError('Debe seleccionar el supervisor responsable en la seccion de aprobacion.');
            return false;
        }

        if (!getNombreSupervisorResponsable()) {
            setError(
                loadingSupervisores
                    ? 'Se estan cargando los supervisores. Intenta nuevamente en unos segundos.'
                    : 'El supervisor seleccionado no es valido.'
            );
            return false;
        }

        const equiposHerramientasLimpios = getEquiposHerramientasSeleccionados();

        if (
            equiposHerramientasSeleccionados.includes(EQUIPOS_HERRAMIENTAS_OTROS)
            && parseEquiposHerramientas(equiposHerramientasOtros).length === 0
        ) {
            setError('Debe ingresar al menos un equipo/herramienta en la opcion Otros.');
            return false;
        }

        if (equiposHerramientasLimpios.length === 0) {
            setError('Debe seleccionar al menos un equipo o herramienta para la tarea.');
            return false;
        }

        if (impactoRespuesta === '') {
            setError('Debe indicar si la tarea impacta sobre otras personas o trabajos.');
            return false;
        }

        if (impactoRespuesta === 'SI' && impactoOpciones.length === 0) {
            setError('Debe seleccionar al menos un impacto cuando la respuesta es SI.');
            return false;
        }

        const filasSinRespuesta = matrizControles.filter((fila) => fila.respuesta === '');
        if (filasSinRespuesta.length > 0) {
            setError('Debe responder SI, NO o NA en todos los controles de la matriz ART.');
            return false;
        }

        if (mejoramientos.otrasAccionesCorrectivas && !otrasAccionesDetalle.trim()) {
            setError('Debe especificar las otras acciones correctivas sugeridas.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        setLoading(true);
        setError('');

        const preguntasIntegrantesCompat: Record<
            number,
            {
                respuesta: Exclude<RespuestaControl, ''>;
                observacion?: string;
                pregunta: string;
                actividad: string;
                paso: number;
            }
        > = {};

        const riesgosPotencialesCompat: Record<number, Exclude<RespuestaControl, ''>> = {};

        matrizControles.forEach((fila, index) => {
            const respuesta = fila.respuesta as Exclude<RespuestaControl, ''>;
            preguntasIntegrantesCompat[index] = {
                respuesta,
                pregunta: fila.especificacion,
                actividad: fila.actividad,
                paso: fila.paso,
                ...(fila.observacion.trim() ? { observacion: fila.observacion.trim() } : {}),
            };
            riesgosPotencialesCompat[index] = respuesta;
        });

        const etapasTrabajoCompat = matrizControles.map((fila) => ({
            etapa: `Paso ${fila.paso}: ${fila.actividad}`,
            peligros: fila.peligro,
            riesgos: fila.eventoNoDeseado,
            medidasControl: `${fila.control}. ${fila.especificacion}${fila.observacion.trim() ? ` Observacion: ${fila.observacion.trim()}` : ''
                }`,
        }));

        const condicionesClimaticasCompat = {
            artVersion: 'ART_V2',
            impacto: {
                respuesta: impactoRespuesta,
                opciones: impactoOpciones,
                detalle: impactoDetalle.trim() || null,
            },
            mejoramientos: {
                ...mejoramientos,
                otrasAccionesDetalle: otrasAccionesDetalle.trim() || null,
            },
        };

        const equiposHerramientasLimpios = getEquiposHerramientasSeleccionados();
        const nombreSupervisorResponsable = getNombreSupervisorResponsable();
        const nombreLiderArea = getNombreLiderArea();

        const eppElementosCompat = {
            artVersion: 'ART_V2',
            objetivoTarea: objetivoTarea.trim(),
            liderEquipoArt: nombreLiderArea,
            liderAreaId: Number(liderAreaId),
            artRegistradoPor: artRegistradoPor.trim(),
            equiposHerramientas: equiposHerramientasLimpios.join(', '),
            equiposHerramientasListado: equiposHerramientasLimpios,
        };

        const grupoTrabajoCompat = [
            {
                ocupacion: liderAprobacion.ocupacion,
                nombre: nombreSupervisorResponsable,
                firma: null,
                fecha: liderAprobacion.fecha || todayChile(),
                rut: liderAprobacion.fecha || todayChile(),
            },
            ...miembrosEquipo.map((fila, index) => ({
                ocupacion: `${OCUPACION_MIEMBRO} ${index + 1}`,
                nombre: fila.nombre.trim(),
                firma: null,
                fecha: fila.fecha || todayChile(),
                rut: fila.fecha || todayChile(),
            })),
        ];

        const resumenImpacto = [
            `Impacto sobre otras personas o trabajos: ${impactoRespuesta}`,
            impactoDetalle.trim() ? `Detalle impacto: ${impactoDetalle.trim()}` : '',
        ]
            .filter(Boolean)
            .join('\n');

        const tareaNormadaPor = existeProcedimiento === 'SI' ? 'Documento' : 'AST';
        const empresaResponsable =
            artRegistradoPor.trim() ||
            session?.empresa ||
            session?.name ||
            session?.username ||
            'No especificado';

        const riesgosControlados = matrizControles.every(
            (fila) => fila.respuesta === 'SI' || fila.respuesta === 'NA'
        );

        try {
            const response = await fetch(`/api/servicios/${servicioId}/checklists/riesgo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tareaRealizar: descripcionTarea.trim(),
                    fecha: new Date(fechaRealizacionArt).toISOString(),
                    empresaResponsable,
                    lugarAreaTrabajo: areaFaenaLugar.trim(),
                    tareaNormadaPor,
                    nombreDocumento: existeProcedimiento === 'SI' ? nombreProcedimiento.trim() : null,
                    preguntasIntegrantes: preguntasIntegrantesCompat,
                    controlSupervisor: resumenImpacto || null,
                    riesgosPotenciales: riesgosPotencialesCompat,
                    condicionesClimaticas: condicionesClimaticasCompat,
                    eppElementos: eppElementosCompat,
                    etapasTrabajo: etapasTrabajoCompat,
                    instruccionesEspeciales: comentariosNotas.trim() || null,
                    grupoTrabajo: grupoTrabajoCompat,
                    supervisorResponsableId: Number(supervisorResponsableId),
                    riesgosControlados,
                    completado: true,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    typeof data.message === 'string' ? data.message : 'No se pudo guardar el ART.'
                );
            }

            router.push(`/servicios/${servicioId}/checklists`);
            router.refresh();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Ocurrio un error inesperado al guardar el ART.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="rounded-lg bg-white p-6 shadow">
                <h1 className="text-2xl font-bold text-gray-900">
                    ANALISIS DE RIESGOS DEL TRABAJO (ART)
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Complete la informacion general, la matriz de controles y la aprobacion del ART.
                </p>
            </div>

            <section className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">SECCION A - INFORMACION GENERAL Y PERSONAL</h2>

                <div className="mt-6">
                    <h3 className="text-base font-semibold text-gray-900">Informacion General</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Descripcion de la tarea / trabajo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={descripcionTarea}
                                onChange={(e) => setDescripcionTarea(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: CARGA, TRANSPORTE Y DESCARGA"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Objetivo de la tarea / trabajo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={objetivoTarea}
                                onChange={(e) => setObjetivoTarea(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describa el objetivo principal de la tarea"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                Existe procedimiento para la tarea a ser evaluada? <span className="text-red-500">*</span>
                            </p>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="existe-procedimiento"
                                        checked={existeProcedimiento === 'SI'}
                                        onChange={() => setExisteProcedimiento('SI')}
                                        className="h-4 w-4"
                                    />
                                    SI
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="existe-procedimiento"
                                        checked={existeProcedimiento === 'NO'}
                                        onChange={() => setExisteProcedimiento('NO')}
                                        className="h-4 w-4"
                                    />
                                    NO
                                </label>
                            </div>
                        </div>

                        {existeProcedimiento === 'SI' && (
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nombre del procedimiento <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nombreProcedimiento}
                                    onChange={(e) => setNombreProcedimiento(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre del procedimiento"
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Fecha de realizacion del ART <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={fechaRealizacionArt}
                                onChange={(e) => setFechaRealizacionArt(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Area / Faena / Lugar <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={areaFaenaLugar}
                                onChange={(e) => setAreaFaenaLugar(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Area o lugar donde se ejecuta la tarea"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Lider de area <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={liderAreaId}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLiderAreaId(value ? Number(value) : '');
                                    setError('');
                                }}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    {loadingPrevencionistas
                                        ? 'Cargando prevencionistas...'
                                        : 'Seleccione un prevencionista'}
                                </option>
                                {prevencionistas.map((prevencionista) => (
                                    <option key={prevencionista.id} value={prevencionista.id}>
                                        {getSupervisorDisplayName(prevencionista)}
                                    </option>
                                ))}
                            </select>
                            {!loadingPrevencionistas && prevencionistas.length === 0 && (
                                <p className="mt-1 text-xs text-red-600">
                                    No hay prevencionistas disponibles para seleccionar.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                ART registrado por <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={artRegistradoPor}
                                onChange={(e) => setArtRegistradoPor(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nombre de quien registra"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Lista de equipos y herramientas para la tarea <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-md border border-gray-200 p-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {EQUIPOS_HERRAMIENTAS_OPCIONES.map((opcion) => (
                                        <label
                                            key={opcion}
                                            className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={equiposHerramientasSeleccionados.includes(opcion)}
                                                onChange={() => toggleEquipoHerramienta(opcion)}
                                                className="h-4 w-4"
                                            />
                                            {opcion}
                                        </label>
                                    ))}
                                </div>

                                {equiposHerramientasSeleccionados.includes(EQUIPOS_HERRAMIENTAS_OTROS) && (
                                    <div className="mt-4">
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Otros (puede agregar uno o varios, separados por coma)
                                        </label>
                                        <textarea
                                            value={equiposHerramientasOtros}
                                            onChange={(e) => setEquiposHerramientasOtros(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Linterna, traba ruedas"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-base font-semibold text-gray-900">Impacto sobre otras personas o trabajos</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Las actividades de la tarea impactan sobre otras personas o trabajos?
                    </p>

                    <div className="mt-3 flex gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="radio"
                                name="impacto"
                                checked={impactoRespuesta === 'SI'}
                                onChange={() => setImpactoRespuesta('SI')}
                                className="h-4 w-4"
                            />
                            SI
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="radio"
                                name="impacto"
                                checked={impactoRespuesta === 'NO'}
                                onChange={() => setImpactoRespuesta('NO')}
                                className="h-4 w-4"
                            />
                            NO
                        </label>
                    </div>

                    {impactoRespuesta === 'SI' && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {IMPACTO_OPCIONES.map((opcion) => (
                                    <label
                                        key={opcion}
                                        className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={impactoOpciones.includes(opcion)}
                                            onChange={() => toggleImpactoOpcion(opcion)}
                                            className="h-4 w-4"
                                        />
                                        {opcion}
                                    </label>
                                ))}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Detalle adicional de impacto
                                </label>
                                <textarea
                                    value={impactoDetalle}
                                    onChange={(e) => setImpactoDetalle(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describa impactos adicionales si corresponde"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">ART - ANALISIS DE RIESGOS DEL TRABAJO</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Para cada control, indique si cumple (SI), no cumple (NO) o no aplica (NA).
                </p>

                <div className="mt-6 space-y-3 lg:hidden">
                    {matrizControles.map((fila) => (
                        <div key={fila.id} className="rounded-lg border border-gray-200 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Paso {fila.paso}</p>
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">Control #{fila.id}</span>
                            </div>

                            <div className="space-y-2 text-xs text-gray-700">
                                <p><span className="font-semibold text-gray-900">Actividad:</span> {fila.actividad}</p>
                                <p><span className="font-semibold text-gray-900">Peligro:</span> {fila.peligro}</p>
                                <p><span className="font-semibold text-gray-900">Evento no deseado:</span> {fila.eventoNoDeseado}</p>
                                <p><span className="font-semibold text-gray-900">Control:</span> {fila.control}</p>
                                <p><span className="font-semibold text-gray-900">Especificacion de ejecucion:</span> {fila.especificacion}</p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-4">
                                {(['SI', 'NO', 'NA'] as const).map((opcion) => (
                                    <label key={opcion} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                        <input
                                            type="radio"
                                            name={`respuesta-mobile-${fila.id}`}
                                            checked={fila.respuesta === opcion}
                                            onChange={() => setRespuestaMatriz(fila.id, opcion)}
                                            className="h-4 w-4"
                                        />
                                        {opcion}
                                    </label>
                                ))}
                            </div>

                            <input
                                type="text"
                                value={fila.observacion}
                                onChange={(e) => setObservacionMatriz(fila.id, e.target.value)}
                                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Observacion (opcional)"
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-6 hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-280 border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-700">
                                <th className="w-14 border border-gray-200 px-2 py-2">Paso</th>
                                <th className="w-48 border border-gray-200 px-2 py-2">Actividad</th>
                                <th className="w-36 border border-gray-200 px-2 py-2">Peligro</th>
                                <th className="w-56 border border-gray-200 px-2 py-2">Evento No Deseado</th>
                                <th className="w-44 border border-gray-200 px-2 py-2">Control</th>
                                <th className="w-72 border border-gray-200 px-2 py-2">Especificacion de ejecucion del control</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrizControles.map((fila) => (
                                <tr key={fila.id} className="align-top text-xs text-gray-700">
                                    <td className="border border-gray-200 px-2 py-2 font-semibold text-gray-900">{fila.paso}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.actividad}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.peligro}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.eventoNoDeseado}</td>
                                    <td className="border border-gray-200 px-2 py-2">{fila.control}</td>
                                    <td className="border border-gray-200 px-2 py-2">
                                        <p className="font-medium text-gray-900">{fila.especificacion}</p>

                                        <div className="mt-2 flex flex-wrap gap-3">
                                            {(['SI', 'NO', 'NA'] as const).map((opcion) => (
                                                <label key={opcion} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                                                    <input
                                                        type="radio"
                                                        name={`respuesta-${fila.id}`}
                                                        checked={fila.respuesta === opcion}
                                                        onChange={() => setRespuestaMatriz(fila.id, opcion)}
                                                        className="h-4 w-4"
                                                    />
                                                    {opcion}
                                                </label>
                                            ))}
                                        </div>

                                        <input
                                            type="text"
                                            value={fila.observacion}
                                            onChange={(e) => setObservacionMatriz(fila.id, e.target.value)}
                                            className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-[11px] text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Observacion (opcional)"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">Mejoramientos sugeridos / acciones correctivas</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={mejoramientos.cambioTareas}
                            onChange={() => setMejoramiento('cambioTareas')}
                            className="h-4 w-4"
                        />
                        Cambio de tareas
                    </label>

                    <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={mejoramientos.cambioHerramientasEquipos}
                            onChange={() => setMejoramiento('cambioHerramientasEquipos')}
                            className="h-4 w-4"
                        />
                        Cambio de herramientas o equipos
                    </label>

                    <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={mejoramientos.reciclajeCapacitacion}
                            onChange={() => setMejoramiento('reciclajeCapacitacion')}
                            className="h-4 w-4"
                        />
                        Reciclaje o capacitacion adicional
                    </label>

                    <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={mejoramientos.otrasAccionesCorrectivas}
                            onChange={() => setMejoramiento('otrasAccionesCorrectivas')}
                            className="h-4 w-4"
                        />
                        Otras acciones correctivas
                    </label>
                </div>

                {mejoramientos.otrasAccionesCorrectivas && (
                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Detalle de otras acciones correctivas <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={otrasAccionesDetalle}
                            onChange={(e) => setOtrasAccionesDetalle(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describa acciones correctivas adicionales"
                        />
                    </div>
                )}
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">Comentarios y notas al procedimiento</h2>
                <textarea
                    value={comentariosNotas}
                    onChange={(e) => setComentariosNotas(e.target.value)}
                    rows={6}
                    className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingrese comentarios y notas"
                />
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900">SECCION C - APROBACION</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Primera fila fija para supervisor responsable (lider de equipo). La primera fila de miembro se completa con el operario. La fecha se asigna automaticamente.
                </p>
                <div className="mt-4 space-y-3 md:hidden">
                    <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ocupacion / Designacion</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{OCUPACION_LIDER}</p>

                        <div className="mt-3">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                            <select
                                value={supervisorResponsableId}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSupervisorResponsableId(value ? Number(value) : '');
                                    setError('');
                                }}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    {loadingSupervisores
                                        ? 'Cargando supervisores...'
                                        : 'Seleccione un supervisor'}
                                </option>
                                {supervisores.map((supervisor) => (
                                    <option key={supervisor.id} value={supervisor.id}>
                                        {getSupervisorDisplayName(supervisor)}
                                    </option>
                                ))}
                            </select>
                            {!loadingSupervisores && supervisores.length === 0 && (
                                <p className="mt-1 text-xs text-red-600">
                                    No hay supervisores disponibles para asignar.
                                </p>
                            )}
                        </div>

                        <div className="mt-3">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                            <input
                                type="date"
                                value={liderAprobacion.fecha}
                                readOnly
                                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-black"
                            />
                        </div>
                    </div>

                    {miembrosEquipo.map((fila, index) => (
                        <div key={`${fila.ocupacion}-${index}`} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ocupacion / Designacion</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {OCUPACION_MIEMBRO} {index + 1}{index === 0 ? ' (Operario)' : ''}
                                    </p>
                                </div>
                                {miembrosEquipo.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => eliminarMiembroEquipo(index)}
                                        className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                                    >
                                        Quitar
                                    </button>
                                )}
                            </div>

                            <div className="mt-3">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                                <input
                                    type="text"
                                    value={fila.nombre}
                                    onChange={(e) => actualizarMiembroEquipo(index, 'nombre', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre"
                                />
                            </div>

                            <div className="mt-3">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                                <input
                                    type="date"
                                    value={fila.fecha}
                                    readOnly
                                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-black"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-180 border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-left text-sm text-gray-700">
                                <th className="border border-gray-200 px-3 py-2">Ocupacion / Designacion</th>
                                <th className="border border-gray-200 px-3 py-2">Nombre</th>
                                <th className="border border-gray-200 px-3 py-2">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-sm text-gray-700">
                                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{OCUPACION_LIDER}</td>
                                <td className="border border-gray-200 px-3 py-2">
                                    <select
                                        value={supervisorResponsableId}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSupervisorResponsableId(value ? Number(value) : '');
                                            setError('');
                                        }}
                                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            {loadingSupervisores
                                                ? 'Cargando supervisores...'
                                                : 'Seleccione un supervisor'}
                                        </option>
                                        {supervisores.map((supervisor) => (
                                            <option key={supervisor.id} value={supervisor.id}>
                                                {getSupervisorDisplayName(supervisor)}
                                            </option>
                                        ))}
                                    </select>
                                    {!loadingSupervisores && supervisores.length === 0 && (
                                        <p className="mt-1 text-xs text-red-600">
                                            No hay supervisores disponibles para asignar.
                                        </p>
                                    )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                    <input
                                        type="date"
                                        value={liderAprobacion.fecha}
                                        readOnly
                                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-black"
                                    />
                                </td>
                            </tr>

                            {miembrosEquipo.map((fila, index) => (
                                <tr key={`${fila.ocupacion}-${index}`} className="text-sm text-gray-700">
                                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                                        {OCUPACION_MIEMBRO} {index + 1}{index === 0 ? ' (Operario)' : ''}
                                        {miembrosEquipo.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => eliminarMiembroEquipo(index)}
                                                className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                                            >
                                                Quitar
                                            </button>
                                        )}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2">
                                        <input
                                            type="text"
                                            value={fila.nombre}
                                            onChange={(e) => actualizarMiembroEquipo(index, 'nombre', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nombre"
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2">
                                        <input
                                            type="date"
                                            value={fila.fecha}
                                            readOnly
                                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-black"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={agregarMiembroEquipo}
                        className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                        Agregar miembro de equipo
                    </button>
                </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {loading ? 'Guardando ART...' : 'Guardar Analisis de Riesgos del Trabajo'}
                </button>
            </div>
        </form>
    );
}
