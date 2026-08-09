import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 12,
    color: "#1f2937",
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: "#db2777", // pink-600
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  schoolName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  reportTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  metaContainer: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 2,
  },
  studentSection: {
    marginBottom: 30,
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 4,
  },
  studentName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 8,
  },
  studentMeta: {
    fontSize: 11,
    color: "#4b5563",
  },
  remarkTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 10,
  },
  remarkContent: {
    fontSize: 12,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: "#6b7280",
  }
});

interface RemarkData {
  studentName: string;
  studentNumber?: string | null;
  classGroupName: string;
  gradingPeriod: string;
  content: string;
  teacherName: string;
}

// Reusable Page Component for a single student's remark
function RemarkPage({ data }: { data: RemarkData }) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Letterhead Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.schoolName}>ClassPilot Academy</Text>
          <Text style={styles.reportTitle}>End of Term Report</Text>
        </View>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Date: {format(new Date(), "MMMM d, yyyy")}</Text>
          <Text style={styles.metaText}>Period: {data.gradingPeriod}</Text>
        </View>
      </View>

      {/* Student Info Box */}
      <View style={styles.studentSection}>
        <Text style={styles.studentName}>{data.studentName}</Text>
        <Text style={styles.studentMeta}>Class: {data.classGroupName}</Text>
        {data.studentNumber && (
          <Text style={styles.studentMeta}>Student ID: {data.studentNumber}</Text>
        )}
      </View>

      {/* Remark Content */}
      <View>
        <Text style={styles.remarkTitle}>Teacher's Remarks</Text>
        <Text style={styles.remarkContent}>
          {data.content || "No remarks provided for this grading period."}
        </Text>
      </View>

      {/* Footer / Signature */}
      <View style={styles.footer} fixed>
        <View>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{data.teacherName}</Text>
          <Text style={styles.signatureText}>Class Teacher</Text>
        </View>
      </View>
    </Page>
  );
}

// Single PDF Export
export function SingleRemarkPDF({ data }: { data: RemarkData }) {
  return (
    <Document>
      <RemarkPage data={data} />
    </Document>
  );
}

// Batch PDF Export (Multiple Pages)
export function BatchRemarksPDF({ remarks }: { remarks: RemarkData[] }) {
  return (
    <Document>
      {remarks.map((data, idx) => (
        <RemarkPage key={idx} data={data} />
      ))}
    </Document>
  );
}
