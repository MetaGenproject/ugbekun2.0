'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'
import {
  UserPlus,
  Users,
  GraduationCap,
  CheckCircle2,
  Loader2,
  BookOpen,
  Award,
  UserCheck,
  QrCode,
  Sparkles,
  ArrowRight,
  Key,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Upload,
  FileText,
  AlertCircle
} from 'lucide-react'

interface ClassData {
  id: number
  name: string
  sections: {
    section: {
      id: number
      name: string
    }
  }[]
}

interface Section {
  id: number
  name: string
}

interface OnboardResult {
  student: {
    id: number
    registerNo: string
    firstName: string
    lastName: string
    gender: string
    birthday: string | null
    idCardToken: string
    createdAt: string
  }
  parent: {
    id: number
    name: string
    relation: string
    email: string | null
    mobileno: string | null
  }
}

interface OnboardResponse {
  success: boolean
  data: OnboardResult
  emailSent: boolean
  credentials?: {
    student: {
      username: string
      password: string
    }
    parent?: {
      username: string
      password: string
    } | null
  }
  pdfBase64?: string | null
}

interface PendingStudent {
  id: string
  student: {
    firstName: string
    lastName: string
    gender: string
    birthday: string
    classId: string
    sectionId: string
    currentAddress: string
    previousDetails: string
  }
  parent: {
    name: string
    relation: string
    email: string
    mobileno: string
  }
  classLabel: string
  sectionLabel: string
}

export interface OnlineAdmissionData {
  id: number
  referenceNo: string | null
  firstName: string
  lastName: string | null
  gender: string | null
  birthday: string | null
  religion: string | null
  caste: string | null
  bloodGroup: string | null
  mobileNo: string | null
  motherTongue: string | null
  presentAddress: string | null
  permanentAddress: string | null
  admissionDate: string | null
  city: string | null
  state: string | null
  studentPhoto: string | null
  categoryId: string | null
  email: string | null
  previousSchoolDetails: string | null
  guardianName: string | null
  guardianRelation: string | null
  fatherName: string | null
  motherName: string | null
  grdOccupation: string | null
  grdIncome: string | null
  grdEducation: string | null
  grdEmail: string | null
  grdMobileNo: string | null
  grdAddress: string | null
  grdCity: string | null
  grdState: string | null
  grdPhoto: string | null
  status: number
  paymentStatus: number
  paymentAmount: number
  paymentDetails: string
  classId: number
  sectionId: string | null
  applyDate: string
  doc: string | null
  rejectionReason: string | null
  reviewNotes: string | null
}

export function StudentOnboarding() {
  const [activeTab, setActiveTab] = useState<'direct' | 'sibling' | 'csv' | 'online'>('direct')

  // Online Admissions Desk States
  const [onlineAdmissions, setOnlineAdmissions] = useState<OnlineAdmissionData[]>([])
  const [loadingAdmissions, setLoadingAdmissions] = useState(false)
  const [admissionsFilter, setAdmissionsFilter] = useState<'all' | 'pending' | 'screening' | 'approved' | 'rejected'>('all')
  const [admissionsSearch, setAdmissionsSearch] = useState('')
  const [selectedAdmission, setSelectedAdmission] = useState<OnlineAdmissionData | null>(null)
  const [admissionModalType, setAdmissionModalType] = useState<'details' | 'screen' | 'reject' | 'approve' | 'success' | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [overrideClassId, setOverrideClassId] = useState<string>('')
  const [overrideSectionId, setOverrideSectionId] = useState<string>('')
  const [overrideSections, setOverrideSections] = useState<Section[]>([])
  const [admissionsResult, setAdmissionsResult] = useState<any | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // CSV Import States
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedStudents, setParsedStudents] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<{ row: number; error: string }[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any[] | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showCredentialsMap, setShowCredentialsMap] = useState<{ [key: string]: boolean }>({})

  // Basic CSV parser handling quotes
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/)
    const result: string[][] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const row: string[] = []
      let inQuotes = false
      let current = ''
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      row.push(current.trim())
      result.push(row)
    }
    return result
  }

  const handleDownloadTemplate = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Gender',
      'Birthday',
      'Class',
      'Section',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
      'Parent Relation'
    ]
    const sampleRow = [
      'John',
      'Doe',
      'Male',
      '2015-05-15',
      'Primary 1',
      'A',
      'Robert Doe',
      'robert@example.com',
      '08012345678',
      'Father'
    ]
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student_bulk_onboarding_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setServerError(null)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return
      parseAndValidateCsv(text)
    }
    reader.readAsText(file)
  }

  const parseAndValidateCsv = (text: string) => {
    const rawRows = parseCSV(text)
    if (rawRows.length < 2) {
      setValidationErrors([{ row: 0, error: 'CSV file must contain at least a header row and one student record row.' }])
      setParsedStudents([])
      return
    }

    const headers = rawRows[0].map(h => h.trim().toLowerCase())

    const indexMap = {
      firstName: headers.indexOf('first name'),
      lastName: headers.indexOf('last name'),
      gender: headers.indexOf('gender'),
      birthday: headers.indexOf('birthday'),
      class: headers.indexOf('class'),
      section: headers.indexOf('section'),
      parentName: headers.indexOf('parent name'),
      parentEmail: headers.indexOf('parent email'),
      parentPhone: headers.indexOf('parent phone'),
      parentRelation: headers.indexOf('parent relation')
    }

    const missingHeaders = []
    if (indexMap.firstName === -1) missingHeaders.push('First Name')
    if (indexMap.lastName === -1) missingHeaders.push('Last Name')
    if (indexMap.gender === -1) missingHeaders.push('Gender')
    if (indexMap.class === -1) missingHeaders.push('Class')
    if (indexMap.section === -1) missingHeaders.push('Section')
    if (indexMap.parentName === -1) missingHeaders.push('Parent Name')

    if (missingHeaders.length > 0) {
      setValidationErrors([{ row: 0, error: `Missing required columns in CSV header: ${missingHeaders.join(', ')}` }])
      setParsedStudents([])
      return
    }

    const students: any[] = []
    const errors: { row: number; error: string }[] = []

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i]
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const rowNum = i + 1
      const getVal = (idx: number) => (idx !== -1 && row[idx] ? row[idx].trim() : '')

      const firstName = getVal(indexMap.firstName)
      const lastName = getVal(indexMap.lastName)
      const gender = getVal(indexMap.gender)
      const birthday = getVal(indexMap.birthday)
      const className = getVal(indexMap.class)
      const sectionName = getVal(indexMap.section)
      const parentName = getVal(indexMap.parentName)
      const parentEmail = getVal(indexMap.parentEmail)
      const parentPhone = getVal(indexMap.parentPhone)
      const parentRelation = getVal(indexMap.parentRelation)

      if (!firstName) {
        errors.push({ row: rowNum, error: 'Student First Name is required.' })
      }
      if (!lastName) {
        errors.push({ row: rowNum, error: 'Student Last Name is required.' })
      }
      if (!parentName) {
        errors.push({ row: rowNum, error: 'Parent Name is required.' })
      }
      if (!parentEmail && !parentPhone) {
        errors.push({ row: rowNum, error: 'At least one of Parent Email or Parent Phone is required.' })
      }

      let resolvedClassId = null
      let resolvedSectionId = null

      if (className) {
        const matchedClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase())
        if (!matchedClass) {
          errors.push({ row: rowNum, error: `Class "${className}" does not exist in this branch.` })
        } else {
          resolvedClassId = matchedClass.id
          if (sectionName) {
            const matchedSection = matchedClass.sections.find(s => s.section.name.toLowerCase() === sectionName.toLowerCase())
            if (!matchedSection) {
              errors.push({ row: rowNum, error: `Section "${sectionName}" is not allocated to Class "${className}".` })
            } else {
              resolvedSectionId = matchedSection.section.id
            }
          } else {
            errors.push({ row: rowNum, error: 'Section is required.' })
          }
        }
      } else {
        errors.push({ row: rowNum, error: 'Class is required.' })
      }

      students.push({
        firstName,
        lastName,
        gender: gender || 'Male',
        birthday: birthday || null,
        className,
        sectionName,
        classId: resolvedClassId,
        sectionId: resolvedSectionId,
        parentName,
        parentEmail,
        parentPhone,
        parentRelation: parentRelation || 'Father'
      })
    }

    setParsedStudents(students)
    setValidationErrors(errors)
  }

  const handleCsvSubmit = async () => {
    setIsImporting(true)
    setServerError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; createdCount: number; data: any[] }>(
        endpoints.admin.importStudentsBulk,
        { students: parsedStudents }
      )
      if (res.success) {
        setImportResult(res.data)
      }
    } catch (err: any) {
      setServerError(err.message || 'Bulk onboarding import failed.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadCredentialsCsv = () => {
    if (!importResult) return
    const headers = [
      'Student Name',
      'Reg No',
      'Student Username',
      'Student Password',
      'Parent Name',
      'Parent Username',
      'Parent Password'
    ]
    const rows = importResult.map(item => {
      const studentName = `${item.firstName} ${item.lastName}`
      const regNo = item.registerNo
      const studentUser = item.credentials.student.username
      const studentPass = item.credentials.student.password
      const parentName = item.parentName
      const parentUser = item.credentials.parent ? item.credentials.parent.username : 'Reuse Existing'
      const parentPass = item.credentials.parent ? item.credentials.parent.password : 'Reuse Existing'
      return [
        `"${studentName}"`,
        `"${regNo}"`,
        `"${studentUser}"`,
        `"${studentPass}"`,
        `"${parentName}"`,
        `"${parentUser}"`,
        `"${parentPass}"`
      ].join(',')
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'onboarded_students_credentials.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleCredentialsVisibility = (key: string) => {
    setShowCredentialsMap(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleResetCsvImport = () => {
    setCsvFile(null)
    setParsedStudents([])
    setValidationErrors([])
    setImportResult(null)
    setServerError(null)
    setShowCredentialsMap({})
  }

  // Sibling Requests Admin states
  interface AdminSiblingRequest {
    id: number
    firstName: string
    lastName: string
    gender: string
    birthday: string | null
    status: string
    rejectionReason: string | null
    createdAt: string
    parent: {
      name: string
      email: string | null
      mobileno: string | null
    }
    class: {
      name: string
    }
    section: {
      name: string
    }
  }

  const [siblingReqs, setSiblingReqs] = useState<AdminSiblingRequest[]>([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [approvingId, setApprovingId] = useState<number | null>(null)

  // Rejection states
  const [rejectingReq, setRejectingReq] = useState<AdminSiblingRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const loadSiblingRequests = async () => {
    setLoadingReqs(true)
    try {
      const res = await apiSlice.get<{ success: boolean; siblingRequests: AdminSiblingRequest[] }>(
        endpoints.admin.siblingRequests
      )
      if (res.success) {
        setSiblingReqs(res.siblingRequests)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReqs(false)
    }
  }

  const loadOnlineAdmissions = async () => {
    setLoadingAdmissions(true)
    try {
      const res = await apiSlice.get<{ success: boolean; admissions: OnlineAdmissionData[] }>(
        endpoints.admin.onlineAdmissions
      )
      if (res.success) {
        setOnlineAdmissions(res.admissions)
      }
    } catch (err) {
      console.error('[FRONTEND] Failed to load online admissions:', err)
    } finally {
      setLoadingAdmissions(false)
    }
  }

  const handleAdmissionAction = async (admissionId: number, status: number, payload?: any) => {
    setIsProcessingAction(true)
    setActionError(null)
    try {
      const res = await apiSlice.post<any>(
        endpoints.admin.updateOnlineAdmissionStatus(admissionId),
        { status, ...payload }
      )
      if (res.success) {
        if (status === 3) {
          setAdmissionsResult(res.credentials)
          setAdmissionModalType('success')
        } else {
          setAdmissionModalType(null)
        }
        loadOnlineAdmissions()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update application status.')
    } finally {
      setIsProcessingAction(false)
    }
  }



  // Initial load
  useEffect(() => {
    loadSiblingRequests()
    loadOnlineAdmissions()
  }, [])

  const [classes, setClasses] = useState<ClassData[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Onboarding wizard states
  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultData, setResultData] = useState<OnboardResponse | null>(null)

  // Batch Onboarding States
  const [pendingStudentsList, setPendingStudentsList] = useState<PendingStudent[]>([])
  const [batchResultData, setBatchResultData] = useState<(OnboardResponse & { name: string; registerNo?: string; error?: string })[]>([])
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({})
  const [copiedFieldMap, setCopiedFieldMap] = useState<Record<string, boolean>>({})

  // Copy & toggle visibility states
  const [showStudentPass, setShowStudentPass] = useState(false)
  const [showParentPass, setShowParentPass] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Update override sections when override class selection changes
  useEffect(() => {
    if (!overrideClassId) {
      setOverrideSections([])
      setOverrideSectionId('')
      return
    }
    const selectedClass = classes.find(c => c.id === Number(overrideClassId))
    if (selectedClass) {
      setOverrideSections(selectedClass.sections.map(s => s.section))
      setOverrideSectionId('')
    }
  }, [overrideClassId, classes])

  // Form states
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthday: '',
    classId: '',
    sectionId: '',
    currentAddress: '',
    previousDetails: '',
  })

  const [parentForm, setParentForm] = useState({
    name: '',
    relation: 'Father',
    email: '',
    mobileno: '',
  })

  // Load classrooms on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingClasses(true)
      setLoadError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; classes: ClassData[] }>(
          endpoints.admin.classesSections
        )
        setClasses(res.classes)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load classroom dropdown configuration.')
      } finally {
        setIsLoadingClasses(false)
      }
    }
    loadData()
  }, [])

  // Update sections when class selection changes
  useEffect(() => {
    if (!studentForm.classId) {
      setAvailableSections([])
      setStudentForm(s => ({ ...s, sectionId: '' }))
      return
    }

    const selectedClass = classes.find(c => c.id === Number(studentForm.classId))
    if (selectedClass) {
      setAvailableSections(selectedClass.sections.map(s => s.section))
      setStudentForm(s => ({ ...s, sectionId: '' }))
    }
  }, [studentForm.classId, classes])

  const [isParsing, setIsParsing] = useState(false)
  const [parseSuccessMsg, setParseSuccessMsg] = useState('')

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setErrorMsg(null)
    setParseSuccessMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = safeStorage.getItem('ugbekun_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const response = await fetch(`${apiUrl}/admin/students/parse-document`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'AI parsing failed.')
      }

      const res = await response.json()
      if (res.success && res.extractedData) {
        const data = res.extractedData

        setStudentForm(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          gender: data.gender === 'Female' ? 'Female' : 'Male',
          birthday: data.birthday ? data.birthday.substring(0, 10) : '',
          currentAddress: data.homeAddress || '',
          previousDetails: data.historicalPerformance || '',
        }))

        setParentForm({
          name: data.parentName || '',
          relation: (data.parentRelation === 'Mother' ? 'Mother' : data.parentRelation === 'Guardian' ? 'Guardian' : 'Father') as any,
          email: data.parentEmail || '',
          mobileno: data.parentPhone || '',
        })

        setParseSuccessMsg('AI successfully parsed document! Fields have been pre-filled below.')
      } else {
        throw new Error('Failed to extract data from document.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'AI parsing failed. Please verify the document is readable.')
    } finally {
      setIsParsing(false)
    }
  }

  // Submit Handler
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    const itemsToSubmit = [...pendingStudentsList]

    // If the active form is valid, include it in the submission batch
    const sName = studentForm.firstName.trim()
    const sLastName = studentForm.lastName.trim()
    const pName = parentForm.name.trim()
    const pEmail = parentForm.email.trim()
    const pPhone = parentForm.mobileno.trim()

    if (sName && sLastName && studentForm.classId && studentForm.sectionId && pName && (pEmail || pPhone)) {
      const selectedClass = classes.find(c => c.id === Number(studentForm.classId))
      const classLabel = selectedClass ? selectedClass.name : ''
      const selectedSection = availableSections.find(s => s.id === Number(studentForm.sectionId))
      const sectionLabel = selectedSection ? selectedSection.name : ''

      itemsToSubmit.push({
        id: 'active-form',
        student: {
          ...studentForm,
          firstName: sName,
          lastName: sLastName,
        },
        parent: {
          ...parentForm,
          name: pName,
          email: pEmail,
          mobileno: pPhone,
        },
        classLabel,
        sectionLabel,
      })
    }

    if (itemsToSubmit.length === 0) {
      setErrorMsg('Please enter student details or add them to the pending list.')
      setIsSubmitting(false)
      return
    }

    const results: typeof batchResultData = []

    for (const item of itemsToSubmit) {
      try {
        const payload = {
          student: {
            ...item.student,
            classId: Number(item.student.classId),
            sectionId: Number(item.student.sectionId),
          },
          parent: item.parent,
        }

        const res = await apiSlice.post<OnboardResponse>(
          endpoints.admin.onboardStudent,
          payload
        )
        results.push({
          ...res,
          name: `${item.student.firstName} ${item.student.lastName}`,
          registerNo: res.data?.student?.registerNo || '',
        })
      } catch (err: any) {
        results.push({
          success: false,
          data: {
            student: {
              id: 0,
              registerNo: '',
              firstName: item.student.firstName,
              lastName: item.student.lastName,
              gender: item.student.gender,
              birthday: null,
              idCardToken: '',
              createdAt: new Date().toISOString(),
            },
            parent: {
              id: 0,
              name: item.parent.name,
              relation: item.parent.relation,
              email: item.parent.email,
              mobileno: item.parent.mobileno,
            }
          },
          emailSent: false,
          name: `${item.student.firstName} ${item.student.lastName}`,
          error: err.message || 'Onboarding failed.'
        })
      }
    }

    setBatchResultData(results)
    setIsSubmitting(false)
  }

  const handleAddMore = () => {
    setErrorMsg(null)
    const sName = studentForm.firstName.trim()
    const sLastName = studentForm.lastName.trim()
    const pName = parentForm.name.trim()
    const pEmail = parentForm.email.trim()
    const pPhone = parentForm.mobileno.trim()

    if (!sName || !sLastName) {
      setErrorMsg('Student First Name and Last Name are required.')
      return
    }
    if (!studentForm.classId || !studentForm.sectionId) {
      setErrorMsg('Student Class and Section selection are required.')
      return
    }
    if (!pName) {
      setErrorMsg('Parent Name is required.')
      return
    }
    if (!pEmail && !pPhone) {
      setErrorMsg('At least one Parent Contact Info (Email or Phone) is required.')
      return
    }

    const selectedClass = classes.find(c => c.id === Number(studentForm.classId))
    const classLabel = selectedClass ? selectedClass.name : ''
    const selectedSection = availableSections.find(s => s.id === Number(studentForm.sectionId))
    const sectionLabel = selectedSection ? selectedSection.name : ''

    const newItem: PendingStudent = {
      id: Math.random().toString(),
      student: {
        ...studentForm,
        firstName: sName,
        lastName: sLastName,
      },
      parent: {
        ...parentForm,
        name: pName,
        email: pEmail,
        mobileno: pPhone,
      },
      classLabel,
      sectionLabel,
    }

    setPendingStudentsList([...pendingStudentsList, newItem])
    setParseSuccessMsg('')

    // Reset student input fields, keeping class/section selection for fast entry
    setStudentForm(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      birthday: '',
      currentAddress: '',
      previousDetails: '',
    }))
    setParentForm({
      name: '',
      relation: 'Father',
      email: '',
      mobileno: '',
    })

    setActiveStep(1)
  }

  const handleRemovePending = (id: string) => {
    setPendingStudentsList(pendingStudentsList.filter(item => item.id !== id))
  }

  // Reset Form for next student
  const handleReset = () => {
    setStudentForm({
      firstName: '',
      lastName: '',
      gender: 'Male',
      birthday: '',
      classId: '',
      sectionId: '',
      currentAddress: '',
      previousDetails: '',
    })
    setParentForm({
      name: '',
      relation: 'Father',
      email: '',
      mobileno: '',
    })
    setParseSuccessMsg('')
    setResultData(null)
    setPendingStudentsList([])
    setBatchResultData([])
    setShowPasswordMap({})
    setCopiedFieldMap({})
    setActiveStep(1)
    setErrorMsg(null)
    setShowStudentPass(false)
    setShowParentPass(false)
    setCopiedField(null)
  }

  const handleApproveSibling = async (id: number) => {
    if (!confirm('Are you sure you want to approve this sibling request and enroll this student?')) return
    setApprovingId(id)
    try {
      const res = await apiSlice.post<OnboardResponse>(
        endpoints.admin.approveSiblingRequest(id),
        {}
      )
      setResultData(res)
      loadSiblingRequests()
    } catch (err: any) {
      alert(err.message || 'Approval failed.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectSibling = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingReq) return
    setIsRejecting(true)
    try {
      await apiSlice.post(
        endpoints.admin.rejectSiblingRequest(rejectingReq.id),
        { rejectionReason }
      )
      setRejectingReq(null)
      setRejectionReason('')
      loadSiblingRequests()
    } catch (err: any) {
      alert(err.message || 'Rejection failed.')
    } finally {
      setIsRejecting(false)
    }
  }

  if (batchResultData.length > 0) {
    const totalBatchCount = batchResultData.length
    const successBatchCount = batchResultData.filter(r => r.success).length
    const hasPDFs = batchResultData.some(r => r.success && r.pdfBase64)

    const handleDownloadAllPDFs = () => {
      batchResultData.forEach((res) => {
        if (res.success && res.pdfBase64) {
          const link = document.createElement('a')
          link.href = `data:application/pdf;base64,${res.pdfBase64}`
          link.download = `login_slip_student_${res.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      })
    }

    const handleCopyTextWithMap = (text: string, key: string) => {
      navigator.clipboard.writeText(text)
      setCopiedFieldMap(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedFieldMap(prev => ({ ...prev, [key]: false }))
      }, 2000)
    }

    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
        {/* Success Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Pipeline Completed!</h2>
          <p className="text-slate-505 text-sm font-medium">
            Processed {totalBatchCount} student registrations. {successBatchCount} succeeded, {totalBatchCount - successBatchCount} failed.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batchResultData.map((res, idx) => (
            <div key={idx} className={`rounded-xl border p-5 space-y-4 relative overflow-hidden bg-white shadow-sm ${
              res.success ? 'border-slate-250' : 'border-rose-200 bg-rose-50/20'
            }`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${res.success ? 'bg-blue-600' : 'bg-rose-500'}`} />

              <div className="flex justify-between items-start pl-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{res.name}</h4>
                  {res.success && res.registerNo && (
                    <p className="text-[10px] text-slate-500 font-bold">Reg No: {res.registerNo}</p>
                  )}
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  res.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {res.success ? 'Success' : 'Failed'}
                </span>
              </div>

              {res.success ? (
                <div className="space-y-3 pl-2">
                  {/* Student Credentials */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Student Username & Password</label>
                    <div className="flex items-center gap-2 bg-slate-550 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 shadow-inner">
                      <span className="flex-1 select-all truncate">{res.credentials?.student.username}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTextWithMap(res.credentials?.student.username || '', `stud-user-${idx}`)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {copiedFieldMap[`stud-user-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-550 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 shadow-inner mt-1">
                      <input
                        type={showPasswordMap[`stud-${idx}`] ? 'text' : 'password'}
                        value={res.credentials?.student.password || ''}
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordMap(prev => ({ ...prev, [`stud-${idx}`]: !prev[`stud-${idx}`] }))}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {showPasswordMap[`stud-${idx}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyTextWithMap(res.credentials?.student.password || '', `stud-pass-${idx}`)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {copiedFieldMap[`stud-pass-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Parent Credentials */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Parent Username & Password</label>
                    {res.credentials?.parent ? (
                      <>
                        <div className="flex items-center gap-2 bg-slate-550 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 shadow-inner">
                          <span className="flex-1 select-all truncate">{res.credentials.parent.username}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTextWithMap(res.credentials?.parent?.username || '', `par-user-${idx}`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                          >
                            {copiedFieldMap[`par-user-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-550 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 shadow-inner mt-1">
                          <input
                            type={showPasswordMap[`par-${idx}`] ? 'text' : 'password'}
                            value={res.credentials.parent.password || ''}
                            readOnly
                            className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordMap(prev => ({ ...prev, [`par-${idx}`]: !prev[`par-${idx}`] }))}
                            className="p-1 hover:bg-slate-100 rounded text-slate-550 hover:text-slate-900 transition shrink-0"
                          >
                            {showPasswordMap[`par-${idx}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyTextWithMap(res.credentials?.parent?.password || '', `par-pass-${idx}`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-550 hover:text-slate-900 transition shrink-0"
                          >
                            {copiedFieldMap[`par-pass-${idx}`] ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-semibold p-2 bg-slate-50 border border-slate-200/60 rounded-lg shadow-inner">
                        Reused existing parent credentials.
                      </p>
                    )}
                  </div>

                  {res.pdfBase64 && (
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = `data:application/pdf;base64,${res.pdfBase64}`
                        link.download = `login_slip_student_${res.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      className="w-full mt-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                    >
                      <Download size={13} /> Download Login Slip (PDF)
                    </button>
                  )}
                </div>
              ) : (
                <div className="pl-2 py-1 text-xs text-rose-600 font-bold">
                  {res.error || 'Server error occurred during student registration.'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
          {hasPDFs && (
            <button
              onClick={handleDownloadAllPDFs}
              className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Download size={15} /> Download All Printable Slips (PDFs)
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center transition active:scale-[0.98]"
          >
            Onboard Another Batch
          </button>
        </div>
      </div>
    )
  }

  if (resultData) {
    const s = resultData.data.student
    const p = resultData.data.parent
    const admissionYear = new Date(s.createdAt).getFullYear()

    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
        {/* Success Header */}
        <div className="text-center space-y-2.5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Completed Successfully!</h2>
          <p className="text-slate-500 text-sm font-medium">The backend transaction committed and initialized all academic bindings.</p>
        </div>

        {/* Credentials and PDF Download Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="text-emerald-600" size={18} /> Instantly Generated Portal Credentials
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Copy credentials below or download the pre-formatted printable slip.
              </p>
            </div>
            {resultData.pdfBase64 && (
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `data:application/pdf;base64,${resultData.pdfBase64}`
                  link.download = `login_slip_${s.firstName.toLowerCase()}_${s.lastName.toLowerCase()}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Download size={15} /> Download Printable Slip (PDF)
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Credentials Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              <div className="flex items-center gap-2 font-black text-xs text-blue-800 uppercase tracking-wider">
                <GraduationCap size={16} /> Student Access Details
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Username</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                    <span className="flex-1 select-all truncate">{resultData.credentials?.student.username}</span>
                    <button
                      onClick={() => handleCopyText(resultData.credentials?.student.username || '', 'student_user')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      title="Copy Username"
                    >
                      {copiedField === 'student_user' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Temporary Password</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                    <input
                      type={showStudentPass ? 'text' : 'password'}
                      value={resultData.credentials?.student.password}
                      readOnly
                      className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                    />
                    <button
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                    >
                      {showStudentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopyText(resultData.credentials?.student.password || '', 'student_pass')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      title="Copy Password"
                    >
                      {copiedField === 'student_pass' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Credentials Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <div className="flex items-center gap-2 font-black text-xs text-amber-800 uppercase tracking-wider">
                <Users size={16} /> Parent Access Details
              </div>

              {resultData.credentials?.parent ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Username</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <span className="flex-1 select-all truncate">{resultData.credentials.parent.username}</span>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.parent?.username || '', 'parent_user')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                        title="Copy Username"
                      >
                        {copiedField === 'parent_user' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Temporary Password</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono text-slate-800 shadow-sm">
                      <input
                        type={showParentPass ? 'text' : 'password'}
                        value={resultData.credentials.parent.password}
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none select-all truncate w-full"
                      />
                      <button
                        onClick={() => setShowParentPass(!showParentPass)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                      >
                        {showParentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyText(resultData.credentials?.parent?.password || '', 'parent_pass')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition shrink-0"
                        title="Copy Password"
                      >
                        {copiedField === 'parent_pass' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center py-4 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Existing Parent Detected</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
                    An existing account with email <span className="text-slate-700 font-bold">{p.email || 'N/A'}</span> was reused. Use existing credentials to sign in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credentials and Digital Footprint Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Footprint Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-[360px]">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

            {/* ID Card Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Ugbekun Academy</span>
                <span className="font-extrabold text-slate-900 text-xs">Active Student Card</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            {/* ID Card Middle Body */}
            <div className="flex gap-5 items-center my-6">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-700 text-2xl uppercase shadow-inner">
                {s.firstName.substring(0, 1)}{s.lastName.substring(0, 1)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate leading-tight">
                  {s.firstName} {s.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-bold tracking-tight">
                  Reg No: <span className="text-slate-950">{s.registerNo}</span>
                </p>
                <p className="text-xs text-slate-400 font-semibold">
                  Class: <span className="text-slate-700">{classes.find(c => c.id === Number(studentForm.classId))?.name}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Admitted: {admissionYear}
                </p>
              </div>
            </div>

            {/* ID Card Footer Barcode Footprint */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 font-bold uppercase block">Security Fingerprint Token</span>
                <span className="text-[9px] font-mono text-slate-600 truncate max-w-[160px] block">{s.idCardToken}</span>
              </div>
              <QrCode className="text-slate-800" size={36} />
            </div>
          </div>

          {/* Programmatic Achievements summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
            <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" /> Automated Bindings Status
            </h4>
            <p className="text-xs text-slate-400 font-medium">Below actions were dynamically completed in the background process:</p>

            <div className="space-y-3">
              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Curriculum Subjects Linked</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Allocated all subjects matching class & section automatically.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Faculty Connections Registered</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Subject teachers linked with student profile to activate marksheet access.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">CA & Exams Matrix Bound</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generated empty evaluation placeholder rows in student grade sheets.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full mt-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Onboard Next Student
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title Header */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Student Onboarding</h1>
            <p className="text-slate-500 text-sm font-medium">Onboard a student and dynamically provision parent relations, classroom schedules, and exams.</p>
          </div>
          {activeTab === 'direct' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition ${activeStep === 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <GraduationCap size={14} /> Student Info
              </button>
              <button
                type="button"
                onClick={() => {
                  if (studentForm.firstName && studentForm.lastName && studentForm.classId && studentForm.sectionId) {
                    setActiveStep(2)
                  } else {
                    setErrorMsg('Please complete student profile (Name, Class & Section) first.')
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition ${activeStep === 2 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Users size={14} /> Parent Info
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-250 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition ${activeTab === 'direct'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-550 hover:text-slate-900'
            }`}
        >
          Direct Student Onboarding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sibling')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${activeTab === 'sibling'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-550 hover:text-slate-900'
            }`}
        >
          Sibling Requests Approval
          {siblingReqs.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-amber-100 text-amber-850 text-[10px] px-2 py-0.5 rounded-full font-black">
              {siblingReqs.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${activeTab === 'csv'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-550 hover:text-slate-900'
            }`}
        >
          CSV Bulk Onboarding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('online')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${activeTab === 'online'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-550 hover:text-slate-900'
            }`}
        >
          Online Admissions Desk
          {onlineAdmissions.filter(a => a.status === 1).length > 0 && (
            <span className="bg-[#003da5]/10 text-[#003da5] text-[10px] px-2 py-0.5 rounded-full font-black">
              {onlineAdmissions.filter(a => a.status === 1).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'direct' && (
        <>
          {/* Load Errors */}
          {loadError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
              Error initializing classrooms: {loadError}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {isLoadingClasses ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-slate-500 text-sm font-semibold">Configuring environment...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              <form onSubmit={handleOnboardSubmit} className="flex-1 space-y-6 w-full">
              {/* STEP 1: STUDENT PROFILE */}
              {activeStep === 1 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <GraduationCap size={16} className="text-blue-600" /> Student Profile Details
                  </h3>

                  {/* AI Document Parsing Widget */}
                  <div className="p-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 transition space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                        <Sparkles size={16} className="animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-950 tracking-tight">AI Document Parsing Assistant</h4>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                          Upload a scanned admission form, birth certificate, or previous academic transcript. AI will parse the details and autofill the registration schema instantly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm active:scale-95">
                        {isParsing ? 'Processing with AI...' : 'Upload & Parse Document'}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          disabled={isParsing}
                        />
                      </label>
                      {isParsing && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting records...
                        </div>
                      )}
                      {parseSuccessMsg && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> {parseSuccessMsg}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">First Name</label>
                      <input
                        type="text"
                        placeholder="Student's first name"
                        value={studentForm.firstName}
                        onChange={e => setStudentForm({ ...studentForm, firstName: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Last Name (Surname)</label>
                      <input
                        type="text"
                        placeholder="Student's last name"
                        value={studentForm.lastName}
                        onChange={e => setStudentForm({ ...studentForm, lastName: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Gender</label>
                      <select
                        value={studentForm.gender}
                        onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={studentForm.birthday}
                        onChange={e => setStudentForm({ ...studentForm, birthday: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Select Class</label>
                      <select
                        value={studentForm.classId}
                        onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      >
                        <option value="">-- Choose Class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Select Section</label>
                      <select
                        value={studentForm.sectionId}
                        onChange={e => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                        disabled={!studentForm.classId}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 disabled:opacity-50"
                        required
                      >
                        <option value="">-- Choose Section --</option>
                        {availableSections.map(sec => (
                          <option key={sec.id} value={sec.id}>{sec.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 block mb-1">Home Address</label>
                      <textarea
                        placeholder="Student's home address"
                        value={studentForm.currentAddress}
                        onChange={e => setStudentForm({ ...studentForm, currentAddress: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 h-16 resize-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 block mb-1">Previous School & Academic History</label>
                      <textarea
                        placeholder="E.g., Greenfield Academy, Grade 3 - average score 85%, exemplary behavior"
                        value={studentForm.previousDetails}
                        onChange={e => setStudentForm({ ...studentForm, previousDetails: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 h-16 resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (studentForm.firstName && studentForm.lastName && studentForm.classId && studentForm.sectionId) {
                          setActiveStep(2)
                          setErrorMsg(null)
                        } else {
                          setErrorMsg('Please complete student profile (Name, Class & Section) first.')
                        }
                      }}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Continue to Parent Details <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PARENT PROFILE */}
              {activeStep === 2 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Users size={16} className="text-amber-600" /> Parent / Guardian Contacts
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Parent Name</label>
                      <input
                        type="text"
                        placeholder="Father or Mother's full name"
                        value={parentForm.name}
                        onChange={e => setParentForm({ ...parentForm, name: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Relationship</label>
                      <select
                        value={parentForm.relation}
                        onChange={e => setParentForm({ ...parentForm, relation: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Mobile Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={parentForm.mobileno}
                        onChange={e => setParentForm({ ...parentForm, mobileno: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. parent@domain.com"
                        value={parentForm.email}
                        onChange={e => setParentForm({ ...parentForm, email: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                    >
                      Back to Student Profile
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddMore}
                        className="px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <UserPlus size={14} /> Save and Add More
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <Check size={14} /> Complete Onboarding ({pendingStudentsList.length + 1})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </form>

              {/* Pending Queue Side */}
              {pendingStudentsList.length > 0 && (
                <div className="w-full lg:w-80 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 shrink-0 max-h-[600px] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Users size={16} className="text-blue-600" /> Pending Queue
                    </h4>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                      {pendingStudentsList.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[400px]">
                    {pendingStudentsList.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition">
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {item.student.firstName} {item.student.lastName}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                            {item.classLabel} - {item.sectionLabel}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium truncate">
                            Parent: {item.parent.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded-lg transition shrink-0"
                          title="Remove Student"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleOnboardSubmit(e)}
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Processing Queue...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> Submit Queue ({pendingStudentsList.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'sibling' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#003da5]" /> Sibling Admissions Requests
            </h3>
            <button
              type="button"
              onClick={loadSiblingRequests}
              className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {loadingReqs ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-8 h-8 text-[#003da5] animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Loading requests...</p>
            </div>
          ) : siblingReqs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No sibling requests found</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                Any sibling admission requests submitted by parents will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Child Name</th>
                    <th className="py-3 px-4">Gender / DOB</th>
                    <th className="py-3 px-4">Parent Details</th>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {siblingReqs.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {req.lastName}, {req.firstName}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-semibold text-slate-700">{req.gender}</p>
                        {req.birthday && (
                          <p className="text-[10px] text-slate-400 font-bold">
                            DOB: {new Date(req.birthday).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-bold text-slate-900">{req.parent.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{req.parent.email || 'No Email'}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{req.parent.mobileno || 'No Phone'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {req.class.name} — {req.section.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            Pending Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-full">
                            Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                              Rejected
                            </span>
                            {req.rejectionReason && (
                              <p className="text-[10px] text-rose-500 italic max-w-xs leading-normal">
                                Reason: {req.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={approvingId !== null}
                              onClick={() => handleApproveSibling(req.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs rounded-lg transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              {approvingId === req.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={approvingId !== null}
                              onClick={() => setRejectingReq(req)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal Backdrop */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#001a4e] text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Reject Sibling Admission</h3>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleRejectSibling} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please enter the reason for rejecting the sibling request for <strong>{rejectingReq.lastName}, {rejectingReq.firstName}</strong>. This reason will be visible to the parent.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Reason for Rejection</label>
                <textarea
                  required
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 h-24 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="space-y-6">
          {importResult ? (
            /* Bulk Onboarding Success Screen */
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="text-center space-y-2.5 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} className="stroke-[2.5]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Onboarding Completed!</h2>
                <p className="text-slate-500 text-sm font-medium">Successfully registered {importResult.length} students and created parent accounts.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Key className="text-emerald-600" size={18} /> Provisioned Credentials List
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Download the CSV file below containing all generated student and parent logins.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadCredentialsCsv}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      <Download size={15} /> Download Credentials (CSV)
                    </button>
                    <button
                      onClick={handleResetCsvImport}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      Upload Another Batch
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Reg No</th>
                        <th className="py-3 px-4">Student Login</th>
                        <th className="py-3 px-4">Parent Info</th>
                        <th className="py-3 px-4">Parent Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {importResult.map((item, idx) => {
                        const studentKey = `${idx}_student`
                        const parentKey = `${idx}_parent`
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 px-4 font-bold text-slate-900">
                              {item.firstName} {item.lastName}
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-500">{item.registerNo}</td>
                            <td className="py-4 px-4 space-y-1 min-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase w-12 shrink-0">User:</span>
                                <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] select-all truncate">{item.credentials.student.username}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase w-12 shrink-0">Pass:</span>
                                <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] select-all truncate">
                                  {showCredentialsMap[studentKey] ? item.credentials.student.password : '••••••••'}
                                </span>
                                <button
                                  onClick={() => toggleCredentialsVisibility(studentKey)}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition shrink-0"
                                >
                                  {showCredentialsMap[studentKey] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-medium text-slate-600">{item.parentName}</td>
                            <td className="py-4 px-4 space-y-1 min-w-[200px]">
                              {item.credentials.parent ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase w-12 shrink-0">User:</span>
                                    <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] select-all truncate">{item.credentials.parent.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase w-12 shrink-0">Pass:</span>
                                    <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] select-all truncate">
                                      {showCredentialsMap[parentKey] ? item.credentials.parent.password : '••••••••'}
                                    </span>
                                    <button
                                      onClick={() => toggleCredentialsVisibility(parentKey)}
                                      className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition shrink-0"
                                    >
                                      {showCredentialsMap[parentKey] ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 font-bold text-[10px] uppercase">Reused Existing Account</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Upload and Validation Preview Screen */
            <div className="space-y-6 pb-12">
              {/* Instructions Panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" /> Bulk Import Guidelines
                    </h3>
                    <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
                      Download the CSV template, fill in your student and parent details, and upload the file.
                      Class and Section names must exactly match the configurations of your branch (case-insensitive).
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 shadow-sm"
                  >
                    <Download size={14} /> Download Template CSV
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <ul className="space-y-2 list-disc list-inside">
                    <li><strong className="text-slate-905">Required:</strong> First Name, Last Name, Gender, Class, Section, Parent Name</li>
                    <li><strong className="text-slate-905">Parent Info:</strong> At least one of Parent Email or Parent Phone is required.</li>
                  </ul>
                  <ul className="space-y-2 list-disc list-inside">
                    <li><strong className="text-slate-905">Gender:</strong> Must be Male or Female (defaults to Male if invalid).</li>
                    <li><strong className="text-slate-905">Class & Section:</strong> Must be already allocated to each other in this branch.</li>
                  </ul>
                </div>
              </div>

              {/* Upload Panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Upload size={16} className="text-blue-600" /> Select CSV File
                  </h3>
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition relative">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 space-y-2 text-center px-4">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-xs text-slate-500 font-extrabold">
                        {csvFile ? `Selected: ${csvFile.name}` : 'Click to upload or drag & drop CSV'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">CSV Files only (max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {serverError && (
                  <div className="rounded-xl border border-rose-250 bg-rose-50 px-4 py-3 text-xs text-rose-800 font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} className="shrink-0" />
                    {serverError}
                  </div>
                )}
              </div>

              {/* Preview and Validation Table */}
              {parsedStudents.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        Parsed Record Preview
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Please review the parsed rows and fix any highlighted errors before submitting.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${validationErrors.length > 0
                        ? 'bg-rose-105 text-rose-700 border border-rose-200'
                        : 'bg-emerald-105 text-emerald-700 border border-emerald-200'
                        }`}>
                        {validationErrors.length > 0
                          ? `${validationErrors.length} validation errors`
                          : 'All rows valid'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-4 w-12 text-center">Row</th>
                          <th className="py-2.5 px-4">Student Details</th>
                          <th className="py-2.5 px-4">Classroom</th>
                          <th className="py-2.5 px-4">Parent Details</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {parsedStudents.map((student, idx) => {
                          const rowNum = idx + 2
                          const rowErrors = validationErrors.filter(e => e.row === rowNum)
                          const hasError = rowErrors.length > 0

                          return (
                            <tr key={idx} className={`hover:bg-slate-50/50 transition ${hasError ? 'bg-rose-50/20' : ''}`}>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">{rowNum}</td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{student.firstName} {student.lastName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{student.gender} • {student.birthday || 'No DOB'}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-700">Class: {student.className}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Section: {student.sectionName}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-700">{student.parentName} ({student.parentRelation})</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{student.parentEmail || 'No Email'} • {student.parentPhone || 'No Phone'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {hasError ? (
                                  <div className="space-y-1">
                                    {rowErrors.map((err, eIdx) => (
                                      <div key={eIdx} className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                                        <AlertCircle size={10} /> {err.error}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-emerald-600 font-bold text-[10px] uppercase flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      onClick={handleResetCsvImport}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Clear File
                    </button>
                    <button
                      onClick={handleCsvSubmit}
                      disabled={validationErrors.length > 0 || parsedStudents.length === 0 || isImporting}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                      Import {parsedStudents.length} Students
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'online' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-[#003da5]" /> Online Admissions Desk
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Manage and process student applications submitted online.
              </p>
            </div>
            <button
              type="button"
              onClick={loadOnlineAdmissions}
              disabled={loadingAdmissions}
              className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loadingAdmissions ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Refresh Applications
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Status Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              {(['all', 'pending', 'screening', 'approved', 'rejected'] as const).map(f => {
                const count = f === 'all'
                  ? onlineAdmissions.length
                  : onlineAdmissions.filter(a => {
                    if (f === 'pending') return a.status === 1
                    if (f === 'screening') return a.status === 2
                    if (f === 'approved') return a.status === 3
                    if (f === 'rejected') return a.status === 0
                    return false
                  }).length

                return (
                  <button
                    key={f}
                    onClick={() => setAdmissionsFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${admissionsFilter === f
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-250'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    {f} ({count})
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search candidates..."
                value={admissionsSearch}
                onChange={e => setAdmissionsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400">🔍</span>
            </div>
          </div>

          {/* Main List */}
          {loadingAdmissions ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#003da5]" size={32} />
              <p className="text-xs font-semibold text-slate-400">Retrieving applications...</p>
            </div>
          ) : (
            (() => {
              const filtered = onlineAdmissions.filter(a => {
                // Status Filter
                if (admissionsFilter === 'pending' && a.status !== 1) return false
                if (admissionsFilter === 'screening' && a.status !== 2) return false
                if (admissionsFilter === 'approved' && a.status !== 3) return false
                if (admissionsFilter === 'rejected' && a.status !== 0) return false

                // Search Filter
                if (admissionsSearch) {
                  const query = admissionsSearch.toLowerCase()
                  const name = `${a.firstName} ${a.lastName || ''}`.toLowerCase()
                  const guardian = (a.guardianName || '').toLowerCase()
                  const email = (a.email || '').toLowerCase()
                  const ref = (a.referenceNo || '').toLowerCase()
                  return name.includes(query) || guardian.includes(query) || email.includes(query) || ref.includes(query)
                }

                return true
              })

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                    <GraduationCap className="text-slate-300 mb-2" size={40} />
                    <p className="text-xs font-bold text-slate-500">No applications found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">There are no candidates matching the active filter.</p>
                  </div>
                )
              }

              return (
                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full border-collapse text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-150 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Ref No / Date</th>
                        <th className="px-4 py-3">Student Candidate</th>
                        <th className="px-4 py-3">Classroom Applied</th>
                        <th className="px-4 py-3">Parent / Guardian</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filtered.map(a => {
                        const classObj = classes.find(c => c.id === a.classId)
                        const sectionName = a.sectionId ? (classObj?.sections.find(s => s.section.id === Number(a.sectionId))?.section.name || 'Unassigned') : 'Unassigned'

                        return (
                          <tr key={a.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{a.referenceNo || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {new Date(a.applyDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{a.firstName} {a.lastName || ''}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">
                                {a.gender || 'Unknown'} • {a.birthday ? new Date(a.birthday).toLocaleDateString() : 'No DOB'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800">{classObj?.name || 'Class ID: ' + a.classId}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Section: {sectionName}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800">{a.guardianName || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {a.grdEmail || a.grdMobileNo || 'No contacts'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {a.status === 1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                  Pending
                                </span>
                              )}
                              {a.status === 2 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                                  Screening
                                </span>
                              )}
                              {a.status === 3 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Approved
                                </span>
                              )}
                              {a.status === 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                                  Rejected
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAdmission(a)
                                    setAdmissionModalType('details')
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="View Details"
                                >
                                  <FileText size={15} />
                                </button>
                                {(a.status === 1 || a.status === 2) && (
                                  <>
                                    {a.status === 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedAdmission(a)
                                          setActionReason(a.reviewNotes || '')
                                          setAdmissionModalType('screen')
                                        }}
                                        className="p-1 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                        title="Move to Screening"
                                      >
                                        <BookOpen size={15} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedAdmission(a)
                                        setOverrideClassId(String(a.classId))
                                        setOverrideSectionId(a.sectionId || '')
                                        setAdmissionModalType('approve')
                                      }}
                                      className="p-1 text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                                      title="Approve & Onboard"
                                    >
                                      <UserCheck size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedAdmission(a)
                                        setActionReason('')
                                        setAdmissionModalType('reject')
                                      }}
                                      className="p-1 text-rose-600 hover:text-rose-850 transition cursor-pointer"
                                      title="Reject Admission"
                                    >
                                      <X size={15} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* Details Modal */}
      {admissionModalType === 'details' && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#001a4e] text-white">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Admission Request Details</h3>
                <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Reference No: {selectedAdmission.referenceNo || 'N/A'}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Student Candidate Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#003da5] uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <GraduationCap size={14} /> Student Candidate Info
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">First Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.firstName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Last Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.lastName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender</span>
                    <span className="text-xs font-semibold text-slate-800 capitalize">{selectedAdmission.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Birthday</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedAdmission.birthday ? new Date(selectedAdmission.birthday).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Religion</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.religion || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blood Group</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.bloodGroup || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mother Tongue</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.motherTongue || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Mobile</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.mobileNo || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Present Address</span>
                    <span className="text-xs font-semibold text-slate-800 leading-normal block max-w-md">{selectedAdmission.presentAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Permanent Address</span>
                    <span className="text-xs font-semibold text-slate-800 leading-normal block max-w-md">{selectedAdmission.permanentAddress || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Previous School Details</span>
                    <span className="text-xs font-semibold text-slate-800 leading-normal block max-w-md">{selectedAdmission.previousSchoolDetails || 'N/A'}</span>
                  </div>
                  {selectedAdmission.doc && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Attached Document</span>
                      <a
                        href={selectedAdmission.doc}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                      >
                        <FileText size={13} /> View Attached File
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent/Guardian Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-[#003da5] uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Users size={14} /> Parent / Guardian Info
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guardian Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.guardianName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Relation</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.guardianRelation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guardian Email</span>
                    <span className="text-xs font-semibold text-slate-850">{selectedAdmission.grdEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guardian Mobile</span>
                    <span className="text-xs font-semibold text-slate-850">{selectedAdmission.grdMobileNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Father Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mother Name</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.motherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Occupation</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.grdOccupation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Education Level</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedAdmission.grdEducation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Status & Review Notes Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-[#003da5] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Status & Review Notes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAdmission.reviewNotes && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Screening/Review Notes</span>
                      <p className="text-xs font-semibold text-slate-700 leading-normal">{selectedAdmission.reviewNotes}</p>
                    </div>
                  )}
                  {selectedAdmission.rejectionReason && (
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                      <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block mb-1">Rejection Reason</span>
                      <p className="text-xs font-semibold text-rose-700 leading-normal">{selectedAdmission.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              {(selectedAdmission.status === 1 || selectedAdmission.status === 2) && (
                <div className="flex gap-2">
                  {selectedAdmission.status === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionReason(selectedAdmission.reviewNotes || '')
                        setAdmissionModalType('screen')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                    >
                      Move to Screening
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideClassId(String(selectedAdmission.classId))
                      setOverrideSectionId(selectedAdmission.sectionId || '')
                      setAdmissionModalType('approve')
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                  >
                    Approve & Onboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionReason('')
                      setAdmissionModalType('reject')
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screening Modal */}
      {admissionModalType === 'screen' && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#001a4e] text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Screening Review Notes</h3>
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Record interview comments, test results, or feedback for <strong>{selectedAdmission.firstName} {selectedAdmission.lastName || ''}</strong>.
                This will move their application status to <strong>Screening</strong>.
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Interview & Test Notes</label>
                <textarea
                  rows={4}
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Enter details here..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-500 font-bold">{actionError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdmissionModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAdmissionAction(selectedAdmission.id, 2, { reviewNotes: actionReason })}
                  disabled={isProcessingAction}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {isProcessingAction ? <Loader2 size={13} className="animate-spin" /> : null}
                  Move to Screening
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {admissionModalType === 'reject' && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#001a4e] text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Reject Application</h3>
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Please provide the reason for denying the application for <strong>{selectedAdmission.firstName} {selectedAdmission.lastName || ''}</strong>.
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Rejection Reason</label>
                <textarea
                  rows={4}
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-500 font-bold">{actionError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdmissionModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAdmissionAction(selectedAdmission.id, 0, { rejectionReason: actionReason })}
                  disabled={isProcessingAction || !actionReason.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingAction ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {admissionModalType === 'approve' && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#001a4e] text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Approve & Onboard</h3>
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Approve admission and register <strong>{selectedAdmission.firstName} {selectedAdmission.lastName || ''}</strong>.
                Verify or override their classroom allocation below:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Class</label>
                  <select
                    value={overrideClassId}
                    onChange={e => setOverrideClassId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Section</label>
                  <select
                    value={overrideSectionId}
                    onChange={e => setOverrideSectionId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                  >
                    <option value="">Select Section</option>
                    {overrideSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {actionError && (
                <p className="text-xs text-rose-500 font-bold">{actionError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdmissionModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAdmissionAction(selectedAdmission.id, 3, {
                    classId: overrideClassId ? Number(overrideClassId) : undefined,
                    sectionId: overrideSectionId ? Number(overrideSectionId) : undefined
                  })}
                  disabled={isProcessingAction || !overrideClassId || !overrideSectionId}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingAction ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm & Onboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {admissionModalType === 'success' && selectedAdmission && admissionsResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-600 text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={18} /> Admission Onboarded Successfully
              </h3>
              <button
                type="button"
                onClick={() => setAdmissionModalType(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Candidate <strong>{selectedAdmission.firstName} {selectedAdmission.lastName || ''}</strong> has been registered in the system. The parent was notified via email.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Student */}
                <div className="p-4 rounded-xl border border-slate-250 bg-slate-50/50 space-y-3 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-wide block">Student Portal Access</span>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                      <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800">
                        <span className="truncate select-all">{admissionsResult.student.username}</span>
                        <button
                          onClick={() => handleCopyText(admissionsResult.student.username, 'adm_student_user')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                        >
                          {copiedField === 'adm_student_user' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Temporary Password</span>
                      <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800">
                        <input
                          type={showStudentPass ? 'text' : 'password'}
                          value={admissionsResult.student.password}
                          readOnly
                          className="bg-transparent border-none outline-none select-all truncate w-full"
                        />
                        <button
                          onClick={() => setShowStudentPass(!showStudentPass)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                        >
                          {showStudentPass ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={() => handleCopyText(admissionsResult.student.password, 'adm_student_pass')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                        >
                          {copiedField === 'adm_student_pass' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent */}
                <div className="p-4 rounded-xl border border-slate-250 bg-slate-50/50 space-y-3 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wide block">Parent Portal Access</span>
                  {admissionsResult.parent ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                        <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800">
                          <span className="truncate select-all">{admissionsResult.parent.username}</span>
                          <button
                            onClick={() => handleCopyText(admissionsResult.parent.username, 'adm_parent_user')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                          >
                            {copiedField === 'adm_parent_user' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Temporary Password</span>
                        <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800">
                          <input
                            type={showParentPass ? 'text' : 'password'}
                            value={admissionsResult.parent.password}
                            readOnly
                            className="bg-transparent border-none outline-none select-all truncate w-full"
                          />
                          <button
                            onClick={() => setShowParentPass(!showParentPass)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                          >
                            {showParentPass ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => handleCopyText(admissionsResult.parent.password, 'adm_parent_pass')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                          >
                            {copiedField === 'adm_parent_pass' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Existing Parent Profile Reused</span>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">
                        Use their existing credentials to sign in.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAdmissionModalType(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
