// Tipos compartidos para los componentes de operaciones

export interface Operario {
    id: number;
    name: string | null;
    username: string;
    email: string | null;
}

export interface Coordinador {
    id: number;
    name: string | null;
    username: string;
}

export interface Empresa {
    id: number;
    nombre: string;
}

export interface Supervisor {
    id: number;
    name: string | null;
    username: string;
}

export interface ChecklistEquipo {
    id: number;
    marcaModelo: string;
    patente: string;
    anio: string;
    conductor: string;
    fecha: string;
    hora: string;
    horometro: string | null;
    kilometraje: string | null;
    equipoEnCondiciones: boolean;
    items: any;
    observaciones: string | null;
}

export interface ChecklistFatiga {
    id: number;
    fecha: string;
    hora: string;
    lugarControl: string;
    nombreConductor: string;
    rut: string;
    licenciaConducir: string | null;
    items: any; // JSON con SECCION_I y SECCION_II
    aptoParaTrabajar: boolean;
    observaciones: string | null;
    requiereReemplazo: boolean;
}

export interface ChecklistTractoCamion {
    id: number;
    patente: string;
    anio: string;
    nombreConductor: string;
    rut: string;
    fecha: string;
    kilometraje: string;
    items: any; // JSON con SECCION: { item: "SI" | "NO" | "OB" }
    observacionesGenerales: string | null;
    equipoEnCondiciones: boolean;
    completado: boolean;
}

export interface AnalisisRiesgo {
    id: number;
    tareaRealizar: string;
    fecha: string;
    empresaResponsable: string;
    lugarAreaTrabajo: string;
    tareaNormadaPor: string;
    nombreDocumento: string | null;
    preguntasIntegrantes: any; // JSON con preguntas y respuestas
    controlSupervisor: string | null;
    riesgosPotenciales: any; // Array de strings
    condicionesClimaticas: any; // Array de strings
    eppElementos: any; // Array de strings
    etapasTrabajo: any; // Array de objetos con etapa, peligros, riesgos, medidasControl
    instruccionesEspeciales: string | null;
    grupoTrabajo: any; // Array de objetos con nombre, rut
    riesgosControlados: boolean;
    completado: boolean;
    fechaAprobacion?: string | null;
    supervisorResponsable?: { id: number; name: string | null; username: string } | null;
}

export interface Aprobacion {
    aprobado: boolean;
    observaciones: string | null;
    supervisor: Supervisor;
    fechaDecision: string;
}

export interface Servicio {
    id: number;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estado: string;
    fechaAsignacion: string;
    fechaAceptacion: string | null;
    fechaRechazo: string | null;
    fechaAprobacion: string | null;
    fechaInicioEjecucion: string | null;
    fechaFinalizacion: string | null;
    observaciones: string | null;
    empresa: Empresa | null;
    operario: Operario | null;
    coordinador: Coordinador | null;
    checklistsCompletados: {
        equipo: boolean;
        fatiga: boolean;
        riesgos: boolean;
    };
    porcentajeCompletado: number;
    problemas: string[];
    hallazgos: {
        total: number;
        abiertos: number;
        cerrados: number;
    };
    noConformidades: {
        total: number;
        abiertos: number;
        cerrados: number;
    };
    aprobacion: Aprobacion | null;
    checklistEquipo: ChecklistEquipo | null;
    checklistFatiga: ChecklistFatiga | null;
    checklistTractoCamion: ChecklistTractoCamion | null;
    analisisRiesgo: AnalisisRiesgo | null;
}
