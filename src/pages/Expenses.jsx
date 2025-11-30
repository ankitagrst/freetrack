import { useState, useEffect } from 'react'
import { expensesAPI } from '../services/api'
import { Plus, TrendingDown, DollarSign, Calendar, Edit, Trash2, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentExpense, setCurrentExpense] = useState(null)
  const [stats, setStats] = useState(null)
  const [formData, setFormData] = useState({
    expense_category: '',
    expense_type: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'cash',
    vendor_name: '',
    bill_number: ''
  })

  const categories = [
    'Rent', 'Electricity', 'Water', 'Internet', 'Maintenance',
    'Salary', 'Stationery', 'Furniture', 'Books', 'Other'
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const [expensesRes, statsRes] = await Promise.all([
        expensesAPI.getAll().catch(() => ({ success: false, data: [] })),
        expensesAPI.getStats().catch(() => ({ success: false, data: null }))
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
        await expensesAPI.create(formData)
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total (Year)</p>
                <p className="text-3xl font-bold text-red-600 mt-2">₹{stats.year_expense || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">₹{stats.month_expense || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">₹{stats.today_expense || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage library expenses</p>
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
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
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
            <p className="text-gray-600 mb-6">Start tracking your library expenses</p>
            <button 
              onClick={() => openModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Vendor</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {exp.expense_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {exp.expense_type && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs capitalize">
                          {exp.expense_type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{exp.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell capitalize">{exp.payment_method}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{exp.vendor_name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(exp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
    </div>
  )
}

export default Expenses
