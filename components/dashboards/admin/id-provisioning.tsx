'use client'

import { useEffect, useState } from 'react'
import { 
  Award, ShieldAlert, FileText, Download, Trash2, CheckCircle2, AlertCircle, 
  RefreshCw, Users, UserPlus, HelpCircle, Layers, ClipboardList, BookOpen, Plus
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'

interface IdCard {
  id: number
  cardNumber: string
  entityType: 'student' | 'staff'
  name: string
  photo: string | null
  role: string
  status: 'active' | 'revoked'
  issuedAt: string
  expiresAt: string | null
  revokedReason: string | null
}

interface Certificate {
  id: number
  certificateNo: string
  certificateType: string
  title: string
  description: string | null
  issuedAt: string
  student: {
    firstName: string
    lastName: string
    registerNo: string
  }
}

interface ClassOption {
  id: number
  name: string
  sections: Array<{
    section: {
      id: number
      name: string
    }
  }>
}

interface StudentOption {
  id: number
  registerNo: string
  firstName: string
  lastName: string
  className?: string
}

interface StaffOption {
  id: number
  username: string
  roleLabel: string
}

export function IdProvisioning() {
  const [activeTab, setActiveTab] = useState<'cards' | 'certificates' | 'provision'>('cards')
  
  // Lists
  const [cards, setCards] = useState<IdCard[]>([])
  const [certs, setCerts] = useState<Certificate[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cardStatusFilter, setCardStatusFilter] = useState('')
  const [cardTypeFilter, setCardTypeFilter] = useState('')
  const [certTypeFilter, setCertTypeFilter] = useState('')
  
  // Pagination
  const [cardPage, setCardPage] = useState(1)
  const [cardTotalPages, setCardTotalPages] = useState(1)
  const [certPage, setCertPage] = useState(1)
  const [certTotalPages, setCertTotalPages] = useState(1)

  // Options for dropdowns (loaded on demand)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [staff, setStaff] = useState<StaffOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Provisioning form states
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [provisioning, setProvisioning] = useState(false)

  // Certificate issuance form states
  const [isIssuingCert, setIsIssuingCert] = useState(false)
  const [certStudentId, setCertStudentId] = useState('')
  const [certType, setCertType] = useState('completion')
  const [certTitle, setCertTitle] = useState('')
  const [certDescription, setCertDescription] = useState('')

  // Revoke states
  const [revokingCard, setRevokingCard] = useState<IdCard | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [isRevoking, setIsRevoking] = useState(false)

  // Load lists
  const loadCards = async () => {
    setLoadingList(true)
    try {
      const queryParams = `?page=${cardPage}&limit=10&search=${encodeURIComponent(searchQuery)}` 
        + (cardStatusFilter ? `&status=${cardStatusFilter}` : '')
        + (cardTypeFilter ? `&entityType=${cardTypeFilter}` : '')
      
      const res = await apiSlice.get<{ success: boolean; data: IdCard[]; pagination: { totalPages: number } }>(
        endpoints.admin.idCards(queryParams)
      )
      setCards(res.data)
      setCardTotalPages(res.pagination.totalPages || 1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load ID cards ledger.')
    } finally {
      setLoadingList(false)
    }
  }

  const loadCertificates = async () => {
    setLoadingList(true)
    try {
      const queryParams = `?page=${certPage}&limit=10&search=${encodeURIComponent(searchQuery)}`
        + (certTypeFilter ? `&certificateType=${certTypeFilter}` : '')
      
      const res = await apiSlice.get<{ success: boolean; data: Certificate[]; pagination: { totalPages: number } }>(
        endpoints.admin.certificates(queryParams)
      )
      setCerts(res.data)
      setCertTotalPages(res.pagination.totalPages || 1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load certificates ledger.')
    } finally {
      setLoadingList(false)
    }
  }

  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      // Classes & Sections
      const classRes = await apiSlice.get<{ success: boolean; classes: ClassOption[] }>(
        endpoints.admin.classesSections
      )
      setClasses(classRes.classes || [])

      // Students
      const stdRes = await apiSlice.get<{ success: boolean; data: { students: StudentOption[] } }>(
        endpoints.admin.studentsParents
      )
      setStudents(stdRes.data.students || [])

      // Staff (Teachers & Staff)
      const staffRes = await apiSlice.get<{ success: boolean; data: { teachers: any[]; staff: any[] } }>(
        endpoints.admin.teachersStaff
      )
      const mappedTeachers = (staffRes.data.teachers || []).map(t => ({
        id: t.id,
        username: t.name,
        roleLabel: 'Teacher'
      }))
      const mappedStaff = (staffRes.data.staff || []).map(s => ({
        id: s.id,
        username: s.username,
        roleLabel: s.roleLabel || 'Staff'
      }))
      setStaff([...mappedTeachers, ...mappedStaff])
    } catch (err: any) {
      toast.error('Failed to load form options.')
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'cards') {
      loadCards()
    } else if (activeTab === 'certificates') {
      loadCertificates()
    } else if (activeTab === 'provision') {
      loadOptions()
    }
  }, [activeTab, cardPage, certPage, cardStatusFilter, cardTypeFilter, certTypeFilter])

  // Trigger search manually or via enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCardPage(1)
    setCertPage(1)
    if (activeTab === 'cards') loadCards()
    if (activeTab === 'certificates') loadCertificates()
  }

  // Provision Student ID Card
  const handleProvisionStudent = async (studentId: number) => {
    setProvisioning(true)
    try {
      const res = await apiSlice.post(endpoints.admin.provisionStudentIdCard(studentId), {})
      toast.success(res.message || 'ID Card provisioned successfully.')
      setSelectedStudentId('')
    } catch (err: any) {
      toast.error(err.message || 'ID card generation failed.')
    } finally {
      setProvisioning(false)
    }
  }

  // Provision Staff ID Card
  const handleProvisionStaff = async (userId: number) => {
    setProvisioning(true)
    try {
      const res = await apiSlice.post(endpoints.admin.provisionStaffIdCard(userId), {})
      toast.success(res.message || 'ID Card provisioned successfully.')
      setSelectedStaffId('')
    } catch (err: any) {
      toast.error(err.message || 'ID card generation failed.')
    } finally {
      setProvisioning(false)
    }
  }

  // Batch Provision ID Cards
  const handleProvisionBatch = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Please select both class and section.')
      return
    }
    setProvisioning(true)
    try {
      const res = await apiSlice.post(endpoints.admin.provisionBatchIdCard, {
        classId: parseInt(selectedClassId, 10),
        sectionId: parseInt(selectedSectionId, 10)
      })
      toast.success(res.message || 'Batch provisioning completed.')
      setSelectedClassId('')
      setSelectedSectionId('')
    } catch (err: any) {
      toast.error(err.message || 'Batch generation failed.')
    } finally {
      setProvisioning(false)
    }
  }

  // Issue Certificate
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certStudentId || !certType || !certTitle) {
      toast.error('Please fill in all required certificate details.')
      return
    }
    setProvisioning(true)
    try {
      const res = await apiSlice.post(endpoints.admin.issueCertificate, {
        studentId: parseInt(certStudentId, 10),
        certificateType: certType,
        title: certTitle,
        description: certDescription
      })
      toast.success(res.message || 'Certificate issued successfully.')
      setCertStudentId('')
      setCertTitle('')
      setCertDescription('')
      setIsIssuingCert(false)
    } catch (err: any) {
      toast.error(err.message || 'Certificate issuance failed.')
    } finally {
      setProvisioning(false)
    }
  }

  // Revoke ID Card
  const handleRevokeCard = async () => {
    if (!revokingCard) return
    setIsRevoking(true)
    try {
      const res = await apiSlice.put(endpoints.admin.revokeIdCard(revokingCard.id), {
        reason: revokeReason
      })
      toast.success(res.message || 'ID Card has been revoked.')
      setRevokingCard(null)
      setRevokeReason('')
      loadCards()
    } catch (err: any) {
      toast.error(err.message || 'Revocation failed.')
    } finally {
      setIsRevoking(false)
    }
  }

  // Download card/certificate documents
  const downloadCardPdf = (card: IdCard) => {
    toast.info(`Preparing download for card ${card.cardNumber}...`)
    apiSlice.download(
      endpoints.admin.downloadIdCard(card.id),
      `ID_Card_${card.cardNumber.replace(/\//g, '_')}.pdf`
    ).catch(err => toast.error(err.message || 'PDF download failed.'))
  }

  const downloadCertPdf = (cert: Certificate) => {
    toast.info(`Preparing download for certificate ${cert.certificateNo}...`)
    apiSlice.download(
      endpoints.admin.downloadCertificate(cert.id),
      `Certificate_${cert.certificateNo.replace(/\//g, '_')}.pdf`
    ).catch(err => toast.error(err.message || 'PDF download failed.'))
  }

  const selectedClass = classes.find(c => c.id === parseInt(selectedClassId, 10))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-800 p-6 md:p-8 shadow-md overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2.5">
          <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-sm inline-block">
            Administrative Credentials
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Credentials & Verification Desk</h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Generate and manage branch-branded ID cards, academic honors, leaving certificates, and public QR verification logs.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cards' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-emerald-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={14} /> ID Cards
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'certificates' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-emerald-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={14} /> Certificates
        </button>
        <button
          onClick={() => setActiveTab('provision')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'provision' 
              ? 'bg-slate-100 text-slate-800 border-b-2 border-emerald-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus size={14} /> Provisioning
        </button>
      </div>

      {/* SEARCH AND FILTERS FOR TABLES */}
      {activeTab !== 'provision' && (
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <input
            type="text"
            placeholder={`Search by name, card number, or code...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
          />
          
          {activeTab === 'cards' && (
            <>
              <select
                value={cardStatusFilter}
                onChange={(e) => setCardStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
              </select>
              
              <select
                value={cardTypeFilter}
                onChange={(e) => setCardTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </>
          )}

          {activeTab === 'certificates' && (
            <select
              value={certTypeFilter}
              onChange={(e) => setCertTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">All Types</option>
              <option value="completion">Term Completion</option>
              <option value="excellence">Academic Excellence</option>
              <option value="graduation">Graduation</option>
            </select>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
          >
            Search
          </button>
        </form>
      )}

      {/* ID CARDS TAB VIEW */}
      {activeTab === 'cards' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-slate-800">Identity Cards Registry</h3>
            <button 
              onClick={loadCards} 
              className="p-1 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded transition"
            >
              <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingList ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading identity cards...</div>
          ) : cards.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No matching credentials found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card No</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Role/Type</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-semibold text-slate-800 text-xs">{card.cardNumber}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] overflow-hidden border border-slate-200">
                            {card.photo ? (
                              <img src={card.photo} alt={card.name} className="w-full h-full object-cover" />
                            ) : (
                              card.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium">{card.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          card.entityType === 'student' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {card.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(card.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          card.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {card.status === 'active' ? (
                            <>
                              <CheckCircle2 size={10} /> Active
                            </>
                          ) : (
                            <>
                              <ShieldAlert size={10} /> Revoked
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => downloadCardPdf(card)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded transition cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          {card.status === 'active' && (
                            <button
                              onClick={() => setRevokingCard(card)}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition cursor-pointer"
                              title="Revoke Card"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination controls */}
              <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 text-xs">
                <span className="text-slate-500">Page {cardPage} of {cardTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={cardPage === 1}
                    onClick={() => setCardPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={cardPage === cardTotalPages}
                    onClick={() => setCardPage(prev => Math.min(cardTotalPages, prev + 1))}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CERTIFICATES TAB VIEW */}
      {activeTab === 'certificates' && (
        <div className="space-y-4 animate-scale-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Student Honors & Leaving Certificates</h3>
              <p className="text-xs text-slate-500 mt-0.5">Issue graduation sheets, terms completion, and academic excellence awards.</p>
            </div>
            <button
              onClick={() => {
                loadOptions()
                setIsIssuingCert(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition"
            >
              <Plus size={14} /> Issue Certificate
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loadingList ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading certificates ledger...</div>
            ) : certs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No certificates issued yet.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cert No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Awarded Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certs.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-semibold text-slate-800 text-xs">{cert.certificateNo}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {cert.student.firstName} {cert.student.lastName} ({cert.student.registerNo})
                        </TableCell>
                        <TableCell className="text-xs capitalize font-semibold text-slate-600">
                          {cert.certificateType.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{cert.title}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => downloadCertPdf(cert)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded transition cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 text-xs">
                  <span className="text-slate-500">Page {certPage} of {certTotalPages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={certPage === 1}
                      onClick={() => setCertPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={certPage === certTotalPages}
                      onClick={() => setCertPage(prev => Math.min(certTotalPages, prev + 1))}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PROVISIONING TAB VIEW */}
      {activeTab === 'provision' && (
        <div className="grid md:grid-cols-2 gap-6 animate-scale-in">
          {/* Student single card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Student ID Provisioning</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a unique identity card for an individual student. This creates a secure URL and links a QR code to the student's register profile.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 block">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                disabled={loadingOptions}
              >
                <option value="">-- Choose a Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.registerNo} - {s.className || 'Unassigned'})
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedStudentId || provisioning}
                onClick={() => handleProvisionStudent(parseInt(selectedStudentId, 10))}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {provisioning ? 'Provisioning...' : 'Generate Student ID'}
              </button>
            </div>
          </div>

          {/* Staff single card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Staff ID Provisioning</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provision standard cards for teachers, accountants, librarians, or branch receptionist personnel. Matches profile records to active user accounts.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 block">Select Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                disabled={loadingOptions}
              >
                <option value="">-- Choose a Staff Member --</option>
                {staff.map(st => (
                  <option key={`${st.id}-${st.roleLabel}`} value={st.id}>
                    {st.username} ({st.roleLabel})
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedStaffId || provisioning}
                onClick={() => handleProvisionStaff(parseInt(selectedStaffId, 10))}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {provisioning ? 'Provisioning...' : 'Generate Staff ID'}
              </button>
            </div>
          </div>

          {/* Batch student card generation */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Batch ID Provisioning Panel</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate ID cards for an entire classroom at once. Automatically filters for active students in the selected class and section and builds missing cards without duplicates.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Select Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)
                    setSelectedSectionId('')
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Select Section</label>
                <select
                  value={selectedSectionId}
                  disabled={!selectedClassId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white disabled:opacity-50"
                >
                  <option value="">-- Choose Section --</option>
                  {selectedClass?.sections.map(s => (
                    <option key={s.section.id} value={s.section.id}>{s.section.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              disabled={!selectedClassId || !selectedSectionId || provisioning}
              onClick={handleProvisionBatch}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {provisioning ? 'Running Batch Provisioning...' : 'Provision Batch Student IDs'}
            </button>
          </div>
        </div>
      )}

      {/* ISSUE CERTIFICATE MODAL FORM */}
      {isIssuingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleIssueCertificate} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Issue Student Certificate</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Select Student *</label>
                <select
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  <option value="">-- Choose a Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registerNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Certificate Type *</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                >
                  <option value="completion">Term Completion</option>
                  <option value="excellence">Academic Excellence</option>
                  <option value="graduation">Graduation/Leaving Certificate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Certificate Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Excellence Award - Math"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Citation / Description</label>
                <textarea
                  rows={3}
                  placeholder="Add details about the award, completion terms, or remarks..."
                  value={certDescription}
                  onChange={(e) => setCertDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsIssuingCert(false)}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={provisioning}
                className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition"
              >
                {provisioning ? 'Issuing...' : 'Issue Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVOCATION REASON MODAL */}
      {revokingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 pb-2 border-b border-red-100">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-black text-slate-900">Revoke Credentials</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Confirm revocation of card <strong>{revokingCard.cardNumber}</strong> belonging to <strong>{revokingCard.name}</strong>. This immediately flags the card as revoked in the registry.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-600 block">Revocation Reason</label>
              <input
                type="text"
                placeholder="e.g. Student transferred, lost card, etc."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRevokingCard(null)
                  setRevokeReason('')
                }}
                disabled={isRevoking}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeCard}
                disabled={isRevoking}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition"
              >
                {isRevoking ? 'Revoking...' : 'Revoke Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
