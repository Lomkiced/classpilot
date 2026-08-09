import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getMonthlyAttendance } from "@/server/actions/attendance";
import { AttendancePDF } from "@/components/attendance/attendance-pdf";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const classId = searchParams.get("classId");
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");

    if (!classId || !yearStr || !monthStr) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
    }

    const { classGroup, students } = await getMonthlyAttendance(classId, year, month);

    const stream = await renderToStream(
      <AttendancePDF
        classGroup={classGroup}
        students={students}
        year={year}
        month={month}
      />
    );

    const filename = `Attendance_${classGroup.name.replace(/\s+/g, "_")}_${format(new Date(year, month - 1), "MMM_yyyy")}.pdf`;

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating attendance PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF. You might be unauthorized." },
      { status: 500 }
    );
  }
}
