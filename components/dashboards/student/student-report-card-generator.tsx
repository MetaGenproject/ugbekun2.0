'use client'

import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  ReportCardGenerator,
  type GeneratedStudentGradeReport,
  type ReportCardGeneratorProfile,
  type StudentReportOptionsPayload,
} from '../shared/report-card-generator'

export type { StudentReportOptionsPayload, GeneratedStudentGradeReport }

interface StudentReportCardGeneratorProps {
  profile: ReportCardGeneratorProfile
  branding?: Record<string, any> | null
  attendance?: {
    percentage: number
    totalDays: number
    presentCount: number
    absentCount: number
  } | null
  initialOptions?: StudentReportOptionsPayload | null
}

export function StudentReportCardGenerator({
  profile,
  branding,
  attendance,
  initialOptions,
}: StudentReportCardGeneratorProps) {
  return (
    <ReportCardGenerator
      portalMode="student"
      profile={profile}
      branding={branding}
      attendance={attendance}
      initialOptions={initialOptions}
      fetchOptions={() =>
        apiSlice.get<{ success: boolean } & StudentReportOptionsPayload>(
          endpoints.student.reportCardOptions
        )
      }
      fetchReport={(filters) =>
        apiSlice.get<GeneratedStudentGradeReport>(endpoints.student.gradesReport(filters))
      }
      buildPdfUrl={(filters) => endpoints.student.exportPdf('all', undefined, filters)}
    />
  )
}
