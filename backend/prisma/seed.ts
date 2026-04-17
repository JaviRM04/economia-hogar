import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const usuario1 = await prisma.usuario.upsert({
    where: { email: 'javi@demo.com' },
    update: {},
    create: { nombre: 'Javi', email: 'javi@demo.com', password: passwordHash, avatarColor: '#6366f1' },
  });

  const usuario2 = await prisma.usuario.upsert({
    where: { email: 'ana@demo.com' },
    update: {},
    create: { nombre: 'Ana', email: 'ana@demo.com', password: passwordHash, avatarColor: '#ec4899' },
  });

  console.log(`✅ Usuarios: ${usuario1.nombre}, ${usuario2.nombre}`);

  const ahora = new Date();
  const m = ahora.getMonth();
  const y = ahora.getFullYear();

  await prisma.gasto.createMany({
    data: [
      { importe: 124.5, descripcion: 'Mercadona - compra semanal', categoria: 'ALIMENTACION', tipo: 'COMUN', usuarioId: usuario1.id, fecha: new Date(y, m, 3) },
      { importe: 89.0,  descripcion: 'Mercadona - compra quincenal', categoria: 'ALIMENTACION', tipo: 'COMUN', usuarioId: usuario2.id, fecha: new Date(y, m, 15) },
      { importe: 12.99, descripcion: 'Netflix', categoria: 'SUSCRIPCIONES', tipo: 'COMUN', usuarioId: usuario1.id, fecha: new Date(y, m, 1) },
      { importe: 9.99,  descripcion: 'Spotify Premium', categoria: 'SUSCRIPCIONES', tipo: 'INDIVIDUAL', usuarioId: usuario1.id, fecha: new Date(y, m, 1) },
      { importe: 45.0,  descripcion: 'Cena restaurante cumpleaños', categoria: 'RESTAURANTES', tipo: 'COMUN', usuarioId: usuario2.id, fecha: new Date(y, m, 10) },
      { importe: 350.0, descripcion: 'Luz + gas', categoria: 'HOGAR', tipo: 'COMUN', usuarioId: usuario1.id, fecha: new Date(y, m, 5) },
      { importe: 65.0,  descripcion: 'Gasolina', categoria: 'TRANSPORTE', tipo: 'INDIVIDUAL', usuarioId: usuario1.id, fecha: new Date(y, m, 8) },
      { importe: 78.5,  descripcion: 'Ropa verano Zara', categoria: 'ROPA', tipo: 'INDIVIDUAL', usuarioId: usuario2.id, fecha: new Date(y, m, 12) },
      { importe: 25.0,  descripcion: 'Farmacia', categoria: 'SALUD', tipo: 'INDIVIDUAL', usuarioId: usuario2.id, fecha: new Date(y, m, 7) },
      { importe: 18.0,  descripcion: 'Cine + palomitas', categoria: 'OCIO', tipo: 'COMUN', usuarioId: usuario1.id, fecha: new Date(y, m, 14) },
    ],
  });
  console.log('✅ Gastos creados');

  await prisma.ingreso.createMany({
    data: [
      { importe: 2200.0, descripcion: 'Nómina', categoria: 'SALARIO', usuarioId: usuario1.id, fecha: new Date(y, m, 28) },
      { importe: 1800.0, descripcion: 'Nómina', categoria: 'SALARIO', usuarioId: usuario2.id, fecha: new Date(y, m, 28) },
      { importe: 300.0,  descripcion: 'Proyecto freelance', categoria: 'FREELANCE', usuarioId: usuario1.id, fecha: new Date(y, m, 20) },
    ],
  });
  console.log('✅ Ingresos creados');

  await prisma.facturaRecurrente.createMany({
    data: [
      { nombre: 'Alquiler',       importe: 950.0, diaMes: 1,  categoria: 'HOGAR',         tipo: 'COMUN',       creadaPorId: usuario1.id },
      { nombre: 'Netflix',        importe: 12.99, diaMes: 1,  categoria: 'SUSCRIPCIONES', tipo: 'COMUN',       creadaPorId: usuario1.id },
      { nombre: 'Spotify',        importe: 9.99,  diaMes: 1,  categoria: 'SUSCRIPCIONES', tipo: 'INDIVIDUAL',  creadaPorId: usuario1.id, afectaAId: usuario1.id },
      { nombre: 'Seguro coche',   importe: 85.0,  diaMes: 15, categoria: 'TRANSPORTE',    tipo: 'INDIVIDUAL',  creadaPorId: usuario1.id, afectaAId: usuario1.id },
      { nombre: 'Gimnasio Ana',   importe: 35.0,  diaMes: 5,  categoria: 'SALUD',         tipo: 'INDIVIDUAL',  creadaPorId: usuario2.id, afectaAId: usuario2.id },
      { nombre: 'Internet fibra', importe: 45.0,  diaMes: 20, categoria: 'HOGAR',         tipo: 'COMUN',       creadaPorId: usuario1.id },
    ],
  });
  console.log('✅ Facturas recurrentes creadas');

  await prisma.deuda.createMany({
    data: [
      { importe: 45.0, concepto: 'Cena cumpleaños (pagué yo por los dos)', deudorId: usuario2.id, acreedorId: usuario1.id, estado: 'PENDIENTE' },
      { importe: 20.0, concepto: 'Compra farmacia urgente', deudorId: usuario1.id, acreedorId: usuario2.id, estado: 'PENDIENTE' },
    ],
  });
  console.log('✅ Deudas creadas');

  const metaVacaciones = await prisma.meta.create({
    data: { nombre: 'Vacaciones verano', emoji: '🏖️', importeObjetivo: 2000.0, importeActual: 650.0, fechaLimite: new Date(y, 5, 30), estado: 'ACTIVA', usuarioId: usuario1.id },
  });
  const metaEmergencias = await prisma.meta.create({
    data: { nombre: 'Fondo de emergencias', emoji: '🛡️', importeObjetivo: 5000.0, importeActual: 1200.0, estado: 'ACTIVA', usuarioId: usuario1.id },
  });
  const metaCoche = await prisma.meta.create({
    data: { nombre: 'Coche nuevo', emoji: '🚗', importeObjetivo: 15000.0, importeActual: 3000.0, estado: 'ACTIVA', usuarioId: usuario2.id },
  });

  await prisma.aportacion.createMany({
    data: [
      { metaId: metaVacaciones.id,   importe: 200, nota: 'Enero',    usuarioId: usuario1.id, fecha: new Date(y, m - 2, 1) },
      { metaId: metaVacaciones.id,   importe: 250, nota: 'Febrero',  usuarioId: usuario2.id, fecha: new Date(y, m - 1, 1) },
      { metaId: metaVacaciones.id,   importe: 200, nota: 'Marzo',    usuarioId: usuario1.id, fecha: new Date(y, m, 1) },
      { metaId: metaEmergencias.id,  importe: 400, nota: 'Inicio',   usuarioId: usuario1.id, fecha: new Date(y, m - 2, 15) },
      { metaId: metaEmergencias.id,  importe: 800, nota: 'x2 meses', usuarioId: usuario1.id, fecha: new Date(y, m - 1, 15) },
      { metaId: metaCoche.id,        importe: 1500, nota: 'Q1',      usuarioId: usuario2.id, fecha: new Date(y, m - 2, 1) },
      { metaId: metaCoche.id,        importe: 1500, nota: 'Q2',      usuarioId: usuario2.id, fecha: new Date(y, m - 1, 1) },
    ],
  });
  console.log('✅ Metas y aportaciones creadas');

  await prisma.presupuesto.createMany({
    data: [
      { categoria: 'ALIMENTACION', importe: 400, usuarioId: usuario1.id },
      { categoria: 'OCIO',         importe: 150, usuarioId: usuario1.id },
      { categoria: 'RESTAURANTES', importe: 200, usuarioId: usuario1.id },
      { categoria: 'TRANSPORTE',   importe: 150, usuarioId: usuario1.id },
    ],
  });
  console.log('✅ Presupuestos creados');

  console.log('\n🎉 Seed completado.');
  console.log('   javi@demo.com  / demo1234');
  console.log('   ana@demo.com   / demo1234');
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
