import { ESTADO_LABEL } from './types';

const fmt = (value?: string | null) => {
    if (!value) return 'N/A';
    try {
        return new Date(value).toLocaleString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return value;
    }
};

const fmtDate = (value?: string | null) => {
    if (!value) return 'N/A';
    try {
        return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return value;
    }
};

const getEmpresaNombre = (datos: any, caminataEmpresaNombre?: string | null) => {
    const empresa = [datos?.empresaNombre, datos?.empresa, datos?.empresaResponsable, caminataEmpresaNombre]
        .find((value) => typeof value === 'string' && value.trim().length > 0);

    return empresa || null;
};

export async function exportRecordPdf(record: any, tipo: 'reporte' | 'tarjeta' | 'art' | 'caminata') {
    const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');
    const empresaNombre = getEmpresaNombre(record?.datos, record?.caminata?.empresa?.nombre);

    const styles = StyleSheet.create({
        page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#f8fafc' },
        header: { backgroundColor: '#1e293b', padding: 14, borderRadius: 6, marginBottom: 14 },
        headerTitle: { fontSize: 16, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
        headerSub: { fontSize: 9, color: '#94a3b8', marginTop: 3 },
        sectionBox: { backgroundColor: '#ffffff', borderRadius: 5, padding: 10, marginBottom: 10, border: '1pt solid #e2e8f0' },
        sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 7, paddingBottom: 4, borderBottom: '1pt solid #e2e8f0' },
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        gridItem: { width: '33%', marginBottom: 6, paddingRight: 6 },
        gridItemHalf: { width: '50%', marginBottom: 6, paddingRight: 6 },
        label: { fontSize: 7, color: '#64748b', marginBottom: 1 },
        value: { fontSize: 9, color: '#0f172a' },
        timelineContainer: { paddingLeft: 14 },
        timelineItem: { marginBottom: 8, paddingLeft: 10, borderLeft: '2pt solid #cbd5e1', paddingBottom: 4 },
        timelineTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
        timelineBy: { fontSize: 8, color: '#475569', marginTop: 1 },
        timelineDate: { fontSize: 7, color: '#94a3b8', marginTop: 1 },
        timelineComment: { fontSize: 8, color: '#374151', marginTop: 2 },
        dot_blue: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 4 },
        dot_orange: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginRight: 4 },
        dot_purple: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a855f7', marginRight: 4 },
        dot_green: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 4 },
        dot_emerald: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 4 },
        dot_red: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 4 },
        dotRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
        dotLabel: { flexDirection: 'column', flex: 1 },
        footer: { marginTop: 10, borderTop: '1pt solid #e2e8f0', paddingTop: 6, fontSize: 7, color: '#94a3b8', textAlign: 'center' },
        artRow: { flexDirection: 'row', marginBottom: 3, paddingBottom: 3, borderBottom: '0.5pt solid #f1f5f9' },
        artIndex: { width: 18, fontSize: 8, color: '#64748b' },
        artDesc: { flex: 1, fontSize: 8, color: '#0f172a', paddingRight: 6 },
        artResultSI: { width: 28, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
        artResultNO: { width: 28, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
        artComment: { marginBottom: 4, paddingLeft: 18, fontSize: 7, color: '#64748b', fontStyle: 'italic' },
    });

    const title =
        tipo === 'reporte' ? 'Reporte de Peligro'
            : tipo === 'tarjeta' ? 'Tarjeta Alto/Stop'
                : tipo === 'art' ? 'Control Análisis de Riesgo en el Trabajo (ART)'
                    : 'Caminata de Seguridad';

    const GItem = ({ label, value, half }: { label: string; value: string; half?: boolean }) => (
        <View style={half ? styles.gridItemHalf : styles.gridItem}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || 'N/A'}</Text>
        </View>
    );

    /* ─── REPORTE DE PELIGRO ─── */
    const ReporteDoc = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSub}>ID #{record.id}  ·  Estado: {ESTADO_LABEL[record.estado] || record.estado || 'N/A'}  ·  Generado: {fmtDate(new Date().toISOString())}</Text>
                </View>

                {/* Info formulario */}
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Información del Formulario</Text>
                    <View style={styles.grid}>
                        <GItem label="Tipo de Peligro" value={record.datos?.tipoPeligro} />
                        <GItem label="Zona" value={record.datos?.zonas || record.caminata?.zona} />
                        <GItem label="Faena" value={record.datos?.faena || record.caminata?.faena} />
                        <GItem label="Empresa" value={empresaNombre} />
                        <GItem label="Ubicación" value={record.datos?.ubicacion} />
                        <GItem label="Actividad" value={record.datos?.actividad} />
                        <GItem label="Tarea" value={record.datos?.tarea} />
                        <GItem label="Tipo Riesgo" value={record.datos?.tipoRiesgo} />
                        <GItem label="Nivel Hallazgo" value={record.datos?.nivelHallazgo} />
                        <GItem label="Plazo Cierre" value={record.datos?.plazoCierre} />
                        <GItem label="Caminata" value={record.caminata?.codigo} />
                        <GItem label="Creado por" value={record.creadoPor} />
                        <GItem label="Rol" value={record.rol} />
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Timeline del Proceso</Text>
                    <View style={styles.timelineContainer}>
                        {/* Creación */}
                        <View style={styles.dotRow}>
                            <View style={styles.dot_blue} />
                            <View style={styles.dotLabel}>
                                <Text style={styles.timelineTitle}>Creado</Text>
                                <Text style={styles.timelineBy}>Por: {record.creadoPor || 'N/A'}</Text>
                                <Text style={styles.timelineDate}>{fmt(record.fecha)}</Text>
                            </View>
                        </View>
                        {/* Completado por tarea asignada */}
                        {record.datos?._completadoPorNombre && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_purple} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Completado desde tarea asignada</Text>
                                    <Text style={styles.timelineBy}>Por: {record.datos._completadoPorNombre}</Text>
                                </View>
                            </View>
                        )}
                        {/* Asignado para cierre */}
                        {record.responsableCierre && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_orange} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Asignado para cierre</Text>
                                    <Text style={styles.timelineBy}>Responsable: {record.responsableCierre}</Text>
                                </View>
                            </View>
                        )}
                        {/* Cierre */}
                        {record.fechaCierre && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_green} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Cierre realizado</Text>
                                    {record.comentarioCierre ? <Text style={styles.timelineComment}>{record.comentarioCierre}</Text> : null}
                                    <Text style={styles.timelineDate}>{fmt(record.fechaCierre)}</Text>
                                </View>
                            </View>
                        )}
                        {/* Verificación */}
                        {record.fechaVerificacion && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_emerald} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Verificado y cerrado</Text>
                                    <Text style={styles.timelineBy}>Por: {record.responsableVerificacion || 'N/A'}</Text>
                                    {record.comentarioVerificacion ? <Text style={styles.timelineComment}>{record.comentarioVerificacion}</Text> : null}
                                    <Text style={styles.timelineDate}>{fmt(record.fechaVerificacion)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.footer}>Documento generado automáticamente · Sistema de Gestión de Seguridad · {fmtDate(new Date().toISOString())}</Text>
            </Page>
        </Document>
    );

    /* ─── TARJETA ALTO/STOP ─── */
    const TarjetaDoc = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSub}>ID #{record.id}  ·  Estado: {ESTADO_LABEL[record.estado] || record.estado || 'N/A'}  ·  Generado: {fmtDate(new Date().toISOString())}</Text>
                </View>

                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Información de la Tarjeta</Text>
                    <View style={styles.grid}>
                        <GItem label="Causa" value={record.datos?.causa} />
                        <GItem label="Zona" value={record.datos?.zonas || record.caminata?.zona} />
                        <GItem label="Faena" value={record.datos?.faenas || record.caminata?.faena} />
                        <GItem label="Empresa" value={empresaNombre} />
                        <GItem label="Causal de Detención" value={record.datos?.causalDetencion} />
                        <GItem label="Motivo Aplicación" value={record.datos?.motivoAplicacionFinal || record.datos?.motivoAplicacion} />
                        <GItem label="Caminata" value={record.caminata?.codigo} />
                        <GItem label="Creado por" value={record.creadoPor} />
                        <GItem label="Rol" value={record.rol} />
                        <GItem label="Fecha creación" value={fmt(record.fecha)} />
                    </View>
                </View>

                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Timeline del Proceso</Text>
                    <View style={styles.timelineContainer}>
                        <View style={styles.dotRow}>
                            <View style={styles.dot_blue} />
                            <View style={styles.dotLabel}>
                                <Text style={styles.timelineTitle}>Tarjeta creada</Text>
                                <Text style={styles.timelineBy}>Por: {record.creadoPor || 'N/A'}</Text>
                                <Text style={styles.timelineDate}>{fmt(record.fecha)}</Text>
                            </View>
                        </View>
                        {record.responsableCierre && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_orange} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Asignado para cierre</Text>
                                    <Text style={styles.timelineBy}>Responsable: {record.responsableCierre}</Text>
                                </View>
                            </View>
                        )}
                        {record.fechaCierre && (
                            <View style={styles.dotRow}>
                                <View style={styles.dot_green} />
                                <View style={styles.dotLabel}>
                                    <Text style={styles.timelineTitle}>Cierre realizado</Text>
                                    {record.comentarioCierre ? <Text style={styles.timelineComment}>{record.comentarioCierre}</Text> : null}
                                    <Text style={styles.timelineDate}>{fmt(record.fechaCierre)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.footer}>Documento generado automáticamente · Sistema de Gestión de Seguridad · {fmtDate(new Date().toISOString())}</Text>
            </Page>
        </Document>
    );

    /* ─── CONTROL ART ─── */
    const ArtDoc = () => {
        const datos = record.datos || {};
        const artItems: any[] = datos.itemsControl || [];
        const artCumplidos = artItems.filter((i: any) => i.cumple === 'SI').length;
        const artLabels = [
            'El ART-AST es específica para la tarea y no es genérica.',
            'Si cambian las condiciones o se incluyen nuevos riesgos, se evalúa nuevamente el ART-AST.',
            'Todo el personal involucrado está registrado en el ART-AST.',
            'La ART-AST la revisó el líder de la tarea y la firmó debidamente.',
            'Se identifican todos los riesgos para controlar la tarea.',
            'Los controles identificados en el documento son concordantes con los implementados en terreno.',
            'En ART-AST se identifica el procedimiento que aplica a la tarea.',
            'Los Controles críticos identificados, son evidenciables en terreno.',
            'Están correctamente identificados los controles si existe trabajos SIMULTÁNEOS.',
        ];
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <Text style={styles.headerSub}>ID #{record.id}  ·  Generado: {fmtDate(new Date().toISOString())}</Text>
                    </View>

                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Información General</Text>
                        <View style={styles.grid}>
                            <GItem label="Fecha" value={fmt(record.fecha)} />
                            <GItem label="Creado por" value={record.creadoPor} />
                            <GItem label="Rol" value={record.rol} />
                            <GItem label="Caminata" value={record.caminata?.codigo} />
                            <GItem label="Zona" value={record.caminata?.zona || datos.zonas} />
                            <GItem label="Faena" value={record.caminata?.faena || datos.faenas || datos.faena} />
                            <GItem label="Empresa" value={empresaNombre} />
                            <GItem label="Área" value={datos.area} />
                            <GItem label="Tarea/Actividad" value={datos.tareaActividad} />
                        </View>
                    </View>

                    {artItems.length > 0 && (
                        <View style={styles.sectionBox}>
                            <Text style={styles.sectionTitle}>
                                Items de Control — {artCumplidos}/{artItems.length} cumplen ({artItems.length > 0 ? Math.round((artCumplidos / artItems.length) * 100) : 0}%)
                            </Text>
                            {artItems.map((item: any, idx: number) => (
                                <View key={idx}>
                                    <View style={styles.artRow}>
                                        <Text style={styles.artIndex}>{idx + 1}.</Text>
                                        <Text style={styles.artDesc}>
                                            {item.descripcion || artLabels[idx] || `Item ${idx + 1}`}
                                        </Text>
                                        <Text style={item.cumple === 'SI' ? styles.artResultSI : styles.artResultNO}>
                                            {item.cumple}
                                        </Text>
                                    </View>
                                    {item.comentario && (
                                        <Text style={styles.artComment}>Comentario: {item.comentario}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {datos.observaciones && (
                        <View style={styles.sectionBox}>
                            <Text style={styles.sectionTitle}>Observaciones</Text>
                            <Text style={styles.value}>{datos.observaciones}</Text>
                        </View>
                    )}

                    <Text style={styles.footer}>Documento generado automáticamente · Sistema de Gestión de Seguridad · {fmtDate(new Date().toISOString())}</Text>
                </Page>
            </Document>
        );
    };

    const doc =
        tipo === 'reporte' ? <ReporteDoc /> :
            tipo === 'tarjeta' ? <TarjetaDoc /> :
                <ArtDoc />;

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${tipo}-${record.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
}

/* ─── EXPORT DETALLE COMPLETO (usa datos ricos de la ruta /api/alertas/[tipo]/[id]) ─── */
export async function exportDetailPdf(
    tipo: 'reporte-peligro' | 'tarjeta-stop' | 'control-art',
    id: number
) {
    const response = await fetch(`/api/alertas/${tipo}/${id}`);
    if (!response.ok) throw new Error('No se pudo obtener los datos del registro');
    const { alerta } = await response.json();

    const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

    const datos = alerta.datos || {};
    const zona = alerta.caminata?.zona || datos.zonas || null;
    const faena = alerta.caminata?.faena || datos.faenas || datos.faena || null;
    const empresaNombre = getEmpresaNombre(datos, alerta.caminata?.empresa?.nombre);
    const creador = alerta.creadoPor?.name || alerta.creadoPor?.username || 'N/A';
    const responsableCierreNombre = alerta.responsableCierre
        ? (alerta.responsableCierre.name || alerta.responsableCierre.username)
        : null;
    const responsableVerifNombre = alerta.responsableVerificacion
        ? (alerta.responsableVerificacion.name || alerta.responsableVerificacion.username)
        : null;

    const tipoLabels: Record<string, string> = {
        'tarjeta-stop': 'Tarjeta Stop',
        'reporte-peligro': 'Reporte de Peligro',
        'control-art': 'Control de Calidad ART',
    };
    const title = tipoLabels[tipo] || 'Alerta de Seguridad';

    // Construir eventos del timeline
    interface TLEvent { color: string; title: string; by?: string; date?: string; comment?: string; }
    const events: TLEvent[] = [];

    events.push({
        color: 'blue',
        title: `${title} Creada`,
        by: `${creador}${alerta.creadoPor?.rol ? ` (${alerta.creadoPor.rol})` : ''}`,
        date: fmt(alerta.createdAt),
    });

    if (tipo === 'tarjeta-stop') {
        if (responsableCierreNombre) {
            events.push({ color: 'orange', title: 'Responsable de Cierre Asignado', by: responsableCierreNombre });
        }
        if (alerta.fechaCierre) {
            events.push({
                color: 'green',
                title: 'Tarjeta Cerrada',
                by: responsableCierreNombre || 'N/A',
                date: fmt(alerta.fechaCierre),
                comment: alerta.comentarioCierre || undefined,
            });
        }
    }

    if (tipo === 'reporte-peligro') {
        if (responsableCierreNombre) {
            events.push({ color: 'orange', title: 'Responsable de Cierre Asignado', by: responsableCierreNombre });
        }
        if (alerta.fechaCierre) {
            events.push({
                color: 'green',
                title: 'Medidas Correctivas Implementadas',
                by: responsableCierreNombre || 'N/A',
                date: fmt(alerta.fechaCierre),
                comment: alerta.comentarioCierre || undefined,
            });
        }
        if (responsableVerifNombre) {
            events.push({ color: 'purple', title: 'Verificador Asignado', by: responsableVerifNombre });
        }
        if (alerta.fechaVerificacion) {
            events.push({
                color: 'emerald',
                title: 'Verificado y Cerrado',
                by: responsableVerifNombre || 'N/A',
                date: fmt(alerta.fechaVerificacion),
                comment: alerta.comentarioVerificacion || undefined,
            });
        }
    }

    if (tipo === 'control-art') {
        events.push({ color: 'green', title: 'Control ART Completado', by: creador, date: fmt(alerta.createdAt) });
    }

    const styles = StyleSheet.create({
        page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#f8fafc' },
        header: { backgroundColor: '#1e293b', padding: 14, borderRadius: 6, marginBottom: 14 },
        headerTitle: { fontSize: 16, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
        headerSub: { fontSize: 9, color: '#94a3b8', marginTop: 3 },
        sectionBox: { backgroundColor: '#ffffff', borderRadius: 5, padding: 10, marginBottom: 10, border: '1pt solid #e2e8f0' },
        sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 7, paddingBottom: 4, borderBottom: '1pt solid #e2e8f0' },
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        gridItem: { width: '33%', marginBottom: 6, paddingRight: 6 },
        gridItemHalf: { width: '50%', marginBottom: 6, paddingRight: 6 },
        gridItemFull: { width: '100%', marginBottom: 6, paddingRight: 6 },
        label: { fontSize: 7, color: '#64748b', marginBottom: 1 },
        value: { fontSize: 9, color: '#0f172a' },
        dotRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
        dotLabel: { flexDirection: 'column', flex: 1 },
        timelineTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
        timelineBy: { fontSize: 8, color: '#475569', marginTop: 1 },
        timelineDate: { fontSize: 7, color: '#94a3b8', marginTop: 1 },
        timelineComment: { fontSize: 8, color: '#374151', marginTop: 2, fontStyle: 'italic' },
        dot_blue: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 6, marginTop: 1 },
        dot_orange: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginRight: 6, marginTop: 1 },
        dot_purple: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a855f7', marginRight: 6, marginTop: 1 },
        dot_green: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6, marginTop: 1 },
        dot_emerald: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6, marginTop: 1 },
        artRow: { flexDirection: 'row', marginBottom: 3, paddingBottom: 3, borderBottom: '0.5pt solid #f1f5f9' },
        artIndex: { width: 18, fontSize: 8, color: '#64748b' },
        artDesc: { flex: 1, fontSize: 8, color: '#0f172a', paddingRight: 6 },
        artResultSI: { width: 28, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
        artResultNO: { width: 28, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
        artComment: { marginBottom: 4, paddingLeft: 18, fontSize: 7, color: '#64748b', fontStyle: 'italic' },
        footer: { marginTop: 10, borderTop: '1pt solid #e2e8f0', paddingTop: 6, fontSize: 7, color: '#94a3b8', textAlign: 'center' },
        // Estilos para la sección de comentarios
        commentBox: { backgroundColor: '#f0fdf4', borderRadius: 5, padding: 10, marginBottom: 8, border: '1pt solid #bbf7d0' },
        commentBoxCierre: { backgroundColor: '#f0fdf4', borderRadius: 5, padding: 10, marginBottom: 8, border: '1pt solid #bbf7d0' },
        commentBoxVerif: { backgroundColor: '#eff6ff', borderRadius: 5, padding: 10, marginBottom: 8, border: '1pt solid #bfdbfe' },
        commentLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#15803d', marginBottom: 3, textTransform: 'uppercase' },
        commentLabelVerif: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', marginBottom: 3, textTransform: 'uppercase' },
        commentAuthor: { fontSize: 8, color: '#475569', marginBottom: 4 },
        commentText: { fontSize: 9, color: '#0f172a', lineHeight: 1.4 },
        noCommentText: { fontSize: 8, color: '#94a3b8', fontStyle: 'italic' },
    });

    const DOT_STYLES: Record<string, any> = {
        blue: styles.dot_blue,
        orange: styles.dot_orange,
        purple: styles.dot_purple,
        green: styles.dot_green,
        emerald: styles.dot_emerald,
    };

    const GItem = ({ label, value, half, full }: { label: string; value?: string | null; half?: boolean; full?: boolean }) => (
        <View style={full ? styles.gridItemFull : half ? styles.gridItemHalf : styles.gridItem}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || '-'}</Text>
        </View>
    );

    const TimelineSection = () => (
        <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Timeline del Proceso</Text>
            {events.map((ev, i) => (
                <View key={i} style={styles.dotRow}>
                    <View style={DOT_STYLES[ev.color] || styles.dot_blue} />
                    <View style={styles.dotLabel}>
                        <Text style={styles.timelineTitle}>{ev.title}</Text>
                        {ev.by ? <Text style={styles.timelineBy}>Por: {ev.by}</Text> : null}
                        {ev.comment ? <Text style={styles.timelineComment}>{ev.comment}</Text> : null}
                        {ev.date ? <Text style={styles.timelineDate}>{ev.date}</Text> : null}
                    </View>
                </View>
            ))}
        </View>
    );

    const footerText = `Documento generado automáticamente · Sistema de Gestión de Seguridad · ${fmtDate(new Date().toISOString())}`;

    const artItemsLabels = [
        'El ART-AST es específica para la tarea y no es genérica.',
        'Si cambian las condiciones o se incluyen nuevos riesgos, se evalúa nuevamente el ART-AST.',
        'Todo el personal involucrado está registrado en el ART-AST.',
        'La ART-AST la revisó el líder de la tarea y la firmó debidamente.',
        'Se identifican todos los riesgos para controlar la tarea.',
        'Los controles identificados en el documento son concordantes con los implementados en terreno.',
        'En ART-AST se identifica el procedimiento que aplica a la tarea.',
        'Los Controles críticos identificados, son evidenciables en terreno.',
        'Están correctamente identificados los controles si existe trabajos SIMULTÁNEOS.',
    ];

    let doc: any;

    if (tipo === 'reporte-peligro') {
        doc = (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <Text style={styles.headerSub}>
                            ID #{alerta.id}  ·  Estado: {ESTADO_LABEL[alerta.estado] || alerta.estado || 'N/A'}  ·  Generado: {fmtDate(new Date().toISOString())}
                        </Text>
                    </View>

                    {/* Sección: Información General */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Información General</Text>
                        <View style={styles.grid}>
                            <GItem label="Creado por" value={creador} />
                            <GItem label="Rol" value={alerta.creadoPor?.rol} />
                            <GItem label="Fecha de Creación" value={fmt(alerta.createdAt)} />
                            <GItem label="Caminata" value={alerta.caminata?.codigo} />
                            <GItem label="Zona" value={zona} />
                            <GItem label="Faena" value={faena} />
                            <GItem label="Empresa" value={empresaNombre} />
                        </View>
                    </View>

                    {/* Sección: Formulario completo */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Formulario — Reporte de Peligro</Text>
                        <View style={styles.grid}>
                            <GItem label="Tipo de Peligro" value={datos.tipoPeligro} />
                            <GItem label="Tipo de Riesgo" value={datos.tipoRiesgo} />
                            <GItem label="Nivel de Hallazgo" value={datos.nivelHallazgo} />
                            <GItem label="Zonas Afectadas" value={datos.zonas} />
                            <GItem label="Faena" value={datos.faena} />
                            <GItem label="Ubicación Específica" value={datos.ubicacion} />
                            <GItem label="Actividad" value={datos.actividad} />
                            <GItem label="Tarea" value={datos.tarea} />
                            <GItem label="Plazo de Cierre" value={datos.plazoCierre ? fmtDate(datos.plazoCierre) : undefined} />
                            <GItem label="Responsable de Cierre Asignado" value={responsableCierreNombre} />
                            <GItem label="Verificador Asignado" value={responsableVerifNombre} />
                            <GItem label="Fecha de Cierre" value={alerta.fechaCierre ? fmt(alerta.fechaCierre) : undefined} />
                            <GItem label="Fecha de Verificación" value={alerta.fechaVerificacion ? fmt(alerta.fechaVerificacion) : undefined} />
                        </View>
                        {(datos.descripcionPeligro || datos.descripcionDetallada) && (
                            <GItem label="Descripción del Peligro" value={datos.descripcionPeligro || datos.descripcionDetallada} full />
                        )}
                        {datos.consecuenciaPotencial && (
                            <GItem label="Consecuencia Potencial" value={datos.consecuenciaPotencial} full />
                        )}
                        {datos.medidasSugeridas && (
                            <GItem label="Medidas Sugeridas por el Reportante" value={datos.medidasSugeridas} full />
                        )}
                    </View>

                    {/* Sección: Comentarios dejados por otros usuarios */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Comentarios del Proceso</Text>
                        {alerta.comentarioCierre ? (
                            <View style={styles.commentBoxCierre}>
                                <Text style={styles.commentLabel}>Comentario de Cierre</Text>
                                <Text style={styles.commentAuthor}>
                                    Por: {responsableCierreNombre || 'N/A'}  ·  {alerta.fechaCierre ? fmt(alerta.fechaCierre) : 'Fecha no registrada'}
                                </Text>
                                <Text style={styles.commentText}>{alerta.comentarioCierre}</Text>
                            </View>
                        ) : (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={styles.commentLabel}>Comentario de Cierre</Text>
                                <Text style={styles.noCommentText}>Sin comentario registrado al momento del cierre.</Text>
                            </View>
                        )}
                        {alerta.comentarioVerificacion ? (
                            <View style={styles.commentBoxVerif}>
                                <Text style={styles.commentLabelVerif}>Comentario de Verificación</Text>
                                <Text style={styles.commentAuthor}>
                                    Por: {responsableVerifNombre || 'N/A'}  ·  {alerta.fechaVerificacion ? fmt(alerta.fechaVerificacion) : 'Fecha no registrada'}
                                </Text>
                                <Text style={styles.commentText}>{alerta.comentarioVerificacion}</Text>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.commentLabelVerif}>Comentario de Verificación</Text>
                                <Text style={styles.noCommentText}>Sin comentario registrado al momento de la verificación.</Text>
                            </View>
                        )}
                    </View>

                    <TimelineSection />

                    <Text style={styles.footer}>{footerText}</Text>
                </Page>
            </Document>
        );
    } else if (tipo === 'tarjeta-stop') {
        doc = (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <Text style={styles.headerSub}>
                            ID #{alerta.id}  ·  Estado: {ESTADO_LABEL[alerta.estado] || alerta.estado || 'N/A'}  ·  Generado: {fmtDate(new Date().toISOString())}
                        </Text>
                    </View>

                    {/* Sección: Información General */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Información General</Text>
                        <View style={styles.grid}>
                            <GItem label="Creado por" value={creador} />
                            <GItem label="Rol" value={alerta.creadoPor?.rol} />
                            <GItem label="Fecha de Creación" value={fmt(alerta.createdAt)} />
                            <GItem label="Caminata" value={alerta.caminata?.codigo} />
                            <GItem label="Zona" value={zona} />
                            <GItem label="Faena" value={faena} />
                            <GItem label="Empresa" value={empresaNombre} />
                        </View>
                    </View>

                    {/* Sección: Formulario completo */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Formulario — Tarjeta Alto/Stop</Text>
                        <View style={styles.grid}>
                            <GItem label="Causa Principal" value={datos.causa} />
                            <GItem label="Causal de Detención" value={datos.causalDetencion} />
                            <GItem label="Motivo de Aplicación" value={datos.motivoAplicacionFinal || datos.motivoAplicacion} />
                            <GItem label="Zonas" value={datos.zonas} />
                            <GItem label="Faenas" value={datos.faenas} />
                            <GItem label="Responsable de Cierre Asignado" value={responsableCierreNombre} />
                            <GItem label="Fecha Tarjeta" value={datos.fechaTarjeta ? fmtDate(datos.fechaTarjeta) : undefined} />
                            <GItem label="Fecha de Cierre" value={alerta.fechaCierre ? fmt(alerta.fechaCierre) : undefined} />
                        </View>
                        {datos.descripcionDetallada && (
                            <GItem label="Descripción Detallada" value={datos.descripcionDetallada} full />
                        )}
                        {datos.medidaCorrectiva && (
                            <GItem label="Medida Correctiva Propuesta" value={datos.medidaCorrectiva} full />
                        )}
                        {datos.solucionImplementada && (
                            <GItem label="Solución Implementada" value={datos.solucionImplementada} full />
                        )}
                    </View>

                    {/* Sección: Comentario del cierre */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Comentario del Proceso</Text>
                        {alerta.comentarioCierre ? (
                            <View style={styles.commentBoxCierre}>
                                <Text style={styles.commentLabel}>Comentario de Cierre</Text>
                                <Text style={styles.commentAuthor}>
                                    Por: {responsableCierreNombre || 'N/A'}  ·  {alerta.fechaCierre ? fmt(alerta.fechaCierre) : 'Fecha no registrada'}
                                </Text>
                                <Text style={styles.commentText}>{alerta.comentarioCierre}</Text>
                            </View>
                        ) : (
                            <Text style={styles.noCommentText}>Sin comentario registrado al momento del cierre.</Text>
                        )}
                    </View>

                    <TimelineSection />

                    <Text style={styles.footer}>{footerText}</Text>
                </Page>
            </Document>
        );
    } else {
        // control-art
        const artItems: any[] = datos.itemsControl || [];
        const artCumplidos = artItems.filter((i: any) => i.cumple === 'SI').length;

        doc = (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <Text style={styles.headerSub}>
                            ID #{alerta.id}  ·  Generado: {fmtDate(new Date().toISOString())}
                        </Text>
                    </View>

                    {/* Sección: Información General */}
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Información General</Text>
                        <View style={styles.grid}>
                            <GItem label="Creado por" value={creador} />
                            <GItem label="Rol" value={alerta.creadoPor?.rol} />
                            <GItem label="Fecha" value={fmt(alerta.createdAt)} />
                            <GItem label="Caminata" value={alerta.caminata?.codigo} />
                            <GItem label="Zona" value={zona} />
                            <GItem label="Faena" value={faena} />
                            <GItem label="Empresa" value={empresaNombre} />
                            <GItem label="Área" value={datos.area} />
                            <GItem label="Tarea/Actividad" value={datos.tareaActividad} />
                        </View>
                    </View>

                    {/* Sección: Formulario — Ítems de control */}
                    {artItems.length > 0 && (
                        <View style={styles.sectionBox}>
                            <Text style={styles.sectionTitle}>
                                Formulario — Ítems de Control: {artCumplidos}/{artItems.length} cumplen ({artItems.length > 0 ? Math.round((artCumplidos / artItems.length) * 100) : 0}%)
                            </Text>
                            {artItems.map((item: any, idx: number) => (
                                <View key={idx}>
                                    <View style={styles.artRow}>
                                        <Text style={styles.artIndex}>{idx + 1}.</Text>
                                        <Text style={styles.artDesc}>
                                            {item.descripcion || artItemsLabels[idx] || `Item ${idx + 1}`}
                                        </Text>
                                        <Text style={item.cumple === 'SI' ? styles.artResultSI : styles.artResultNO}>
                                            {item.cumple}
                                        </Text>
                                    </View>
                                    {item.comentario ? (
                                        <Text style={styles.artComment}>Comentario del evaluador: {item.comentario}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Observaciones generales */}
                    {datos.observaciones && (
                        <View style={styles.sectionBox}>
                            <Text style={styles.sectionTitle}>Observaciones Generales</Text>
                            <Text style={styles.value}>{datos.observaciones}</Text>
                        </View>
                    )}

                    <TimelineSection />

                    <Text style={styles.footer}>{footerText}</Text>
                </Page>
            </Document>
        );
    }

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${tipo}-${id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
}
