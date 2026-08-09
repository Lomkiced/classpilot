import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { LessonPlanPDF } from "@/components/lesson-plans/lesson-plan-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get Teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
    });

    if (!teacher) {
      return new NextResponse("Teacher not found", { status: 404 });
    }

    const awaitedParams = await params;

    // 2. Fetch Lesson Plan & verify ownership
    const plan = await prisma.lessonPlan.findFirst({
      where: {
        id: awaitedParams.id,
        classGroup: {
          teacherId: teacher.id,
        },
      },
      include: {
        classGroup: true,
      },
    });

    if (!plan) {
      return new NextResponse("Lesson plan not found", { status: 404 });
    }

    // 3. Render PDF to stream
    const pdfStream = await renderToStream(
      <LessonPlanPDF plan={plan} teacherName={teacher.name} />
    ) as any; // Next.js streams have slight type mismatches with node streams sometimes

    // 4. Return as downloadable file
    return new NextResponse(pdfStream as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="LessonPlan_${plan.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
