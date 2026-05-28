import 'dotenv/config';
import prisma from '../lib/prisma';

async function limpiarCaminatas() {
    try {
        console.log('🧹 Iniciando limpieza de caminatas de seguridad y registros asociados...\n');

        // Contar antes de borrar
        const totalTareas = await prisma.tareaAsignada.count();
        const totalControles = await prisma.controlCalidadART.count();
        const totalTarjetas = await prisma.tarjetaStop.count();
        const totalReportes = await prisma.reportePeligro.count();
        const totalCaminatas = await prisma.caminataSeguridad.count();

        console.log('📊 Registros encontrados:');
        console.log(`   TareaAsignada      : ${totalTareas}`);
        console.log(`   ControlCalidadART  : ${totalControles}`);
        console.log(`   TarjetaStop        : ${totalTarjetas}`);
        console.log(`   ReportePeligro     : ${totalReportes}`);
        console.log(`   CaminataSeguridad  : ${totalCaminatas}`);
        console.log('');

        // 1. Tareas asignadas (sin FK a caminatas, hay que borrar primero)
        const tareasEliminadas = await prisma.tareaAsignada.deleteMany({});
        console.log(`✅ TareasAsignadas eliminadas      : ${tareasEliminadas.count}`);

        // 2. Registros independientes (sin caminataId) — no se borran en cascada
        const controlesIndep = await prisma.controlCalidadART.deleteMany({ where: { caminataId: null } });
        console.log(`✅ ControlCalidadART indep. elim.  : ${controlesIndep.count}`);

        const tarjetasIndep = await prisma.tarjetaStop.deleteMany({ where: { caminataId: null } });
        console.log(`✅ TarjetaStop indep. eliminadas   : ${tarjetasIndep.count}`);

        const reportesIndep = await prisma.reportePeligro.deleteMany({ where: { caminataId: null } });
        console.log(`✅ ReportePeligro indep. elim.     : ${reportesIndep.count}`);

        // 3. Caminatas — los registros vinculados se borran en cascada (onDelete: Cascade)
        const caminatasEliminadas = await prisma.caminataSeguridad.deleteMany({});
        console.log(`✅ CaminatasSeguridad eliminadas   : ${caminatasEliminadas.count}`);
        console.log(`   (ControlCalidadART, TarjetaStop y ReportePeligro vinculados borrados en cascada)`);

        const total =
            tareasEliminadas.count +
            controlesIndep.count +
            tarjetasIndep.count +
            reportesIndep.count +
            caminatasEliminadas.count;

        console.log(`\n✨ Limpieza completada exitosamente!`);
        console.log(`📊 Total de registros eliminados: ${total}`);

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

limpiarCaminatas();
