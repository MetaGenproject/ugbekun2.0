'use client'

import React from 'react'
import {
  Calendar,
  Send,
  X,
  Loader2,
  AlertCircle,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  useCbtDistributionForm,
  CbtDistributionSourceMode,
  CbtDistributionModalMode,
  ClassItem,
  SubjectItem,
  ExamMasterItem,
  ExamSetup,
  QuestionGroupItem,
  VaultQuestion,
  CbtTargetSlot,
} from '@/hooks/use-cbt-distribution-form'

export interface CbtDistributionModalProps {
  isOpen: boolean
  onClose: () => void
  sourceMode: CbtDistributionSourceMode
  mode?: CbtDistributionModalMode
  editingDistId?: number | null
  initialData?: any | null
  vaultQuestions?: VaultQuestion[]
  classes: ClassItem[]
  schoolSections?: any[]
  subjects: SubjectItem[]
  examMasters: ExamMasterItem[]
  activeExamSetup?: ExamSetup | null
  questionGroups?: QuestionGroupItem[]
  subjectApprovedCount?: number | null
  isAdmin?: boolean
  onSuccess?: (result: any, message?: string) => void
  showToast?: (message: string) => void
}

export function CbtDistributionModal({
  isOpen,
  onClose,
  sourceMode,
  mode = 'create',
  editingDistId = null,
  initialData = null,
  vaultQuestions = [],
  classes,
  schoolSections = [],
  subjects,
  examMasters,
  activeExamSetup = null,
  questionGroups = [],
  subjectApprovedCount = null,
  isAdmin = true,
  onSuccess,
  showToast,
}: CbtDistributionModalProps) {
  const form = useCbtDistributionForm({
    isOpen,
    sourceMode,
    mode,
    editingDistId,
    initialData,
    vaultQuestions,
    classes,
    schoolSections,
    subjects,
    examMasters,
    activeExamSetup,
    questionGroups,
    subjectApprovedCount,
    isAdmin,
    onSuccess: (result, message) => {
      onSuccess?.(result, message)
      if (showToast && message) {
        showToast(message)
      }
      onClose()
    },
    onError: (err) => {
      const msg = typeof err === 'string' ? err : err.message
      alert(msg)
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2 font-black text-sm">
            {mode === 'reschedule' ? (
              <Calendar size={18} className="text-amber-400" />
            ) : (
              <Send size={18} className="text-amber-400" />
            )}
            {mode === 'reschedule'
              ? 'Reschedule sitting'
              : mode === 'edit'
                ? 'Edit CBT schedule'
                : 'Distribute CBT Assessment to Classroom'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={form.handleSubmit} className="p-6 space-y-4">
          {mode === 'reschedule' ? (
            <>
              <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                Students who missed{' '}
                <span className="font-semibold text-slate-900">{form.distTitle}</span> can sit this
                same examination. A new test is not created.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opens *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.distStartDate}
                  onChange={(e) => form.setDistStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Closes *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.distEndDate}
                  onChange={(e) => form.setDistEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </>
          ) : (
            <>
              {/* Exam Master Binding & Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Assessment Title / Exam Master *
                  </label>
                  {form.activeCap && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Cap: {form.activeCap} Qs · Total Marks:{' '}
                      {form.activeExamTotalMarks ?? 'N/A'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={form.selectedExamMasterId}
                    onChange={(e) => form.handleExamMasterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">-- Bind to Exam Master --</option>
                    {examMasters
                      .filter((em) => !em.examCategory || em.examCategory === 'CBT')
                      .map((em) => (
                        <option key={em.id} value={em.id}>
                          {em.name} (Cap: {em.totalQuestionCount || 'None'} Qs)
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBT 1, Midterm CBT Test"
                    value={form.distTitle}
                    onChange={(e) => {
                      form.setDistTitle(e.target.value)
                      const match = examMasters.find(
                        (em) => em.name.trim().toLowerCase() === e.target.value.trim().toLowerCase()
                      )
                      if (match) form.setSelectedExamMasterId(String(match.id))
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Target CBT Component Slot Selector */}
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assessment Component Slot *
                  </label>
                  <select
                    value={form.distTargetSlot}
                    onChange={(e) => form.handleTargetSlotChange(e.target.value as CbtTargetSlot)}
                    className="w-full px-3 py-2 bg-slate-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select Target Assessment Slot --</option>
                    <option value="CBT1">CBT 1 (Continuous Assessment 1)</option>
                    <option value="CBT2">CBT 2 (Continuous Assessment 2)</option>
                    <option value="CBT_EXAM">Terminal CBT (Final Examination)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Student attempt scores will automatically index under this slot for Teacher
                    Gradebook 1-click Auto-Fill.
                  </p>
                </div>
              </div>

              {/* Classroom & Section / Stream */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classroom *</label>
                  <select
                    value={form.distClassId}
                    onChange={(e) => form.handleClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section / Stream
                  </label>
                  <select
                    value={form.distSectionId}
                    onChange={(e) => form.setDistSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">All Sections</option>
                    {form.activeSectionsForClass.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Question Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={form.distSubjectId}
                    onChange={(e) => form.handleSubjectChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  {sourceMode === 'vault' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Question Source
                      </label>
                      <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <Layers size={14} className="text-blue-600" />
                          <span>Collected Vault: {form.currentQuestionCount} Qs</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white">
                          {form.totalVaultMarks} Marks
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Question Bundle
                      </label>
                      <select
                        value={form.distGroupId}
                        onChange={(e) => form.setDistGroupId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                      >
                        <option value="">
                          Use Subject Question Bank{' '}
                          {subjectApprovedCount !== null
                            ? `(${subjectApprovedCount} approved Qs available)`
                            : ''}
                        </option>
                        {questionGroups
                          .filter(
                            (g) => !form.distSubjectId || g.subjectId === Number(form.distSubjectId)
                          )
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title} ({g.groupCode}) —{' '}
                              {Array.isArray(g.questionIds) ? g.questionIds.length : 0} Qs
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Question Cap Warning */}
                  {form.isExceedingCap && form.activeCap && (
                    <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      <span>
                        Maximum of {form.activeCap} questions approved for this exam. (Source contains{' '}
                        {form.currentQuestionCount} questions)
                      </span>
                    </div>
                  )}

                  {/* Empty Source Warning */}
                  {form.hasNoQuestionsAvailable && (
                    <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-1.5">
                      <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <span>
                          {sourceMode === 'vault'
                            ? 'No questions selected from vault.'
                            : form.distGroupId
                              ? 'The selected Question Bundle contains 0 questions.'
                              : 'No approved questions found in the Question Bank for this subject.'}
                        </span>
                        <p className="text-[11px] font-normal text-rose-600 mt-0.5">
                          CBT tests cannot be distributed with zero questions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration & Passing Mark */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={form.distDuration}
                    onChange={(e) => {
                      const val = e.target.value
                      form.setDistDuration(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0))
                    }}
                    onBlur={() => {
                      if (!form.distDuration || Number(form.distDuration) < 1) {
                        form.setDistDuration(30)
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passing Mark (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.distPassingMark}
                    onChange={(e) => {
                      const val = e.target.value
                      form.setDistPassingMark(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0))
                    }}
                    onBlur={() => {
                      if (!form.distPassingMark || Number(form.distPassingMark) < 1) {
                        form.setDistPassingMark(50)
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Opens & Closes Datetime Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opens</label>
                  <input
                    type="datetime-local"
                    value={form.distStartDate}
                    onChange={(e) => form.setDistStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Closes</label>
                  <input
                    type="datetime-local"
                    value={form.distEndDate}
                    onChange={(e) => form.setDistEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-2">
                If a student misses this sitting, change these times on the existing exam. Do not
                create a new test.
              </p>

              {/* Flags / Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.distShuffle}
                    onChange={(e) => form.setDistShuffle(e.target.checked)}
                    className="rounded-md text-amber-500"
                  />
                  Shuffle Questions (Anti-Cheat)
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.distShowResults}
                    onChange={(e) => form.setDistShowResults(e.target.checked)}
                    className="rounded-md text-amber-500"
                  />
                  Show Instant Results on Submit
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.distPublished}
                    onChange={(e) => form.setDistPublished(e.target.checked)}
                    className="rounded-md text-emerald-500"
                  />
                  Publish Live Immediately
                </label>
              </div>
            </>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                form.isSaving || form.isExceedingCap || form.hasNoQuestionsAvailable
              }
              title={
                form.isExceedingCap && form.activeCap
                  ? `Maximum of ${form.activeCap} questions approved for this exam.`
                  : form.hasNoQuestionsAvailable
                    ? 'No approved questions available for this assessment.'
                    : undefined
              }
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {form.isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {mode === 'reschedule'
                ? 'Save new sitting'
                : mode === 'edit'
                  ? 'Save schedule'
                  : 'Distribute CBT Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
