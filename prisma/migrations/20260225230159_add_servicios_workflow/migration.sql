-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('PENDIENTE', 'ASIGNADO', 'ACEPTADO', 'RECHAZADO', 'EN_CHECKLIST', 'PENDIENTE_APROBACION', 'APROBADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "estado" "EstadoServicio" NOT NULL DEFAULT 'PENDIENTE',
    "operarioId" INTEGER,
    "coordinadorId" INTEGER NOT NULL,
    "observaciones" TEXT,
    "motivoRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistEquipo" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "estadoGeneral" BOOLEAN NOT NULL,
    "neumaticos" BOOLEAN NOT NULL,
    "luces" BOOLEAN NOT NULL,
    "frenos" BOOLEAN NOT NULL,
    "espejos" BOOLEAN NOT NULL,
    "documentacion" BOOLEAN NOT NULL,
    "kitSeguridad" BOOLEAN NOT NULL,
    "combustible" BOOLEAN NOT NULL,
    "equipoEnCondiciones" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "reporteFalla" TEXT,
    "requiereMantenimiento" BOOLEAN NOT NULL DEFAULT false,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistFatiga" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "horasSueno" INTEGER NOT NULL,
    "descansoBien" BOOLEAN NOT NULL,
    "sienteCansancio" BOOLEAN NOT NULL,
    "medicamentos" BOOLEAN NOT NULL,
    "consumioAlcohol" BOOLEAN NOT NULL,
    "bostezosFrecuentes" BOOLEAN NOT NULL,
    "dificultadConcentrar" BOOLEAN NOT NULL,
    "ojosPesados" BOOLEAN NOT NULL,
    "conductorApto" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "requiereReemplazo" BOOLEAN NOT NULL DEFAULT false,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistFatiga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisRiesgo" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "riesgosIdentificados" TEXT NOT NULL,
    "nivelRiesgo" TEXT NOT NULL,
    "medidasControl" TEXT NOT NULL,
    "medidasAplicadas" BOOLEAN NOT NULL DEFAULT false,
    "riesgosControlados" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisRiesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprobacionSupervisor" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "supervisorId" INTEGER NOT NULL,
    "checklistEquipoOk" BOOLEAN NOT NULL,
    "checklistFatigaOk" BOOLEAN NOT NULL,
    "analisisRiesgoOk" BOOLEAN NOT NULL,
    "aprobado" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "motivoRechazo" TEXT,
    "firmaDigital" TEXT NOT NULL,
    "fechaAprobacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AprobacionSupervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuiaDespacho" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "numeroGuia" TEXT NOT NULL,
    "kmInicial" DOUBLE PRECISION NOT NULL,
    "kmFinal" DOUBLE PRECISION NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaTermino" TIMESTAMP(3) NOT NULL,
    "tipoCarga" TEXT NOT NULL,
    "pesoCarga" DOUBLE PRECISION,
    "nombreReceptor" TEXT NOT NULL,
    "rutReceptor" TEXT,
    "firmaReceptor" TEXT,
    "observaciones" TEXT,
    "incidentes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuiaDespacho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_codigo_key" ON "Servicio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistEquipo_servicioId_key" ON "ChecklistEquipo"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistFatiga_servicioId_key" ON "ChecklistFatiga"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalisisRiesgo_servicioId_key" ON "AnalisisRiesgo"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "AprobacionSupervisor_servicioId_key" ON "AprobacionSupervisor"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "GuiaDespacho_servicioId_key" ON "GuiaDespacho"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "GuiaDespacho_numeroGuia_key" ON "GuiaDespacho"("numeroGuia");

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_operarioId_fkey" FOREIGN KEY ("operarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_coordinadorId_fkey" FOREIGN KEY ("coordinadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEquipo" ADD CONSTRAINT "ChecklistEquipo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistFatiga" ADD CONSTRAINT "ChecklistFatiga_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisRiesgo" ADD CONSTRAINT "AnalisisRiesgo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprobacionSupervisor" ADD CONSTRAINT "AprobacionSupervisor_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprobacionSupervisor" ADD CONSTRAINT "AprobacionSupervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaDespacho" ADD CONSTRAINT "GuiaDespacho_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
