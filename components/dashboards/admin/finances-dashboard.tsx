'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  Calendar,
  BarChart3,
  Trash2,
  Send,
  Building2,
  Landmark,
  PieChart,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  Printer,
  Loader2,
  Check,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Pencil,
  Ban
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'
import { IncomeVsExpensesChart, AnnualFeeSummaryCard } from './financial-visuals'

export interface OverviewData {
  summary: {
    totalInvoiced: number
    totalRevenue: number
    totalOutstanding: number
    collectionRate: number
  }
  paymentTrend: Array<{ date: string; amount: number }>
  outstandingStudents: Array<{
    invoiceId: number
    invoiceNo: string
    studentName: string
    registerNo: string
    total: number
    paid: number
    balance: number
  }>
}

export interface Invoice {
  id: number
  invoiceNo: string
  termLabel: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  dueDate: string | null
  issuedAt: string
  student: {
    id?: number
    firstName: string
    lastName: string
    registerNo: string
    className?: string
    sectionName?: string
  }
  items: Array<{
    id: number
    description: string
    amount: number
  }>
}

export interface FeeType {
  id: number
  name: string
  code: string
  amount: number
  frequency: string
}

export interface FeeGroup {
  id: number
  name: string
  description?: string | null
  feeTypeIds: number[] | string
  classIds?: number[] | string
  totalAmount: number
  createdAt: string
  feeTypes?: FeeType[]
  classes?: Array<{ id: number; name: string }>
}

export interface VoucherHead {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  description?: string | null
  active?: boolean
}

export interface OfficeTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  voucherHeadId?: number | null
  voucherHeadName: string
  amount: number
  originalAmount?: number | null
  paymentMethod: string
  transactionDate: string
  referenceNo?: string | null
  voucherNo?: string
  description?: string | null
  status?: 'POSTED' | 'AMENDED' | 'VOIDED' | string
  amendmentNote?: string | null
  voidReason?: string | null
  voidedAt?: string | null
  amendedAt?: string | null
  createdAt?: string
}

export interface SchoolBank {
  id: number
  bankName: string
  accountName: string
  accountNumber: string
  branchName?: string | null
  sortCode?: string | null
  swiftCode?: string | null
  isActive: boolean
}

export interface BatchPreviewStudent {
  id: number
  studentName: string
  firstName: string
  lastName: string
  registerNo: string
  gender: string
  sectionId: number | null
  sectionName: string
  alreadyInvoiced: boolean
  existingInvoiceId: number | null
  existingInvoiceNo: string | null
  existingStatus: string | null
  existingTotal: number | null
  existingBalance: number | null
}

export interface BatchPreviewData {
  className: string
  sectionName: string
  totalEnrolled: number
  alreadyInvoicedCount: number
  unInvoicedCount: number
  totalPerStudent: number
  projectedTotal: number
  feeTypes: FeeType[]
  students: BatchPreviewStudent[]
}

export function FinancesDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'bulk-collections' | 'feetypes' | 'allocation' | 'reports' | 'office-finance'
  >('overview')

  // Core Data
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])

  // Office & Bank Data
  const [voucherHeads, setVoucherHeads] = useState<VoucherHead[]>([])
  const [officeTxs, setOfficeTxs] = useState<OfficeTransaction[]>([])
  const [schoolBank, setSchoolBank] = useState<SchoolBank | null>(null)
  const [reportsData, setReportsData] = useState<any>(null)

  // Loading & Filter States
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null)
  const [isExportingBatchPdf, setIsExportingBatchPdf] = useState(false)

  // Batch Invoice Generation Modal & Preview State
  const [showBatchInvoiceModal, setShowBatchInvoiceModal] = useState(false)
  const [batchClassId, setBatchClassId] = useState<string>('')
  const [batchSectionId, setBatchSectionId] = useState<string>('')
  const [batchTermLabel, setBatchTermLabel] = useState('First Term')
  const [batchDueDate, setBatchDueDate] = useState('')
  const [batchSelectedFeeTypeIds, setBatchSelectedFeeTypeIds] = useState<number[]>([])
  const [batchSelectedStudentIds, setBatchSelectedStudentIds] = useState<number[]>([])
  const [batchOverwrite, setBatchOverwrite] = useState(false)
  const [batchPreview, setBatchPreview] = useState<BatchPreviewData | null>(null)
  const [loadingBatchPreview, setLoadingBatchPreview] = useState(false)
  const [isGeneratingBatchInvoices, setIsGeneratingBatchInvoices] = useState(false)

  // Other Modals & Forms
  const [showFeeGroupModal, setShowFeeGroupModal] = useState(false)
  const [feeGroupForm, setFeeGroupForm] = useState({
    name: '',
    description: '',
    selectedFeeTypeIds: [] as number[],
    selectedClassIds: [] as number[],
  })
  const [showFeeTypeModal, setShowFeeTypeModal] = useState(false)
  const [feeTypeRows, setFeeTypeRows] = useState([{ name: '', code: '', amount: '', frequency: 'per_term' }])
  const [savingFeeTypes, setSavingFeeTypes] = useState(false)
  const [allocatingGroup, setAllocatingGroup] = useState<FeeGroup | null>(null)
  const [allocateClassIds, setAllocateClassIds] = useState<number[]>([])
  const [savingAllocation, setSavingAllocation] = useState(false)

  const [showOfficeTxModal, setShowOfficeTxModal] = useState(false)
  const [officeTxForm, setOfficeTxForm] = useState({
    id: null as number | null,
    type: 'EXPENSE',
    voucherHeadId: '',
    voucherHeadName: 'School Supplies',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNo: '',
    description: '',
    transactionDate: '',
    amendmentNote: '',
  })
  const [voucherSearch, setVoucherSearch] = useState('')
  const [voucherTypeFilter, setVoucherTypeFilter] = useState('ALL')
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('LIVE')
  const [headSearch, setHeadSearch] = useState('')
  const [editingVoucherHeadId, setEditingVoucherHeadId] = useState<number | null>(null)
  const [voidingTx, setVoidingTx] = useState<OfficeTransaction | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [savingVoucher, setSavingVoucher] = useState(false)

  const [showVoucherHeadModal, setShowVoucherHeadModal] = useState(false)
  const [voucherHeadForm, setVoucherHeadForm] = useState({
    name: '',
    type: 'EXPENSE',
    description: ''
  })

  const [showSchoolBankModal, setShowSchoolBankModal] = useState(false)
  const [schoolBankForm, setSchoolBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    sortCode: '',
    swiftCode: ''
  })

  // Payment Recording Modal
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Bank Transfer')
  const [payReference, setPayReference] = useState('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [ovRes, invRes, ftRes, fgRes, clsRes, asgRes, vhRes, txRes, sbRes, repRes] = await Promise.all([
        apiSlice.get<{ success: boolean; data: OverviewData }>(endpoints.admin.financesOverview).catch(() => null),
        apiSlice.get<{ success: boolean; data: Invoice[] }>(endpoints.admin.invoices()).catch(() => null),
        apiSlice.get<{ success: boolean; data: FeeType[] }>(endpoints.admin.feeTypes).catch(() => null),
        apiSlice.get<{ success: boolean; data: FeeGroup[] }>(endpoints.admin.feeGroups).catch(() => null),
        apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.admin.classesSections).catch(() => null),
        apiSlice.get<{ success: boolean; data: any[] }>(endpoints.admin.feeAssignments).catch(() => null),
        apiSlice.get<{ success: boolean; data: VoucherHead[] }>(`${endpoints.admin.voucherHeads}?includeArchived=1`).catch(() => null),
        apiSlice.get<{ success: boolean; data: OfficeTransaction[] }>(`${endpoints.admin.officeTransactions}?includeVoided=1`).catch(() => null),
        apiSlice.get<{ success: boolean; data: SchoolBank }>(endpoints.admin.schoolBank).catch(() => null),
        apiSlice.get<{ success: boolean; data: any }>(endpoints.admin.financesCollectionsReport).catch(() => null)
      ])

      if (ovRes && ovRes.success) setOverview(ovRes.data)
      if (invRes && invRes.success) setInvoices(invRes.data || [])
      if (ftRes && ftRes.success) setFeeTypes(ftRes.data || [])
      if (fgRes && fgRes.success) setFeeGroups(fgRes.data || [])
      if (asgRes && asgRes.success) setAssignments(asgRes.data || [])
      if (clsRes && clsRes.success) {
        setClasses(clsRes.classes || [])
        if (clsRes.classes?.length > 0) {
          const firstClass = clsRes.classes[0]
          setBatchClassId(String(firstClass.id))
          if (firstClass.sections?.length > 0) {
            setBatchSectionId(String(firstClass.sections[0].id))
          }
        }
      }
      if (vhRes && vhRes.success) setVoucherHeads(vhRes.data || [])
      if (txRes && txRes.success) setOfficeTxs(txRes.data || [])
      if (sbRes && sbRes.success && sbRes.data) {
        setSchoolBank(sbRes.data)
        setSchoolBankForm({
          bankName: sbRes.data.bankName || '',
          accountName: sbRes.data.accountName || '',
          accountNumber: sbRes.data.accountNumber || '',
          branchName: sbRes.data.branchName || '',
          sortCode: sbRes.data.sortCode || '',
          swiftCode: sbRes.data.swiftCode || ''
        })
      }
      if (repRes && repRes.success) setReportsData(repRes)
    } catch (e) {
      console.error('Error fetching finance initial data:', e)
    } finally {
      setLoading(false)
    }
  }

  // Load Invoices with Filter
  const fetchFilteredInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (classFilter) params.append('classId', classFilter)
      if (sectionFilter) params.append('sectionId', sectionFilter)
      if (searchQuery) params.append('search', searchQuery)

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await apiSlice.get<{ success: boolean; data: Invoice[] }>(endpoints.admin.invoices(queryString))
      if (res.success) {
        setInvoices(res.data || [])
      }
    } catch (err: any) {
      console.error('Failed to filter invoices:', err)
    }
  }

  useEffect(() => {
    fetchFilteredInvoices()
  }, [statusFilter, classFilter, sectionFilter, searchQuery])

  // Fetch Batch Preview when Class, Section, or Term changes in modal
  const fetchBatchPreview = async (cId: string, sId: string, term: string, feeIds: number[]) => {
    if (!cId) {
      setBatchPreview(null)
      return
    }
    setLoadingBatchPreview(true)
    try {
      const params = new URLSearchParams()
      params.append('classId', cId)
      if (sId) params.append('sectionId', sId)
      if (term) params.append('termLabel', term)
      if (feeIds.length > 0) params.append('feeTypeIds', feeIds.join(','))

      const res = await apiSlice.get<BatchPreviewData & { success: boolean }>(
        endpoints.admin.batchInvoicesPreview(`?${params.toString()}`)
      )
      if (res.success) {
        setBatchPreview(res)
        // Select all eligible students by default
        const eligible = res.students.filter(s => !s.alreadyInvoiced || batchOverwrite).map(s => s.id)
        setBatchSelectedStudentIds(eligible.length > 0 ? eligible : res.students.map(s => s.id))
        if (feeIds.length === 0 && res.feeTypes?.length > 0) {
          setBatchSelectedFeeTypeIds(res.feeTypes.map(ft => ft.id))
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to preview classroom roster.')
    } finally {
      setLoadingBatchPreview(false)
    }
  }

  // Handle Class change in Batch Modal
  const handleBatchClassChange = (cId: string) => {
    setBatchClassId(cId)
    const cls = classes.find(c => String(c.id) === cId)
    const sId = cls?.sections?.length > 0 ? String(cls.sections[0].id) : ''
    setBatchSectionId(sId)
    fetchBatchPreview(cId, sId, batchTermLabel, batchSelectedFeeTypeIds)
  }

  // Handle Section change in Batch Modal
  const handleBatchSectionChange = (sId: string) => {
    setBatchSectionId(sId)
    fetchBatchPreview(batchClassId, sId, batchTermLabel, batchSelectedFeeTypeIds)
  }

  // Handle Term change in Batch Modal
  const handleBatchTermChange = (term: string) => {
    setBatchTermLabel(term)
    fetchBatchPreview(batchClassId, batchSectionId, term, batchSelectedFeeTypeIds)
  }

  // Handle Generate Batch Invoices
  const handleGenerateBatchInvoices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchClassId) {
      toast.error('Please select a target Classroom.')
      return
    }
    if (batchSelectedFeeTypeIds.length === 0) {
      toast.error('Please select at least one Fee Type component.')
      return
    }
    if (batchSelectedStudentIds.length === 0) {
      toast.error('Please select at least one student from the roster.')
      return
    }

    setIsGeneratingBatchInvoices(true)
    toast.info('Generating batch fee invoices per class section…')

    try {
      const res = await apiSlice.post<{
        success: boolean
        message: string
        createdCount: number
        skippedCount: number
        totalInvoiced: number
      }>(endpoints.admin.batchInvoicesGenerate, {
        classId: parseInt(batchClassId, 10),
        sectionId: batchSectionId ? parseInt(batchSectionId, 10) : null,
        termLabel: batchTermLabel,
        dueDate: batchDueDate || null,
        feeTypeIds: batchSelectedFeeTypeIds,
        studentIds: batchSelectedStudentIds,
        overwriteExisting: batchOverwrite
      })

      if (res.success) {
        toast.success(res.message || 'Batch fee invoices generated successfully!')
        setShowBatchInvoiceModal(false)
        fetchInitialData()
        fetchFilteredInvoices()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate batch fee invoices.')
    } finally {
      setIsGeneratingBatchInvoices(false)
    }
  }

  // 1-Click Single Invoice PDF Download
  const handleDownloadSingleInvoicePdf = async (invoice: Invoice) => {
    setDownloadingInvoiceId(invoice.id)
    toast.info(`Generating official PDF invoice #${invoice.invoiceNo}…`)

    try {
      const safeInvoiceNo = invoice.invoiceNo.replace(/[\/\\]/g, '_')
      await apiSlice.download(
        endpoints.admin.downloadInvoicePdf(invoice.id),
        `Invoice_${safeInvoiceNo}.pdf`
      )
      toast.success(`Invoice #${invoice.invoiceNo} downloaded!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to download invoice PDF.')
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  // 1-Click Batch Class Section Invoices PDF Download
  const handleDownloadBatchInvoicesPdf = async (cId?: string, sId?: string, term?: string) => {
    const targetClassId = cId || batchClassId || classFilter
    const targetSectionId = sId || batchSectionId || sectionFilter
    const targetTerm = term || batchTermLabel

    if (!targetClassId) {
      toast.error('Please select a Classroom to export batch invoices.')
      return
    }

    setIsExportingBatchPdf(true)
    const cls = classes.find(c => String(c.id) === String(targetClassId))
    const sec = cls?.sections?.find((s: any) => String(s.id) === String(targetSectionId))
    const clsName = cls?.name || 'Class'
    const secName = sec?.name || ''

    toast.info(`Compiling Batch PDF Invoices for ${clsName} ${secName ? `(${secName})` : ''}…`)

    try {
      const params = new URLSearchParams()
      params.append('classId', targetClassId)
      if (targetSectionId) params.append('sectionId', targetSectionId)
      if (targetTerm) params.append('termLabel', targetTerm)

      const safeCls = clsName.replace(/\s+/g, '_')
      const safeSec = secName ? `_${secName.replace(/\s+/g, '_')}` : ''

      await apiSlice.download(
        endpoints.admin.downloadBatchInvoicesPdf(`?${params.toString()}`),
        `Batch_Invoices_${safeCls}${safeSec}.pdf`
      )
      toast.success(`Batch invoices PDF compiled successfully for ${clsName}!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to download batch invoices PDF.')
    } finally {
      setIsExportingBatchPdf(false)
    }
  }

  const handleSendParentReminder = async (invoiceId: number) => {
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.sendParentReminder, { invoiceId })
      if (res.success) {
        toast.success(res.message || 'Parent reminder notification sent.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send fee reminder.')
    }
  }

  const handleCreateFeeGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeGroupForm.name) return
    if (feeGroupForm.selectedFeeTypeIds.length === 0) {
      toast.error('Select at least one fee type for this group.')
      return
    }
    const selectedTypes = feeTypes.filter((ft) => feeGroupForm.selectedFeeTypeIds.includes(ft.id))
    const totalAmount = selectedTypes.reduce((acc, ft) => acc + Number(ft.amount), 0)

    try {
      await apiSlice.post(endpoints.admin.feeGroups, {
        name: feeGroupForm.name,
        description: feeGroupForm.description,
        feeTypeIds: feeGroupForm.selectedFeeTypeIds,
        classIds: feeGroupForm.selectedClassIds,
        totalAmount
      })
      toast.success(
        feeGroupForm.selectedClassIds.length
          ? 'Fee group created and allocated to the selected classes.'
          : 'Fee group created successfully.'
      )
      setShowFeeGroupModal(false)
      setFeeGroupForm({ name: '', description: '', selectedFeeTypeIds: [], selectedClassIds: [] })
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee group.')
    }
  }

  const emptyFeeTypeRow = () => ({ name: '', code: '', amount: '', frequency: 'per_term' })

  const handleCreateFeeTypes = async (e: React.FormEvent) => {
    e.preventDefault()
    const feeTypesPayload = feeTypeRows
      .map((row) => ({
        name: row.name.trim(),
        code: row.code.trim().toUpperCase(),
        amount: row.amount,
        frequency: row.frequency || 'per_term',
      }))
      .filter((row) => row.name && row.code && row.amount !== '')

    if (!feeTypesPayload.length) {
      toast.error('Add at least one fee type with name, code, and amount.')
      return
    }

    setSavingFeeTypes(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string; created?: any[]; skipped?: any[] }>(
        endpoints.admin.feeTypesBulk,
        { feeTypes: feeTypesPayload }
      )
      toast.success(res.message || 'Fee types saved.')
      if (res.skipped?.length) {
        toast.warning(`${res.skipped.length} row(s) skipped (duplicate code or missing fields).`)
      }
      setShowFeeTypeModal(false)
      setFeeTypeRows([emptyFeeTypeRow()])
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee types.')
    } finally {
      setSavingFeeTypes(false)
    }
  }

  const groupTypeIds = (group: FeeGroup): number[] =>
    Array.isArray(group.feeTypeIds)
      ? group.feeTypeIds
      : String(group.feeTypeIds || '[]')
          .replace(/[\[\]\s]/g, '')
          .split(',')
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)

  const groupClassIds = (group: FeeGroup): number[] => {
    if (Array.isArray(group.classIds)) return group.classIds
    if (Array.isArray(group.classes)) return group.classes.map((cls) => cls.id)
    return String(group.classIds || '[]')
      .replace(/[\[\]\s]/g, '')
      .split(',')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  }

  const openAllocateModal = (group: FeeGroup) => {
    setAllocatingGroup(group)
    setAllocateClassIds(groupClassIds(group))
  }

  const handleAllocateFeeGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocatingGroup) return
    setSavingAllocation(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.feeGroupAllocate(allocatingGroup.id),
        { classIds: allocateClassIds, feeTypeIds: groupTypeIds(allocatingGroup) }
      )
      toast.success(res.message || 'Fee group allocated to classes.')
      setAllocatingGroup(null)
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate fee group.')
    } finally {
      setSavingAllocation(false)
    }
  }

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payInvoice || !payAmount) return
    try {
      await apiSlice.post(endpoints.admin.bulkPaymentsPost, {
        payments: [
          {
            invoiceId: payInvoice.id,
            amountPaid: parseFloat(payAmount),
            paymentMethod: payMethod,
            reference: payReference
          }
        ]
      })
      toast.success(`Payment receipt logged for Invoice #${payInvoice.invoiceNo}.`)
      setPayInvoice(null)
      fetchInitialData()
      fetchFilteredInvoices()
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment.')
    }
  }

  const emptyOfficeTxForm = () => ({
    id: null as number | null,
    type: 'EXPENSE',
    voucherHeadId: '',
    voucherHeadName: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNo: '',
    description: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    amendmentNote: '',
  })

  const openNewVoucher = () => {
    const defaults = emptyOfficeTxForm()
    const firstHead = voucherHeads.find((head) => head.active !== false && head.type === 'EXPENSE') || voucherHeads.find((head) => head.active !== false)
    setOfficeTxForm({
      ...defaults,
      voucherHeadId: firstHead ? String(firstHead.id) : '',
      voucherHeadName: firstHead?.name || '',
    })
    setShowOfficeTxModal(true)
  }

  const openEditVoucher = (tx: OfficeTransaction) => {
    if (tx.status === 'VOIDED') {
      toast.error('Voided vouchers are retained for audit and cannot be edited.')
      return
    }
    setOfficeTxForm({
      id: tx.id,
      type: tx.type,
      voucherHeadId: tx.voucherHeadId ? String(tx.voucherHeadId) : '',
      voucherHeadName: tx.voucherHeadName || '',
      amount: String(tx.amount ?? ''),
      paymentMethod: tx.paymentMethod || 'Bank Transfer',
      referenceNo: tx.referenceNo || '',
      description: tx.description || '',
      transactionDate: tx.transactionDate ? new Date(tx.transactionDate).toISOString().slice(0, 10) : '',
      amendmentNote: '',
    })
    setShowOfficeTxModal(true)
  }

  const handleSaveOfficeTx = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!officeTxForm.amount) return
    const selectedHead = voucherHeads.find((head) => String(head.id) === String(officeTxForm.voucherHeadId))
    const payload = {
      type: officeTxForm.type,
      voucherHeadId: officeTxForm.voucherHeadId || selectedHead?.id || null,
      voucherHeadName: selectedHead?.name || officeTxForm.voucherHeadName,
      amount: officeTxForm.amount,
      paymentMethod: officeTxForm.paymentMethod,
      referenceNo: officeTxForm.referenceNo,
      description: officeTxForm.description,
      transactionDate: officeTxForm.transactionDate,
      amendmentNote: officeTxForm.amendmentNote,
    }
    setSavingVoucher(true)
    try {
      if (officeTxForm.id) {
        await apiSlice.put(endpoints.admin.officeTransactionItem(officeTxForm.id), payload)
        toast.success('Voucher corrected. The original record is retained.')
      } else {
        await apiSlice.post(endpoints.admin.officeTransactions, payload)
        toast.success('Voucher recorded and retained in the register.')
      }
      setShowOfficeTxModal(false)
      setOfficeTxForm(emptyOfficeTxForm())
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save voucher.')
    } finally {
      setSavingVoucher(false)
    }
  }

  const handleVoidVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voidingTx) return
    if (!voidReason.trim()) {
      toast.error('A void reason is required so the record can be retained.')
      return
    }
    try {
      await apiSlice.post(endpoints.admin.officeTransactionVoid(voidingTx.id), { voidReason: voidReason.trim() })
      toast.success('Voucher voided and retained for audit.')
      setVoidingTx(null)
      setVoidReason('')
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to void voucher.')
    }
  }

  const handleSaveVoucherHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherHeadForm.name) return
    try {
      if (editingVoucherHeadId) {
        await apiSlice.put(endpoints.admin.voucherHeadItem(editingVoucherHeadId), voucherHeadForm)
        toast.success('Voucher head updated.')
      } else {
        await apiSlice.post(endpoints.admin.voucherHeads, voucherHeadForm)
        toast.success('Voucher head created.')
      }
      setShowVoucherHeadModal(false)
      setEditingVoucherHeadId(null)
      setVoucherHeadForm({ name: '', type: 'EXPENSE', description: '' })
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save voucher head.')
    }
  }

  const handleArchiveVoucherHead = async (head: VoucherHead) => {
    if (!confirm(`Archive “${head.name}”? Existing vouchers stay on the register.`)) return
    try {
      await apiSlice.post(endpoints.admin.voucherHeadArchive(head.id), {})
      toast.success('Voucher head archived. Historical vouchers are retained.')
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive voucher head.')
    }
  }

  const filteredVouchers = useMemo(() => {
    const q = voucherSearch.trim().toLowerCase()
    return officeTxs.filter((tx) => {
      const status = tx.status || 'POSTED'
      if (voucherTypeFilter !== 'ALL' && tx.type !== voucherTypeFilter) return false
      if (voucherStatusFilter === 'LIVE' && status === 'VOIDED') return false
      if (voucherStatusFilter !== 'LIVE' && voucherStatusFilter !== 'ALL' && status !== voucherStatusFilter) return false
      if (!q) return true
      const voucherNo = (tx.voucherNo || tx.referenceNo || `VCH-${tx.id}`).toLowerCase()
      return [voucherNo, tx.voucherHeadName, tx.description, tx.paymentMethod, tx.referenceNo]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [officeTxs, voucherSearch, voucherTypeFilter, voucherStatusFilter])

  const filteredHeads = useMemo(() => {
    const q = headSearch.trim().toLowerCase()
    if (!q) return voucherHeads
    return voucherHeads.filter((head) =>
      [head.name, head.description, head.type].join(' ').toLowerCase().includes(q)
    )
  }, [voucherHeads, headSearch])

  const activeVoucherHeads = voucherHeads.filter((head) => head.active !== false)

  const handleSaveSchoolBank = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.schoolBank, schoolBankForm)
      toast.success('School bank details updated successfully.')
      setShowSchoolBankModal(false)
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save school bank details.')
    }
  }

  // Active class in modal for section list
  const selectedModalClass = classes.find(c => String(c.id) === String(batchClassId))
  const modalSections = selectedModalClass?.sections || []

  // Active class in table filter for section list
  const selectedFilterClass = classes.find(c => String(c.id) === String(classFilter))
  const filterSections = selectedFilterClass?.sections || []

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-50/70 rounded-full blur-3xl opacity-70" />
          <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-blue-50/50 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Batch Invoicing Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                1-Click Multi-Page PDF
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={24} /> School Bursary & Fee Invoicing Desk
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Automated batch fee invoice generation per class section, 1-Click single and classroom PDF invoices, collection reports, and bank transfers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowBatchInvoiceModal(true)
                if (batchClassId) {
                  fetchBatchPreview(batchClassId, batchSectionId, batchTermLabel, batchSelectedFeeTypeIds)
                }
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Batch Generate Class Invoices
            </button>
            <button
              onClick={() => setShowSchoolBankModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Landmark size={16} /> School Bank Setup
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ₦{Number(overview?.summary?.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-emerald-800">Total Fees Collected</div>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ₦{Number(overview?.summary?.totalOutstanding || 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-rose-800">Outstanding Fee Balances</div>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {Number(overview?.summary?.collectionRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs font-medium text-indigo-800">Collection Recovery Rate</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {schoolBank ? `${schoolBank.bankName} (${schoolBank.accountNumber})` : 'Not Configured'}
            </div>
            <div className="text-xs font-medium text-blue-800">Official School Bank</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={18} /> Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} /> Invoices & Batch Class Dues ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('feetypes')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'feetypes' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={18} /> Fee Types & Fee Groups ({feeTypes.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'reports' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChart size={18} /> Collection Reports
        </button>
        <button
          onClick={() => setActiveTab('office-finance')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'office-finance' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} /> Office Transactions & Vouchers
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <IncomeVsExpensesChart
                totalIncome={Number(overview?.summary?.totalRevenue || 0)}
                totalExpenses={officeTxs.filter(t => t.type === 'EXPENSE' && t.status !== 'VOIDED').reduce((acc, t) => acc + Number(t.amount || 0), 0)}
                feeIncome={Number(overview?.summary?.totalRevenue || 0)}
                netSurplus={Number(overview?.summary?.totalRevenue || 0) - officeTxs.filter(t => t.type === 'EXPENSE' && t.status !== 'VOIDED').reduce((acc, t) => acc + Number(t.amount || 0), 0)}
              />
            </div>

            <div className="space-y-4">
              <AnnualFeeSummaryCard
                totalInvoiced={Number(overview?.summary?.totalInvoiced || 0)}
                totalCollected={Number(overview?.summary?.totalRevenue || 0)}
                totalOutstanding={Number(overview?.summary?.totalOutstanding || 0)}
                collectionRate={overview?.summary?.collectionRate || 0}
                sessionName="2026/2027 Academic Session"
              />
            </div>
          </div>

          {/* Top Outstanding Balances Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="text-rose-600" size={20} /> Top Outstanding Student Accounts
              </h3>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Invoices Ledger <ChevronRight size={14} />
              </button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Total Billed</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview?.outstandingStudents?.map((st) => (
                  <TableRow key={st.invoiceId}>
                    <TableCell className="font-mono font-bold text-slate-900">{st.invoiceNo}</TableCell>
                    <TableCell className="font-bold text-slate-800">{st.studentName}</TableCell>
                    <TableCell className="font-mono text-slate-500">{st.registerNo}</TableCell>
                    <TableCell className="font-bold">₦{Number(st.total).toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">₦{Number(st.paid).toLocaleString()}</TableCell>
                    <TableCell className="text-rose-600 font-bold">₦{Number(st.balance).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleSendParentReminder(st.invoiceId)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Bell size={12} /> Send Reminder
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES & BATCH DUES POSTING */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Action & Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Classroom Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Class:</span>
                <select
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value)
                    setSectionFilter('')
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              {filterSections.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Section:</span>
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                  >
                    <option value="">All Streams</option>
                    {filterSections.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">All Invoices</option>
                  <option value="unpaid">Unpaid Only</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Paid in Full</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {classFilter && (
                <button
                  onClick={() => handleDownloadBatchInvoicesPdf(classFilter, sectionFilter)}
                  disabled={isExportingBatchPdf || invoices.length === 0}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isExportingBatchPdf ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  Batch Print Class (PDF)
                </button>
              )}
              <button
                onClick={() => {
                  setShowBatchInvoiceModal(true)
                  if (batchClassId) {
                    fetchBatchPreview(batchClassId, batchSectionId, batchTermLabel, batchSelectedFeeTypeIds)
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={16} /> Batch Generate Class Invoices
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class & Stream</th>
                    <th className="p-4">Term</th>
                    <th className="p-4">Total Billed</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        No invoice records matching this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                        <td className="p-4 font-bold text-slate-800">
                          <div>{inv.student?.firstName} {inv.student?.lastName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{inv.student?.registerNo || 'Pending'}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">
                          {inv.student?.className || 'Classroom'} {inv.student?.sectionName ? `(${inv.student.sectionName})` : ''}
                        </td>
                        <td className="p-4 text-slate-500">{inv.termLabel}</td>
                        <td className="p-4 font-bold">₦{Number(inv.totalAmount).toLocaleString()}</td>
                        <td className="p-4 text-emerald-600 font-bold">₦{Number(inv.paidAmount).toLocaleString()}</td>
                        <td className="p-4 text-rose-600 font-bold">₦{Number(inv.balanceAmount).toLocaleString()}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : inv.status === 'partial'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click PDF Download */}
                            <button
                              onClick={() => handleDownloadSingleInvoicePdf(inv)}
                              disabled={downloadingInvoiceId === inv.id}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              {downloadingInvoiceId === inv.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Download size={12} />
                              )}
                              PDF
                            </button>

                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setPayInvoice(inv)
                                  setPayAmount(String(inv.balanceAmount))
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs"
                              >
                                Record Pay
                              </button>
                            )}

                            <button
                              onClick={() => handleSendParentReminder(inv.id)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                              title="Send Parent Fee Reminder"
                            >
                              <Bell size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE TYPES & FEE GROUPS */}
      {activeTab === 'feetypes' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <div className="text-sm font-bold text-slate-900">Fee Types & Group Bundles</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Create fee types, bundle them into groups, then allocate each group to the classes that should pay it.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFeeTypeRows([emptyFeeTypeRow()])
                  setShowFeeTypeModal(true)
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Create Fee Types
              </button>
              <button
                onClick={() => {
                  setFeeGroupForm({ name: '', description: '', selectedFeeTypeIds: [], selectedClassIds: [] })
                  setShowFeeGroupModal(true)
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Create Fee Group
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fee Types List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Individual Fee Types ({feeTypes.length})</h3>
              <div className="divide-y divide-slate-100">
                {feeTypes.length === 0 ? (
                  <p className="py-6 text-xs text-slate-400 text-center">No fee types yet. Use Create Fee Types to add one or more entries.</p>
                ) : (
                  feeTypes.map((ft) => (
                    <div key={ft.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{ft.name} ({ft.code})</div>
                        <div className="text-[11px] text-slate-400 capitalize">{ft.frequency}</div>
                      </div>
                      <div className="font-bold text-emerald-700 text-sm">₦{Number(ft.amount).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fee Groups List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Group Fee Bundles ({feeGroups.length})</h3>
              <div className="space-y-3">
                {feeGroups.length === 0 ? (
                  <p className="py-6 text-xs text-slate-400 text-center">No fee groups yet. Bundle fee types, then allocate the group to classes.</p>
                ) : (
                  feeGroups.map((fg) => {
                    const bundled = Array.isArray(fg.feeTypes) && fg.feeTypes.length
                      ? fg.feeTypes
                      : feeTypes.filter((ft) => groupTypeIds(fg).includes(ft.id))
                    const allocated = Array.isArray(fg.classes) && fg.classes.length
                      ? fg.classes
                      : classes.filter((cls) => groupClassIds(fg).includes(cls.id))
                    return (
                      <div key={fg.id} className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900">{fg.name}</h4>
                          <span className="font-bold text-indigo-700 text-sm">₦{Number(fg.totalAmount).toLocaleString()}</span>
                        </div>
                        {fg.description && <p className="text-[11px] text-slate-500">{fg.description}</p>}
                        {bundled.length > 0 && (
                          <p className="text-[11px] text-slate-600">
                            Types: {bundled.map((ft) => ft.name).join(', ')}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-600">
                          Classes: {allocated.length ? allocated.map((cls) => cls.name).join(', ') : 'Not allocated yet'}
                        </p>
                        <button
                          type="button"
                          onClick={() => openAllocateModal(fg)}
                          className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Allocate to classes
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COLLECTION REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Fee Collection Breakdown by Fee Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportsData?.feeTypeBreakdown?.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border space-y-1">
                  <div className="text-xs font-semibold text-slate-600">{item.feeType}</div>
                  <div className="text-lg font-black text-emerald-700">₦{Number(item.totalAmount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICE TRANSACTIONS / VOUCHERS */}
      {activeTab === 'office-finance' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <div className="text-sm font-bold text-slate-900">Office vouchers</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every voucher stays on this register. Correct a live record, or void it with a reason — nothing is deleted.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingVoucherHeadId(null)
                  setVoucherHeadForm({ name: '', type: 'EXPENSE', description: '' })
                  setShowVoucherHeadModal(true)
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus size={14} /> New voucher head
              </button>
              <button
                onClick={openNewVoucher}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Record voucher
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-52">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    placeholder="Search voucher no, head, reference, notes…"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <select
                  value={voucherTypeFilter}
                  onChange={(e) => setVoucherTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="ALL">All types</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
                <select
                  value={voucherStatusFilter}
                  onChange={(e) => setVoucherStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="LIVE">Live (posted &amp; amended)</option>
                  <option value="ALL">All retained records</option>
                  <option value="POSTED">Posted</option>
                  <option value="AMENDED">Amended</option>
                  <option value="VOIDED">Voided</option>
                </select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Amount (₦)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-slate-400 py-8">
                        No vouchers match this search. Record a voucher or include voided records.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVouchers.map((tx) => {
                      const status = tx.status || 'POSTED'
                      const voucherNo = tx.voucherNo || tx.referenceNo || `VCH-${String(tx.id).padStart(5, '0')}`
                      return (
                        <TableRow key={tx.id} className={status === 'VOIDED' ? 'opacity-70' : ''}>
                          <TableCell>
                            <div className="font-mono font-bold text-slate-900">{voucherNo}</div>
                            <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                            {tx.description && <div className="text-[10px] text-slate-500 max-w-48 truncate">{tx.description}</div>}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-slate-800">{tx.voucherHeadName}</TableCell>
                          <TableCell className="font-bold">
                            ₦{Number(tx.amount).toLocaleString()}
                            {tx.originalAmount != null && Number(tx.originalAmount) !== Number(tx.amount) && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                Was ₦{Number(tx.originalAmount).toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                status === 'VOIDED'
                                  ? 'bg-slate-200 text-slate-700'
                                  : status === 'AMENDED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {status}
                            </span>
                            {tx.amendmentNote && status === 'AMENDED' && (
                              <div className="text-[10px] text-slate-500 mt-1 max-w-40 truncate" title={tx.amendmentNote}>
                                {tx.amendmentNote}
                              </div>
                            )}
                            {tx.voidReason && status === 'VOIDED' && (
                              <div className="text-[10px] text-slate-500 mt-1 max-w-40 truncate" title={tx.voidReason}>
                                {tx.voidReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {status !== 'VOIDED' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditVoucher(tx)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                                    title="Correct voucher"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoidingTx(tx)
                                      setVoidReason('')
                                    }}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer"
                                    title="Void and retain"
                                  >
                                    <Ban size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Voucher heads</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={headSearch}
                    onChange={(e) => setHeadSearch(e.target.value)}
                    placeholder="Search heads…"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
                {filteredHeads.length === 0 ? (
                  <p className="p-6 text-xs text-slate-400 text-center">No voucher heads yet.</p>
                ) : (
                  filteredHeads.map((head) => (
                    <div key={head.id} className="p-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{head.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{head.type}{head.active === false ? ' · archived' : ''}</div>
                        {head.description && <div className="text-[10px] text-slate-400 mt-0.5">{head.description}</div>}
                      </div>
                      {head.active !== false && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVoucherHeadId(head.id)
                              setVoucherHeadForm({
                                name: head.name,
                                type: head.type,
                                description: head.description || '',
                              })
                              setShowVoucherHeadModal(true)
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                            title="Edit head"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveVoucherHead(head)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer"
                            title="Archive head"
                          >
                            <Ban size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: BATCH FEE INVOICE GENERATOR PER CLASS SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showBatchInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  1-Click Automation
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Batch Fee Invoice Generator per Class Section
                </h2>
              </div>
              <button
                onClick={() => setShowBatchInvoiceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateBatchInvoices} className="space-y-4 text-xs font-medium">
              {/* Classroom, Section, Term & Due Date Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Class *</label>
                  <select
                    value={batchClassId}
                    onChange={(e) => handleBatchClassChange(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Section / Stream</label>
                  <select
                    value={batchSectionId}
                    onChange={(e) => handleBatchSectionChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">All Streams in Class</option>
                    {modalSections.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Term *</label>
                  <select
                    value={batchTermLabel}
                    onChange={(e) => handleBatchTermChange(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                    <option value="Annual Session">Annual Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={batchDueDate}
                    onChange={(e) => setBatchDueDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Fee Types Multi-select & Live Sum */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold">Included Fee Type Components *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = feeTypes.map(f => f.id)
                        setBatchSelectedFeeTypeIds(allIds)
                        fetchBatchPreview(batchClassId, batchSectionId, batchTermLabel, allIds)
                      }}
                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchSelectedFeeTypeIds([])
                        fetchBatchPreview(batchClassId, batchSectionId, batchTermLabel, [])
                      }}
                      className="text-[11px] text-slate-500 font-medium hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  {feeTypes.map((ft) => {
                    const isChecked = batchSelectedFeeTypeIds.includes(ft.id)
                    return (
                      <label
                        key={ft.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate text-[11px]">{ft.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">₦{Number(ft.amount).toLocaleString()}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let newIds: number[]
                            if (e.target.checked) {
                              newIds = [...batchSelectedFeeTypeIds, ft.id]
                            } else {
                              newIds = batchSelectedFeeTypeIds.filter((id) => id !== ft.id)
                            }
                            setBatchSelectedFeeTypeIds(newIds)
                            fetchBatchPreview(batchClassId, batchSectionId, batchTermLabel, newIds)
                          }}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer ml-1"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Roster & Billing Preview Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-600" /> Class Section Student Roster & Billing Matrix
                  </h4>
                  {batchPreview && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-semibold">
                        Total Per Pupil: <strong className="text-slate-900 font-mono">₦{batchPreview.totalPerStudent.toLocaleString()}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Projected Total: <strong className="font-mono text-emerald-800">₦{(batchSelectedStudentIds.length * batchPreview.totalPerStudent).toLocaleString()}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {loadingBatchPreview ? (
                  <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                    <Loader2 className="animate-spin text-emerald-600 mx-auto" size={24} />
                    <p className="text-xs text-slate-500 font-semibold">Loading class section student roster…</p>
                  </div>
                ) : !batchPreview || batchPreview.students.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                    <AlertCircle className="mx-auto text-amber-500" size={24} />
                    <p className="text-xs text-slate-600 font-bold">No students enrolled in selected class section.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5 w-8">
                            <input
                              type="checkbox"
                              checked={batchSelectedStudentIds.length === batchPreview.students.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBatchSelectedStudentIds(batchPreview.students.map(s => s.id))
                                } else {
                                  setBatchSelectedStudentIds([])
                                }
                              }}
                              className="accent-emerald-600 rounded cursor-pointer"
                            />
                          </th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5">Reg Number</th>
                          <th className="p-2.5">Stream</th>
                          <th className="p-2.5">Current Term Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {batchPreview.students.map((st) => {
                          const isSelected = batchSelectedStudentIds.includes(st.id)
                          return (
                            <tr key={st.id} className={isSelected ? 'bg-emerald-50/30' : ''}>
                              <td className="p-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBatchSelectedStudentIds([...batchSelectedStudentIds, st.id])
                                    } else {
                                      setBatchSelectedStudentIds(batchSelectedStudentIds.filter(id => id !== st.id))
                                    }
                                  }}
                                  className="accent-emerald-600 rounded cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">{st.studentName}</td>
                              <td className="p-2.5 font-mono text-slate-500">{st.registerNo}</td>
                              <td className="p-2.5 text-slate-600">{st.sectionName}</td>
                              <td className="p-2.5">
                                {st.alreadyInvoiced ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Already Invoiced ({st.existingInvoiceNo})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Ready to Bill
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Overwrite Option */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-900 font-semibold">
                    Overwrite existing invoices for this term if already generated?
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={batchOverwrite}
                  onChange={(e) => setBatchOverwrite(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDownloadBatchInvoicesPdf(batchClassId, batchSectionId, batchTermLabel)}
                  disabled={isExportingBatchPdf}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isExportingBatchPdf ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  1-Click Batch PDF Export
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchInvoiceModal(false)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingBatchInvoices || batchSelectedStudentIds.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition"
                  >
                    {isGeneratingBatchInvoices ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Generate Invoices ({batchSelectedStudentIds.length} Pupils)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT RECEIPT */}
      {payInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Record Fee Payment Receipt</h2>
              <button onClick={() => setPayInvoice(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-emerald-900">Invoice #{payInvoice.invoiceNo}</div>
              <div className="text-slate-600">Student: {payInvoice.student?.firstName} {payInvoice.student?.lastName}</div>
              <div className="text-rose-600 font-bold">Outstanding Balance: ₦{Number(payInvoice.balanceAmount).toLocaleString()}</div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount (₦) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="p-2.5 border rounded-xl">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="POS">POS Terminal</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <input
                  type="text"
                  placeholder="Ref No / Tx Hash"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setPayInvoice(null)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE FEE GROUP */}
      {showFeeGroupModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create Fee Group</h2>
              <button onClick={() => setShowFeeGroupModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateFeeGroup} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Group Name (e.g. Primary School Fees Group) *"
                value={feeGroupForm.name}
                onChange={(e) => setFeeGroupForm({ ...feeGroupForm, name: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />
              <textarea
                rows={2}
                placeholder="Description..."
                value={feeGroupForm.description}
                onChange={(e) => setFeeGroupForm({ ...feeGroupForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Fee Types to Bundle *</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded-xl">
                  {feeTypes.length === 0 ? (
                    <p className="p-2 text-slate-400">Create fee types first, then bundle them here.</p>
                  ) : (
                    feeTypes.map((ft) => {
                      const isChecked = feeGroupForm.selectedFeeTypeIds.includes(ft.id)
                      return (
                        <label key={ft.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                          <span className="font-bold text-slate-800">{ft.name} (₦{Number(ft.amount).toLocaleString()})</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFeeGroupForm({ ...feeGroupForm, selectedFeeTypeIds: [...feeGroupForm.selectedFeeTypeIds, ft.id] })
                              } else {
                                setFeeGroupForm({
                                  ...feeGroupForm,
                                  selectedFeeTypeIds: feeGroupForm.selectedFeeTypeIds.filter((id) => id !== ft.id)
                                })
                              }
                            }}
                            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Allocate this group to classes</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded-xl">
                  {classes.length === 0 ? (
                    <p className="p-2 text-slate-400">No classes found.</p>
                  ) : (
                    classes.map((cls) => {
                      const isChecked = feeGroupForm.selectedClassIds.includes(cls.id)
                      return (
                        <label key={cls.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                          <span className="font-bold text-slate-800">{cls.name}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFeeGroupForm({ ...feeGroupForm, selectedClassIds: [...feeGroupForm.selectedClassIds, cls.id] })
                              } else {
                                setFeeGroupForm({
                                  ...feeGroupForm,
                                  selectedClassIds: feeGroupForm.selectedClassIds.filter((id) => id !== cls.id)
                                })
                              }
                            }}
                            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowFeeGroupModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer">
                  Create Fee Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeeTypeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Fee Types</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Add one or more fee types in a single save. Each row needs a name, unique code, and amount.</p>
              </div>
              <button onClick={() => setShowFeeTypeModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateFeeTypes} className="space-y-3">
              <div className="space-y-2">
                {feeTypeRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Fee name *"
                      value={row.name}
                      onChange={(e) =>
                        setFeeTypeRows((prev) => prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item)))
                      }
                      className="col-span-4 p-2.5 border rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Code *"
                      value={row.code}
                      onChange={(e) =>
                        setFeeTypeRows((prev) => prev.map((item, i) => (i === idx ? { ...item, code: e.target.value } : item)))
                      }
                      className="col-span-2 p-2.5 border rounded-xl text-xs uppercase"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount *"
                      value={row.amount}
                      onChange={(e) =>
                        setFeeTypeRows((prev) => prev.map((item, i) => (i === idx ? { ...item, amount: e.target.value } : item)))
                      }
                      className="col-span-2 p-2.5 border rounded-xl text-xs"
                    />
                    <select
                      value={row.frequency}
                      onChange={(e) =>
                        setFeeTypeRows((prev) => prev.map((item, i) => (i === idx ? { ...item, frequency: e.target.value } : item)))
                      }
                      className="col-span-3 p-2.5 border rounded-xl text-xs"
                    >
                      <option value="per_term">Per term</option>
                      <option value="per_session">Per session</option>
                      <option value="one_off">One off</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setFeeTypeRows((prev) => (prev.length === 1 ? [emptyFeeTypeRow()] : prev.filter((_, i) => i !== idx)))}
                      className="col-span-1 p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer flex items-center justify-center"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFeeTypeRows((prev) => [...prev, emptyFeeTypeRow()])}
                className="px-3 py-2 border border-dashed border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add another fee type
              </button>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowFeeTypeModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeeTypes}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingFeeTypes ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save fee types
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {allocatingGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Allocate {allocatingGroup.name}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Choose the classes that should inherit this group&apos;s fee types.</p>
              </div>
              <button onClick={() => setAllocatingGroup(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAllocateFeeGroup} className="space-y-3 text-xs font-medium">
              <div className="space-y-1 max-h-56 overflow-y-auto border p-2 rounded-xl">
                {classes.map((cls) => {
                  const isChecked = allocateClassIds.includes(cls.id)
                  return (
                    <label key={cls.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <span className="font-bold text-slate-800">{cls.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setAllocateClassIds((prev) =>
                            e.target.checked ? [...prev, cls.id] : prev.filter((id) => id !== cls.id)
                          )
                        }}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </label>
                  )
                })}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setAllocatingGroup(null)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAllocation}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingAllocation ? 'Saving…' : 'Save allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD / CORRECT VOUCHER */}
      {showOfficeTxModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {officeTxForm.id ? 'Correct voucher' : 'Record voucher'}
              </h2>
              <button onClick={() => setShowOfficeTxModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveOfficeTx} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={officeTxForm.type}
                  onChange={(e) => {
                    const nextType = e.target.value
                    const firstHead = activeVoucherHeads.find((head) => head.type === nextType) || activeVoucherHeads[0]
                    setOfficeTxForm({
                      ...officeTxForm,
                      type: nextType,
                      voucherHeadId: firstHead ? String(firstHead.id) : '',
                      voucherHeadName: firstHead?.name || '',
                    })
                  }}
                  className="p-2.5 border rounded-xl"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
                <select
                  value={officeTxForm.voucherHeadId}
                  onChange={(e) => {
                    const head = activeVoucherHeads.find((item) => String(item.id) === e.target.value)
                    setOfficeTxForm({
                      ...officeTxForm,
                      voucherHeadId: e.target.value,
                      voucherHeadName: head?.name || '',
                    })
                  }}
                  className="p-2.5 border rounded-xl"
                >
                  <option value="">Select head</option>
                  {activeVoucherHeads
                    .filter((vh) => vh.type === officeTxForm.type || !vh.type)
                    .map((vh) => (
                      <option key={vh.id} value={vh.id}>
                        {vh.name}
                      </option>
                    ))}
                </select>
              </div>

              <input
                type="number"
                placeholder="Amount (₦) *"
                value={officeTxForm.amount}
                onChange={(e) => setOfficeTxForm({ ...officeTxForm, amount: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl font-bold text-slate-900"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={officeTxForm.paymentMethod}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, paymentMethod: e.target.value })}
                  className="p-2.5 border rounded-xl"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="POS">POS</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <input
                  type="date"
                  value={officeTxForm.transactionDate}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, transactionDate: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <input
                type="text"
                placeholder="Voucher / payment reference"
                value={officeTxForm.referenceNo}
                onChange={(e) => setOfficeTxForm({ ...officeTxForm, referenceNo: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <textarea
                rows={2}
                placeholder="Description / notes..."
                value={officeTxForm.description}
                onChange={(e) => setOfficeTxForm({ ...officeTxForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              {officeTxForm.id && (
                <textarea
                  rows={2}
                  required
                  placeholder="Correction note * (kept on the original record)"
                  value={officeTxForm.amendmentNote}
                  onChange={(e) => setOfficeTxForm({ ...officeTxForm, amendmentNote: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-amber-50"
                />
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowOfficeTxModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVoucher}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {officeTxForm.id ? 'Save correction' : 'Save voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CREATE / EDIT VOUCHER HEAD */}
      {showVoucherHeadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingVoucherHeadId ? 'Edit voucher head' : 'Add voucher head'}
              </h2>
              <button onClick={() => setShowVoucherHeadModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveVoucherHead} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Voucher Head Name (e.g. Utility Bills, Diesel) *"
                value={voucherHeadForm.name}
                onChange={(e) => setVoucherHeadForm({ ...voucherHeadForm, name: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />
              <select
                value={voucherHeadForm.type}
                onChange={(e) => setVoucherHeadForm({ ...voucherHeadForm, type: e.target.value as any })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="EXPENSE">Expense Category</option>
                <option value="INCOME">Income Category</option>
              </select>
              <textarea
                rows={2}
                placeholder="Description..."
                value={voucherHeadForm.description}
                onChange={(e) => setVoucherHeadForm({ ...voucherHeadForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowVoucherHeadModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">
                  {editingVoucherHeadId ? 'Save changes' : 'Save voucher head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {voidingTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Void voucher</h2>
              <button onClick={() => setVoidingTx(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-600">
              {voidingTx.voucherNo || voidingTx.referenceNo || `VCH-${voidingTx.id}`} will stay on the register as voided. It will not count in live totals.
            </p>
            <form onSubmit={handleVoidVoucher} className="space-y-3 text-xs font-medium">
              <textarea
                rows={3}
                required
                placeholder="Reason for voiding *"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 border rounded-xl"
              />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setVoidingTx(null)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer">
                  Void and retain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: SCHOOL BANK SETUP */}
      {showSchoolBankModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark size={20} className="text-blue-600" /> Official School Bank Setup
              </h2>
              <button onClick={() => setShowSchoolBankModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSchoolBank} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zenith Bank / Access Bank"
                  value={schoolBankForm.bankName}
                  onChange={(e) => setSchoolBankForm({ ...schoolBankForm, bankName: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ugbekun Schools Limited"
                  value={schoolBankForm.accountName}
                  onChange={(e) => setSchoolBankForm({ ...schoolBankForm, accountName: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 1012345678"
                  value={schoolBankForm.accountNumber}
                  onChange={(e) => setSchoolBankForm({ ...schoolBankForm, accountNumber: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Branch"
                    value={schoolBankForm.branchName}
                    onChange={(e) => setSchoolBankForm({ ...schoolBankForm, branchName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sort Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 057150013"
                    value={schoolBankForm.sortCode}
                    onChange={(e) => setSchoolBankForm({ ...schoolBankForm, sortCode: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowSchoolBankModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
