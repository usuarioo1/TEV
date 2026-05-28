import React from 'react';
import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Constants (mirrored from form files) ───────────────────────────────────

const EQUIPO_CATEGORIAS: Record<string, string[]> = {
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
    'NEUMÁTICOS': [
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
    'FIJACIÓN': [
        'Ojales o puntos de amarre',
        'Conos de Seguridad (x4)',
    ],
};

const EQUIPO_LABEL: Record<string, string> = {
    DOCUMENTACION: 'A. DOCUMENTACION (CRITICA)',
    CONEXIONES: 'B. CONEXIONES',
    'NEUMÁTICOS': 'C. NEUMATICOS',
    GENERAL: 'D. GENERAL',
    ESTRUCTURA: 'E. ESTRUCTURA',
    'FIJACIÓN': 'F. FIJACION',
};

const TRACTO_CATEGORIAS: Record<string, string[]> = {
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

const TRACTO_LABEL: Record<string, string> = {
    DOCUMENTACION: 'A. DOCUMENTACIÓN',
    EPP: 'B. EPP',
    LUCES_Y_MICAS: 'C. LUCES Y MICAS',
    CONDICIONES_GENERALES: 'D. CONDICIONES GENERALES',
    MECANICA_Y_MOTOR: 'E. MECÁNICA Y MOTOR',
};

const FATIGA_SECCION_I = [
    'Confirma que ha dormido el tiempo necesario en las últimas 24 horas y se encuentra apto para las labores de conducción',
    '¿Actualmente está tomando medicamentos que provocan somnolencia o sensación de fatiga?',
    '¿Ha realizado actividades físicas exigentes o prolongadas antes de conducir?',
    '¿Ha ingerido alcohol en las últimas 48 horas?',
    '¿Presenta síntomas de resfriado común?',
    '¿Ha ingerido comidas abundantes en la última hora?',
    '¿Ha manejado más de 12 horas acumuladas en las últimas 24 horas?',
];

const FATIGA_SECCION_II = [
    'Dificultad para concentrarse o permanecer alerta',
    'Movimientos lentos o torpes',
    'Visión borrosa',
    'Dificultad para recordar cómo se ha alcanzado la localización actual',
    'Dificultad para mantener una trayectoria recta',
    'Bostezos frecuentes',
    'Pesadez en los párpados',
    'Muchas ganas de dormir ("cabeceos")',
    'Dolor de cabeza',
    'Sensación de mareos',
    'Dolores de nuca y de espalda',
    'Cambios de postura con frecuencia, estiramientos',
];

const PREGUNTAS_INTEGRANTES = [
    '¿Se cuenta con el personal necesario y entrenado para realizar la tarea?',
    '¿Se bloqueó y comprobó energía cero según procedimiento?',
    '¿Se realiza pruebas con equipo energizado?',
    '¿Se cuenta con las herramientas e insumos necesarios?',
    '¿Las herramientas están codificadas y chequeadas?',
    '¿Se encuentra en condiciones física y/o psicológicas para realizar la tarea?',
    '¿Los sistemas eléctricos se encuentran en buen estado?',
    'Existen trabajos simultáneos en el área. Especificar:',
    '¿Cuento con las coordinaciones y autorización para trabajos simultáneos?',
    '¿Se cuenta con el procedimiento en terreno para realizar el trabajo?',
    '¿Conoce el Plan de Emergencia e identificó las vías de evacuación?',
    '¿Tengo identificado los Aspectos Ambientales de mi Actividad?',
];

const RIESGOS_POTENCIALES = [
    'Atrapamiento',
    'Caída al mismo nivel',
    'Caída a distinto nivel',
    'Caída de altura',
    'Caída de objetos',
    'Cortes por objetos / herramientas',
    'Golpe por objetos / Herramientas',
    'Choque contra objetos',
    'Contactos térmicos por calor o frío',
    'Contacto con energía eléctrica',
    'Contacto con fluido a presión',
    'Contacto con sustancias cáusticas y/o corrosivas',
    'Explosiones',
    'Proyección de fragmentos y/o partículas',
    'Atropellos o golpes con vehículos',
    'Choque, colisión o volcamiento',
    'Incendios',
    'Exposición a sustancias químicas tóxicas',
    'Exposición a radiaciones no ionizantes',
    'Exposición a radiaciones ionizantes',
    'Ingesta de sustancias nocivas',
    'Inhalación accidental de sustancias nocivas',
    'Sobreesfuerzos por manipulación de cargas',
    'Sobreesfuerzos por otras causas',
    'Exposición a radiación ultravioleta, ruidos, gases, polvo',
    'Derrame de Sustancia y/o Residuo Peligroso',
];

const EPP_ELEMENTOS = [
    { value: 'casco', label: 'Casco' },
    { value: 'calzadoSeguridad', label: 'Calzado de seguridad' },
    { value: 'coletoCuero', label: 'Coleto de cuero' },
    { value: 'chaquetaPantalonCuero', label: 'Chaqueta y pantalón cuero' },
    { value: 'polainasCuero', label: 'Polainas de cuero' },
    { value: 'fonoProtectorAuditivo', label: 'Fono protector auditivo' },
    { value: 'rotuloIdentificacion', label: 'Rotulo de identificación' },
    { value: 'gafasSeguridad', label: 'Gafas de seguridad' },
    { value: 'guantes', label: 'Guantes' },
    { value: 'proteccionRespiratoria', label: 'Protección respiratoria' },
    { value: 'arnesSeguridad', label: 'Arnés de seguridad' },
    { value: 'buzoPapel', label: 'Buzo de papel' },
    { value: 'taponProtectorAuditivo', label: 'Tapón protector auditivo' },
    { value: 'careta', label: 'Careta' },
    { value: 'mascaraFacial', label: 'Mascara facial' },
    { value: 'mascaraFullFace', label: 'Mascara full face' },
    { value: 'bandejaContencion', label: 'Bandeja de contención' },
    { value: 'materialAbsorbente', label: 'Material Absorbente' },
    { value: 'elementosSegregacion', label: 'Elementos de segregación/señalización' },
    { value: 'cascoBarbiquejo', label: 'Casco con barbiquejo' },
    { value: 'bloqueadorSolar', label: 'Bloqueador solar RUV' },
    { value: 'gafasProteccionSolar', label: 'Gafas con protección solar RUV' },
    { value: 'vestimentaProteccionSolar', label: 'Vestimenta con protección solar RUV' },
];

const CONDICIONES_CLIMATICAS_LABELS: Record<string, string> = {
    viento: 'Viento',
    lluvia: 'Lluvia',
    hielo: 'Hielo',
    barro: 'Barro',
    nieve: 'Nieve',
    terrenoDesnivel: 'Terreno en desnivel',
};

const IMPACTO_OPCIONES = [
    'Proveedores externos',
    'Cliente AA',
    'Ingreso de equipos a las areas de carguio',
    'Descarga e interaccion con terceros en la via publica',
];

const EVIDENCIAS_CIERRE_MARKER = 'EVIDENCIAS_FOTOGRAFICAS_CIERRE:';

// ─── Styles ──────────────────────────────────────────────────────────────────

const PRIMARY = '#1e3a5f';
const PRIMARY_LIGHT = '#e8eef5';
const SUCCESS = '#15803d';
const DANGER = '#dc2626';
const MUTED = '#6b7280';
const BORDER = '#d1d5db';

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontFamily: 'Helvetica',
        fontSize: 8.5,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `2pt solid ${PRIMARY}`,
    },
    companyName: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: PRIMARY,
        letterSpacing: 2,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    serviceCode: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: PRIMARY,
    },
    serviceStatus: {
        fontSize: 8,
        color: MUTED,
        marginTop: 2,
    },
    generatedAt: {
        fontSize: 7,
        color: MUTED,
        marginTop: 2,
    },
    // ── Section ──
    section: {
        marginBottom: 12,
    },
    sectionHeader: {
        backgroundColor: PRIMARY,
        padding: '5 8',
        marginBottom: 6,
    },
    sectionHeaderText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    subSectionHeader: {
        backgroundColor: PRIMARY_LIGHT,
        padding: '3 6',
        marginBottom: 4,
        marginTop: 4,
    },
    subSectionHeaderText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: PRIMARY,
    },
    // ── Info rows ──
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoCell: {
        width: '50%',
        marginBottom: 5,
        paddingRight: 8,
    },
    infoCellFull: {
        width: '100%',
        marginBottom: 5,
    },
    infoCellThird: {
        width: '33%',
        marginBottom: 5,
        paddingRight: 8,
    },
    infoLabel: {
        fontSize: 7,
        color: MUTED,
        marginBottom: 1,
        fontFamily: 'Helvetica-Bold',
    },
    infoValue: {
        fontSize: 8.5,
        color: '#111827',
    },
    // ── Route bar ──
    routeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        border: `1pt solid ${BORDER}`,
        borderRadius: 4,
        padding: '6 10',
        marginBottom: 8,
    },
    routeOrigin: {
        flex: 1,
    },
    routeArrow: {
        marginHorizontal: 8,
        fontSize: 12,
        color: MUTED,
    },
    routeDestination: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 7,
        color: MUTED,
        marginBottom: 1,
    },
    routeText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    // ── Status badges ──
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 3,
        fontSize: 8,
    },
    badgeGreen: { backgroundColor: '#dcfce7', color: SUCCESS },
    badgeRed: { backgroundColor: '#fee2e2', color: DANGER },
    badgeYellow: { backgroundColor: '#fef9c3', color: '#854d0e' },
    badgeGray: { backgroundColor: '#f3f4f6', color: MUTED },
    // ── Items table ──
    table: {
        border: `1pt solid ${BORDER}`,
        marginBottom: 4,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: `1pt solid ${BORDER}`,
        padding: '3 6',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid #e5e7eb`,
        padding: '3 6',
        minHeight: 16,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid #e5e7eb`,
        padding: '3 6',
        backgroundColor: '#fafafa',
        minHeight: 16,
    },
    colItem: { flex: 1, fontSize: 7.5 },
    colStatus: { width: 30, textAlign: 'center', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
    colObs: { width: 120, fontSize: 7, color: '#4b5563' },
    colHeaderText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
    statusSI: { color: SUCCESS },
    statusNO: { color: DANGER },
    statusNA: { color: MUTED },
    // ── Two-column list ──
    twoCol: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    twoColItem: {
        width: '50%',
        paddingRight: 6,
        marginBottom: 3,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    twoColItemFull: {
        width: '100%',
        marginBottom: 3,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkBox: {
        width: 10,
        height: 10,
        border: `1pt solid ${BORDER}`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
        marginTop: 0.5,
        flexShrink: 0,
    },
    checkBoxChecked: {
        backgroundColor: PRIMARY,
        border: `1pt solid ${PRIMARY}`,
    },
    checkMark: { fontSize: 7, color: '#ffffff' },
    checkLabel: { fontSize: 7.5, flex: 1, color: '#374151' },
    // ── Summary table ──
    summaryTable: {
        border: `1pt solid ${BORDER}`,
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid ${BORDER}`,
        padding: '4 8',
        alignItems: 'center',
    },
    summaryRowAlt: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid ${BORDER}`,
        padding: '4 8',
        backgroundColor: '#fafafa',
        alignItems: 'center',
    },
    summaryCol1: { flex: 1, fontSize: 8.5 },
    summaryCol2: { width: 80, textAlign: 'center', fontSize: 8 },
    summaryCol3: { width: 100, textAlign: 'right', fontSize: 7.5, color: MUTED },
    // ── Etapas table ──
    etapasTable: {
        border: `1pt solid ${BORDER}`,
        marginBottom: 4,
    },
    etapasHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: `1pt solid ${BORDER}`,
        padding: '3 4',
    },
    etapasRow: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid #e5e7eb`,
        padding: '3 4',
    },
    etapasColA: { width: '18%', fontSize: 7.5 },
    etapasColB: { width: '20%', fontSize: 7.5 },
    etapasColC: { width: '17%', fontSize: 7.5 },
    etapasColD: { flex: 1, fontSize: 7.5 },
    etapasColHeader: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
    // ── Grupo trabajo ──
    grupoRow: {
        flexDirection: 'row',
        borderBottom: `0.5pt solid ${BORDER}`,
        padding: '3 6',
    },
    grupoCol1: { flex: 1, fontSize: 8 },
    grupoCol2: { width: 100, fontSize: 8 },
    // ── Separator ──
    separator: {
        borderBottom: `1pt solid ${BORDER}`,
        marginVertical: 10,
    },
    // ── Footer ──
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 32,
        right: 32,
        borderTop: `0.5pt solid ${BORDER}`,
        paddingTop: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 7,
        color: MUTED,
    },
    // ── Generic ──
    bold: { fontFamily: 'Helvetica-Bold' },
    mt4: { marginTop: 4 },
    mb4: { marginBottom: 4 },
    observationBox: {
        backgroundColor: '#fffbeb',
        border: `0.5pt solid #fcd34d`,
        padding: '3 6',
        marginTop: 3,
        borderRadius: 2,
    },
    observationText: {
        fontSize: 7.5,
        color: '#92400e',
    },
    evidenceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 3,
    },
    evidenceCard: {
        width: '32%',
        marginRight: '2%',
        marginBottom: 4,
        border: `0.5pt solid ${BORDER}`,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    evidenceCardLast: {
        marginRight: 0,
    },
    evidenceImage: {
        width: '100%',
        height: 80,
        objectFit: 'cover',
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',
    });
}

function fmtDateShort(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Santiago',
    });
}

function getItemStatusStyle(valor: string) {
    if (valor === 'SI') return styles.statusSI;
    if (valor === 'NO') return styles.statusNO;
    return styles.statusNA;
}

function getChecklistBadge(exists: boolean, ok: boolean, label: string) {
    if (!exists) return { text: `${label}: Pendiente`, style: styles.badgeGray };
    if (ok) return { text: `${label}: OK`, style: styles.badgeGreen };
    return { text: `${label}: Con Fallas`, style: styles.badgeRed };
}

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

const normalizeControlRespuesta = (value: unknown): 'SI' | 'NO' | 'NA' | '' => {
    if (value === 'SI' || value === 'NO' || value === 'NA') {
        return value;
    }
    return '';
};

const getListFromString = (value: unknown): string[] => {
    if (typeof value !== 'string') {
        return [];
    }

    return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const parsePasoActividad = (value: unknown): { paso: string; actividad: string } => {
    if (typeof value !== 'string') {
        return { paso: '-', actividad: '-' };
    }

    const match = value.match(/^Paso\s+(\d+)\s*:\s*(.+)$/i);
    if (!match) {
        return { paso: '-', actividad: value || '-' };
    }

    return {
        paso: match[1],
        actividad: match[2] || '-',
    };
};

const fmtDateFromUnknown = (value: unknown): string => {
    if (typeof value !== 'string' || !value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Santiago',
    });
};

function extraerEvidenciasCierre(observaciones?: string | null): string[] {
    if (!observaciones || !observaciones.includes(EVIDENCIAS_CIERRE_MARKER)) return [];

    const markerIndex = observaciones.indexOf(EVIDENCIAS_CIERRE_MARKER);
    const bloque = observaciones.slice(markerIndex);

    return bloque
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => linea.startsWith('- '))
        .map((linea) => {
            const match = linea.match(/https?:\/\/\S+/i);
            return match?.[0] || '';
        })
        .filter((url) => url.length > 0)
        .slice(0, 3);
}

function limpiarBloqueEvidenciasCierre(observaciones?: string | null): string {
    if (!observaciones) return '';

    const sinBloque = observaciones
        .replace(/\r?\n?EVIDENCIAS_FOTOGRAFICAS_CIERRE:\r?\n(?:- \d+\.\s+https?:\/\/[^\r\n]+\r?\n?)*/g, '')
        .trim();

    return sinBloque
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => !/^https?:\/\//i.test(linea))
        .filter((linea) => !/^-\s*\d+\.\s*https?:\/\//i.test(linea))
        .join('\n')
        .trim();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

function SubSectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.subSectionHeader}>
            <Text style={styles.subSectionHeaderText}>{title}</Text>
        </View>
    );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <View style={styles.infoCellFull}>
            <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    );
}

function PageFooter({ servicio }: { servicio: any }) {
    return (
        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
                Viasentra   |   Servicio {servicio.codigo}
            </Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
                `Página ${pageNumber} de ${totalPages}`
            } />
        </View>
    );
}

// ─── Checklist Items Table ────────────────────────────────────────────────────

function ChecklistItemsTable({ categorias, items, labels }: {
    categorias: Record<string, string[]>;
    items: any;
    labels?: Record<string, string>;
}) {
    if (!items) return null;
    const parsed = typeof items === 'string' ? JSON.parse(items) : items;

    return (
        <View>
            {Object.entries(categorias).map(([catKey, itemList]) => {
                const catData = parsed[catKey] || {};
                const label = (labels && labels[catKey]) || catKey;
                return (
                    <View key={catKey} style={styles.mt4}>
                        <SubSectionHeader title={label} />
                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.colItem, styles.colHeaderText]}>Ítem</Text>
                                <Text style={[styles.colStatus, styles.colHeaderText]}>Estado</Text>
                                <Text style={[styles.colObs, styles.colHeaderText]}>Observación</Text>
                            </View>
                            {itemList.map((itemName, idx) => {
                                const itemData = catData[itemName] || {};
                                const valor: string = itemData.valor || '';
                                const obs: string = itemData.observacion || '';
                                const isAlt = idx % 2 === 1;
                                return (
                                    <View key={itemName} style={isAlt ? styles.tableRowAlt : styles.tableRow}>
                                        <Text style={styles.colItem}>{itemName}</Text>
                                        <Text style={[styles.colStatus, getItemStatusStyle(valor)]}>
                                            {valor || '—'}
                                        </Text>
                                        <Text style={styles.colObs}>{obs}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function ServicioPDF({ servicio }: { servicio: any }) {
    const now = new Date().toLocaleDateString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Santiago',
    });

    const ce = servicio.checklistEquipo;
    const ct = servicio.checklistTractoCamion;
    const cf = servicio.checklistFatiga;
    const ar = servicio.analisisRiesgo;
    const ap = servicio.aprobacion;
    const evidenciasCierre = extraerEvidenciasCierre(servicio.observaciones);
    const observacionesSinEvidencias = limpiarBloqueEvidenciasCierre(servicio.observaciones);

    const arEpp = asObject(ar?.eppElementos);
    const arCondiciones = asObject(ar?.condicionesClimaticas);
    const arPreguntas = asObject(ar?.preguntasIntegrantes);
    const arRiesgos = asObject(ar?.riesgosPotenciales);
    const arImpacto = asObject(arCondiciones.impacto);
    const arMejoramientos = asObject(arCondiciones.mejoramientos);
    const arEsV2 = arEpp.artVersion === 'ART_V2' || arCondiciones.artVersion === 'ART_V2';

    const arEquiposListado = asArray(arEpp.equiposHerramientasListado)
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    const arEquipos = arEquiposListado.length > 0
        ? arEquiposListado
        : getListFromString(arEpp.equiposHerramientas);
    const arLiderArea =
        (typeof arEpp.liderArea === 'string' && arEpp.liderArea.trim()) ||
        (typeof arEpp.liderAreaNombre === 'string' && arEpp.liderAreaNombre.trim()) ||
        (typeof arEpp.liderEquipoArt === 'string' && arEpp.liderEquipoArt.trim()) ||
        '—';

    const arImpactoOpciones = asArray(arImpacto.opciones)
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    const arImpactoRespuesta = normalizeControlRespuesta(arImpacto.respuesta);

    const arMejoramientosActivos = [
        {
            label: 'Cambio de tareas',
            active: Boolean(arMejoramientos.cambioTareas),
        },
        {
            label: 'Cambio de herramientas o equipos',
            active: Boolean(arMejoramientos.cambioHerramientasEquipos),
        },
        {
            label: 'Reciclaje o capacitacion adicional',
            active: Boolean(arMejoramientos.reciclajeCapacitacion),
        },
        {
            label: 'Otras acciones correctivas',
            active: Boolean(arMejoramientos.otrasAccionesCorrectivas),
        },
    ].filter((item) => item.active);

    const arGrupo = asArray(ar?.grupoTrabajo).map((item) => asObject(item));
    const arLider =
        arGrupo.find(
            (item) =>
                typeof item.ocupacion === 'string' &&
                item.ocupacion.toLowerCase().includes('lider')
        ) ||
        arGrupo[0] ||
        {};
    const arMiembros = arGrupo.filter((item) => item !== arLider);
    const arSupervisorResponsableNombre =
        ar?.supervisorResponsable?.name ||
        ar?.supervisorResponsable?.username ||
        (typeof arLider.nombre === 'string' && arLider.nombre.trim() ? arLider.nombre : '—');
    const arFechaAprobacionDisplay = ar?.fechaAprobacion
        ? fmtDateShort(ar.fechaAprobacion)
        : fmtDateFromUnknown(arLider.fecha || arLider.rut);

    const arEtapas = asArray(ar?.etapasTrabajo).map((item) => asObject(item));
    const arMatriz = (
        arEtapas.length > 0
            ? arEtapas.map((etapa, index) => {
                const pregunta = asObject(arPreguntas[String(index)]);
                const pasoActividad = parsePasoActividad(etapa.etapa);
                const respuesta =
                    normalizeControlRespuesta(pregunta.respuesta) ||
                    normalizeControlRespuesta(arRiesgos[String(index)]);

                return {
                    index,
                    paso:
                        typeof pregunta.paso === 'number'
                            ? String(pregunta.paso)
                            : pasoActividad.paso,
                    actividad:
                        typeof pregunta.actividad === 'string' && pregunta.actividad.trim()
                            ? pregunta.actividad
                            : pasoActividad.actividad,
                    peligro:
                        typeof etapa.peligros === 'string' && etapa.peligros.trim()
                            ? etapa.peligros
                            : '—',
                    evento:
                        typeof etapa.riesgos === 'string' && etapa.riesgos.trim()
                            ? etapa.riesgos
                            : '—',
                    control:
                        typeof etapa.medidasControl === 'string' && etapa.medidasControl.trim()
                            ? etapa.medidasControl
                            : typeof pregunta.pregunta === 'string' && pregunta.pregunta.trim()
                                ? pregunta.pregunta
                                : '—',
                    respuesta,
                    observacion:
                        typeof pregunta.observacion === 'string' && pregunta.observacion.trim()
                            ? pregunta.observacion
                            : '—',
                };
            })
            : Object.entries(arPreguntas).map(([key, item]) => {
                const pregunta = asObject(item);
                const index = Number.parseInt(key, 10);
                const respuesta =
                    normalizeControlRespuesta(pregunta.respuesta) ||
                    normalizeControlRespuesta(arRiesgos[key]);

                return {
                    index: Number.isNaN(index) ? 9999 : index,
                    paso: typeof pregunta.paso === 'number' ? String(pregunta.paso) : '—',
                    actividad:
                        typeof pregunta.actividad === 'string' && pregunta.actividad.trim()
                            ? pregunta.actividad
                            : '—',
                    peligro: '—',
                    evento: '—',
                    control:
                        typeof pregunta.pregunta === 'string' && pregunta.pregunta.trim()
                            ? pregunta.pregunta
                            : '—',
                    respuesta,
                    observacion:
                        typeof pregunta.observacion === 'string' && pregunta.observacion.trim()
                            ? pregunta.observacion
                            : '—',
                };
            })
    ).sort((a, b) => a.index - b.index);

    return (
        <Document
            title={`Servicio ${servicio.codigo}`}
            author="Viasentra"
            subject="Resumen de Servicio"
        >
            <Page size="A4" style={styles.page}>
                {/* ── Header ── */}
                <View style={styles.header} fixed>
                    <Text style={styles.companyName}>VIASENTRA</Text>
                    <View style={styles.headerRight}>
                        <Text style={styles.serviceCode}>{servicio.codigo}</Text>
                        <Text style={styles.serviceStatus}>
                            Estado: {servicio.estado}
                        </Text>
                        <Text style={styles.generatedAt}>Generado: {now}</Text>
                    </View>
                </View>

                {/* ── Resumen de Estado ── */}
                <View style={styles.section}>
                    <SectionHeader title="RESUMEN DEL SERVICIO" />

                    {/* Ruta */}
                    <View style={styles.routeBar}>
                        <View style={styles.routeOrigin}>
                            <Text style={styles.routeLabel}>ORIGEN</Text>
                            <Text style={styles.routeText}>{servicio.origen}</Text>
                        </View>
                        <Text style={styles.routeArrow}>→</Text>
                        <View style={styles.routeDestination}>
                            <Text style={styles.routeLabel}>DESTINO</Text>
                            <Text style={styles.routeText}>{servicio.destino}</Text>
                        </View>
                    </View>

                    {/* Info general */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>EMPRESA</Text>
                            <Text style={styles.infoValue}>
                                {servicio.empresa?.nombre || '—'}
                            </Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>OPERARIO</Text>
                            <Text style={styles.infoValue}>
                                {servicio.operario?.name || servicio.operario?.username || '—'}
                            </Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>COORDINADOR</Text>
                            <Text style={styles.infoValue}>
                                {servicio.coordinador?.name || servicio.coordinador?.username || '—'}
                            </Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>SUPERVISOR</Text>
                            <Text style={styles.infoValue}>
                                {ap?.supervisor?.name || ap?.supervisor?.username || '—'}
                            </Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>FECHA ASIGNACIÓN</Text>
                            <Text style={styles.infoValue}>{fmtDate(servicio.fechaAsignacion)}</Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>FECHA INICIO</Text>
                            <Text style={styles.infoValue}>{fmtDate(servicio.fechaInicio)}</Text>
                        </View>
                        <View style={styles.infoCellThird}>
                            <Text style={styles.infoLabel}>FECHA TÉRMINO</Text>
                            <Text style={styles.infoValue}>{fmtDate(servicio.fechaFinalizacion)}</Text>
                        </View>
                        {servicio.descripcion && (
                            <View style={styles.infoCellFull}>
                                <Text style={styles.infoLabel}>DESCRIPCIÓN</Text>
                                <Text style={styles.infoValue}>{servicio.descripcion}</Text>
                            </View>
                        )}
                        {observacionesSinEvidencias && (
                            <View style={styles.infoCellFull}>
                                <Text style={styles.infoLabel}>OBSERVACIONES</Text>
                                <Text style={styles.infoValue}>{observacionesSinEvidencias}</Text>
                            </View>
                        )}

                        {evidenciasCierre.length > 0 && (
                            <View style={styles.infoCellFull}>
                                <Text style={styles.infoLabel}>EVIDENCIAS FOTOGRÁFICAS DE CIERRE</Text>
                                <View style={styles.evidenceGrid}>
                                    {evidenciasCierre.map((url: string, index: number) => (
                                        <View
                                            key={`${url}-${index}`}
                                            style={[styles.evidenceCard, (index + 1) % 3 === 0 ? styles.evidenceCardLast : {}]}
                                        >
                                            <Image src={url} style={styles.evidenceImage} />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Estado de validaciones */}
                    <View style={styles.badgeRow}>
                        {[
                            getChecklistBadge(!!ce, ce?.equipoEnCondiciones === true, 'Equipo Rampla'),
                            getChecklistBadge(!!ct, ct?.equipoEnCondiciones === true, 'Tracto Camión'),
                            getChecklistBadge(!!cf, cf?.aptoParaTrabajar === true, 'Fatiga'),
                            getChecklistBadge(!!ar, ar?.riesgosControlados === true, 'AST/ART'),
                        ].map((b, i) => (
                            <Text key={i} style={[styles.badge, b.style]}>{b.text}</Text>
                        ))}
                    </View>

                    {/* Aprobación supervisor */}
                    {ap && (
                        <View style={styles.summaryTable}>
                            <View style={[styles.sectionHeader, { marginBottom: 0 }]}>
                                <Text style={styles.sectionHeaderText}>APROBACIÓN DEL SUPERVISOR</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryCol1}>
                                    Aprobado por: {ap.supervisor?.name || ap.supervisor?.username || '—'}
                                </Text>
                                <Text style={styles.summaryCol2}>
                                    {ap.aprobado ? 'APROBADO' : 'RECHAZADO'}
                                </Text>
                                <Text style={styles.summaryCol3}>{fmtDate(ap.fechaAprobacion)}</Text>
                            </View>
                            {ap.observaciones && (
                                <View style={[styles.summaryRow, { backgroundColor: '#fffbeb' }]}>
                                    <Text style={[styles.summaryCol1, { color: '#92400e', fontSize: 8 }]}>
                                        Observaciones: {ap.observaciones}
                                    </Text>
                                </View>
                            )}
                            {ap.motivoRechazo && (
                                <View style={[styles.summaryRow, { backgroundColor: '#fee2e2' }]}>
                                    <Text style={[styles.summaryCol1, { color: DANGER, fontSize: 8 }]}>
                                        Motivo rechazo: {ap.motivoRechazo}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* ══════════════════════════════════════════
                    CHECKLIST EQUIPO (RAMPLA)
                ══════════════════════════════════════════ */}
                {ce && (
                    <View style={styles.section} break>
                        <SectionHeader title="CHECKLIST DE EQUIPO - RAMPLA / SEMIRREMOLQUE" />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>MARCA / MODELO</Text>
                                <Text style={styles.infoValue}>{ce.marcaModelo || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>PATENTE</Text>
                                <Text style={styles.infoValue}>{ce.patente || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>AÑO</Text>
                                <Text style={styles.infoValue}>{ce.anio || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>CONDUCTOR</Text>
                                <Text style={styles.infoValue}>{ce.conductor || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>FECHA</Text>
                                <Text style={styles.infoValue}>{fmtDateShort(ce.fecha)}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>HORA</Text>
                                <Text style={styles.infoValue}>{ce.hora || '—'}</Text>
                            </View>
                            {ce.horometro && (
                                <View style={styles.infoCell}>
                                    <Text style={styles.infoLabel}>HORÓMETRO</Text>
                                    <Text style={styles.infoValue}>{ce.horometro}</Text>
                                </View>
                            )}
                            {ce.kilometraje && (
                                <View style={styles.infoCell}>
                                    <Text style={styles.infoLabel}>KILOMETRAJE</Text>
                                    <Text style={styles.infoValue}>{ce.kilometraje}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.badgeRow}>
                            <Text style={[styles.badge,
                            ce.equipoEnCondiciones ? styles.badgeGreen : styles.badgeRed]}>
                                {ce.equipoEnCondiciones ? 'EQUIPO EN CONDICIONES' : 'EQUIPO CON FALLAS'}
                            </Text>
                        </View>

                        <ChecklistItemsTable
                            categorias={EQUIPO_CATEGORIAS}
                            items={ce.items}
                            labels={EQUIPO_LABEL}
                        />

                        {ce.observaciones && (
                            <View style={styles.observationBox}>
                                <Text style={[styles.infoLabel, { color: '#92400e' }]}>OBSERVACIONES GENERALES</Text>
                                <Text style={styles.observationText}>{ce.observaciones}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ══════════════════════════════════════════
                    CHECKLIST TRACTO CAMIÓN
                ══════════════════════════════════════════ */}
                {ct && (
                    <View style={styles.section} break>
                        <SectionHeader title="CHECKLIST DE TRACTO CAMIÓN" />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>PATENTE</Text>
                                <Text style={styles.infoValue}>{ct.patente || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>AÑO</Text>
                                <Text style={styles.infoValue}>{ct.anio || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>CONDUCTOR</Text>
                                <Text style={styles.infoValue}>{ct.nombreConductor || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>RUT</Text>
                                <Text style={styles.infoValue}>{ct.rut || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>FECHA</Text>
                                <Text style={styles.infoValue}>{fmtDateShort(ct.fecha)}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>KILOMETRAJE</Text>
                                <Text style={styles.infoValue}>{ct.kilometraje || '—'}</Text>
                            </View>
                        </View>

                        <View style={styles.badgeRow}>
                            <Text style={[styles.badge,
                            ct.equipoEnCondiciones ? styles.badgeGreen : styles.badgeRed]}>
                                {ct.equipoEnCondiciones ? 'EQUIPO EN CONDICIONES' : 'EQUIPO CON FALLAS'}
                            </Text>
                        </View>

                        <ChecklistItemsTable
                            categorias={TRACTO_CATEGORIAS}
                            items={ct.items}
                            labels={TRACTO_LABEL}
                        />

                        {ct.observacionesGenerales && (
                            <View style={styles.observationBox}>
                                <Text style={[styles.infoLabel, { color: '#92400e' }]}>OBSERVACIONES GENERALES</Text>
                                <Text style={styles.observationText}>{ct.observacionesGenerales}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ══════════════════════════════════════════
                    CHECKLIST FATIGA
                ══════════════════════════════════════════ */}
                {cf && (
                    <View style={styles.section} break>
                        <SectionHeader title="CHECKLIST DE FATIGA Y SOMNOLENCIA" />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>CONDUCTOR</Text>
                                <Text style={styles.infoValue}>{cf.nombreConductor || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>RUT</Text>
                                <Text style={styles.infoValue}>{cf.rut || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>FECHA</Text>
                                <Text style={styles.infoValue}>{fmtDateShort(cf.fecha)}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>HORA</Text>
                                <Text style={styles.infoValue}>{cf.hora || '—'}</Text>
                            </View>
                            <View style={styles.infoCell}>
                                <Text style={styles.infoLabel}>LUGAR DE CONTROL</Text>
                                <Text style={styles.infoValue}>{cf.lugarControl || '—'}</Text>
                            </View>
                            {cf.licenciaConducir && (
                                <View style={styles.infoCell}>
                                    <Text style={styles.infoLabel}>LICENCIA DE CONDUCIR</Text>
                                    <Text style={styles.infoValue}>{cf.licenciaConducir}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.badgeRow}>
                            {cf.aptoParaTrabajar
                                ? <Text style={[styles.badge, styles.badgeGreen]}>APTO PARA TRABAJAR</Text>
                                : <Text style={[styles.badge, styles.badgeRed]}>NO APTO PARA TRABAJAR</Text>
                            }
                            {cf.requiereReemplazo &&
                                <Text style={[styles.badge, styles.badgeYellow]}>REQUIERE REEMPLAZO</Text>
                            }
                        </View>

                        {/* Sección I */}
                        <SubSectionHeader title="SECCIÓN I — AUTOEVALUACIÓN" />
                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.colItem, styles.colHeaderText]}>Pregunta</Text>
                                <Text style={[styles.colStatus, styles.colHeaderText]}>Resp.</Text>
                            </View>
                            {(() => {
                                const secI = (typeof cf.items === 'string' ? JSON.parse(cf.items) : cf.items)?.SECCION_I || {};
                                return FATIGA_SECCION_I.map((q, idx) => {
                                    const resp: string = secI[idx] || '—';
                                    return (
                                        <View key={idx} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                            <Text style={styles.colItem}>{q}</Text>
                                            <Text style={[styles.colStatus, getItemStatusStyle(resp)]}>{resp}</Text>
                                        </View>
                                    );
                                });
                            })()}
                        </View>

                        {/* Sección II */}
                        <SubSectionHeader title="SECCIÓN II — INDICADORES DE FATIGA" />
                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.colItem, styles.colHeaderText]}>Síntoma</Text>
                                <Text style={[styles.colStatus, styles.colHeaderText]}>Resp.</Text>
                            </View>
                            {(() => {
                                const secII = (typeof cf.items === 'string' ? JSON.parse(cf.items) : cf.items)?.SECCION_II || {};
                                return FATIGA_SECCION_II.map((q, idx) => {
                                    const resp: string = secII[idx] || '—';
                                    return (
                                        <View key={idx} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                            <Text style={styles.colItem}>{q}</Text>
                                            <Text style={[styles.colStatus, getItemStatusStyle(resp)]}>{resp}</Text>
                                        </View>
                                    );
                                });
                            })()}
                        </View>

                        {cf.observaciones && (
                            <View style={styles.observationBox}>
                                <Text style={[styles.infoLabel, { color: '#92400e' }]}>OBSERVACIONES</Text>
                                <Text style={styles.observationText}>{cf.observaciones}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ══════════════════════════════════════════
                    ANÁLISIS DE RIESGO (AST / ART)
                ══════════════════════════════════════════ */}
                {ar && (
                    <View style={styles.section} break>
                        <SectionHeader title="ANÁLISIS SEGURO DE TAREA (AST / ART)" />

                        {arEsV2 ? (
                            <>
                                <SubSectionHeader title="SECCION A - INFORMACION GENERAL Y PERSONAL" />
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoCellFull}>
                                        <Text style={styles.infoLabel}>DESCRIPCION DE LA TAREA / TRABAJO</Text>
                                        <Text style={styles.infoValue}>{ar.tareaRealizar || '—'}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>OBJETIVO DE LA TAREA / TRABAJO</Text>
                                        <Text style={styles.infoValue}>{String(arEpp.objetivoTarea || '—')}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>FECHA DE REALIZACION DEL ART</Text>
                                        <Text style={styles.infoValue}>{fmtDateShort(ar.fecha)}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>AREA / FAENA / LUGAR</Text>
                                        <Text style={styles.infoValue}>{ar.lugarAreaTrabajo || '—'}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>LIDER DE AREA</Text>
                                        <Text style={styles.infoValue}>{arLiderArea}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>ART REGISTRADO POR</Text>
                                        <Text style={styles.infoValue}>{String(arEpp.artRegistradoPor || ar.empresaResponsable || '—')}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>EXISTE PROCEDIMIENTO</Text>
                                        <Text style={styles.infoValue}>
                                            {ar.tareaNormadaPor === 'Documento' ? 'SI' : 'NO'}
                                        </Text>
                                    </View>
                                    {ar.tareaNormadaPor === 'Documento' && (
                                        <View style={styles.infoCell}>
                                            <Text style={styles.infoLabel}>NOMBRE DEL PROCEDIMIENTO</Text>
                                            <Text style={styles.infoValue}>{ar.nombreDocumento || '—'}</Text>
                                        </View>
                                    )}
                                </View>

                                <SubSectionHeader title="LISTA DE EQUIPOS Y HERRAMIENTAS PARA LA TAREA" />
                                <View style={styles.table}>
                                    {arEquipos.length > 0 ? (
                                        arEquipos.map((equipo, index) => (
                                            <View key={`${equipo}-${index}`} style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                                <Text style={styles.colItem}>{`${index + 1}. ${equipo}`}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.tableRow}>
                                            <Text style={styles.colItem}>Sin equipos/herramientas registrados</Text>
                                        </View>
                                    )}
                                </View>

                                <SubSectionHeader title="IMPACTO SOBRE OTRAS PERSONAS O TRABAJOS" />
                                <View style={styles.infoCellFull}>
                                    <Text style={styles.infoLabel}>RESPUESTA</Text>
                                    <Text style={styles.infoValue}>
                                        {arImpactoRespuesta || 'No informado'}
                                    </Text>
                                </View>
                                {arImpactoRespuesta === 'SI' ? (
                                    <View style={styles.twoCol}>
                                        {IMPACTO_OPCIONES.map((opcion) => {
                                            const selected = arImpactoOpciones.includes(opcion);
                                            return (
                                                <View key={opcion} style={styles.twoColItem}>
                                                    <View style={[styles.checkBox, selected ? styles.checkBoxChecked : {}]}>
                                                        {selected && <Text style={styles.checkMark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.checkLabel}>{opcion}</Text>
                                                </View>
                                            );
                                        })}
                                        {arImpactoOpciones
                                            .filter((item) => !IMPACTO_OPCIONES.includes(item))
                                            .map((item, index) => (
                                                <View key={`${item}-${index}`} style={styles.twoColItemFull}>
                                                    <View style={[styles.checkBox, styles.checkBoxChecked]}>
                                                        <Text style={styles.checkMark}>✓</Text>
                                                    </View>
                                                    <Text style={styles.checkLabel}>{item}</Text>
                                                </View>
                                            ))}
                                    </View>
                                ) : (
                                    <View style={styles.infoCellFull}>
                                        <Text style={styles.infoValue}>No se reportan impactos adicionales.</Text>
                                    </View>
                                )}
                                {typeof arImpacto.detalle === 'string' && arImpacto.detalle.trim() && (
                                    <View style={styles.infoCellFull}>
                                        <Text style={styles.infoLabel}>DETALLE ADICIONAL DE IMPACTO</Text>
                                        <Text style={styles.infoValue}>{arImpacto.detalle}</Text>
                                    </View>
                                )}

                                <SubSectionHeader title="ART - ANALISIS DE RIESGOS DEL TRABAJO" />
                                <View style={styles.table}>
                                    <View style={styles.tableHeaderRow}>
                                        <Text style={[styles.colHeaderText, { width: '7%' }]}>Paso</Text>
                                        <Text style={[styles.colHeaderText, { width: '15%' }]}>Actividad</Text>
                                        <Text style={[styles.colHeaderText, { width: '13%' }]}>Peligro</Text>
                                        <Text style={[styles.colHeaderText, { width: '15%' }]}>Evento</Text>
                                        <Text style={[styles.colHeaderText, { width: '32%' }]}>Control / Especificacion</Text>
                                        <Text style={[styles.colHeaderText, { width: '8%', textAlign: 'center' }]}>Resp.</Text>
                                        <Text style={[styles.colHeaderText, { width: '10%' }]}>Observacion</Text>
                                    </View>
                                    {arMatriz.length > 0 ? (
                                        arMatriz.map((fila, idx) => (
                                            <View key={`${fila.index}-${idx}`} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                                <Text style={{ width: '7%', fontSize: 7.5 }}>{fila.paso}</Text>
                                                <Text style={{ width: '15%', fontSize: 7.5 }}>{fila.actividad}</Text>
                                                <Text style={{ width: '13%', fontSize: 7.5 }}>{fila.peligro}</Text>
                                                <Text style={{ width: '15%', fontSize: 7.5 }}>{fila.evento}</Text>
                                                <Text style={{ width: '32%', fontSize: 7.5 }}>{fila.control}</Text>
                                                <Text style={[
                                                    { width: '8%', textAlign: 'center', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
                                                    getItemStatusStyle(fila.respuesta || ''),
                                                ]}>
                                                    {fila.respuesta || '—'}
                                                </Text>
                                                <Text style={{ width: '10%', fontSize: 7 }}>{fila.observacion}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.tableRow}>
                                            <Text style={styles.colItem}>Sin controles registrados</Text>
                                        </View>
                                    )}
                                </View>

                                <SubSectionHeader title="MEJORAMIENTOS SUGERIDOS / ACCIONES CORRECTIVAS" />
                                <View style={styles.table}>
                                    {arMejoramientosActivos.length > 0 ? (
                                        arMejoramientosActivos.map((item, index) => (
                                            <View key={item.label} style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                                <Text style={styles.colItem}>{item.label}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.tableRow}>
                                            <Text style={styles.colItem}>No se registraron mejoramientos sugeridos</Text>
                                        </View>
                                    )}
                                    {typeof arMejoramientos.otrasAccionesDetalle === 'string' && arMejoramientos.otrasAccionesDetalle.trim() && (
                                        <View style={styles.tableRow}>
                                            <Text style={styles.colItem}>Detalle otras acciones: {arMejoramientos.otrasAccionesDetalle}</Text>
                                        </View>
                                    )}
                                </View>

                                <SubSectionHeader title="COMENTARIOS Y NOTAS AL PROCEDIMIENTO" />
                                <View style={styles.observationBox}>
                                    <Text style={styles.observationText}>
                                        {ar.instruccionesEspeciales || 'Sin comentarios registrados'}
                                    </Text>
                                </View>

                                <SubSectionHeader title="SECCION C - APROBACION" />
                                <View style={styles.table}>
                                    <View style={styles.tableHeaderRow}>
                                        <Text style={[styles.colHeaderText, { width: '40%' }]}>Ocupacion / Designacion</Text>
                                        <Text style={[styles.colHeaderText, { width: '38%' }]}>Nombre</Text>
                                        <Text style={[styles.colHeaderText, { width: '22%' }]}>Fecha</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={{ width: '40%', fontSize: 8 }}>Lider del Equipo</Text>
                                        <Text style={{ width: '38%', fontSize: 8 }}>{arSupervisorResponsableNombre}</Text>
                                        <Text style={{ width: '22%', fontSize: 8 }}>{arFechaAprobacionDisplay}</Text>
                                    </View>
                                    {arMiembros.map((item, index) => (
                                        <View key={`miembro-${index}`} style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                            <Text style={{ width: '40%', fontSize: 8 }}>
                                                {typeof item.ocupacion === 'string' ? item.ocupacion : `Miembro del Equipo ${index + 1}`}
                                            </Text>
                                            <Text style={{ width: '38%', fontSize: 8 }}>
                                                {typeof item.nombre === 'string' && item.nombre ? item.nombre : '—'}
                                            </Text>
                                            <Text style={{ width: '22%', fontSize: 8 }}>
                                                {fmtDateFromUnknown(item.fecha || item.rut)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={[styles.table, {
                                    borderColor: ar.riesgosControlados ? SUCCESS : DANGER,
                                    backgroundColor: ar.riesgosControlados ? '#f0fdf4' : '#fff1f2',
                                }]}>
                                    <View style={[styles.tableRow, { backgroundColor: 'transparent' }]}>
                                        <Text style={[styles.colItem, styles.bold, {
                                            color: ar.riesgosControlados ? SUCCESS : DANGER,
                                        }]}>
                                            {ar.riesgosControlados
                                                ? '✓ Riesgos controlados segun formulario ART'
                                                : '⚠ Riesgos no controlados o pendientes en formulario ART'}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Antecedentes generales */}
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoCellFull}>
                                        <Text style={styles.infoLabel}>TAREA A REALIZAR</Text>
                                        <Text style={styles.infoValue}>{ar.tareaRealizar || '—'}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>FECHA</Text>
                                        <Text style={styles.infoValue}>{fmtDateShort(ar.fecha)}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>EMPRESA RESPONSABLE</Text>
                                        <Text style={styles.infoValue}>{ar.empresaResponsable || '—'}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>LUGAR / ÁREA DE TRABAJO</Text>
                                        <Text style={styles.infoValue}>{ar.lugarAreaTrabajo || '—'}</Text>
                                    </View>
                                    <View style={styles.infoCell}>
                                        <Text style={styles.infoLabel}>TAREA NORMADA POR</Text>
                                        <Text style={styles.infoValue}>{ar.tareaNormadaPor || '—'}</Text>
                                    </View>
                                    {ar.nombreDocumento && (
                                        <View style={styles.infoCell}>
                                            <Text style={styles.infoLabel}>DOCUMENTO</Text>
                                            <Text style={styles.infoValue}>{ar.nombreDocumento}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.badgeRow}>
                                    {ar.riesgosControlados
                                        ? <Text style={[styles.badge, styles.badgeGreen]}>RIESGOS CONTROLADOS</Text>
                                        : <Text style={[styles.badge, styles.badgeYellow]}>CON OBSERVACIONES</Text>
                                    }
                                </View>

                                {/* Preguntas integrantes */}
                                <SubSectionHeader title="PASO 2 — PREGUNTAS A LOS INTEGRANTES" />
                                <View style={styles.table}>
                                    <View style={styles.tableHeaderRow}>
                                        <Text style={[styles.colItem, styles.colHeaderText]}>Pregunta</Text>
                                        <Text style={[styles.colStatus, styles.colHeaderText]}>Resp.</Text>
                                    </View>
                                    {(() => {
                                        const pregs = typeof ar.preguntasIntegrantes === 'string'
                                            ? JSON.parse(ar.preguntasIntegrantes)
                                            : (ar.preguntasIntegrantes || {});
                                        return PREGUNTAS_INTEGRANTES.map((q, idx) => {
                                            const d = pregs[idx];
                                            const resp: string = d?.respuesta || '—';
                                            return (
                                                <View key={idx} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                                    <Text style={styles.colItem}>{q}</Text>
                                                    <Text style={[styles.colStatus, getItemStatusStyle(resp)]}>{resp}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>

                                {ar.controlSupervisor && (
                                    <View style={styles.infoCellFull}>
                                        <Text style={styles.infoLabel}>CONTROL SUPERVISOR</Text>
                                        <Text style={styles.infoValue}>{ar.controlSupervisor}</Text>
                                    </View>
                                )}

                                {/* Riesgos potenciales */}
                                <SubSectionHeader title="PASO 4 — RIESGOS POTENCIALES IDENTIFICADOS" />
                                <View style={styles.twoCol}>
                                    {(() => {
                                        const riesgos = typeof ar.riesgosPotenciales === 'string'
                                            ? JSON.parse(ar.riesgosPotenciales)
                                            : (ar.riesgosPotenciales || {});
                                        return RIESGOS_POTENCIALES.map((riesgo, idx) => {
                                            const val: string = String(riesgos[idx] || '');
                                            const selected = val === 'SI' || val === 'true' || val === true.toString();
                                            return (
                                                <View key={idx} style={styles.twoColItem}>
                                                    <View style={[styles.checkBox, selected ? styles.checkBoxChecked : {}]}>
                                                        {selected && <Text style={styles.checkMark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.checkLabel}>{riesgo}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>

                                {/* Condiciones climáticas */}
                                <SubSectionHeader title="PASO 5 — CONDICIONES ADVERSAS" />
                                <View style={styles.twoCol}>
                                    {(() => {
                                        const conds = typeof ar.condicionesClimaticas === 'string'
                                            ? JSON.parse(ar.condicionesClimaticas)
                                            : (ar.condicionesClimaticas || {});
                                        return Object.entries(CONDICIONES_CLIMATICAS_LABELS).map(([key, label]) => {
                                            const val = conds[key];
                                            const selected = val === true || val === 'true';
                                            return (
                                                <View key={key} style={styles.twoColItem}>
                                                    <View style={[styles.checkBox, selected ? styles.checkBoxChecked : {}]}>
                                                        {selected && <Text style={styles.checkMark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.checkLabel}>{label}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                    {(() => {
                                        const conds = typeof ar.condicionesClimaticas === 'string'
                                            ? JSON.parse(ar.condicionesClimaticas)
                                            : (ar.condicionesClimaticas || {});
                                        if (conds['otro'] && typeof conds['otro'] === 'string') {
                                            return (
                                                <View style={styles.twoColItem}>
                                                    <View style={[styles.checkBox, styles.checkBoxChecked]}>
                                                        <Text style={styles.checkMark}>✓</Text>
                                                    </View>
                                                    <Text style={styles.checkLabel}>Otro: {conds['otro']}</Text>
                                                </View>
                                            );
                                        }
                                        return null;
                                    })()}
                                </View>

                                {/* EPP */}
                                <SubSectionHeader title="PASO 6 — EPP Y ELEMENTOS" />
                                <View style={styles.twoCol}>
                                    {(() => {
                                        const epp = typeof ar.eppElementos === 'string'
                                            ? JSON.parse(ar.eppElementos)
                                            : (ar.eppElementos || {});
                                        return EPP_ELEMENTOS.map(({ value, label }) => {
                                            const selected = epp[value] === true || epp[value] === 'true';
                                            return (
                                                <View key={value} style={styles.twoColItem}>
                                                    <View style={[styles.checkBox, selected ? styles.checkBoxChecked : {}]}>
                                                        {selected && <Text style={styles.checkMark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.checkLabel}>{label}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>

                                {/* Etapas de trabajo */}
                                {(() => {
                                    const etapas: any[] = typeof ar.etapasTrabajo === 'string'
                                        ? JSON.parse(ar.etapasTrabajo)
                                        : (ar.etapasTrabajo || []);
                                    if (!etapas.length) return null;
                                    return (
                                        <View>
                                            <SubSectionHeader title="PASO 7 — ETAPAS DEL TRABAJO" />
                                            <View style={styles.etapasTable}>
                                                <View style={styles.etapasHeaderRow}>
                                                    <Text style={[styles.etapasColA, styles.etapasColHeader]}>Etapa</Text>
                                                    <Text style={[styles.etapasColB, styles.etapasColHeader]}>Peligros</Text>
                                                    <Text style={[styles.etapasColC, styles.etapasColHeader]}>Riesgos</Text>
                                                    <Text style={[styles.etapasColD, styles.etapasColHeader]}>Medidas de Control</Text>
                                                </View>
                                                {etapas.map((e: any, idx: number) => (
                                                    <View key={idx} style={idx % 2 === 1 ? [styles.etapasRow, { backgroundColor: '#fafafa' }] : styles.etapasRow}>
                                                        <Text style={styles.etapasColA}>{e.etapa || '—'}</Text>
                                                        <Text style={styles.etapasColB}>{e.peligros || '—'}</Text>
                                                        <Text style={styles.etapasColC}>{e.riesgos || '—'}</Text>
                                                        <Text style={styles.etapasColD}>{e.medidasControl || '—'}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })()}

                                {/* Instrucciones especiales */}
                                {ar.instruccionesEspeciales && (
                                    <View style={styles.observationBox}>
                                        <Text style={[styles.infoLabel, { color: '#92400e' }]}>INSTRUCCIONES ESPECIALES</Text>
                                        <Text style={styles.observationText}>{ar.instruccionesEspeciales}</Text>
                                    </View>
                                )}

                                {/* Grupo de trabajo */}
                                {(() => {
                                    const grupo: any[] = typeof ar.grupoTrabajo === 'string'
                                        ? JSON.parse(ar.grupoTrabajo)
                                        : (ar.grupoTrabajo || []);
                                    if (!grupo.length) return null;
                                    return (
                                        <View style={styles.mt4}>
                                            <SubSectionHeader title="GRUPO DE TRABAJO" />
                                            <View style={styles.table}>
                                                <View style={styles.tableHeaderRow}>
                                                    <Text style={[styles.grupoCol1, styles.colHeaderText]}>Nombre</Text>
                                                    <Text style={[styles.grupoCol2, styles.colHeaderText]}>RUT</Text>
                                                </View>
                                                {grupo.map((p: any, idx: number) => (
                                                    <View key={idx} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                                                        <Text style={styles.grupoCol1}>{p.nombre || '—'}</Text>
                                                        <Text style={styles.grupoCol2}>{p.rut || '—'}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })()}

                                {/* PASO 10: Firma de Aprobación */}
                                <View style={styles.mt4}>
                                    <SubSectionHeader title="PASO 10 — FIRMA DE APROBACIÓN PARA COMENZAR LA TAREA" />
                                    <View style={[styles.table, {
                                        borderColor: ar.riesgosControlados ? SUCCESS : DANGER,
                                        backgroundColor: ar.riesgosControlados ? '#f0fdf4' : '#fff1f2',
                                    }]}>
                                        <View style={[styles.tableRow, { backgroundColor: 'transparent' }]}>
                                            <Text style={[styles.colItem, styles.bold, {
                                                color: ar.riesgosControlados ? SUCCESS : DANGER,
                                            }]}>
                                                {ar.riesgosControlados
                                                    ? '✓ Todos los riesgos fueron identificados y controlados'
                                                    : '⚠ Riesgos no controlados o pendientes'}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableRow, { backgroundColor: 'transparent' }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.infoLabel}>SUPERVISOR RESPONSABLE</Text>
                                                <Text style={styles.infoValue}>
                                                    {ar.supervisorResponsable
                                                        ? (ar.supervisorResponsable.name || ar.supervisorResponsable.username)
                                                        : '—'}
                                                </Text>
                                            </View>
                                            {ar.fechaAprobacion && (
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.infoLabel}>FECHA DE APROBACIÓN</Text>
                                                    <Text style={styles.infoValue}>{fmtDate(ar.fechaAprobacion)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Footer */}
                <PageFooter servicio={servicio} />
            </Page>
        </Document>
    );
}
