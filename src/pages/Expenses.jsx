import { useState, useEffect } from 'react'
import { expensesAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency } from '../utils/formatters'
import { Plus, TrendingDown, IndianRupee, Calendar, Edit, Trash2, Receipt, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const Expenses = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState({
    total_expense: 0,
    monthly_expense: 0,
    today_expense: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentExpense, setCurrentExpense] = useState(null)
  const [detailExpense, setDetailExpense] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [formData, setFormData] = useState({
    expense_category: '',
    expense_type: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    vendor_name: '',
    bill_number: '',
    description: ''
  })

  const getCategories = () => {
    const base = ['Rent', 'Electricity', 'Water', 'Internet', 'Maintenance', 'Salary', 'Stationery', 'Other']
    if (orgType === 'library') return [...base, 'Books', 'Furniture']
    if (orgType === 'gym') return [...base, 'Equipment', 'Supplements']
    if (orgType === 'dance' || orgType === 'yoga') return [...base, 'Music System', 'Mats/Props']
    if (orgType === 'tution') return [...base, 'Study Material', 'Marketing']
    return base
  }

  const categories = getCategories()

  useEffect(() => {
    if (selectedOrg?.id) {
      fetchExpenses()
    }
  }, [selectedOrg])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const [expensesRes, statsRes] = await Promise.all([
        expensesAPI.getAll({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] })),
        expensesAPI.getStats({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: null }))
      ])

      let expensesList = []
      if (expensesRes.success && expensesRes.data?.expenses) {
        expensesList = expensesRes.data.expenses
      } else if (Array.isArray(expensesRes.data)) {
        expensesList = expensesRes.data
      }

      let statsData = null
      if (statsRes.success && statsRes.data) {
        statsData = statsRes.data
      }

      setExpenses(expensesList)
      setStats(statsData)
    } catch (error) {
      console.error('Error:', error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentExpense) {
        await expensesAPI.update(currentExpense.id, formData)
        toast.success('Expense updated successfully')
      } else {
        await expensesAPI.create({ ...formData, org_id: selectedOrg.id })
        toast.success('Expense added successfully')
      }
      fetchExpenses()
      closeModal()
    } catch (error) {
      toast.error(currentExpense ? 'Failed to update expense' : 'Failed to add expense')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await expensesAPI.delete(id)
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const openModal = (expense = null) => {
    if (expense) {
      setCurrentExpense(expense)
      setFormData({
        expense_category: expense.expense_category,
        expense_type: expense.expense_type || '',
        amount: expense.amount,
        expense_date: expense.expense_date,
        description: expense.description || '',
        payment_method: expense.payment_method || 'cash',
        vendor_name: expense.vendor_name || '',
        bill_number: expense.bill_number || ''
      })
    } else {
      setCurrentExpense(null)
      setFormData({
        expense_category: '',
        expense_type: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: 'cash',
        vendor_name: '',
        bill_number: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentExpense(null)
    setFormData({
      expense_category: '',
      expense_type: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      payment_method: 'cash',
      vendor_name: '',
      bill_number: ''
    })
  }

  const openDetailModal = (expense) => {
    setDetailExpense(expense)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="stats-card stats-card-danger">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Total (Year)</p>
                <p className="stats-card-value">{formatCurrency(stats.year_expense || 0)}</p>
              </div>
              <div className="stats-card-icon">
                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="stats-card stats-card-warning">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">This Month</p>
                <p className="stats-card-value">{formatCurrency(stats.month_expense || 0)}</p>
              </div>
              <div className="stats-card-icon">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="stats-card stats-card-primary">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Today</p>
                <p className="stats-card-value">{formatCurrency(stats.today_expense || 0)}</p>
              </div>
              <div className="stats-card-icon">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage organization expenses</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl shadow-sm border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading expenses...</p>
            </div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Expenses Yet</h3>
            <p className="text-gray-600 mb-6">Start tracking your organization expenses</p>
            <button 
              onClick={() => openModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {expenses.map((exp) => (
              <div key={exp.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-red-200 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-3 py-1.5 bg-info/10 text-info rounded-lg text-sm font-semibold">
                        {exp.expense_category}
                      </span>
                      {exp.expense_type && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-semibold capitalize">
                          {exp.expense_type}
                        </span>
                      )}
                    </div>
                    
                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600 font-medium capitalize">{exp.payment_method}</span>
                      {exp.vendor_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-600 font-medium truncate">{exp.vendor_name}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Amount Section */}
                    <div className="bg-danger-light rounded-lg px-4 py-3 border border-danger-light">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-danger-dark uppercase tracking-wide">Expense Amount</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-danger-dark">{formatCurrency(exp.amount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openDetailModal(exp)}
                      className="p-2.5 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openModal(exp)}
                      className="p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      title="Edit Expense"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select value={formData.expense_category} onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })} className="input" required>
                  <option value="">Select</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expense Type</label>
                <select value={formData.expense_type} onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })} className="input">
                  <option value="">Select Type (Optional)</option>
                  <option value="recurring">Recurring</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input" placeholder="Enter amount" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="input" required>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name</label>
                  <input type="text" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="input" placeholder="Vendor/supplier name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Number</label>
                  <input type="text" value={formData.bill_number} onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })} className="input" placeholder="Invoice/bill number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input resize-none" rows="3" placeholder="Add notes or description..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">
                  {currentExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {showDetailModal && detailExpense && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="bg-gradient-danger p-6 pb-16 rounded-t-xl">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <TrendingDown className="w-10 h-10 text-danger" />
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Info Card */}
            <div className="px-6 -mt-8 relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                {/* Expense Category */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Expense Details</h3>
                  <span className="inline-flex items-center px-4 py-1 text-sm font-bold rounded-full bg-info/10 text-info">
                    {detailExpense.expense_category}
                  </span>
                </div>

                {/* Amount */}
                <div className="mb-4 pb-4 border-b text-center">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-4xl font-bold text-danger">{formatCurrency(detailExpense.amount || 0)}</p>
                </div>

                {/* Expense Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-base font-bold text-gray-900">
                      {new Date(detailExpense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Method</p>
                    <p className="text-base font-bold text-gray-900 capitalize">
                      {detailExpense.payment_method || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Type */}
                {detailExpense.expense_type && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full capitalize bg-purple-100 text-purple-800">
                      {detailExpense.expense_type}
                    </span>
                  </div>
                )}

                {/* Vendor */}
                {detailExpense.vendor_name && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Vendor</p>
                    <p className="text-sm font-medium text-gray-900">{detailExpense.vendor_name}</p>
                  </div>
                )}

                {/* Bill Number */}
                {detailExpense.bill_number && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Bill Number</p>
                    <p className="text-sm font-mono font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      {detailExpense.bill_number}
                    </p>
                  </div>
                )}

                {/* Description */}
                {detailExpense.description && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{detailExpense.description}</p>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openModal(detailExpense)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Expense
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
