import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos demo de producción...');

  const [aportaciones, gastos, ingresos, deudas, metas, facturas, presupuestos, categorias] = await Promise.all([
    prisma.aportacion.deleteMany(),
    prisma.gasto.deleteMany(),
    prisma.ingreso.deleteMany(),
    prisma.deuda.deleteMany(),
    prisma.meta.deleteMany(),
    prisma.facturaRecurrente.deleteMany(),
    prisma.presupuesto.deleteMany(),
    prisma.categoriaPersonalizada.deleteMany(),
  ]);

  console.log(`✅ Aportaciones eliminadas: ${aportaciones.count}`);
  console.log(`✅ Gastos eliminados: ${gastos.count}`);
  console.log(`✅ Ingresos eliminados: ${ingresos.count}`);
  console.log(`✅ Deudas eliminadas: ${deudas.count}`);
  console.log(`✅ Metas eliminadas: ${metas.count}`);
  console.log(`✅ Facturas recurrentes eliminadas: ${facturas.count}`);
  console.log(`✅ Presupuestos eliminados: ${presupuestos.count}`);
  console.log(`✅ Categorías personalizadas eliminadas: ${categorias.count}`);

  // Actualizar telegramId de Javier
  const javier = await prisma.usuario.update({
    where: { email: 'javirm@casa.com' },
    data: { telegramId: '833164789' },
  });
  console.log(`✅ TelegramId de ${javier.nombre} actualizado: ${javier.telegramId}`);

  console.log('\n🎉 Base de datos limpia y lista.');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
