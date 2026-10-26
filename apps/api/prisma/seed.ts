import { PrismaClient } from '@prisma/client';
import { FICTIONAL_DOCTORS, FICTIONAL_SPECIALTIES } from '../src/modules/doctors/fictional-doctors.data.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DocTALK database with fictional healthcare data...');

  // 1. Seed Specialties
  for (const s of FICTIONAL_SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
      },
    });
  }

  console.log(`✅ Seeded ${FICTIONAL_SPECIALTIES.length} specialties`);
  console.log('✅ Seeding complete. Ready for development.');
}

main()
  .catch((e) => {
    console.error('Seeding error (Note: If DB is offline in local dev, in-memory mocks are active):', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
