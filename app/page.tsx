'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';
import InicioHeader from '@/components/inicio/InicioHeader';
import SeccionReportarInicio from '@/components/seccionReportarInicio/SeccionReportarInicio';
import ActividadesPendientes from '@/components/inicio/ActividadesPendientes';
import GridPrevencionista from '@/components/inicio/GridPrevencionista';
import GridSupervisor from '@/components/inicio/GridSupervisor';
import GridCoordinador from '@/components/inicio/GridCoordinador';
import GridTaller from '@/components/inicio/GridTaller';
import ModalReporte from '@/components/inicio/ModalReporte';
import type { CaminataPendiente, TareaAsignada, AlertaResumen, ARTResumen } from '@/components/inicio/types';

export default function Home() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState<'seleccion' | 'peligro' | 'stop' | 'art'>('seleccion');

  const [caminatasPendientes, setCaminatasPendientes] = useState<CaminataPendiente[]>([]);
  const [tareasAsignadas, setTareasAsignadas] = useState<TareaAsignada[]>([]);
  const [reportesCierre, setReportesCierre] = useState<AlertaResumen[]>([]);
  const [reportesVerificacion, setReportesVerificacion] = useState<AlertaResumen[]>([]);
  const [controlesART, setControlesART] = useState<ARTResumen[]>([]);
  const [serviciosPendientesAprobacion, setServiciosPendientesAprobacion] = useState(0);
  const [noConformidadesPendientes, setNoConformidadesPendientes] = useState(0);
  const [hallazgosPendientes, setHallazgosPendientes] = useState(0);
  const [actividadesLoading, setActividadesLoading] = useState(false);
  const [expandedTareas, setExpandedTareas] = useState(false);
  const [expandedCaminatas, setExpandedCaminatas] = useState(false);
  const [expandedCierre, setExpandedCierre] = useState(false);
  const [expandedVerificacion, setExpandedVerificacion] = useState(false);
  const [expandedARTs, setExpandedARTs] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.rol === 'operario') {
      router.push('/servicios');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (!session || (session.rol !== 'supervisor' && session.rol !== 'jefaturas' && session.rol !== 'coordinador' && session.rol !== 'prevencionista')) {
      return;
    }
    queueMicrotask(() => setActividadesLoading(true));
    Promise.all([
      fetch('/api/caminatas').then(r => r.ok ? r.json() : []),
      fetch('/api/tareas-asignadas').then(r => r.ok ? r.json() : []),
      fetch('/api/alertas/pendientes').then(r => r.ok ? r.json() : null),
      session.rol === 'supervisor'
        ? fetch('/api/supervisor/pendientes-aprobacion').then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]).then(([caminatasData, tareasData, alertasData, aprobacionesData]) => {
      // Caminatas pendientes (asignadas al usuario en estado PENDIENTE o EN_PROCESO)
      const pendientes = Array.isArray(caminatasData)
        ? caminatasData.filter((c: { estado?: string; asignadoId?: number }) =>
          (c.estado === 'PENDIENTE' || c.estado === 'EN_PROCESO') &&
          (session.rol !== 'prevencionista' || c.asignadoId === session.id)
        )
        : [];
      setCaminatasPendientes(pendientes);

      // Tareas asignadas pendientes
      setTareasAsignadas(Array.isArray(tareasData) ? tareasData : []);

      // Reportes y tarjetas pendientes de cierre
      if (alertasData) {
        const cierre: AlertaResumen[] = [
          ...(alertasData.pendientes?.reportes || []).map((r: {
            id: number;
            datos?: { tipoPeligro?: string; zonas?: string };
            creadoPor: AlertaResumen['creadoPor'];
            createdAt: string;
          }) => ({
            id: r.id,
            tipo: 'reporte' as const,
            titulo: r.datos?.tipoPeligro || 'Reporte de Peligro',
            zona: r.datos?.zonas || 'N/A',
            creadoPor: r.creadoPor,
            createdAt: r.createdAt,
          })),
          ...(alertasData.pendientes?.tarjetas || []).map((t: {
            id: number;
            datos?: { causa?: string; zonas?: string };
            creadoPor: AlertaResumen['creadoPor'];
            createdAt: string;
          }) => ({
            id: t.id,
            tipo: 'tarjeta' as const,
            titulo: t.datos?.causa || 'Tarjeta Alto/Stop',
            zona: t.datos?.zonas || 'N/A',
            creadoPor: t.creadoPor,
            createdAt: t.createdAt,
          })),
        ];
        setReportesCierre(cierre);

        const verif: AlertaResumen[] = (alertasData.pendientesVerificacion?.reportes || []).map((r: {
          id: number;
          datos?: { tipoPeligro?: string; zonas?: string };
          creadoPor: AlertaResumen['creadoPor'];
          createdAt: string;
        }) => ({
          id: r.id,
          tipo: 'reporte' as const,
          titulo: r.datos?.tipoPeligro || 'Reporte de Peligro',
          zona: r.datos?.zonas || 'N/A',
          creadoPor: r.creadoPor,
          createdAt: r.createdAt,
        }));
        setReportesVerificacion(verif);

        // ARTs pendientes en caminatas del usuario
        setControlesART(Array.isArray(alertasData.arts) ? alertasData.arts : []);
      }

      setServiciosPendientesAprobacion(
        session.rol === 'supervisor' && aprobacionesData && typeof aprobacionesData.total === 'number'
          ? aprobacionesData.total
          : 0
      );
    }).finally(() => setActividadesLoading(false));
  }, [session]);

  useEffect(() => {
    if (!session || (session.rol !== 'taller' && session.rol !== 'prevencionista' && session.rol !== 'coordinador')) {
      return;
    }

    Promise.all([
      fetch('/api/no-conformidades?estado=ABIERTA', { cache: 'no-store' }),
      fetch('/api/hallazgoschecklist?estado=ABIERTA', { cache: 'no-store' }),
    ])
      .then(async ([ncRes, hallazgosRes]) => {
        const ncData = ncRes.ok ? await ncRes.json() : [];
        const hallazgosData = hallazgosRes.ok ? await hallazgosRes.json() : [];

        setNoConformidadesPendientes(Array.isArray(ncData) ? ncData.length : 0);
        setHallazgosPendientes(Array.isArray(hallazgosData) ? hallazgosData.length : 0);
      })
      .catch(() => {
        setNoConformidadesPendientes(0);
        setHallazgosPendientes(0);
      });
  }, [session]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const handleSuccess = () => {
    setShowModal(false);
    setTipoFormulario('seleccion');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!session || (session.rol !== 'jefaturas' && session.rol !== 'prevencionista' && session.rol !== 'supervisor' && session.rol !== 'coordinador' && session.rol !== 'taller')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <InicioHeader name={session.name} rol={session.rol} welcomeMessage={getWelcomeMessage()} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {session.rol === 'jefaturas' ? (
          <div className="space-y-8">

            {/* 1. Actividades pendientes */}
            <section>
              <div className="flex items-center gap-3 mb-4">

              </div>
              <ActividadesPendientes
                caminatasPendientes={caminatasPendientes}
                tareasAsignadas={tareasAsignadas}
                reportesCierre={reportesCierre}
                reportesVerificacion={reportesVerificacion}
                controlesART={controlesART}
                serviciosPendientesAprobacion={serviciosPendientesAprobacion}
                noConformidadesPendientes={noConformidadesPendientes}
                hallazgosPendientes={hallazgosPendientes}
                loading={actividadesLoading}
                expandedTareas={expandedTareas}
                onToggleTareas={() => setExpandedTareas(v => !v)}
                expandedCaminatas={expandedCaminatas}
                onToggleCaminatas={() => setExpandedCaminatas(v => !v)}
                expandedCierre={expandedCierre}
                onToggleCierre={() => setExpandedCierre(v => !v)}
                expandedVerificacion={expandedVerificacion}
                onToggleVerificacion={() => setExpandedVerificacion(v => !v)}
                expandedARTs={expandedARTs}
                onToggleARTs={() => setExpandedARTs(v => !v)}
                singleCardMode={true}
              />
            </section>

            {/* 2. Reportar */}
            <section>
              <div className="flex items-center gap-3 mb-4">

              </div>
              <SeccionReportarInicio
                rol={session.rol}
                onOpenModal={(tipo) => {
                  setTipoFormulario(tipo);
                  setShowModal(true);
                }}
              />
            </section>

          </div>
        ) : (
          <>
            {(session.rol === 'supervisor' || session.rol === 'coordinador') && (
              <ActividadesPendientes
                caminatasPendientes={caminatasPendientes}
                tareasAsignadas={tareasAsignadas}
                reportesCierre={reportesCierre}
                reportesVerificacion={reportesVerificacion}
                controlesART={controlesART}
                serviciosPendientesAprobacion={serviciosPendientesAprobacion}
                noConformidadesPendientes={noConformidadesPendientes}
                hallazgosPendientes={hallazgosPendientes}
                loading={actividadesLoading}
                expandedTareas={expandedTareas}
                onToggleTareas={() => setExpandedTareas(v => !v)}
                expandedCaminatas={expandedCaminatas}
                onToggleCaminatas={() => setExpandedCaminatas(v => !v)}
                expandedCierre={expandedCierre}
                onToggleCierre={() => setExpandedCierre(v => !v)}
                expandedVerificacion={expandedVerificacion}
                onToggleVerificacion={() => setExpandedVerificacion(v => !v)}
                expandedARTs={expandedARTs}
                onToggleARTs={() => setExpandedARTs(v => !v)}
                singleCardMode={true}
              />
            )}

            {session.rol === 'prevencionista' ? (
              <div className="space-y-8">
                <section>
                  <ActividadesPendientes
                    caminatasPendientes={caminatasPendientes}
                    tareasAsignadas={tareasAsignadas}
                    reportesCierre={reportesCierre}
                    reportesVerificacion={reportesVerificacion}
                    controlesART={controlesART}
                    serviciosPendientesAprobacion={serviciosPendientesAprobacion}
                    noConformidadesPendientes={noConformidadesPendientes}
                    hallazgosPendientes={hallazgosPendientes}
                    loading={actividadesLoading}
                    expandedTareas={expandedTareas}
                    onToggleTareas={() => setExpandedTareas(v => !v)}
                    expandedCaminatas={expandedCaminatas}
                    onToggleCaminatas={() => setExpandedCaminatas(v => !v)}
                    expandedCierre={expandedCierre}
                    onToggleCierre={() => setExpandedCierre(v => !v)}
                    expandedVerificacion={expandedVerificacion}
                    onToggleVerificacion={() => setExpandedVerificacion(v => !v)}
                    expandedARTs={expandedARTs}
                    onToggleARTs={() => setExpandedARTs(v => !v)}
                    singleCardMode={true}
                  />
                </section>
                <section>
                  <SeccionReportarInicio
                    rol={session.rol}
                    onOpenModal={(tipo) => {
                      setTipoFormulario(tipo);
                      setShowModal(true);
                    }}
                  />
                </section>
                <section>
                  <GridPrevencionista />
                </section>
              </div>
            ) : (
              <>
                {session.rol !== 'taller' && (
                  <SeccionReportarInicio
                    rol={session.rol}
                    onOpenModal={(tipo) => {
                      setTipoFormulario(tipo);
                      setShowModal(true);
                    }}
                  />
                )}
                {session.rol === 'supervisor' && <GridSupervisor />}
                {session.rol === 'coordinador' && <GridCoordinador />}
                {session.rol === 'taller' && (
                  <GridTaller
                    noConformidadesPendientes={noConformidadesPendientes}
                    hallazgosPendientes={hallazgosPendientes}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <ModalReporte
        show={showModal}
        tipo={tipoFormulario}
        onChange={setTipoFormulario}
        onClose={() => {
          setShowModal(false);
          setTipoFormulario('seleccion');
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
