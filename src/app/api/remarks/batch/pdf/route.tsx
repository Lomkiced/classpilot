import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { BatchRemarksPDF } from "@/components/remarks/remark-pdf";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const teacher = await prisma.teacher.findUnique({ where: { id: user.id } });
    if (!teacher) return new NextResponse("Teacher not found", { status: 404 });

    const searchParams = req.nextUrl.searchParams;
    const classGroupId = searchParams.get("classGroupId");
    const gradingPeriod = searchParams.get("gradingPeriod");

    if (!classGroupId || !gradingPeriod) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Verify ownership and fetch data
    const classGroup = await prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId: teacher.id },
      include: {
        students: {
          include: { student: true }
        }
      }
    });

    if (!classGroup) return new NextResponse("Unauthorized", { status: 401 });

    const studentIds = classGroup.students.map(cs => cs.studentId);

    const remarks = await prisma.remark.findMany({
      where: {
        classGroupId,
        gradingPeriod,
        studentId: { in: studentIds }
      }
    });

    const remarksMap = new Map(remarks.map(r => [r.studentId, r]));

    // Construct array of pages data
    const pdfDataArray = classGroup.students
      .map(cs => cs.student)
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map(student => {
        const r = remarksMap.get(student.id);
        return {
          studentName: student.fullName,
          studentNumber: student.studentNumber,
          classGroupName: classGroup.name,
          gradingPeriod,
          content: r?.content || "",
          teacherName: teacher.name,
        };
      });

    const pdfStream = await renderToStream(<BatchRemarksPDF remarks={pdfDataArray} />) as any;

    return new NextResponse(pdfStream as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Remarks_${classGroup.name.replace(/[^a-zA-Z0-9]/g, '_')}_${gradingPeriod}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Batch PDF Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
