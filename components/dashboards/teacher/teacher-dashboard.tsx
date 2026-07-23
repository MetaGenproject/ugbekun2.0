'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckSquare, 
  Activity,
  Award,
  CheckCircle,
  FileText,
  UserCheck,
  Calendar,
  AlertCircle,
  PlusCircle,
  Search,
  Save,
  Clock,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react'
import { SchoolHeader } from '../school-header'
import { safeStorage } from '@/lib/safeStorage'
import { apiSlice, endpoints } from '../../../lib/apiSlice'
import GradebookInterface from './gradebook-interface'
import MontessoriMatrix from './montessori-matrix'
import AttendanceRegister from './attendance-register'
import { MediaLibrary } from './media-library'
import { AiLessonPlanner } from './ai-lesson-planner'
import { LiveClassroomHub } from './live-classroom-hub'
import TeacherPointsHub from './points-hub'
import { TeacherAttritionRadar } from './attrition-radar'
import { QuestionBankManager } from './question-bank-manager'
import SchoolCalendar from '../admin/school-calendar'

interface DashboardProps {
  user: {
    id: number
    username: string
    role: number
  }
  activeSection?: string
}

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId: number
  isEcd?: boolean
}

interface SubjectAssignment {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  subjectId: number
  subjectName: string
  sessionId: number
  isEcd?: boolean
}

interface TeacherProfile {
  teacherId: number
  isFormTeacher: boolean
  isSubjectTeacher: boolean
  formAllocations: FormAllocation[]
  subjectAssignments: SubjectAssignment[]
}

interface Exam {
  id: number
  name: string
}

interface Student {
  id: number
  firstName: string
  lastName: string
  registerNo: string
  gender: string
  remark?: string
  status?: string
  reviewNotes?: string | null
  originalAiRemark?: string | null
  isAiGenerated?: boolean
  isEditedByHuman?: boolean
}

export function TeacherDashboard({ user, activeSection }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'attendance' | 'commentary' | 'assignments' | 'media' | 'lessonPlan' | 'liveRooms' | 'gamification' | 'attrition' | 'calendar'>('overview')

  useEffect(() => {
    if (!activeSection) return
    if (activeSection === 'classroom') {
      setActiveTab('overview')
    } else if (activeSection === 'grades') {
      setActiveTab('scores')
    } else if (activeSection === 'attendance') {
      setActiveTab('attendance')
    } else if (activeSection === 'roster') {
      setActiveTab('commentary')
    } else if (activeSection === 'calendar') {
      setActiveTab('calendar')
    } else if (activeSection === 'media') {
      setActiveTab('media')
    } else if (activeSection === 'lessonPlan') {
      setActiveTab('lessonPlan')
    } else if (activeSection === 'liveRooms') {
      setActiveTab('liveRooms')
    } else if (activeSection === 'points-hub') {
      setActiveTab('gamification')
    } else if (activeSection === 'attrition') {
      setActiveTab('attrition')
    }
  }, [activeSection])
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  
  // Loading & error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Scores state
  const [selectedAssignment, setSelectedAssignment] = useState<number>(0) // index in subjectAssignments
  const [selectedExam, setSelectedExam] = useState<number>(0)
  const [students, setStudents] = useState<Student[]>([])
  const [scores, setScores] = useState<Record<number, { mark: string; absent: boolean }>>({})
  const [savingScores, setSavingScores] = useState(false)

  // Attendance state
  const [selectedForm, setSelectedForm] = useState<number>(0) // index in formAllocations
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { status: string; remark: string }>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  // Commentary state
  const [selectedFormCommentary, setSelectedFormCommentary] = useState<number>(0) // index in formAllocations
  const [commentaryRecords, setCommentaryRecords] = useState<Record<number, string>>({})
  const [savingCommentary, setSavingCommentary] = useState<Record<number, boolean>>({})
  const [originalAiRemarks, setOriginalAiRemarks] = useState<Record<number, string>>({})
  const [isAiGeneratedFlags, setIsAiGeneratedFlags] = useState<Record<number, boolean>>({})
  const [generatingAi, setGeneratingAi] = useState<Record<number, boolean>>({})
  const [selectedTags, setSelectedTags] = useState<Record<number, string[]>>({})

  // Report Cards State
  const [reportCards, setReportCards] = useState<any[]>([])
  const [loadingReportCards, setLoadingReportCards] = useState(false)
  const [rankingType, setRankingType] = useState<string>('full')
  const [rankingLimit, setRankingLimit] = useState<number>(3)
  const [exportingPdf, setExportingPdf] = useState<Record<number, boolean>>({})

  // Assignments Curation State
  const [homeworksList, setHomeworksList] = useState<any[]>([])
  const [examsList, setExamsList] = useState<any[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [assessmentType, setAssessmentType] = useState<'homework' | 'online_exam'>('homework')
  
  // Builder state
  const [curateTitle, setCurateTitle] = useState('')
  const [curateDesc, setCurateDesc] = useState('')
  const [curateClassId, setCurateClassId] = useState<number>(0)
  const [curateSubjectId, setCurateSubjectId] = useState<number>(0)
  const [curateDueDate, setCurateDueDate] = useState('')
  const [curatePassingMark, setCuratePassingMark] = useState(0)
  const [curateDuration, setCurateDuration] = useState(0)

  // Questions inside builder
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([])
  const [newQuestionType, setNewQuestionType] = useState<'MCQ' | 'TF' | 'DOCUMENT' | 'AUDIO'>('MCQ')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '', '', ''])
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('')
  const [newQuestionPoints, setNewQuestionPoints] = useState(1)

  // Submissions viewing
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<number | null>(null)
  const [viewingSubmissionsType, setViewingSubmissionsType] = useState<'homework' | 'online_exam' | null>(null)
  const [submissionsList, setSubmissionsList] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  
  // Grading state
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null)
  const [gradingScore, setGradingScore] = useState<number>(0)
  const [gradingFeedback, setGradingFeedback] = useState('')

  // Question Bank Integration State
  const [assignmentsActiveTab, setAssignmentsActiveTab] = useState<'workspace' | 'bank'>('workspace')
  const [showBankImportModal, setShowBankImportModal] = useState(false)

  // Fetch initial profile allocation & exams
  const fetchAssessments = async () => {
    setLoadingAssessments(true)
    try {
      const token = safeStorage.getItem('ugbekun_token')
      const hwRes = await fetch(endpoints.teacher.homeworks, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const hwData = await hwRes.json()
      if (hwData.success) {
        setHomeworksList(hwData.homeworks)
      }

      const examRes = await fetch(endpoints.teacher.onlineExams, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const examData = await examRes.json()
      if (examData.success) {
        setExamsList(examData.exams)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAssessments(false)
    }
  }

  // Get unique classes taught by the teacher
  const getUniqueClasses = () => {
    const classesMap = new Map<number, string>()
    ;(profile?.subjectAssignments || []).forEach(sa => {
      classesMap.set(sa.classId, sa.className)
    })
    return Array.from(classesMap.entries()).map(([id, name]) => ({ id, name }))
  }

  // Get unique subjects for selected class taught by the teacher
  const getSubjectsForClass = (classId: number) => {
    const subjectsMap = new Map<number, string>()
    ;(profile?.subjectAssignments || []).forEach(sa => {
      if (sa.classId === classId) {
        subjectsMap.set(sa.subjectId, sa.subjectName)
      }
    })
    return Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name }))
  }

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssessments()
    }
  }, [activeTab])

  useEffect(() => {
    const classes = getUniqueClasses()
    if (classes.length > 0) {
      if (!curateClassId || !classes.some(c => c.id === curateClassId)) {
        setCurateClassId(classes[0].id)
      }
    }
  }, [profile])

  useEffect(() => {
    if (curateClassId) {
      const subjects = getSubjectsForClass(curateClassId)
      if (subjects.length > 0) {
        setCurateSubjectId(subjects[0].id)
      }
    }
  }, [curateClassId])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const profileData = await apiSlice.get<TeacherProfile>(endpoints.teacher.profile)
        setProfile(profileData)

        if (profileData.isSubjectTeacher) {
          const examData = await apiSlice.get<{ success: boolean; exams: Exam[] }>(endpoints.teacher.exams)
          setExams(examData.exams || [])
          if (examData.exams && examData.exams.length > 0) {
            setSelectedExam(examData.exams[0].id)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load teacher workspace profile.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Dynamic state updates when scores selection changes
  useEffect(() => {
    if (!profile || profile.subjectAssignments.length === 0) return
    const assignment = profile.subjectAssignments[selectedAssignment]
    if (!assignment) return

    async function loadRosterAndScores() {
      try {
        setError(null)
        // 1. Fetch Students
        const rosterRes = await apiSlice.get<{ success: boolean; students: Student[] }>(
          `${endpoints.teacher.students}?classId=${assignment.classId}&sectionId=${assignment.sectionId}`
        )
        setStudents(rosterRes.students)

        // 2. Fetch Existing Scores
        if (selectedExam) {
          const scoresRes = await apiSlice.get<{ success: boolean; marks: any[] }>(
            `${endpoints.teacher.scores}?classId=${assignment.classId}&sectionId=${assignment.sectionId}&subjectId=${assignment.subjectId}&examId=${selectedExam}`
          )
          
          const initialScores: Record<number, { mark: string; absent: boolean }> = {}
          rosterRes.students.forEach(std => {
            const found = scoresRes.marks.find(m => m.studentId === std.id)
            initialScores[std.id] = {
              mark: found ? (found.mark || '') : '',
              absent: found ? found.absent === '1' : false
            }
          })
          setScores(initialScores)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch score data.')
      }
    }

    loadRosterAndScores()
  }, [profile, selectedAssignment, selectedExam, activeTab])

  // Dynamic state updates when attendance selection changes
  useEffect(() => {
    if (!profile || profile.formAllocations.length === 0 || activeTab !== 'attendance') return
    const allocation = profile.formAllocations[selectedForm]
    if (!allocation) return

    async function loadRosterAndAttendance() {
      try {
        setError(null)
        // 1. Fetch Students
        const rosterRes = await apiSlice.get<{ success: boolean; students: Student[] }>(
          `${endpoints.teacher.students}?classId=${allocation.classId}&sectionId=${allocation.sectionId}`
        )
        setStudents(rosterRes.students)

        // 2. Fetch Existing Attendance
        const attendanceRes = await apiSlice.get<{ success: boolean; attendance: any[] }>(
          `${endpoints.teacher.attendance}?classId=${allocation.classId}&sectionId=${allocation.sectionId}&attendanceDate=${attendanceDate}`
        )

        const initialAttendance: Record<number, { status: string; remark: string }> = {}
        rosterRes.students.forEach(std => {
          const found = attendanceRes.attendance.find(a => a.studentId === std.id)
          initialAttendance[std.id] = {
            status: found ? found.status : 'Present',
            remark: found ? (found.remark || '') : ''
          }
        })
        setAttendanceRecords(initialAttendance)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance register.')
      }
    }

    loadRosterAndAttendance()
  }, [profile, selectedForm, attendanceDate, activeTab])

  // Dynamic state updates when commentary selection changes
  useEffect(() => {
    if (!profile || profile.formAllocations.length === 0) return
    const allocation = profile.formAllocations[selectedFormCommentary]
    if (!allocation) return

    async function loadCommentariesAndReports() {
      if (activeTab !== 'commentary') return
      try {
        setLoadingReportCards(true)
        setError(null)
        // 1. Fetch Students
        const rosterRes = await apiSlice.get<{ success: boolean; students: Student[] }>(
          `${endpoints.teacher.students}?classId=${allocation.classId}&sectionId=${allocation.sectionId}`
        )
        setStudents(rosterRes.students)

        const initialCommentaries: Record<number, string> = {}
        const initialOriginalAiRemarks: Record<number, string> = {}
        const initialIsAiGeneratedFlags: Record<number, boolean> = {}
        const initialTags: Record<number, string[]> = {}
        rosterRes.students.forEach((std: any) => {
          initialCommentaries[std.id] = std.remark || ''
          initialOriginalAiRemarks[std.id] = std.originalAiRemark || ''
          initialIsAiGeneratedFlags[std.id] = std.isAiGenerated || false
          initialTags[std.id] = []
        })
        setCommentaryRecords(initialCommentaries)
        setOriginalAiRemarks(initialOriginalAiRemarks)
        setIsAiGeneratedFlags(initialIsAiGeneratedFlags)
        setSelectedTags(initialTags)

        // 2. Fetch Report Card Marks
        const reportRes = await apiSlice.get<{ success: boolean; marks: any[] }>(
          `${endpoints.teacher.reportCards}?classId=${allocation.classId}&sectionId=${allocation.sectionId}`
        )
        setReportCards(reportRes.marks || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load report data.')
      } finally {
        setLoadingReportCards(false)
      }
    }

    loadCommentariesAndReports()
  }, [profile, selectedFormCommentary, activeTab])

  const showNotification = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => {
      setActionSuccess(null)
    }, 4000)
  }

  // Handle Score Entries Save
  const handleSaveScores = async () => {
    if (!profile) return
    const assignment = profile.subjectAssignments[selectedAssignment]
    if (!assignment) return

    setSavingScores(true)
    setError(null)

    try {
      const payloadScores = Object.entries(scores).map(([studentId, data]) => ({
        studentId: Number(studentId),
        mark: data.absent ? '' : data.mark,
        absent: data.absent
      }))

      await apiSlice.post(endpoints.teacher.scores, {
        classId: assignment.classId,
        sectionId: assignment.sectionId,
        subjectId: assignment.subjectId,
        examId: selectedExam,
        scores: payloadScores
      })

      showNotification('Subject grades saved and locked successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to save scores.')
    } finally {
      setSavingScores(false)
    }
  }

  // Handle Attendance Save
  const handleSaveAttendance = async () => {
    if (!profile) return
    const allocation = profile.formAllocations[selectedForm]
    if (!allocation) return

    setSavingAttendance(true)
    setError(null)

    try {
      const payloadAttendance = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId: Number(studentId),
        status: data.status,
        remark: data.remark
      }))

      await apiSlice.post(endpoints.teacher.attendance, {
        classId: allocation.classId,
        sectionId: allocation.sectionId,
        attendanceDate,
        attendanceData: payloadAttendance
      })

      showNotification('Class attendance register submitted successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance register.')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Handle Commentary Save (Per Student)
  const handleSaveCommentary = async (studentId: number) => {
    if (!profile) return
    const allocation = profile.formAllocations[selectedFormCommentary]
    if (!allocation) return

    setSavingCommentary(prev => ({ ...prev, [studentId]: true }))
    setError(null)

    try {
      const remark = commentaryRecords[studentId] || ''
      const originalAiRemark = originalAiRemarks[studentId] || ''
      const isAiGenerated = isAiGeneratedFlags[studentId] || false

      await apiSlice.post(endpoints.teacher.commentary, {
        classId: allocation.classId,
        sectionId: allocation.sectionId,
        studentId,
        remark,
        originalAiRemark,
        isAiGenerated
      })

      // Refresh students roster to fetch updated status badge & notes
      const rosterRes = await apiSlice.get<{ success: boolean; students: Student[] }>(
        `${endpoints.teacher.students}?classId=${allocation.classId}&sectionId=${allocation.sectionId}`
      )
      setStudents(rosterRes.students)

      showNotification('Remarks and behavioral commentary updated.')
    } catch (err: any) {
      setError(err.message || 'Failed to save commentary.')
    } finally {
      setSavingCommentary(prev => ({ ...prev, [studentId]: false }))
    }
  }

  // Handle AI Commentary Generation
  const handleGenerateAiCommentary = async (studentId: number) => {
    if (!profile) return
    const allocation = profile.formAllocations[selectedFormCommentary]
    if (!allocation) return

    setGeneratingAi(prev => ({ ...prev, [studentId]: true }))
    setError(null)

    try {
      const tags = selectedTags[studentId] || []
      const res = await apiSlice.post<{ success: boolean; draft: string }>(
        endpoints.teacher.generateAiCommentary,
        {
          classId: allocation.classId,
          sectionId: allocation.sectionId,
          studentId,
          behavioralTags: tags
        }
      )

      if (res.success) {
        setCommentaryRecords(prev => ({ ...prev, [studentId]: res.draft }))
        setOriginalAiRemarks(prev => ({ ...prev, [studentId]: res.draft }))
        setIsAiGeneratedFlags(prev => ({ ...prev, [studentId]: true }))
        showNotification('AI commentary generated successfully. Review and save below.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI commentary.')
    } finally {
      setGeneratingAi(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const handleExportPdf = async (studentId: number, studentLastName: string, studentFirstName: string) => {
    if (!profile) return
    const allocation = profile.formAllocations[selectedFormCommentary]
    if (!allocation) return

    setExportingPdf(prev => ({ ...prev, [studentId]: true }))

    try {
      const token = safeStorage.getItem('ugbekun_token')
      const url = endpoints.teacher.exportPdf(
        studentId,
        allocation.classId,
        allocation.sectionId,
        rankingType,
        rankingType === 'topn' ? rankingLimit : undefined
      )

      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error('Failed to export PDF.')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `report_card_${studentLastName || 'Student'}_${studentFirstName || 'Grades'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to download PDF report card.')
    } finally {
      setExportingPdf(prev => ({ ...prev, [studentId]: false }))
    }
  }

  // Handle Question Addition
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) {
      alert('Question text is required.')
      return
    }
    const q = {
      id: Math.random().toString(36).substring(2, 9),
      type: newQuestionType,
      questionText: newQuestionText,
      options: newQuestionType === 'MCQ' ? newQuestionOptions.filter(o => o.trim() !== '') : [],
      correctAnswer: newQuestionType === 'MCQ' || newQuestionType === 'TF' ? newQuestionCorrect : '',
      points: Number(newQuestionPoints) || 1
    }
    setBuilderQuestions(prev => [...prev, q])
    setNewQuestionText('')
    setNewQuestionOptions(['', '', '', ''])
    setNewQuestionCorrect('')
    setNewQuestionPoints(1)
  }

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) return
        
        const lines = text.split(/\r?\n/)
        if (lines.length < 2) {
          alert('CSV file is empty or does not have enough rows.')
          return
        }

        // Parse headers to find indexes (case-insensitive)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const qIdx = headers.indexOf('question')
        const optAIdx = headers.indexOf('optiona')
        const optBIdx = headers.indexOf('optionb')
        const optCIdx = headers.indexOf('optionc')
        const optDIdx = headers.indexOf('optiond')
        const ansIdx = headers.indexOf('correctanswer')
        const ptsIdx = headers.indexOf('points')

        if (qIdx === -1 || optAIdx === -1 || optBIdx === -1 || ansIdx === -1) {
          alert('CSV headers must include at least: Question, OptionA, OptionB, CorrectAnswer')
          return
        }

        const importedQuestions: any[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const cols: string[] = []
          let curCol = ''
          let insideQuote = false
          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              insideQuote = !insideQuote
            } else if (char === ',' && !insideQuote) {
              cols.push(curCol.trim())
              curCol = ''
            } else {
              curCol += char
            }
          }
          cols.push(curCol.trim())

          const cleanCols = cols.map(c => c.replace(/^"|"$/g, ''))

          const questionText = cleanCols[qIdx]
          if (!questionText) continue

          const optA = cleanCols[optAIdx] || ''
          const optB = cleanCols[optBIdx] || ''
          const optC = optCIdx !== -1 ? cleanCols[optCIdx] || '' : ''
          const optD = optDIdx !== -1 ? cleanCols[optDIdx] || '' : ''
          
          const options = [optA, optB, optC, optD].filter(o => o.trim() !== '')
          
          const isTF = options.length === 2 && 
                       (optA.toLowerCase() === 'true' || optA.toLowerCase() === 'false') &&
                       (optB.toLowerCase() === 'true' || optB.toLowerCase() === 'false')
          
          const type = isTF ? 'TF' : 'MCQ'
          const correctAnswer = cleanCols[ansIdx] || ''
          const points = ptsIdx !== -1 ? Number(cleanCols[ptsIdx]) || 1 : 1

          importedQuestions.push({
            id: Math.random().toString(36).substring(2, 9),
            type,
            questionText,
            options,
            correctAnswer,
            points
          })
        }

        if (importedQuestions.length === 0) {
          alert('No valid questions found in the CSV.')
        } else {
          setBuilderQuestions(prev => [...prev, ...importedQuestions])
          alert(`Successfully imported ${importedQuestions.length} questions from CSV!`)
        }
      } catch (err) {
        console.error(err)
        alert('Failed to parse CSV file. Ensure it is formatted correctly.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Handle Assignment Creation & Publishing
  const handlePublishAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curateTitle.trim() || !curateClassId || !curateSubjectId) {
      alert('Title, Target Class, and Target Subject are required.')
      return
    }
    if (assessmentType === 'homework' && !curateDueDate) {
      alert('Due Date is required for Homework.')
      return
    }

    try {
      let res;
      const token = safeStorage.getItem('ugbekun_token')
      if (assessmentType === 'homework') {
        res = await fetch(endpoints.teacher.homeworks, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: curateTitle,
            description: curateDesc,
            classId: curateClassId,
            subjectId: curateSubjectId,
            dueDate: curateDueDate,
            questions: builderQuestions
          })
        })
      } else {
        res = await fetch(endpoints.teacher.onlineExams, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: curateTitle,
            classId: curateClassId,
            subjectId: curateSubjectId,
            passingMark: curatePassingMark,
            duration: curateDuration,
            questions: builderQuestions
          })
        })
      }

      const data = await res.json()
      if (data.success) {
        showNotification(`${assessmentType === 'homework' ? 'Homework' : 'Online exam'} published successfully.`)
        // Reset builder
        setCurateTitle('')
        setCurateDesc('')
        setCurateDueDate('')
        setCuratePassingMark(0)
        setCurateDuration(0)
        setBuilderQuestions([])
        // Refresh list
        fetchAssessments()
      } else {
        alert(data.message || 'Failed to publish assessment.')
      }
    } catch (err: any) {
      console.error(err)
      alert('Error publishing assessment.')
    }
  }

  // View Submissions for a Homework or Exam
  const handleViewSubmissions = async (id: number, type: 'homework' | 'online_exam') => {
    setViewingSubmissionsId(id)
    setViewingSubmissionsType(type)
    setLoadingSubmissions(true)
    setGradingSubmission(null)
    try {
      const url = type === 'homework' 
        ? endpoints.teacher.homeworkSubmissions(id)
        : endpoints.teacher.onlineExamSubmissions(id)
      const token = safeStorage.getItem('ugbekun_token')
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSubmissionsList(data.submissions || [])
      } else {
        alert('Failed to retrieve student submissions.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Submit Submission Grading
  const handleGradeSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingSubmission) return
    try {
      const url = viewingSubmissionsType === 'homework'
        ? endpoints.teacher.gradeHomework(gradingSubmission.id)
        : endpoints.teacher.gradeOnlineExam(gradingSubmission.id)
      const bodyPayload = viewingSubmissionsType === 'homework'
        ? { score: gradingScore, feedback: gradingFeedback }
        : { score: gradingScore }

      const token = safeStorage.getItem('ugbekun_token')
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      })
      const data = await res.json()
      if (data.success) {
        showNotification('Submission graded successfully.')
        setGradingSubmission(null)
        // Refresh submissions
        if (viewingSubmissionsId && viewingSubmissionsType) {
          handleViewSubmissions(viewingSubmissionsId, viewingSubmissionsType)
        }
      } else {
        alert(data.message || 'Failed to save grade.')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving grade.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-semibold">Resolving employee allocations...</p>
      </div>
    )
  }

  // Count allocations for stats
  const formClassCount = profile?.formAllocations.length || 0
  const subjectClassCount = profile?.subjectAssignments.length || 0

  return (
    <div className="space-y-8">
      <SchoolHeader />

      {/* Branded Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#003da5] via-[#0063a6] to-[#009ca6] p-6 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
                Academic Year 2026
              </span>
              {profile?.isFormTeacher && (
                <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block flex items-center gap-1">
                  <Award size={12} /> Form Teacher
                </span>
              )}
              {profile?.isSubjectTeacher && (
                <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block flex items-center gap-1">
                  <BookOpen size={12} /> Subject Teacher
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome Back, {user.username}
            </h1>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Academic Portal — Configure dynamic subject grading sheets, online assignments, class attendance, and holistic commentary.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="text-rose-600 shrink-0" size={20} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          Overview Roster
        </button>

        {profile?.isSubjectTeacher && (
          <>
            <button
              onClick={() => setActiveTab('scores')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'scores'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Score Book Entry
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'assignments'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Assignments & Tests
            </button>
          </>
        )}

        {profile?.isFormTeacher && (
          <>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'attendance'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Class Attendance Tracker
            </button>
            <button
              onClick={() => setActiveTab('commentary')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'commentary'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Holistic Commentary & Report Card
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'media'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          Media Library
        </button>
        <button
          onClick={() => setActiveTab('lessonPlan')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'lessonPlan'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          AI Lesson Planner
        </button>
        <button
          onClick={() => setActiveTab('liveRooms')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'liveRooms'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          Virtual Classroom Hub
        </button>
        <button
          onClick={() => setActiveTab('gamification')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'gamification'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          Points Hub & XP
        </button>
        <button
          onClick={() => setActiveTab('attrition')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'attrition'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          Attrition Radar
        </button>
      </div>

      {/* Tab Panels */}

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Allocations Summary Widgets */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex items-center justify-between group">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assigned Subjects</p>
                <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{subjectClassCount} Classes</p>
              </div>
              <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100 rounded-xl">
                <BookOpen size={20} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex items-center justify-between group">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Form Class Allocations</p>
                <p className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{formClassCount} Rooms</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                <Award size={20} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex items-center justify-between group sm:col-span-2 lg:col-span-1">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending Tasks</p>
                <p className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">3 registers</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
                <CheckSquare size={20} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Subject Teacher Allocations */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-violet-600" />
                Your Subject Classes
              </h3>
              {profile?.subjectAssignments && profile.subjectAssignments.length > 0 ? (
                <div className="space-y-3">
                  {profile.subjectAssignments.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-xs hover:bg-slate-100/50 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{sub.subjectName}</p>
                        <p className="text-xs font-semibold text-slate-400">Class: {sub.className} ({sub.sectionName})</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 rounded-md border border-violet-100">
                        Subject Owner
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No subject allocations assigned.</p>
              )}
            </div>

            {/* Form Teacher Allocations */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                Your Assigned Rooms
              </h3>
              {profile?.formAllocations && profile.formAllocations.length > 0 ? (
                <div className="space-y-3">
                  {profile.formAllocations.map((form, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-xs hover:bg-slate-100/50 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{form.className}</p>
                        <p className="text-xs font-semibold text-slate-400">Section: {form.sectionName}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100">
                        Form Owner
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No form teacher room assignments.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Score Entry Tab */}
      {activeTab === 'scores' && profile?.isSubjectTeacher && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Award size={20} className="text-violet-600" />
              Score Book Entry
            </h3>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Class & Subject</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {profile.subjectAssignments.map((sub, idx) => (
                    <option key={idx} value={idx}>
                      {sub.className} ({sub.sectionName}) - {sub.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Active Exam</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {exams.length > 0 ? (
                    exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))
                  ) : (
                    <option value={0}>No exams configured</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* New Unified Mark Entry spreadsheet / Montessori Matrix */}
          {profile.subjectAssignments[selectedAssignment] && selectedExam ? (
            profile.subjectAssignments[selectedAssignment].isEcd ? (
              <MontessoriMatrix
                classId={profile.subjectAssignments[selectedAssignment].classId}
                sectionId={profile.subjectAssignments[selectedAssignment].sectionId}
                examId={selectedExam}
                className={profile.subjectAssignments[selectedAssignment].className}
                sectionName={profile.subjectAssignments[selectedAssignment].sectionName}
                examName={exams.find((ex) => ex.id === selectedExam)?.name || 'Active Exam'}
              />
            ) : (
              <GradebookInterface
                classId={profile.subjectAssignments[selectedAssignment].classId}
                sectionId={profile.subjectAssignments[selectedAssignment].sectionId}
                subjectId={profile.subjectAssignments[selectedAssignment].subjectId}
                examId={selectedExam}
                className={profile.subjectAssignments[selectedAssignment].className}
                sectionName={profile.subjectAssignments[selectedAssignment].sectionName}
                subjectName={profile.subjectAssignments[selectedAssignment].subjectName}
                examName={exams.find((ex) => ex.id === selectedExam)?.name || 'Active Exam'}
              />
            )
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-6">No assignments or exams selected.</p>
          )}
        </div>
      )}

      {/* 3. Assignments Curation Tab */}
      {activeTab === 'assignments' && profile?.isSubjectTeacher && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Curation Form & Question Builder */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm lg:col-span-1">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PlusCircle size={18} className="text-blue-600" />
                  Curate Assessment Cascade
                </h3>
                <p className="text-xs text-slate-400 mt-1">Target grade levels globally across all constituent section rooms.</p>
              </div>

              <form onSubmit={handlePublishAssessment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Assessment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssessmentType('homework')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${assessmentType === 'homework' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      Homework
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssessmentType('online_exam')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${assessmentType === 'online_exam' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      Online Exam
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Project Essay"
                    value={curateTitle}
                    onChange={(e) => setCurateTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {assessmentType === 'homework' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Instructions / Description</label>
                    <textarea
                      placeholder="Enter optional description or submission instructions..."
                      value={curateDesc}
                      onChange={(e) => setCurateDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Target Class</label>
                    <select
                      value={curateClassId}
                      onChange={(e) => setCurateClassId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {getUniqueClasses().map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Subject</label>
                    <select
                      value={curateSubjectId}
                      onChange={(e) => setCurateSubjectId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {getSubjectsForClass(curateClassId).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {assessmentType === 'homework' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Submission Deadline</label>
                    <input
                      type="date"
                      required
                      value={curateDueDate}
                      onChange={(e) => setCurateDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Passing Mark</label>
                      <input
                        type="number"
                        required
                        value={curatePassingMark}
                        onChange={(e) => setCuratePassingMark(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="0 for untimed"
                        value={curateDuration}
                        onChange={(e) => setCurateDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Question Builder Box */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <p className="text-xs font-bold text-slate-700">Add Question to Builder</p>
                    <div className="flex items-center gap-1.5">
                      <label className="px-2 py-0.5 text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg cursor-pointer transition">
                        Import CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvImport}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentsActiveTab('bank')
                          showNotification('Please select questions from the repository and click Import to Builder.')
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition"
                      >
                        From Bank
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    CSV headers: <code className="bg-slate-100 px-1 rounded text-slate-600">Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Points</code> (First row must be header)
                  </p>
                  
                  <div>
                    <select
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="MCQ">Multiple Choice Question (MCQ)</option>
                      <option value="TF">True / False</option>
                      <option value="DOCUMENT">Document Upload Provision</option>
                      <option value="AUDIO">Audio Response Recording</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Question content or instructions..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {newQuestionType === 'MCQ' && (
                    <div className="space-y-1.5">
                      {newQuestionOptions.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuestionOptions]
                            updated[oIdx] = e.target.value
                            setNewQuestionOptions(updated)
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      ))}
                      <select
                        value={newQuestionCorrect}
                        onChange={(e) => setNewQuestionCorrect(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Correct Option</option>
                        {newQuestionOptions.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {String.fromCharCode(65 + oIdx)}: {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newQuestionType === 'TF' && (
                    <div>
                      <select
                        value={newQuestionCorrect}
                        onChange={(e) => setNewQuestionCorrect(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Correct Answer</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Points:</span>
                      <input
                        type="number"
                        min={1}
                        value={newQuestionPoints}
                        onChange={(e) => setNewQuestionPoints(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      Add Question
                    </button>
                  </div>
                </div>

                {builderQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Builder Questions ({builderQuestions.length})</p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/20">
                      {builderQuestions.map((q, idx) => (
                        <div key={q.id} className="flex items-center justify-between p-1.5 text-xs bg-white rounded border border-slate-200">
                          <span className="truncate font-medium text-slate-700">{idx + 1}. ({q.type}) {q.questionText}</span>
                          <button
                            type="button"
                            onClick={() => setBuilderQuestions(prev => prev.filter(item => item.id !== q.id))}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
                >
                  Publish Assessment Cascade
                </button>
              </form>
            </div>

            {/* Published list & Submissions Workspace */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sub-navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-1.5 p-1 bg-slate-50/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignmentsActiveTab('workspace')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    assignmentsActiveTab === 'workspace'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Published Assessments
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentsActiveTab('bank')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    assignmentsActiveTab === 'bank'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Question Bank Repository
                </button>
              </div>

              {assignmentsActiveTab === 'bank' ? (
                <QuestionBankManager
                  profile={profile}
                  onImportToBuilder={(imported) => {
                    // Convert QuestionBankItem format to builder format
                    const formatted = imported.map((q) => ({
                      id: Math.random().toString(36).substring(2, 9),
                      type: q.questionType === 'mcq' ? 'MCQ' : q.questionType === 'tf' ? 'TF' : 'DOCUMENT',
                      questionText: q.questionText,
                      options: q.options || [],
                      correctAnswer: q.correctOption || '',
                      points: q.marks || 1
                    }))
                    setBuilderQuestions(prev => [...prev, ...formatted])
                    setAssignmentsActiveTab('workspace')
                    alert(`Successfully imported ${imported.length} questions to builder!`)
                  }}
                />
              ) : (
                /* Published Assessments List */
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-slate-600" />
                    Published Assessments Workspace
                  </h3>

                {loadingAssessments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : homeworksList.length === 0 && examsList.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">No homework assignments or exams published yet.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Homework list */}
                    {homeworksList.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Homework Assignments</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {homeworksList.map((hw) => (
                            <div key={hw.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-xs hover:border-blue-300 transition flex flex-col justify-between gap-3">
                              <div>
                                <p className="text-sm font-extrabold text-slate-800">{hw.title}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{hw.description || 'No instructions provided.'}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 rounded-md border border-blue-100">
                                    Class: {hw.class.name}
                                  </span>
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-violet-700 bg-violet-50 rounded-md border border-violet-100">
                                    Subject: {hw.subject.name}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40">
                                <span className="text-[10px] text-slate-500 font-medium">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                                <button
                                  onClick={() => handleViewSubmissions(hw.id, 'homework')}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                >
                                  View Submissions →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Online Exams list */}
                    {examsList.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Online Exams</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {examsList.map((ex) => (
                            <div key={ex.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-xs hover:border-violet-300 transition flex flex-col justify-between gap-3">
                              <div>
                                <p className="text-sm font-extrabold text-slate-800">{ex.title}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 rounded-md border border-blue-100">
                                    Class: {ex.class.name}
                                  </span>
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-violet-700 bg-violet-50 rounded-md border border-violet-100">
                                    Subject: {ex.subject.name}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40">
                                <span className="text-[10px] text-slate-500 font-medium">Passing Score: {ex.passingMark}%</span>
                                <button
                                  onClick={() => handleViewSubmissions(ex.id, 'online_exam')}
                                  className="text-xs font-bold text-violet-600 hover:text-violet-800"
                                >
                                  View Submissions →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Submissions Details Drawer/Overlay */}
              {viewingSubmissionsId && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Submissions for {viewingSubmissionsType === 'homework' ? 'Homework' : 'Exam'} (ID: {viewingSubmissionsId})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Review answers, files, audios and input final marks.</p>
                    </div>
                    <button
                      onClick={() => {
                        setViewingSubmissionsId(null)
                        setViewingSubmissionsType(null)
                        setGradingSubmission(null)
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Close View
                    </button>
                  </div>

                  {loadingSubmissions ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="animate-spin text-blue-600" size={20} />
                    </div>
                  ) : submissionsList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No submissions received from students yet.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left: Students List */}
                      <div className="space-y-2 max-h-80 overflow-y-auto border-r border-slate-100 pr-4">
                        {submissionsList.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setGradingSubmission(sub)
                              setGradingScore(viewingSubmissionsType === 'homework' ? (sub.score || 0) : (sub.totalMark || 0))
                              setGradingFeedback(sub.feedback || '')
                            }}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition ${gradingSubmission?.id === sub.id ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                          >
                            <p className="text-xs font-bold text-slate-800">
                              {sub.student.lastName}, {sub.student.firstName}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-semibold">
                              <span>Reg: {sub.student.registerNo}</span>
                              <span className="px-1.5 py-0.5 bg-slate-200 rounded font-bold text-slate-700">
                                Score: {viewingSubmissionsType === 'homework' ? (sub.score !== null ? sub.score : 'N/A') : sub.totalMark}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right: Submission Details & Grading form */}
                      {gradingSubmission ? (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                            Submission Details: {gradingSubmission.student.lastName}, {gradingSubmission.student.firstName}
                          </h4>

                          {/* Student Answers */}
                          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                            {(gradingSubmission.answers || []).map((ans: any, aIdx: number) => (
                              <div key={aIdx} className="p-2.5 rounded bg-slate-50 border border-slate-200/50 space-y-1">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Question {aIdx + 1}</p>
                                {ans.answerText && (
                                  <p className="text-xs font-semibold text-slate-700">
                                    Answer: <span className="font-bold text-slate-900">{ans.answerText}</span>
                                  </p>
                                )}
                                {ans.fileUrl && (
                                  <div className="pt-1">
                                    <a
                                      href={ans.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <Download size={12} /> Download Provided Document
                                    </a>
                                  </div>
                                )}
                                {ans.audioUrl && (
                                  <div className="pt-1 space-y-1">
                                    <p className="text-[9px] font-bold text-slate-500">Audio Response:</p>
                                    <audio controls src={ans.audioUrl} className="w-full h-8" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Grading Form */}
                          <form onSubmit={handleGradeSubmissionSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Final Score / Marks</label>
                              <input
                                type="number"
                                required
                                value={gradingScore}
                                onChange={(e) => setGradingScore(Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            {viewingSubmissionsType === 'homework' && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Teacher Feedback</label>
                                <textarea
                                  value={gradingFeedback}
                                  onChange={(e) => setGradingFeedback(e.target.value)}
                                  rows={2}
                                  placeholder="Provide optional assessment feedback or remarks..."
                                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                                />
                              </div>
                            )}

                            <button
                              type="submit"
                              className="w-full py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
                            >
                              Save Grade & Feedback
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <p className="text-xs text-slate-400 italic">Select a student submission to grade.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Attendance Tab */}
      {activeTab === 'attendance' && profile?.isFormTeacher && (
        <AttendanceRegister formAllocations={profile.formAllocations} />
      )}

      {/* 5. Commentary & Report Card Tab */}
      {activeTab === 'commentary' && profile?.isFormTeacher && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" />
              Holistic Commentary & Report Card
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              {/* Room Allocations Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Form Room</label>
                <select
                  value={selectedFormCommentary}
                  onChange={(e) => setSelectedFormCommentary(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {profile.formAllocations.map((form, idx) => (
                    <option key={idx} value={idx}>
                      {form.className} ({form.sectionName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Global Ranking Mode */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Report Card Ranking</label>
                <select
                  value={rankingType}
                  onChange={(e) => setRankingType(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="full">Full Class Ranking</option>
                  <option value="topn">Top-N Bracket</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {rankingType === 'topn' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Limit N</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rankingLimit}
                    onChange={(e) => setRankingLimit(Number(e.target.value))}
                    className="w-16 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* compiled cross-subject grid list */}
          {students.length > 0 ? (
            <div className="space-y-6">
              {loadingReportCards ? (
                <p className="text-sm text-slate-400 italic text-center py-6">Compiling grades from all subjects...</p>
              ) : (
                <div className="space-y-6">
                  {students.map((student) => {
                    const studentMarks = reportCards.filter(m => m.studentId === student.id)
                    const commentary = commentaryRecords[student.id] || ''
                    const isSaving = savingCommentary[student.id] || false

                    return (
                      <div key={student.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-black text-slate-900">{student.lastName}, {student.firstName}</p>
                              {(() => {
                                const status = student.status || 'DRAFT'
                                switch (status) {
                                  case 'PRINCIPAL_SIGNED_OFF':
                                    return (
                                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100 shadow-3xs" title="Approved & Signed Off by Principal">
                                        Signed Off
                                      </span>
                                    )
                                  case 'TEACHER_APPROVED':
                                    return (
                                      <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-md border border-blue-100 shadow-3xs" title="Pending Principal Review">
                                        Pending Review
                                      </span>
                                    )
                                  case 'REJECTED':
                                    return (
                                      <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 rounded-md border border-rose-100 shadow-3xs cursor-help" title={student.reviewNotes || 'Rejected by Admin. Please check remarks.'}>
                                        Rejected
                                      </span>
                                    )
                                  default:
                                    return (
                                      <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-md border border-amber-100 shadow-3xs" title="Draft">
                                        Draft
                                      </span>
                                    )
                                }
                              })()}
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Reg No: {student.registerNo}</p>
                          </div>
                          <button
                            onClick={() => handleExportPdf(student.id, student.lastName, student.firstName)}
                            disabled={exportingPdf[student.id]}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-black rounded-lg shadow-sm transition shrink-0 cursor-pointer text-center"
                          >
                            {exportingPdf[student.id] ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                Export A4 PDF
                              </>
                            )}
                          </button>
                        </div>

                        {/* Rejection Alert Banner */}
                        {student.status === 'REJECTED' && student.reviewNotes && (
                          <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg text-xs font-semibold text-rose-800">
                            <strong>Principal Review Notes:</strong> {student.reviewNotes}
                          </div>
                        )}

                        {/* Subject Marks Summary */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Evaluation Type</p>
                          {profile.formAllocations[selectedFormCommentary]?.isEcd ? (
                            <span className="inline-block px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-100 shadow-3xs">
                              Montessori Progress Evaluation (Qualitative Rubrics & Narrative)
                            </span>
                          ) : studentMarks.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {studentMarks.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs">
                                  <span className="text-slate-500">{m.subject.name}:</span>
                                  <span className={`font-extrabold ${m.absent === '1' ? 'text-rose-500' : 'text-slate-800'}`}>
                                    {m.absent === '1' ? 'Abs' : `${m.mark || 'N/A'}`}
                                  </span>
                                  <span className="text-[10px] text-slate-300">({m.exam.name})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No subject grades recorded yet.</p>
                          )}
                        </div>

                        {/* AI Commentary Assistant (Only for non-ECD) */}
                        {!profile.formAllocations[selectedFormCommentary]?.isEcd && (
                          <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black text-violet-900 flex items-center gap-1">
                                  <Sparkles size={14} className="text-violet-600 animate-pulse" />
                                  AI Commentary Assistant
                                </p>
                                <p className="text-[10px] text-violet-500 font-semibold mt-0.5">
                                  Select student attributes to guide the Deepseek AI draft.
                                </p>
                              </div>
                              <button
                                onClick={() => handleGenerateAiCommentary(student.id)}
                                disabled={generatingAi[student.id] || student.status === 'PRINCIPAL_SIGNED_OFF'}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-lg shadow-sm transition cursor-pointer text-center"
                              >
                                {generatingAi[student.id] ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Generating Draft...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} />
                                    Spark AI Draft
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Tags Selection */}
                            <div className="flex flex-wrap gap-1.5">
                              {["Diligent", "Creative", "Participative", "Hardworking", "Distracted", "Lacks Math Focus", "Excellent Reader"].map((tag) => {
                                const currentTags = selectedTags[student.id] || []
                                const isSelected = currentTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const updated = isSelected 
                                        ? currentTags.filter(t => t !== tag)
                                        : [...currentTags, tag]
                                      setSelectedTags(prev => ({ ...prev, [student.id]: updated }))
                                    }}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${isSelected ? 'bg-violet-600 text-white border-violet-600 shadow-3xs' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'}`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Holistic Commentary Commentary Box */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">
                            Holistic commentary & General remark
                          </label>
                          {profile.formAllocations[selectedFormCommentary]?.isEcd ? (
                            <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
                              Holistic narrative comments are managed directly within the Montessori Matrix workspace.
                            </p>
                          ) : (
                            <div className="flex gap-3 items-end">
                              <div className="flex-1 space-y-1.5 w-full">
                                <textarea
                                  rows={2}
                                  value={commentary}
                                  disabled={student.status === 'PRINCIPAL_SIGNED_OFF'}
                                  onChange={(e) => {
                                    setCommentaryRecords(prev => ({
                                      ...prev,
                                      [student.id]: e.target.value
                                    }))
                                  }}
                                  placeholder="Enter behavioral remarks and holistic term feedback..."
                                  className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                {isAiGeneratedFlags[student.id] && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <span>🤖 AI-Generated</span>
                                    <span>•</span>
                                    <span>
                                      {commentary !== originalAiRemarks[student.id] 
                                        ? "✏️ Edited by Instructor" 
                                        : "📋 Pure AI Draft"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleSaveCommentary(student.id)}
                                disabled={isSaving || student.status === 'PRINCIPAL_SIGNED_OFF'}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition h-10 flex items-center gap-1 shrink-0"
                              >
                                <Save size={14} />
                                {isSaving ? 'Saving...' : 'Save Remarks'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-6">No students found enrolled in this room.</p>
          )}
        </div>
      )}

      {activeTab === 'media' && profile && (
        <MediaLibrary teacherId={profile.teacherId} />
      )}

      {activeTab === 'lessonPlan' && profile && (
        <AiLessonPlanner profile={{
          id: profile.teacherId,
          name: user.username,
          isSubjectTeacher: profile.isSubjectTeacher,
          isFormTeacher: profile.isFormTeacher,
          subjectAssignments: profile.subjectAssignments
        }} />
      )}

      {activeTab === 'liveRooms' && profile && (
        <LiveClassroomHub profile={{
          id: profile.teacherId,
          name: user.username,
          subjectAssignments: profile.subjectAssignments
        }} />
      )}

      {activeTab === 'gamification' && (
        <TeacherPointsHub />
      )}

      {activeTab === 'attrition' && (
        <TeacherAttritionRadar />
      )}

      {activeTab === 'calendar' && (
        <SchoolCalendar user={user} />
      )}
    </div>
  )
}
