import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Use standard fonts, or register custom if needed
Font.register({
  family: "Open Sans",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Open Sans",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "right",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 24,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F9FAFB",
    fontWeight: "bold",
  },
  studentCol: {
    width: 140,
    paddingLeft: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    justifyContent: "center",
  },
  dayCol: {
    width: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  cellText: {
    fontSize: 8,
  },
  legend: {
    marginTop: 20,
    flexDirection: "row",
    gap: 15,
  },
  legendItem: {
    fontSize: 9,
    color: "#4B5563",
  },
});

interface AttendancePDFProps {
  classGroup: { name: string; subject: string; gradeLevel: string };
  students: {
    student: { id: string; fullName: string; studentNumber: string | null };
    records: { date: Date; status: string }[];
  }[];
  year: number;
  month: number;
}

export function AttendancePDF({ classGroup, students, year, month }: AttendancePDFProps) {
  // Get number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Status mapping to 1-letter abbreviation
  const getStatusChar = (status: string) => {
    switch (status) {
      case "PRESENT": return "P";
      case "LATE": return "L";
      case "ABSENT": return "A";
      case "EXCUSED": return "E";
      default: return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "#166534"; // green
      case "LATE": return "#854D0E"; // yellow
      case "ABSENT": return "#991B1B"; // red
      case "EXCUSED": return "#1E40AF"; // blue
      default: return "#000000";
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{classGroup.name} - Attendance Report</Text>
            <Text style={styles.subtitle}>{classGroup.subject} • {classGroup.gradeLevel}</Text>
          </View>
          <View>
            <Text style={styles.metaText}>{format(new Date(year, month - 1), "MMMM yyyy")}</Text>
            <Text style={styles.metaText}>Generated: {format(new Date(), "PP")}</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.studentCol}>
              <Text style={styles.cellText}>Student Name</Text>
            </View>
            {days.map(day => (
              <View key={day} style={styles.dayCol}>
                <Text style={styles.cellText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {students.map(({ student, records }) => {
            const recordMap = new Map(records.map(r => [new Date(r.date).getUTCDate(), r.status]));

            return (
              <View key={student.id} style={styles.tableRow}>
                <View style={styles.studentCol}>
                  <Text style={styles.cellText}>
                    {student.studentNumber ? `${student.studentNumber}. ` : ""}{student.fullName}
                  </Text>
                </View>
                {days.map(day => {
                  const status = recordMap.get(day);
                  return (
                    <View key={day} style={styles.dayCol}>
                      <Text style={[styles.cellText, { color: status ? getStatusColor(status) : "#D1D5DB" }]}>
                        {status ? getStatusChar(status) : "-"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendItem}><Text style={{ color: "#166534" }}>P</Text> = Present</Text>
          <Text style={styles.legendItem}><Text style={{ color: "#854D0E" }}>L</Text> = Late</Text>
          <Text style={styles.legendItem}><Text style={{ color: "#991B1B" }}>A</Text> = Absent</Text>
          <Text style={styles.legendItem}><Text style={{ color: "#1E40AF" }}>E</Text> = Excused</Text>
        </View>
      </Page>
    </Document>
  );
}
