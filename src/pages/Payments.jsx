import { useState, useEffect } from 'react'
import { paymentsAPI, membersAPI } from '../services/api'
import { Plus, Search, IndianRupee, Calendar, Filter, Eye, Edit, Trash2, Receipt, CreditCard, X, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import InvoiceGenerator from '../components/InvoiceGenerator'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentPayment, setCurrentPayment] = useState(null)
  const [filter, setFilter] = useState('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_type: 'subscription',
    transaction_id: '',
    notes: ''
  })
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceMember, setInvoiceMember] = useState(null)
  const [invoicePayment, setInvoicePayment] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, membersRes, statsRes] = await Promise.all([
        paymentsAPI.getAll().catch(() => ({ success: false, data: [] })),
        membersAPI.getAll({ status: 'active' }).catch(() => ({ success: false, data: [] })),
        paymentsAPI.getStats().catch(() => ({ success: false, data: null }))
      ])
      
      console.log('Payments response:', paymentsRes)
      console.log('Members response:', membersRes)
      console.log('Stats response:', statsRes)
      
      // Handle payments response
      let paymentsList = []
      if (paymentsRes.success && paymentsRes.data?.payments) {
        paymentsList = paymentsRes.data.payments
      } else if (Array.isArray(paymentsRes.data)) {
        paymentsList = paymentsRes.data
      } else if (Array.isArray(paymentsRes)) {
        paymentsList = paymentsRes
      }
      
      // Handle members response
      let membersList = []
      if (membersRes.success && membersRes.data?.members) {
        membersList = membersRes.data.members
      } else if (Array.isArray(membersRes.data)) {
        membersList = membersRes.data
      } else if (Array.isArray(membersRes)) {
        membersList = membersRes
      }
      
      // Handle stats response
      let statsData = null
      if (statsRes.success && statsRes.data) {
        statsData = statsRes.data
      } else if (statsRes.data) {
        statsData = statsRes.data
      }
      
      setPayments(paymentsList)
      setMembers(membersList)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load payments')
      setPayments([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentPayment && currentPayment.id) {
        await paymentsAPI.update(currentPayment.id, formData)
        toast.success('Payment updated successfully')
      } else {
        await paymentsAPI.create(formData)
        toast.success('Payment recorded successfully')
      }
      fetchData()
      closeModal()
    } catch (error) {
      console.error('Payment submit error:', error)
      toast.error(currentPayment && currentPayment.id ? 'Failed to update payment' : 'Failed to record payment')
    }
  }

  const openModal = (payment = null) => {
    if (payment) {
      setCurrentPayment(payment)
      setFormData({
        member_id: payment.member_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'cash',
        payment_type: payment.payment_type || 'subscription',
        transaction_id: payment.transaction_id || '',
        notes: payment.notes || ''
      })
    } else {
      setCurrentPayment(null)
      setFormData({
        member_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        payment_type: 'subscription',
        transaction_id: '',
        notes: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentPayment(null)
    setFormData({
      member_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      payment_type: 'subscription',
      transaction_id: '',
      notes: ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return
    try {
      await paymentsAPI.delete(id)
      toast.success('Payment deleted successfully')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete payment')
    }
  }

  const openInvoice = (payment) => {
    // Find the member for this payment
    const member = members.find(m => m.id === payment.member_id)
    if (member) {
      setInvoiceMember(member)
      setInvoicePayment(payment)
      setShowInvoice(true)
    } else {
      toast.error('Member information not found')
    }
  }

  const closeInvoice = () => {
    setShowInvoice(false)
    setInvoiceMember(null)
    setInvoicePayment(null)
  }

  const filteredPayments = payments.filter(payment => {
    // Status filter
    const matchesStatus = filter === 'all' || payment.status === filter
    
    // Search filter
    const matchesSearch = payment.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Payment type filter
    const matchesType = paymentTypeFilter === 'all' || payment.payment_type === paymentTypeFilter
    
    // Payment method filter
    const matchesMethod = paymentMethodFilter === 'all' || payment.payment_method === paymentMethodFilter
    
    // Date range filter
    let matchesDate = true
    if (dateRange.from || dateRange.to) {
      const paymentDate = new Date(payment.payment_date)
      if (dateRange.from && paymentDate < new Date(dateRange.from)) matchesDate = false
      if (dateRange.to && paymentDate > new Date(dateRange.to)) matchesDate = false
    }
    
    return matchesStatus && matchesSearch && matchesType && matchesMethod && matchesDate
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'enrollment': return 'bg-blue-100 text-blue-800'
      case 'subscription': return 'bg-purple-100 text-purple-800'
      case 'renewal': return 'bg-green-100 text-green-800'
      case 'fine': return 'bg-red-100 text-red-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track and manage payments</p>
        </div>
        <button onClick={openModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Year</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2 break-words">
                  ₹{parseFloat(stats.total_year || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2 break-words">
                  ₹{parseFloat(stats.total_month || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
                  {stats.pending_count || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Count</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                  {payments.length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by member name or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Payment Type Filter */}
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="enrollment">Enrollment</option>
              <option value="subscription">Subscription</option>
              <option value="renewal">Renewal</option>
              <option value="fine">Fine</option>
              <option value="other">Other</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="input flex-1"
                placeholder="From"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="input flex-1"
                placeholder="To"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(paymentTypeFilter !== 'all' || paymentMethodFilter !== 'all' || dateRange.from || dateRange.to) && (
            <button
              onClick={() => {
                setPaymentTypeFilter('all')
                setPaymentMethodFilter('all')
                setDateRange({ from: '', to: '' })
              }}
              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 self-start"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading payments...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Found</h3>
            <p className="text-gray-600 mb-6">Start recording member payments</p>
            <button 
              onClick={() => openModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.member_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{parseFloat(payment.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm hidden md:table-cell">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full capitalize ${getPaymentTypeColor(payment.payment_type)}`}>
                        {payment.payment_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell capitalize">
                      {payment.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(payment.status)}`}>
                        {payment.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openInvoice(payment)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Generate Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
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

      {/* Add/Edit Payment Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentPayment ? 'Edit Payment' : 'Record New Payment'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Member *</label>
                <select
                  value={formData.member_id}
                  onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.member_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Type *</label>
                <select
                  value={formData.payment_type}
                  onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                  className="input"
                  required
                >
                  <option value="enrollment">Enrollment</option>
                  <option value="subscription">Subscription</option>
                  <option value="renewal">Renewal</option>
                  <option value="fine">Fine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input min-h-[60px]"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoice && invoiceMember && invoicePayment && (
        <InvoiceGenerator
          member={invoiceMember}
          payment={invoicePayment}
          onClose={closeInvoice}
        />
      )}
    </div>
  )
}

export default Payments
