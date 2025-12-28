import { useState, useEffect } from 'react'
import { paymentsAPI, membersAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency } from '../utils/formatters'
import { Plus, Search, IndianRupee, Calendar, Filter, Eye, Edit, Trash2, Receipt, CreditCard, X, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import InvoiceGenerator from '../components/InvoiceGenerator'

const Payments = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library'

  const getOrgLabel = () => {
    switch(orgType) {
      case 'gym': return 'Gym'
      case 'dance': return 'Dance Studio'
      case 'yoga': return 'Yoga Center'
      case 'tution': return 'Tuition Center'
      default: return 'Library'
    }
  }

  const getMemberLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Member'
  }

  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentPayment, setCurrentPayment] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailPayment, setDetailPayment] = useState(null)
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
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([])

  useEffect(() => {
    if (selectedOrg?.id) {
      fetchData()
    }
  }, [selectedOrg])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, membersRes, statsRes, monthlyRes] = await Promise.all([
        paymentsAPI.getAll({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] })),
        membersAPI.getAll({ status: 'active', org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] })),
        paymentsAPI.getStats({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: null })),
        paymentsAPI.getMonthlyStats({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] }))
      ])
      
      
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

      // Monthly cash/online breakdown
      let monthly = []
      if (monthlyRes.success && Array.isArray(monthlyRes.data)) monthly = monthlyRes.data
      if (Array.isArray(monthlyRes)) monthly = monthlyRes
      setMonthlyBreakdown(monthly)
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

  const openDetailModal = (payment) => {
    setDetailPayment(payment)
    setShowDetailModal(true)
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
      case 'enrollment': return 'bg-info/10 text-info'
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

      {/* Monthly Cash / Online Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlyBreakdown.map((m, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">{m.month_name}, {m.year}</p>
                  <p className="text-lg font-semibold text-gray-900">₹{(m.total || 0).toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{m.count || 0} payments</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cash</span>
                <span className="font-semibold text-gray-900">₹{(m.cash_total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Online</span>
                <span className="font-semibold text-gray-900">₹{(m.online_total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="stats-card stats-card-success">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Total Year</p>
                <p className="stats-card-value">
                  {formatCurrency(stats.total_year || 0)}
                </p>
              </div>
              <div className="stats-card-icon">
                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-primary">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">This Month</p>
                <p className="stats-card-value">
                  {formatCurrency(stats.total_month || 0)}
                </p>
              </div>
              <div className="stats-card-icon">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-warning">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Pending</p>
                <p className="stats-card-value">
                  {stats.pending_count || 0}
                </p>
              </div>
              <div className="stats-card-icon">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-info">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Total Count</p>
                <p className="stats-card-value">
                  {payments.length}
                </p>
              </div>
              <div className="stats-card-icon">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
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
      <div className="rounded-xl shadow-sm border-gray-200">
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
            <p className="text-gray-600 mb-6">Start recording {getMemberLabel().toLowerCase()} payments</p>
            <button 
              onClick={() => openModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{payment.member_name || `Unknown ${getMemberLabel()}`}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md capitalize ${getStatusColor(payment.status)}`}>
                          {payment.status || 'pending'}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : 'No date'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetailModal(payment)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-gray-100 hover:border-primary/20"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openModal(payment)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 hover:border-gray-200"
                        title="Edit Payment"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className={`text-xs font-bold capitalize ${getPaymentTypeColor(payment.payment_type)}`}>
                        {payment.payment_type || 'Other'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-bold text-gray-600 capitalize">{payment.payment_method || 'Cash'}</span>
                    </div>
                    {payment.transaction_id && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">ID:</span>
                        <span className="text-xs font-mono font-medium text-gray-600">{payment.transaction_id}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Amount Section */}
                  <div className="bg-gradient-to-r from-green-50 to-transparent rounded-xl px-4 py-3 border border-green-100/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-0.5">Amount Paid</p>
                      <p className="text-2xl font-black text-green-700">{formatCurrency(payment.amount || 0)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setInvoiceMember({ id: payment.member_id, full_name: payment.member_name })
                        setInvoicePayment(payment)
                        setShowInvoice(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-200 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">{getMemberLabel()} *</label>
                <select
                  value={formData.member_id}
                  onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select {getMemberLabel()}</option>
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
          org={selectedOrg}
          onClose={closeInvoice}
        />
      )}

      {/* Payment Detail Modal */}
      {showDetailModal && detailPayment && (
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
              
              <div className="bg-gradient-success p-6 pb-16 rounded-t-xl">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-success" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            <div className="px-6 -mt-8 relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                {/* Payment Type & Status */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full capitalize ${detailPayment.payment_type === 'subscription' ? 'bg-info/10 text-info' : 'bg-purple-100 text-purple-800'}`}>
                      {detailPayment.payment_type || 'N/A'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full capitalize ${detailPayment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {detailPayment.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Member Info */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs text-gray-500 mb-1">Member</p>
                  <p className="text-lg font-bold text-gray-900">{detailPayment.member_name || 'N/A'}</p>
                </div>

                {/* Amount */}
                <div className="mb-4 pb-4 border-b text-center">
                  <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                  <p className="text-4xl font-bold text-green-600">{formatCurrency(detailPayment.amount || 0)}</p>
                </div>

                {/* Payment Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-base font-bold text-gray-900">
                      {detailPayment.payment_date ? format(new Date(detailPayment.payment_date), 'dd MMM, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Method</p>
                    <p className="text-base font-bold text-gray-900 capitalize">
                      {detailPayment.payment_method || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Transaction ID */}
                {detailPayment.transaction_id && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                    <p className="text-sm font-mono font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      {detailPayment.transaction_id}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {detailPayment.notes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{detailPayment.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openInvoice(detailPayment)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openModal(detailPayment)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                    Edit
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

export default Payments
