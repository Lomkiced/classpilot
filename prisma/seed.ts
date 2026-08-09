import { PrismaClient, GradeLevel } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Initialize Prisma with the Driver Adapter exactly as we do in the app
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  // 2. Find the Teacher account (you must have logged in at least once)
  const teacher = await prisma.teacher.findFirst();

  if (!teacher) {
    console.error(
      "❌ No Teacher found in the database. Please log in via the UI first so the Teacher record is created."
    );
    process.exit(1);
  }

  console.log(`Found Teacher: ${teacher.name} (${teacher.email})`);

  // 3. Define the classes to seed
  const classesToSeed = [
    { name: "Primary 1 Math", gradeLevel: GradeLevel.P1, subject: "Math" },
    { name: "Primary 2 Math", gradeLevel: GradeLevel.P2, subject: "Math" },
    { name: "Primary 2 English", gradeLevel: GradeLevel.P2, subject: "English" },
    { name: "Primary 3 Math", gradeLevel: GradeLevel.P3, subject: "Math" },
    { name: "Primary 4 Math", gradeLevel: GradeLevel.P4, subject: "Math" },
    { name: "Primary 5/6 Math Mixed", gradeLevel: GradeLevel.P5_6, subject: "Math" },
  ];

  console.log("Seeding classes...");

  for (const cls of classesToSeed) {
    const createdClass = await prisma.classGroup.create({
      data: {
        teacherId: teacher.id,
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        subject: cls.subject,
      },
    });
    console.log(`✅ Created Class: ${createdClass.name}`);
  }

  console.log("Database seed completed successfully! 🎉");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
