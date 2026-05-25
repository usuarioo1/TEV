import 'dotenv/config';
import prisma from '../lib/prisma';

type Snapshot = {
    users: number;
    tractoCamiones: number;
    semiremolques: number;
    servicios: number;
    analisisRiesgo: number;
    checklistEquipo: number;
    checklistTractoCamion: number;
    checklistFatiga: number;
    aprobacionesSupervisor: number;
    guiasDespacho: number;
    noConformidades: number;
    hallazgos: number;
    comentariosNoConformidad: number;
    comentariosHallazgo: number;
    caminatas: number;
    reportesPeligro: number;
    tarjetasStop: number;
    controlesCalidadArt: number;
    tareasAsignadas: number;
    posts: number;
};

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const isConfirmed = args.has('--confirm');
const showHelp = args.has('--help') || args.has('-h');
const allowProduction = args.has('--allow-production');

function printUsage(): void {
    console.log('Uso:');
    console.log('  tsx scripts/reset-operativo.ts --dry-run');
    console.log('  tsx scripts/reset-operativo.ts --confirm');
    console.log('');
    console.log('Flags:');
    console.log('  --dry-run            Solo muestra conteos, no borra datos');
    console.log('  --confirm            Ejecuta borrado operativo');
    console.log('  --allow-production   Permite correr con NODE_ENV=production');
}

function format(value: number): string {
    return value.toLocaleString('es-CL');
}

async function getSnapshot(): Promise<Snapshot> {
    const [
        users,
        tractoCamiones,
        semiremolques,
        servicios,
        analisisRiesgo,
        checklistEquipo,
        checklistTractoCamion,
        checklistFatiga,
        aprobacionesSupervisor,
        guiasDespacho,
        noConformidades,
        hallazgos,
        comentariosNoConformidad,
        comentariosHallazgo,
        caminatas,
        reportesPeligro,
        tarjetasStop,
        controlesCalidadArt,
        tareasAsignadas,
        posts,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.tractoCamion.count(),
        prisma.semiremolque.count(),
        prisma.servicio.count(),
        prisma.analisisRiesgo.count(),
        prisma.checklistEquipo.count(),
        prisma.checklistTractoCamion.count(),
        prisma.checklistFatiga.count(),
        prisma.aprobacionSupervisor.count(),
        prisma.guiaDespacho.count(),
        prisma.noConformidad.count(),
        prisma.hallazgo.count(),
        prisma.comentarioNoConformidad.count(),
        prisma.comentarioHallazgo.count(),
        prisma.caminataSeguridad.count(),
        prisma.reportePeligro.count(),
        prisma.tarjetaStop.count(),
        prisma.controlCalidadART.count(),
        prisma.tareaAsignada.count(),
        prisma.post.count(),
    ]);

    return {
        users,
        tractoCamiones,
        semiremolques,
        servicios,
        analisisRiesgo,
        checklistEquipo,
        checklistTractoCamion,
        checklistFatiga,
        aprobacionesSupervisor,
        guiasDespacho,
        noConformidades,
        hallazgos,
        comentariosNoConformidad,
        comentariosHallazgo,
        caminatas,
        reportesPeligro,
        tarjetasStop,
        controlesCalidadArt,
        tareasAsignadas,
        posts,
    };
}

function getOperationalTotal(snapshot: Snapshot): number {
    return (
        snapshot.servicios +
        snapshot.analisisRiesgo +
        snapshot.checklistEquipo +
        snapshot.checklistTractoCamion +
        snapshot.checklistFatiga +
        snapshot.aprobacionesSupervisor +
        snapshot.guiasDespacho +
        snapshot.noConformidades +
        snapshot.hallazgos +
        snapshot.comentariosNoConformidad +
        snapshot.comentariosHallazgo +
        snapshot.caminatas +
        snapshot.reportesPeligro +
        snapshot.tarjetasStop +
        snapshot.controlesCalidadArt +
        snapshot.tareasAsignadas +
        snapshot.posts
    );
}

function printSnapshot(title: string, snapshot: Snapshot): void {
    console.log(`\n${title}`);
    console.log('Preservados:');
    console.log(`  User                : ${format(snapshot.users)}`);
    console.log(`  TractoCamion        : ${format(snapshot.tractoCamiones)}`);
    console.log(`  Semiremolque        : ${format(snapshot.semiremolques)}`);

    console.log('\nOperativos:');
    console.log(`  Servicio            : ${format(snapshot.servicios)}`);
    console.log(`  AnalisisRiesgo      : ${format(snapshot.analisisRiesgo)}`);
    console.log(`  ChecklistEquipo     : ${format(snapshot.checklistEquipo)}`);
    console.log(`  ChecklistTractoCamion: ${format(snapshot.checklistTractoCamion)}`);
    console.log(`  ChecklistFatiga     : ${format(snapshot.checklistFatiga)}`);
    console.log(`  AprobacionSupervisor: ${format(snapshot.aprobacionesSupervisor)}`);
    console.log(`  GuiaDespacho        : ${format(snapshot.guiasDespacho)}`);
    console.log(`  NoConformidad       : ${format(snapshot.noConformidades)}`);
    console.log(`  Hallazgo            : ${format(snapshot.hallazgos)}`);
    console.log(`  ComentarioNC        : ${format(snapshot.comentariosNoConformidad)}`);
    console.log(`  ComentarioHallazgo  : ${format(snapshot.comentariosHallazgo)}`);
    console.log(`  CaminataSeguridad   : ${format(snapshot.caminatas)}`);
    console.log(`  ReportePeligro      : ${format(snapshot.reportesPeligro)}`);
    console.log(`  TarjetaStop         : ${format(snapshot.tarjetasStop)}`);
    console.log(`  ControlCalidadART   : ${format(snapshot.controlesCalidadArt)}`);
    console.log(`  TareaAsignada       : ${format(snapshot.tareasAsignadas)}`);
    console.log(`  Post                : ${format(snapshot.posts)}`);
    console.log(`\n  Total operativos    : ${format(getOperationalTotal(snapshot))}`);
}

async function resetOperativo(): Promise<void> {
    if (showHelp) {
        printUsage();
        return;
    }

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL no esta definido.');
    }

    if (process.env.NODE_ENV === 'production' && !allowProduction) {
        throw new Error('Bloqueado en production. Usa --allow-production si realmente lo necesitas.');
    }

    if (!isDryRun && !isConfirmed) {
        throw new Error('Debes usar --dry-run o --confirm.');
    }

    console.log('Reset operativo preparado para conservar: User, TractoCamion y Semiremolque.');

    const before = await getSnapshot();
    printSnapshot('Conteos antes', before);

    if (isDryRun) {
        console.log('\nDry run finalizado. No se realizaron cambios.');
        return;
    }

    await prisma.$transaction([
        prisma.tareaAsignada.deleteMany({}),
        prisma.post.deleteMany({}),
        prisma.servicio.deleteMany({}),
        prisma.reportePeligro.deleteMany({ where: { caminataId: null } }),
        prisma.tarjetaStop.deleteMany({ where: { caminataId: null } }),
        prisma.controlCalidadART.deleteMany({ where: { caminataId: null } }),
        prisma.caminataSeguridad.deleteMany({}),
    ]);

    const after = await getSnapshot();
    printSnapshot('Conteos despues', after);

    const deleted = getOperationalTotal(before) - getOperationalTotal(after);
    console.log(`\nRegistros operativos eliminados: ${format(deleted)}`);

    const preservedOk =
        before.users === after.users &&
        before.tractoCamiones === after.tractoCamiones &&
        before.semiremolques === after.semiremolques;

    if (!preservedOk) {
        console.warn('Atencion: hubo cambios en tablas preservadas. Revisa la base de datos antes de continuar.');
        return;
    }

    console.log('Reset operativo completado correctamente.');
}

resetOperativo()
    .catch((error) => {
        console.error('Error durante reset operativo:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
