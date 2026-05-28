import 'dotenv/config';
import prisma from '../lib/prisma';

async function limpiarAlertas() {
    try {
        console.log('🧹 Iniciando limpieza de alertas y controles ART...\n');

        // Borrar Reportes de Peligro
        const reportesEliminados = await prisma.reportePeligro.deleteMany({});
        console.log(`✅ Reportes de Peligro eliminados: ${reportesEliminados.count}`);

        // Borrar Tarjetas Stop
        const tarjetasEliminadas = await prisma.tarjetaStop.deleteMany({});
        console.log(`✅ Tarjetas Stop eliminadas: ${tarjetasEliminadas.count}`);

        // Borrar Controles de Calidad ART
        const controlesEliminados = await prisma.controlCalidadART.deleteMany({});
        console.log(`✅ Controles ART eliminados: ${controlesEliminados.count}`);

        console.log('\n✨ Limpieza completada exitosamente!');
        console.log(`📊 Total de registros eliminados: ${reportesEliminados.count + tarjetasEliminadas.count + controlesEliminados.count}`);

    } catch (error) {
        console.error('❌ Error al limpiar alertas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
limpiarAlertas();
