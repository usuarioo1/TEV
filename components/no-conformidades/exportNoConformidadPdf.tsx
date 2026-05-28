'use client';

import type { NoConformidad } from '@/app/no-conformidades/page';

const CHECKLIST_LABELS: Record<string, string> = {
    TRACTO_CAMION: 'Tractocamion',
    SEMIREMOLQUE: 'Semirremolque',
};

const SECCION_LABELS: Record<string, string> = {
    DOCUMENTACION: 'Documentacion',
    EPP: 'EPP',
    LUCES_Y_MICAS: 'Luces y Micas',
    CONDICIONES_GENERALES: 'Condiciones Generales',
    MECANICA_Y_MOTOR: 'Mecanica y Motor',
    CONEXIONES: 'Conexiones',
    NEUMATICOS: 'Neumaticos',
    GENERAL: 'General',
    ESTRUCTURA: 'Estructura',
    FIJACION: 'Fijacion',
};

const ESTADO_LABELS: Record<string, string> = {
    ABIERTA: 'Abierta',
    CERRADA: 'Cerrada',
};

function formatDate(value: string, withTime = false): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';

    if (withTime) {
        return parsed.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return parsed.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function safeText(value?: string | null): string {
    if (!value) return 'N/A';
    const text = value.trim();
    return text.length > 0 ? text : 'N/A';
}

export async function exportNoConformidadPdf(nc: NoConformidad) {
    const { pdf, Document, Page, Text, View, StyleSheet, Image } = await import('@react-pdf/renderer');

    const styles = StyleSheet.create({
        page: {
            paddingTop: 28,
            paddingBottom: 28,
            paddingHorizontal: 24,
            backgroundColor: '#f8fafc',
            fontSize: 9,
            fontFamily: 'Helvetica',
        },
        header: {
            backgroundColor: '#0f172a',
            borderRadius: 6,
            padding: 12,
            marginBottom: 10,
        },
        title: {
            color: '#ffffff',
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
        },
        subtitle: {
            marginTop: 4,
            color: '#cbd5e1',
            fontSize: 8,
        },
        section: {
            backgroundColor: '#ffffff',
            borderRadius: 6,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            padding: 10,
        },
        sectionTitle: {
            fontSize: 10,
            fontFamily: 'Helvetica-Bold',
            color: '#0f172a',
            marginBottom: 7,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: 6,
        },
        cell: {
            width: '50%',
            paddingRight: 8,
        },
        label: {
            color: '#64748b',
            fontSize: 7,
            marginBottom: 1,
        },
        value: {
            color: '#0f172a',
            fontSize: 9,
        },
        valueMuted: {
            color: '#334155',
            fontSize: 9,
        },
        paragraph: {
            color: '#0f172a',
            fontSize: 9,
            lineHeight: 1.35,
        },
        imageRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
        },
        imageBox: {
            width: '32%',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 4,
            padding: 4,
            backgroundColor: '#ffffff',
        },
        image: {
            width: '100%',
            height: 100,
            objectFit: 'cover',
            borderRadius: 3,
        },
        commentCard: {
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 4,
            padding: 6,
            marginBottom: 6,
            backgroundColor: '#f8fafc',
        },
        commentMeta: {
            fontSize: 7,
            color: '#475569',
            marginBottom: 3,
        },
        commentText: {
            fontSize: 8,
            color: '#1f2937',
            lineHeight: 1.3,
        },
        footer: {
            marginTop: 8,
            textAlign: 'center',
            fontSize: 7,
            color: '#94a3b8',
        },
    });

    const checklistLabel = CHECKLIST_LABELS[nc.checklistTipo] ?? nc.checklistTipo;
    const seccionLabel = SECCION_LABELS[nc.seccion] ?? nc.seccion;
    const estadoLabel = ESTADO_LABELS[nc.estado] ?? nc.estado;
    const operario = nc.servicio.operario?.name ?? nc.servicio.operario?.username ?? 'N/A';
    const coordinador = nc.servicio.coordinador?.name ?? nc.servicio.coordinador?.username ?? 'N/A';
    const imagenes = (nc.imagenes ?? []).slice(0, 3);

    const Documento = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>No Conformidad #{nc.id}</Text>
                    <Text style={styles.subtitle}>
                        Estado: {estadoLabel} | Servicio: {safeText(nc.servicio.codigo)} | Generado: {formatDate(new Date().toISOString(), true)}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle de la no conformidad</Text>
                    <View style={styles.grid}>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Checklist</Text>
                            <Text style={styles.value}>{checklistLabel}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Seccion</Text>
                            <Text style={styles.value}>{seccionLabel}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Item</Text>
                            <Text style={styles.value}>{safeText(nc.itemNombre)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Responsable</Text>
                            <Text style={styles.value}>{safeText(nc.responsableRol)}</Text>
                        </View>
                    </View>
                    <Text style={[styles.label, { marginTop: 6 }]}>Observacion</Text>
                    <Text style={styles.paragraph}>{safeText(nc.observacion)}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informacion del servicio</Text>
                    <View style={styles.grid}>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Codigo</Text>
                            <Text style={styles.value}>{safeText(nc.servicio.codigo)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Estado servicio</Text>
                            <Text style={styles.value}>{safeText(nc.servicio.estado)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Origen</Text>
                            <Text style={styles.value}>{safeText(nc.servicio.origen)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Destino</Text>
                            <Text style={styles.value}>{safeText(nc.servicio.destino)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Operario</Text>
                            <Text style={styles.value}>{safeText(operario)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Coordinador</Text>
                            <Text style={styles.value}>{safeText(coordinador)}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.label}>Fecha asignacion</Text>
                            <Text style={styles.valueMuted}>{formatDate(nc.servicio.fechaAsignacion)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Imagenes adjuntas (maximo 3)</Text>
                    {imagenes.length === 0 ? (
                        <Text style={styles.valueMuted}>No hay imagenes adjuntas.</Text>
                    ) : (
                        <View style={styles.imageRow}>
                            {imagenes.map((img, idx) => (
                                <View style={styles.imageBox} key={`${img.publicId}-${idx}`}>
                                    <Image src={img.url} style={styles.image} />
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial de comentarios</Text>
                    {nc.comentarios.length === 0 ? (
                        <Text style={styles.valueMuted}>Sin comentarios.</Text>
                    ) : (
                        <>
                            {nc.comentarios.map((comentario) => (
                                <View key={comentario.id} style={styles.commentCard}>
                                    <Text style={styles.commentMeta}>
                                        {safeText(comentario.autor.name ?? comentario.autor.username)} | {formatDate(comentario.createdAt, true)}
                                    </Text>
                                    <Text style={styles.commentText}>{safeText(comentario.contenido)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                <Text style={styles.footer}>Documento generado desde NextMiner</Text>
            </Page>
        </Document>
    );

    const blob = await pdf(<Documento />).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `no-conformidad-${nc.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
}
