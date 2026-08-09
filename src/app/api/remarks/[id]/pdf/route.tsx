import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { SingleRemarkPDF } from "@/components/remarks/remark-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const teacher = await prisma.teacher.findUnique({ where: { id: user.id } });
    if (!teacher) return new NextResponse("Teacher not found", { status: 404 });

    const awaitedParams = await params;
    const studentId = awaitedParams.id;
    const searchParams = req.nextUrl.searchParams;
    const classGroupId = searchParams.get("classGroupId");
    const gradingPeriod = searchParams.get("gradingPeriod");

    if (!classGroupId || !gradingPeriod) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Verify ownership and fetch data
    const classGroup = await prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId: teacher.id }
    });

    if (!classGroup) return new NextResponse("Unauthorized", { status: 401 });

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return new NextResponse("Student not found", { status: 404 });

    const remark = await prisma.remark.findFirst({
      where: { studentId, classGroupId, gradingPeriod }
    });

    const pdfData = {
      studentName: student.fullName,
      studentNumber: student.studentNumber,
      classGroupName: classGroup.name,
      gradingPeriod,
      content: remark?.content || "",
      teacherName: teacher.name,
    };

    const pdfStream = await renderToStream(<SingleRemarkPDF data={pdfData} />) as any;

    return new NextResponse(pdfStream as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Remark_${student.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Single PDF Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
