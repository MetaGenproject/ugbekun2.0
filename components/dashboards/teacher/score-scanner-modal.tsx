'use client'

import React, { useState, useRef } from 'react'
import { 
  X, 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Save, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { endpoints } from '@/lib/apiSlice'

interface Student {
  id: number
  firstName: string
  lastName: string
  registerNo: string
}

interface ScanRow {
  rowId: number
  inputIdentifier: string
  inputName: string
  matchedStudentId: number | null
  matchedStudentName: string
  matchedRegNo: string
  matchConfidence: number
  extractedMark: number | null
  hasAnomaly: boolean
  anomalyReason: string | null
  lowConfidence: boolean
}

interface ScoreScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onCommitSuccess: () => void
  classId: number
  sectionId: number
  examId: number
  subjectId: number
  students: Student[]
}

export function ScoreScannerModal({
  isOpen,
  onClose,
  onCommitSuccess,
  classId,
  sectionId,
  examId,
  subjectId,
  students
}: ScoreScannerModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [scanId, setScanId] = useState<number | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [gridData, setGridData] = useState<ScanRow[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Image zoom scale state
  const [zoomScale, setZoomScale] = useState(1)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile)
      } else {
        setErrorMessage('Unsupported file format. Please upload an image.')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleScanSubmit = async () => {
    if (!file) return

    setIsProcessing(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('classId', String(classId))
    formData.append('sectionId', String(sectionId))
    formData.append('examId', String(examId))
    formData.append('subjectId', String(subjectId))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(endpoints.teacher.scanScoreSheet, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setScanId(data.scanId)
        setFileUrl(data.fileUrl)
        setGridData(data.parsedData)
      } else {
        setErrorMessage(data.message || 'Failed to scan the document.')
      }
    } catch (error) {
      console.error('Scan API error:', error)
      setErrorMessage('Network error occurred during document parsing.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Update cell fields in the grid
  const handleCellChange = (rowId: number, field: keyof ScanRow, value: any) => {
    setGridData(prev => prev.map(row => {
      if (row.rowId === rowId) {
        const updatedRow = { ...row, [field]: value }

        // Recalculate match details if student is updated
        if (field === 'matchedStudentId') {
          const studentIdNum = value ? Number(value) : null
          const student = students.find(s => s.id === studentIdNum)
          
          updatedRow.matchedStudentId = studentIdNum
          updatedRow.matchedStudentName = student ? `${student.lastName}, ${student.firstName}` : 'Unmatched'
          updatedRow.matchedRegNo = student ? student.registerNo : 'N/A'
          updatedRow.matchConfidence = student ? 1.0 : 0
          updatedRow.lowConfidence = false
        }

        // Validate marks bounds inline
        if (field === 'extractedMark') {
          const markVal = value !== '' && value !== null ? parseFloat(value) : null
          updatedRow.extractedMark = markVal
        }

        // Perform validation checks
        let hasAnomaly = false
        let anomalyReason = null

        if (!updatedRow.matchedStudentId) {
          hasAnomaly = true
          anomalyReason = 'Student not found in registry.'
        }

        if (updatedRow.extractedMark !== null && (isNaN(updatedRow.extractedMark) || updatedRow.extractedMark < 0 || updatedRow.extractedMark > 100)) {
          hasAnomaly = true
          anomalyReason = anomalyReason ? anomalyReason + ' Score out of bounds (0-100).' : 'Score out of bounds (0-100).'
        }

        updatedRow.hasAnomaly = hasAnomaly
        updatedRow.anomalyReason = anomalyReason

        return updatedRow
      }
      return row
    }))
  }

  const handleCommit = async () => {
    if (!scanId) return

    // Ensure all critical name mismatches are resolved or excluded
    const unresolvedNames = gridData.some(r => r.hasAnomaly && !r.matchedStudentId)
    if (unresolvedNames) {
      setErrorMessage('Please link all unmatched student rows to valid students in the registry before committing.')
      return
    }

    setIsCommitting(true)
    setErrorMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(endpoints.teacher.commitScanRecord(scanId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verifiedData: gridData })
      })

      const data = await response.json()
      if (data.success) {
        onCommitSuccess()
        onClose()
      } else {
        setErrorMessage(data.message || 'Failed to commit marks to gradebook.')
      }
    } catch (error) {
      console.error('Commit scan error:', error)
      setErrorMessage('Network error occurred during gradebook integration.')
    } finally {
      setIsCommitting(false)
    }
  }

  const resetScanner = () => {
    setFile(null)
    setScanId(null)
    setFileUrl(null)
    setGridData([])
    setErrorMessage(null)
    setZoomScale(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col w-full max-w-7xl h-[90vh] bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">AI / OCR Score Sheets Scanner</h2>
              <p className="text-xs font-semibold text-slate-400">Digitize physical grading sheets using computer vision stagings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {errorMessage && (
            <div className="absolute top-16 left-6 right-6 z-10 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold shadow-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {scanId === null ? (
            /* Upload Workspace */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div 
                className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all ${
                  dragActive ? 'border-violet-500 bg-violet-50/50' : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                  <UploadCloud size={40} className="text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Drag and drop your score sheet photograph or scan here</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Supports PNG, JPG, or JPEG up to 10MB</p>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition-colors"
                >
                  Browse Files
                </button>

                {file && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                    <span>Selected: {file.name}</span>
                    <button 
                      onClick={() => setFile(null)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScanSubmit}
                  disabled={!file || isProcessing}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs font-black rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Parsing Scan & Matching Registry...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Start Document Scanner
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Split Pane Verification Workspace */
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Pane: Scan Image Preview */}
              <div className="w-1/2 border-r border-slate-200 bg-slate-900 flex flex-col relative">
                
                {/* Zoom Controls Overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700/50 shadow-lg">
                  <button 
                    onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}
                    className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[10px] font-bold text-slate-300 px-2 select-none">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}
                    className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                {/* Interactive Zoomable Image container */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <div 
                    style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }} 
                    className="transition-transform duration-200 max-w-full max-h-full"
                  >
                    {fileUrl && (
                      <img 
                        src={fileUrl} 
                        alt="Score sheet scan" 
                        className="max-w-[450px] shadow-2xl rounded-lg border border-slate-700/50 select-none object-contain"
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Verification Grid */}
              <div className="w-1/2 flex flex-col bg-white overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Verification Grid ({gridData.length} records parsed)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Validation Warnings Highlighted
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                        <th className="px-4 py-3">Extracted Row</th>
                        <th className="px-4 py-3">Aligned Student</th>
                        <th className="px-4 py-3 w-28">Score (0-100)</th>
                        <th className="px-4 py-3">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {gridData.map((row) => {
                        const hasErr = row.hasAnomaly
                        const hasWarning = row.lowConfidence

                        return (
                          <tr 
                            key={row.rowId}
                            className={`transition-colors ${
                              hasErr ? 'bg-red-50/40 hover:bg-red-50/60' : hasWarning ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* Extracted Row Name/ID */}
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-700">{row.inputName || 'Unknown ID'}</p>
                              <p className="text-[10px] font-semibold text-slate-400">ID: {row.inputIdentifier || 'N/A'}</p>
                            </td>

                            {/* Aligned Student Registry Dropdown */}
                            <td className="px-4 py-3">
                              <select
                                value={row.matchedStudentId || ''}
                                onChange={(e) => handleCellChange(row.rowId, 'matchedStudentId', e.target.value || null)}
                                className={`w-full px-2.5 py-1.5 font-bold rounded-lg border text-xs bg-white outline-none focus:ring-1 focus:ring-violet-500 ${
                                  !row.matchedStudentId 
                                    ? 'border-red-300 text-red-700 font-black' 
                                    : row.lowConfidence 
                                      ? 'border-amber-300 text-slate-700' 
                                      : 'border-slate-200 text-slate-700'
                                }`}
                              >
                                <option value="" className="text-red-500 font-semibold">-- Select Student --</option>
                                {students.map(std => (
                                  <option key={std.id} value={std.id}>
                                    {std.lastName}, {std.firstName} ({std.registerNo})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Editable Mark input */}
                            <td className="px-4 py-3">
                              <input 
                                type="number" 
                                step="any"
                                value={row.extractedMark === null ? '' : row.extractedMark}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value)
                                  handleCellChange(row.rowId, 'extractedMark', val)
                                }}
                                className={`w-full px-2.5 py-1.5 font-bold rounded-lg border text-xs text-center outline-none focus:ring-1 focus:ring-violet-500 ${
                                  row.extractedMark !== null && (row.extractedMark < 0 || row.extractedMark > 100)
                                    ? 'border-red-300 bg-red-50 text-red-600 font-black'
                                    : 'border-slate-200 bg-white text-slate-800'
                                }`}
                                placeholder="--"
                              />
                            </td>

                            {/* Audit Badge & Warnings */}
                            <td className="px-4 py-3">
                              {hasErr ? (
                                <div className="flex items-center gap-1 text-red-600 font-bold text-[10px]" title={row.anomalyReason || ''}>
                                  <AlertCircle size={12} />
                                  <span>{row.anomalyReason || 'Anomaly'}</span>
                                </div>
                              ) : hasWarning ? (
                                <div className="flex items-center gap-1 text-amber-600 font-bold text-[10px]" title="Fuzzy matched name with similarity < 85%">
                                  <AlertTriangle size={12} />
                                  <span>Fuzzy Match ({Math.round(row.matchConfidence * 100)}%)</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
                                  <CheckCircle2 size={12} />
                                  <span>Aligned</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Staging Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                  <button
                    onClick={resetScanner}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Reset & Scan New
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 hover:bg-slate-100 text-xs font-bold text-slate-500 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCommit}
                      disabled={isCommitting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-black rounded-lg flex items-center gap-2 shadow-sm transition-all"
                    >
                      {isCommitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Committing...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Commit to Gradebook
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
