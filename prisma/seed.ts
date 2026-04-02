import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_SUBJECTS = [
  "Algebra 1",
  "Algebra 2",
  "Geometry",
  "Pre-Calculus",
  "Calculus AB",
  "Calculus BC",
  "Statistics",
  "Biology",
  "Chemistry",
  "Physics",
  "English / Writing",
  "History",
  "SAT Math",
  "SAT Reading",
  "ACT Prep",
];

const DEFAULT_FIELD_SECTIONS = [
  {
    entityType: "ACCOUNT" as const,
    sections: [{ name: "Details", position: 0 }],
  },
  {
    entityType: "CONTACT" as const,
    sections: [
      { name: "Academic Info", position: 0 },
      { name: "Additional", position: 1 },
    ],
  },
  {
    entityType: "SCHOOL" as const,
    sections: [{ name: "Details", position: 0 }],
  },
  {
    entityType: "SESSION" as const,
    sections: [{ name: "Session Details", position: 0 }],
  },
];

async function main() {
  console.log("Seeding subjects...");
  for (const name of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding default field sections...");
  for (const { entityType, sections } of DEFAULT_FIELD_SECTIONS) {
    for (const section of sections) {
      const existing = await prisma.fieldSection.findFirst({
        where: { entityType, name: section.name },
      });
      if (!existing) {
        await prisma.fieldSection.create({
          data: { entityType, name: section.name, position: section.position },
        });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
