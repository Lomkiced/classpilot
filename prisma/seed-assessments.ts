import { PrismaClient, GradeLevel, AssessmentType, AcademicTerm } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding default primary assessments...");
  
  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    console.error("❌ No Teacher found in the database.");
    process.exit(1);
  }

  // Find all primary classes
  const classes = await prisma.classGroup.findMany({
    where: {
      gradeLevel: {
        in: [GradeLevel.P1, GradeLevel.P2, GradeLevel.P3, GradeLevel.P4, GradeLevel.P5_6]
      }
    }
  });

  console.log(`Found ${classes.length} primary classes.`);

  const defaultAssessments = [
    { name: "Workbook", type: AssessmentType.ACTIVITY, maxScore: 30 },
    { name: "Performance", type: AssessmentType.PARTICIPATION, maxScore: 30 },
    { name: "Attendance", type: AssessmentType.PARTICIPATION, maxScore: 10 },
    { name: "Examination", type: AssessmentType.FINAL, maxScore: 30 }
  ];

  const terms = [AcademicTerm.TERM_1, AcademicTerm.TERM_2];

  for (const cls of classes) {
    console.log(`Processing class: ${cls.name}`);
    for (const term of terms) {
      for (const da of defaultAssessments) {
        // Check if already exists to avoid duplicates
        const existing = await prisma.assessment.findFirst({
          where: {
            classGroupId: cls.id,
            name: da.name,
            term: term
          }
        });

        if (!existing) {
          await prisma.assessment.create({
            data: {
              classGroupId: cls.id,
              name: da.name,
              type: da.type,
              term: term,
              weight: 1.0,
              maxScore: da.maxScore,
              date: new Date() // default to today, they can edit later
            }
          });
          console.log(`  ✅ Added ${da.name} (${term})`);
        } else {
          console.log(`  ⏭️ Skipped ${da.name} (${term}) - already exists`);
        }
      }
    }
  }

  console.log("Done seeding assessments!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
