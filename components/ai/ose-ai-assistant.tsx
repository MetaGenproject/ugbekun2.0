'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  X,
  UserPlus,
  BookOpen,
  FileText,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  Loader2,
  Printer,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Award
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'ose'
  text: string
  timestamp: string
  actionData?: {
    type: 'action' | 'data' | 'insights'
    title?: string
    details?: any
  }
}

export function OSeAiAssistant({ isOpen: externalIsOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputQuery, setInputQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen)
    }
  }, [externalIsOpen])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ose',
      text: "Hello! I am **OSe AI**, your intelligent school assistant. How can I assist you today? Try typing requests like:\n• *'Register a new student named David Adeleke in Primary 4'* \n• *'Generate lesson notes for Fractions & Decimals'* \n• *'Identify outstanding school fees'* \n• *'Analyse academic performance'*",
      timestamp: 'Just now'
    }
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing])

  const handleQuickPrompt = (promptText: string) => {
    processNaturalLanguageRequest(promptText)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputQuery.trim()) return
    processNaturalLanguageRequest(inputQuery)
  }

  const processNaturalLanguageRequest = (query: string) => {
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputQuery('')
    setIsProcessing(true)

    const lower = query.toLowerCase()

    setTimeout(() => {
      let oseReply: Message

      if (lower.includes('register') || lower.includes('student')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "✅ **Student Enrolled Successfully via OSe AI Engine**\n\nI have generated Admission Number **UG-2026-048** and registered the student into **Primary 4 Gold**. Student file and parent notification link have been established.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionData: {
            type: 'action',
            title: 'Admission Registration Record',
            details: { name: 'David Adeleke', admNo: 'UG-2026-048', class: 'Primary 4 Gold', status: 'Active & Verified' }
          }
        }
      } else if (lower.includes('lesson') || lower.includes('note') || lower.includes('curriculum')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "📖 **Complete Lesson Note Generated (NERDC Curriculum Compliant)**\n\n**Topic**: Fractions & Decimals (Mathematics)\n**Objectives**: 1. Identify proper & improper fractions. 2. Convert fractions to decimals.\n**Evaluation Questions**: 3 test questions generated with answer key.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionData: {
            type: 'action',
            title: 'Generated Lesson Plan PDF',
            details: { topic: 'Fractions & Decimals', class: 'Primary 4', duration: '45 mins', format: 'Ready for PDF Export' }
          }
        }
      } else if (lower.includes('outstanding') || lower.includes('due') || lower.includes('debt')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "💳 **Outstanding School Fees Analysis**\n\nIdentified **32 Students** with pending fee balances totaling **₦4,850,000**. Automated SMS reminder notices are ready to be dispatched to parents.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionData: {
            type: 'data',
            title: 'Overdue Fee Roster',
            details: { count: 32, totalOverdue: '₦4,850,000', collectionRate: '92.4% Paid' }
          }
        }
      } else if (lower.includes('finance') || lower.includes('income') || lower.includes('summary')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "💰 **Executive Financial Summary (Current Session)**\n\n• **Total Invoiced**: ₦198,000,000\n• **Fee Revenue Collected**: ₦185,400,000\n• **Operating Expenses**: ₦42,100,000\n• **Net Operating Surplus**: **₦129,935,000**",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionData: {
            type: 'insights',
            title: 'Financial Health Indicator',
            details: { status: 'Healthy Surplus (+18.4% YoY)', cashflow: 'Positive' }
          }
        }
      } else if (lower.includes('report') || lower.includes('publish') || lower.includes('card')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "📢 **Report Cards Published to Portal**\n\n1st Term examination report cards for all **1,250 Students** have been locked and published online. Automated SMS and EduChat notifications dispatched to parents.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionData: {
            type: 'action',
            title: 'Report Cards Publication',
            details: { totalPublished: 1250, smsSent: 1210, status: 'Portal Live' }
          }
        }
      } else if (lower.includes('academic') || lower.includes('performance') || lower.includes('analyse')) {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: "📈 **Academic Performance Insights**\n\n• **Overall School Average**: **84.2%**\n• **Top Class Arm**: Primary 4 Gold (92.5% Average)\n• **Subject Leader**: Mathematics (88.4% Pass Rate)\n• **Recommendation**: Provide supplementary quantitative exercises for Primary 3 Silver.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      } else {
        oseReply = {
          id: String(Date.now() + 1),
          sender: 'ose',
          text: `⚡ **OSe AI Assistance Executed**: I have processed your request regarding "${query}". The system metrics and database records have been analyzed and synchronized across your admin portal.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }

      setMessages(prev => [...prev, oseReply])
      setIsProcessing(false)
    }, 800)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] p-4 rounded-full bg-slate-900 text-white font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-amber-400/80 cursor-pointer group"
        >
          <div className="relative">
            <Bot size={24} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1">Ask OSe AI</span>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-5rem)] h-[520px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  OSe AI Assistant <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase">Active</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Natural Language Intelligence Engine</p>
              </div>
            </div>

            <button 
              onClick={handleClose} 
              title="Close OSe AI (Esc)"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <span>Close</span>
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 shadow-2xs ${
                  m.sender === 'user' ? 'bg-indigo-600 text-white font-medium rounded-br-none' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}>
                  <div className="prose prose-xs max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </div>

                  {/* Action Data Box if available */}
                  {m.actionData && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 space-y-1 text-[11px]">
                      <p className="font-bold text-xs text-indigo-900 border-b border-slate-200/80 pb-1">{m.actionData.title}</p>
                      {Object.entries(m.actionData.details).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize text-slate-500 font-medium">{k}:</span>
                          <span className="font-bold text-slate-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className={`text-[9px] font-mono text-right ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl text-xs flex items-center gap-2 text-slate-500">
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                  <span className="font-medium text-[11px]">OSe AI is processing request...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Natural Language Action Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-slate-600">
            <button onClick={() => handleQuickPrompt('Register a student')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition">
              + Register Student
            </button>
            <button onClick={() => handleQuickPrompt('Generate lesson notes')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition">
              📖 Lesson Notes
            </button>
            <button onClick={() => handleQuickPrompt('Identify outstanding school fees')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition">
              💳 Outstanding Fees
            </button>
            <button onClick={() => handleQuickPrompt('Analyse academic performance')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition">
              📈 Academic Performance
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask OSe AI anything..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
            />
            <button type="submit" className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold transition cursor-pointer">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
