import 'dotenv/config';
import prisma from '../lib/prisma';
import { sincronizarNoConformidades } from '../lib/no-conformidades';

async function backfillNoConformidades() {
    console.log('🔄 Iniciando backfill de no conformidades...\n');
    let totalTracto = 0;
    let totalSemi = 0;
    let errores = 0;

    // --- Tracto camiones ---
    const checklists = await prisma.checklistTractoCamion.findMany({
        select: { servicioId: true, items: true },
    });

    console.log(`📋 ChecklistTractoCamion encontrados: ${checklists.length}`);
    for (const cl of checklists) {
        try {
            await sincronizarNoConformidades(
                cl.servicioId,
                'TRACTO_CAMION',
                cl.items as Record<string, Record<string, any>>
            );
            totalTracto++;
        } catch (err) {
            console.error(`  ❌ Error en servicioId ${cl.servicioId} (tracto):`, err);
            errores++;
        }
    }
    console.log(`  ✅ Tracto camiones procesados: ${totalTracto}\n`);

    // --- Semirremolques (ChecklistEquipo) ---
    const checklistsEquipo = await prisma.checklistEquipo.findMany({
        select: { servicioId: true, items: true },
    });

    console.log(`📋 ChecklistEquipo (semirremolque) encontrados: ${checklistsEquipo.length}`);
    for (const cl of checklistsEquipo) {
        try {
            await sincronizarNoConformidades(
                cl.servicioId,
                'SEMIREMOLQUE',
                cl.items as Record<string, Record<string, any>>
            );
            totalSemi++;
        } catch (err) {
            console.error(`  ❌ Error en servicioId ${cl.servicioId} (semi):`, err);
            errores++;
        }
    }
    console.log(`  ✅ Semirremolques procesados: ${totalSemi}\n`);

    console.log('─────────────────────────────────');
    console.log(`✨ Backfill completado.`);
    console.log(`   Tracto procesados : ${totalTracto}`);
    console.log(`   Semi procesados   : ${totalSemi}`);
    console.log(`   Errores           : ${errores}`);
}

backfillNoConformidades()
    .catch((e) => {
        console.error('❌ Error fatal:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
