'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Boxes,
  CheckCircle2,
  DollarSign,
  Tag,
  FileText,
  User,
  Layers,
  BookOpen,
  Laptop,
  Armchair,
  Microscope,
  Trophy,
  PenTool,
  Truck,
  FileCheck,
  Wrench,
  BarChart3,
  Check
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type InventoryTab = 
  | 'inventory-dashboard' 
  | 'assets' 
  | 'books' 
  | 'ict-equipment' 
  | 'furniture' 
  | 'lab-equipment' 
  | 'sports-equipment' 
  | 'stationery' 
  | 'suppliers' 
  | 'purchase-orders' 
  | 'stock-in' 
  | 'stock-out' 
  | 'maintenance' 
  | 'inventory-reports'

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('inventory-dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  // Asset Datasets (initialized empty for live data)
  const [assets, setAssets] = useState<Array<{ id: string; name: string; category: string; condition: string; val: string }>>([])
  const [ictItems, setIctItems] = useState<Array<{ id: string; name: string; location: string; condition: string; val: string }>>([])
  const [books, setBooks] = useState<Array<{ id: string; title: string; copies: number; status: string }>>([])
  const [labItems, setLabItems] = useState<Array<{ id: string; name: string; lab: string; status: string }>>([])
  const [suppliers, setSuppliers] = useState<Array<{ id: string; company: string; contact: string; phone: string; goods: string }>>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<Array<{ id: string; item: string; issue: string; technician: string; cost: string; status: string }>>([])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="text-amber-600" size={24} /> School Inventory & Fixed Assets
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Assets, textbooks, ICT equipment, furniture, lab & sports gear, suppliers, purchase orders, and maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <FileCheck size={15} className="text-amber-400" /> Purchase Orders
            </button>
          </div>
        </div>
      </div>

      {/* 14 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('inventory-dashboard')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'inventory-dashboard' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📊 Inventory Dashboard
        </button>
        <button onClick={() => setActiveTab('assets')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'assets' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏛️ Fixed Assets
        </button>
        <button onClick={() => setActiveTab('books')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'books' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📚 Books & Library
        </button>
        <button onClick={() => setActiveTab('ict-equipment')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'ict-equipment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💻 ICT Equipment
        </button>
        <button onClick={() => setActiveTab('furniture')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'furniture' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🪑 Furniture
        </button>
        <button onClick={() => setActiveTab('lab-equipment')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'lab-equipment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔬 Laboratory
        </button>
        <button onClick={() => setActiveTab('sports-equipment')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'sports-equipment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ⚽ Sports Equipment
        </button>
        <button onClick={() => setActiveTab('stationery')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'stationery' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ✏️ Stationery
        </button>
        <button onClick={() => setActiveTab('suppliers')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'suppliers' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🚚 Suppliers Directory
        </button>
        <button onClick={() => setActiveTab('purchase-orders')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'purchase-orders' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📝 Purchase Orders
        </button>
        <button onClick={() => setActiveTab('stock-in')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'stock-in' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📥 Stock In
        </button>
        <button onClick={() => setActiveTab('stock-out')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'stock-out' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📤 Stock Out
        </button>
        <button onClick={() => setActiveTab('maintenance')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'maintenance' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🛠️ Maintenance
        </button>
        <button onClick={() => setActiveTab('inventory-reports')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'inventory-reports' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📈 Reports
        </button>
      </div>

      {/* 1. INVENTORY DASHBOARD */}
      {activeTab === 'inventory-dashboard' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Total Asset Valuation</p>
              <p className="text-2xl font-black text-amber-950 mt-1">₦76,300,000</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Total Stock Items</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">1,480 Items</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-blue-50">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Registered Suppliers</p>
              <p className="text-2xl font-black text-blue-950 mt-1">14 Vendors</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-rose-50">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Low Stock Alerts</p>
              <p className="text-2xl font-black text-rose-950 mt-1">3 Items</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FIXED ASSETS */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Fixed Assets Register</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Asset ID</TableHead><TableHead>Asset Description</TableHead><TableHead>Category</TableHead><TableHead>Condition</TableHead><TableHead>Valuation</TableHead></TableRow></TableHeader>
            <TableBody>
              {assets.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-bold text-amber-700">{a.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{a.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">{a.category}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{a.condition}</span></TableCell>
                  <TableCell className="font-mono font-black text-slate-900">{a.val}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 3. BOOKS */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Textbooks & Library Inventory</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Book ID</TableHead><TableHead>Title</TableHead><TableHead>Available Copies</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {books.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{b.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{b.title}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{b.copies} Copies</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{b.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. ICT EQUIPMENT */}
      {activeTab === 'ict-equipment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">ICT & Computing Assets</h3>
          <Table>
            <TableHeader><TableRow><TableHead>ICT ID</TableHead><TableHead>Equipment</TableHead><TableHead>Location</TableHead><TableHead>Condition</TableHead><TableHead>Valuation</TableHead></TableRow></TableHeader>
            <TableBody>
              {ictItems.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{i.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{i.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">{i.location}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{i.condition}</span></TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{i.val}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. FURNITURE */}
      {activeTab === 'furniture' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Classroom & Office Furniture</h3>
          <p className="text-xs text-slate-500 font-medium">Student Desks: 450 Units • Teacher Tables: 45 Units • Whiteboards: 30 Units.</p>
        </div>
      )}

      {/* 6. LAB EQUIPMENT */}
      {activeTab === 'lab-equipment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Science Laboratory Apparatus & Reagents</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Lab ID</TableHead><TableHead>Apparatus</TableHead><TableHead>Laboratory</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {labItems.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{l.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{l.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">{l.lab}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{l.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 7. SPORTS EQUIPMENT */}
      {activeTab === 'sports-equipment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Physical Education & Sports Gear</h3>
          <p className="text-xs text-slate-500 font-medium">Match Footballs: 18 • Basketballs: 12 • Volleyball Nets: 4 • Table Tennis Boards: 2.</p>
        </div>
      )}

      {/* 8. STATIONERY */}
      {activeTab === 'stationery' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Stationery & Office Consumables</h3>
          <p className="text-xs text-slate-500 font-medium">A4 Paper Reams: 85 Packs • Whiteboard Markers: 140 Packs • Exam Answer Sheets: 4,000 Units.</p>
        </div>
      )}

      {/* 9. SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Registered Vendor & Supplier Directory</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Vendor ID</TableHead><TableHead>Company Name</TableHead><TableHead>Contact Person</TableHead><TableHead>Phone</TableHead><TableHead>Category Supplied</TableHead></TableRow></TableHeader>
            <TableBody>
              {suppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-bold text-amber-700">{s.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{s.company}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{s.contact}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-800">{s.phone}</TableCell>
                  <TableCell className="text-xs text-slate-600">{s.goods}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 10. PURCHASE ORDERS */}
      {activeTab === 'purchase-orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Generate Requisition Purchase Order (PO)</h3>
          <select className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold">{suppliers.map(s => <option key={s.id}>{s.company}</option>)}</select>
          <input type="text" placeholder="PO Description (e.g. 50 Reams A4 Paper & Whiteboard Markers)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <button onClick={() => alert('PO Generated & Sent to Bursary!')} className="px-4 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl">Create Purchase Order</button>
        </div>
      )}

      {/* 11. STOCK IN */}
      {activeTab === 'stock-in' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Record Incoming Stock (Stock In)</h3>
          <input type="text" placeholder="Item Name / Ref" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <input type="number" placeholder="Quantity Received" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" defaultValue={50} />
          <button onClick={() => alert('Stock In Recorded!')} className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">Record Stock In</button>
        </div>
      )}

      {/* 12. STOCK OUT */}
      {activeTab === 'stock-out' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Record Issuance / Usage (Stock Out)</h3>
          <input type="text" placeholder="Item Name / Ref" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <input type="text" placeholder="Issued To (e.g. Primary 4 Gold Teacher)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <button onClick={() => alert('Stock Out Recorded!')} className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Record Stock Out</button>
        </div>
      )}

      {/* 13. MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Equipment Servicing & Maintenance Log</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Ref ID</TableHead><TableHead>Equipment</TableHead><TableHead>Issue / Servicing</TableHead><TableHead>Technician</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {maintenanceLogs.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{m.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{m.item}</TableCell>
                  <TableCell className="text-xs text-slate-600">{m.issue}</TableCell>
                  <TableCell className="text-xs text-slate-700">{m.technician}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{m.cost}</TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 14. INVENTORY REPORTS */}
      {activeTab === 'inventory-reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Comprehensive Inventory Audit Reports</h3>
          <p className="text-xs text-slate-500 font-medium">Download annual valuation statements, stock depletion reports, and asset depreciation logs.</p>
          <button onClick={() => alert('Downloading Valuation Audit PDF...')} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Download Audit Report PDF</button>
        </div>
      )}
    </div>
  )
}