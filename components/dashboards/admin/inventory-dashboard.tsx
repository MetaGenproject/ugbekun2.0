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
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

interface InventoryItem {
  id: number
  name: string
  category: string
  unit: string
  unitCost: number
  unitPrice: number
  totalPurchasedInt: number
  totalSoldInt: number
  quantityBalance: number
  reorderLevel: number
  createdAt: string
  updatedAt: string
}

interface InventoryTransaction {
  id: number
  itemId: number
  itemName: string
  category: string
  unit: string
  type: 'PURCHASE' | 'SALE'
  quantity: number
  unitPrice: number
  totalAmount: number
  referenceNo: string | null
  notes: string | null
  issuedTo: string | null
  createdAt: string
}

interface InventoryMetrics {
  totalItemsCount: number
  totalPurchasedQty: number
  totalSoldQty: number
  totalBalanceQty: number
  totalPurchasedAmount: number
  totalSalesAmount: number
  lowStockCount: number
}

const CATEGORIES = ['All', 'Uniforms', 'Books', 'Stationery', 'Sports', 'General']
const UNITS = ['Pcs', 'Packs', 'Pairs', 'Boxes', 'Sets', 'Rolls']

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'transactions'>('ledger')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItemsCount: 0,
    totalPurchasedQty: 0,
    totalSoldQty: 0,
    totalBalanceQty: 0,
    totalPurchasedAmount: 0,
    totalSalesAmount: 0,
    lowStockCount: 0,
  })
  const [items, setItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)
  const [isSaleOpen, setIsSaleOpen] = useState(false)

  // Form states
  const [submitting, setSubmitting] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'General',
    unit: 'Pcs',
    unitCost: '',
    unitPrice: '',
    initialStock: '0',
    reorderLevel: '5',
  })

  const [purchaseForm, setPurchaseForm] = useState({
    itemId: '',
    quantity: '1',
    unitCost: '',
    referenceNo: '',
    notes: '',
  })

  const [saleForm, setSaleForm] = useState({
    itemId: '',
    quantity: '1',
    unitPrice: '',
    issuedTo: '',
    referenceNo: '',
    notes: '',
  })

  useEffect(() => {
    fetchInventory()
  }, [selectedCategory])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      let url = endpoints.admin.inventory
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (params.toString()) url += `?${params.toString()}`

      const res = await apiSlice.get<{
        success: boolean
        data: {
          metrics: InventoryMetrics
          items: InventoryItem[]
          recentTransactions: InventoryTransaction[]
        }
      }>(url)

      if (res.success && res.data) {
        setMetrics(res.data.metrics)
        setItems(res.data.items)
        setTransactions(res.data.recentTransactions)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load inventory data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) {
      toast.error('Item name is required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.inventoryItems,
        newItem
      )
      if (res.success) {
        toast.success(res.message || 'Item created successfully!')
        setIsAddItemOpen(false)
        setNewItem({
          name: '',
          category: 'General',
          unit: 'Pcs',
          unitCost: '',
          unitPrice: '',
          initialStock: '0',
          reorderLevel: '5',
        })
        fetchInventory()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create item.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseForm.itemId || !purchaseForm.quantity) {
      toast.error('Item selection and quantity are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.inventoryPurchase,
        purchaseForm
      )
      if (res.success) {
        toast.success(res.message || 'Stock purchase recorded!')
        setIsPurchaseOpen(false)
        setPurchaseForm({ itemId: '', quantity: '1', unitCost: '', referenceNo: '', notes: '' })
        fetchInventory()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record stock purchase.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saleForm.itemId || !saleForm.quantity) {
      toast.error('Item selection and quantity are required.')
      return
    }

    const selectedItem = items.find((i) => i.id === parseInt(saleForm.itemId, 10))
    if (selectedItem && selectedItem.quantityBalance < parseInt(saleForm.quantity, 10)) {
      toast.error(
        `Insufficient stock! Balance is ${selectedItem.quantityBalance} ${selectedItem.unit}.`
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.inventorySale,
        saleForm
      )
      if (res.success) {
        toast.success(res.message || 'Stock sale recorded!')
        setIsSaleOpen(false)
        setSaleForm({
          itemId: '',
          quantity: '1',
          unitPrice: '',
          issuedTo: '',
          referenceNo: '',
          notes: '',
        })
        fetchInventory()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record stock sale.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete item "${item.name}" and all its transaction history?`)) {
      return
    }

    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.admin.inventoryItemDelete(item.id)
      )
      if (res.success) {
        toast.success(res.message || 'Item deleted.')
        fetchInventory()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item.')
    }
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 md:p-8 shadow-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 text-xs font-bold text-blue-200 bg-white/10 rounded-full border border-white/20 inline-block">
              Stock & Supply Control
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Inventory Management</h1>
            <p className="text-slate-300 text-sm max-w-xl font-medium">
              Record purchases, track stock sales, manage item categories, and monitor live balance quantities with ease.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Plus size={16} /> New Item
            </button>
            <button
              onClick={() => setIsPurchaseOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <ArrowDownLeft size={16} /> Restock (Stock In)
            </button>
            <button
              onClick={() => setIsSaleOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <ArrowUpRight size={16} /> Sell / Issue (Stock Out)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Restocked</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalPurchasedQty.toLocaleString()} Pcs</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Cost: ₦{metrics.totalPurchasedAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">₦{metrics.totalSalesAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {metrics.totalSoldQty.toLocaleString()} items sold / issued
            </p>
          </div>
        </div>

        {/* Current Balance Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stock Balance</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Boxes size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalBalanceQty.toLocaleString()} Pcs</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Across {metrics.totalItemsCount} catalog item types
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Reorders</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">{metrics.lowStockCount} Items</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Require restock reorder
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package size={15} /> Stock Catalog ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText size={15} /> Transaction Audit Logs ({transactions.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stock item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchInventory}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit Cost (₦)</th>
                  <th className="py-3.5 px-4">Unit Price (₦)</th>
                  <th className="py-3.5 px-4 text-center">Purchased</th>
                  <th className="py-3.5 px-4 text-center">Sold</th>
                  <th className="py-3.5 px-4 text-center">Balance Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No stock items found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.quantityBalance <= item.reorderLevel
                    const isOut = item.quantityBalance === 0

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Unit: {item.unit}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          ₦{item.unitCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₦{item.unitPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          {item.totalPurchasedInt}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                          {item.totalSoldInt}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {item.quantityBalance}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">{item.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isOut ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPurchaseForm({
                                  itemId: String(item.id),
                                  quantity: '1',
                                  unitCost: String(item.unitCost),
                                  referenceNo: '',
                                  notes: '',
                                })
                                setIsPurchaseOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition cursor-pointer"
                              title="Restock Item"
                            >
                              <ArrowDownLeft size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSaleForm({
                                  itemId: String(item.id),
                                  quantity: '1',
                                  unitPrice: String(item.unitPrice),
                                  issuedTo: '',
                                  referenceNo: '',
                                  notes: '',
                                })
                                setIsSaleOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition cursor-pointer"
                              title="Sell / Issue Item"
                            >
                              <ArrowUpRight size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  <th className="py-3.5 px-4">Unit Price (₦)</th>
                  <th className="py-3.5 px-4">Total Amount (₦)</th>
                  <th className="py-3.5 px-4">Issued To / Ref</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === 'PURCHASE' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <ArrowDownLeft size={12} /> RESTOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <ArrowUpRight size={12} /> SALE / ISSUE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {tx.itemName}
                        <span className="text-[10px] text-slate-400 block font-normal">{tx.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-800">
                        {tx.quantity} {tx.unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        ₦{tx.unitPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₦{tx.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.issuedTo ? (
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <User size={12} className="text-slate-400" /> {tx.issuedTo}
                          </p>
                        ) : (
                          <p className="text-slate-400 font-mono text-[10px]">{tx.referenceNo || '—'}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {tx.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW ITEM */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-blue-600" /> Add New Inventory Item
              </h3>
              <button
                onClick={() => setIsAddItemOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School Uniform Size M"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit Cost (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.initialStock}
                    onChange={(e) => setNewItem({ ...newItem, initialStock: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reorder Alert Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.reorderLevel}
                    onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD RESTOCK PURCHASE */}
      {isPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft size={18} className="text-emerald-600" /> Restock Stock Entry
              </h3>
              <button
                onClick={() => setIsPurchaseOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Stock Item *</label>
                <select
                  required
                  value={purchaseForm.itemId}
                  onChange={(e) => {
                    const selected = items.find((i) => i.id === parseInt(e.target.value, 10))
                    setPurchaseForm({
                      ...purchaseForm,
                      itemId: e.target.value,
                      unitCost: selected ? String(selected.unitCost) : '',
                    })
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Balance: {i.quantityBalance} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Restock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit Cost (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseForm.unitCost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitCost: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Invoice / Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-089"
                  value={purchaseForm.referenceNo}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, referenceNo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased from Royal Stationers Ltd"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Recording...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD SALE / ISSUANCE */}
      {isSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowUpRight size={18} className="text-amber-600" /> Record Stock Sale / Issuance
              </h3>
              <button
                onClick={() => setIsSaleOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Stock Item *</label>
                <select
                  required
                  value={saleForm.itemId}
                  onChange={(e) => {
                    const selected = items.find((i) => i.id === parseInt(e.target.value, 10))
                    setSaleForm({
                      ...saleForm,
                      itemId: e.target.value,
                      unitPrice: selected ? String(selected.unitPrice) : '',
                    })
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id} disabled={i.quantityBalance <= 0}>
                      {i.name} (Balance: {i.quantityBalance} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity Sold / Issued *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issued To / Buyer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (JS1-A Student)"
                  value={saleForm.issuedTo}
                  onChange={(e) => setSaleForm({ ...saleForm, issuedTo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receipt / Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. RCPT-892"
                  value={saleForm.referenceNo}
                  onChange={(e) => setSaleForm({ ...saleForm, referenceNo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Confirm Sale / Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}