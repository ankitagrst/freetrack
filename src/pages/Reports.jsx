import { useState, useEffect } from 'react'
import { reportsAPI, paymentsAPI, expensesAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { FileText, Download, Calendar, TrendingUp, BarChart3, IndianRupee, TrendingDown, X, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Reports = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library'

  const getMemberLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Member'
  }

  const [reportType, setReportType] = useState('payments')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({ from_date: '', to_date: '' })
  const [showCollectionReport, setShowCollectionReport] = useState(false)
  const [yearlyData, setYearlyData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showPLReport, setShowPLReport] = useState(false)
  const [plData, setPLData] = useState({ collections: [], expenses: [], activeTab: 'collection' })
  const [plFilters, setPLFilters] = useState({ from_date: '', to_date: '' })
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [paymentMethodData, setPaymentMethodData] = useState({ cash: [], online: [] })

  const reportTypes = [
    { value: 'payments', label: 'Payment Report' },
    { value: 'members', label: `${getMemberLabel()}s Report` },
    // { value: 'attendance', label: 'Attendance Report' },
    { value: 'revenue', label: 'Revenue Report' }
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const fetchYearlyData = async () => {
    try {
      const response = await paymentsAPI.getAll({ org_id: selectedOrg.id })
      let allPayments = []
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          allPayments = response.data
        } else if (response.data.payments && Array.isArray(response.data.payments)) {
          allPayments = response.data.payments
        }
      }
      
      // Group by month for selected year
      const monthlyData = Array(12).fill(0).map((_, idx) => ({
        month: monthNames[idx],
        monthNum: idx + 1,
        amount: 0,
        count: 0
      }))
      
      // Separate cash and online payments for the year
      const cashPayments = []
      const onlinePayments = []
      
      allPayments.forEach(payment => {
        const date = new Date(payment.payment_date)
        if (date.getFullYear() === selectedYear) {
          const monthIdx = date.getMonth()
          monthlyData[monthIdx].amount += parseFloat(payment.amount || 0)
          monthlyData[monthIdx].count += 1
          
          // Categorize by payment method
          if (payment.payment_method === 'cash') {
            cashPayments.push(payment)
          } else {
            onlinePayments.push(payment)
          }
        }
      })
      
      setYearlyData(monthlyData)
      setPaymentMethodData({ cash: cashPayments, online: onlinePayments })
    } catch (error) {
      console.error('Error fetching yearly data:', error)
      toast.error('Failed to load collection data')
    }
  }

  const fetchPLData = async () => {
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        paymentsAPI.getAll({ org_id: selectedOrg.id }),
        expensesAPI.getAll({ org_id: selectedOrg.id })
      ])

      let payments = []
      if (paymentsRes.success && paymentsRes.data) {
        payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.payments || []
      }

      let expenses = []
      if (expensesRes.success && expensesRes.data) {
        expenses = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || []
      }

      // Filter by date range if provided
      if (plFilters.from_date || plFilters.to_date) {
        const fromDate = plFilters.from_date ? new Date(plFilters.from_date) : null
        const toDate = plFilters.to_date ? new Date(plFilters.to_date) : null

        if (fromDate) {
          payments = payments.filter(p => new Date(p.payment_date) >= fromDate)
          expenses = expenses.filter(e => new Date(e.expense_date) >= fromDate)
        }
        if (toDate) {
          payments = payments.filter(p => new Date(p.payment_date) <= toDate)
          expenses = expenses.filter(e => new Date(e.expense_date) <= toDate)
        }
      }

      setPLData({ collections: payments, expenses: expenses, activeTab: 'collection' })
    } catch (error) {
      console.error('Error fetching P&L data:', error)
      toast.error('Failed to load P&L data')
    }
  }

  useEffect(() => {
    if (showCollectionReport) {
      fetchYearlyData()
    }
  }, [showCollectionReport, selectedYear])

  useEffect(() => {
    if (showPLReport) {
      fetchPLData()
    }
  }, [showPLReport, plFilters])

  const generateReport = async () => {
    try {
      setLoading(true)
      let response
      const reportFilters = { ...filters, org_id: selectedOrg.id }
      switch (reportType) {
        case 'payments':
          response = await reportsAPI.getPayments(reportFilters)
          break
        case 'members':
          response = await reportsAPI.getMembers(reportFilters)
          break
        // case 'attendance':
        //   response = await reportsAPI.getAttendance(reportFilters)
        //   break
        case 'revenue':
          response = await reportsAPI.getRevenue(reportFilters)
          break
        default:
          response = { success: false }
      }
      
      if (response.success && response.data) {
        setReportData(response.data)
        toast.success('Report generated')
      } else {
        toast.error('Failed to generate report')
      }
    } catch (error) {
      toast.error('Error generating report')
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const maxAmount = Math.max(...yearlyData.map(d => d.amount), 1)
  const totalYearlyRevenue = yearlyData.reduce((sum, d) => sum + d.amount, 0)
  const totalYearlyPayments = yearlyData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Generate and view detailed reports</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowPLReport(!showPLReport)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 btn-danger rounded-lg shadow-sm text-sm font-semibold"
          >
            <IndianRupee className="w-5 h-5" />
            {showPLReport ? 'Hide P&L Report' : 'P&L Report'}
          </button>
          <button
            onClick={() => setShowCollectionReport(!showCollectionReport)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 btn-primary rounded-lg shadow-sm text-sm font-semibold"
          >
            <BarChart3 className="w-5 h-5" />
            {showCollectionReport ? 'Hide Collection Report' : 'Collection Report'}
          </button>
        </div>
      </div>

      {/* P&L Report */}
      {showPLReport && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-4 sm:p-6">
          {/* Header */}
          <div className="bg-gradient-danger rounded-lg p-4 sm:p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">P&L Report</h2>
              <IndianRupee className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold mb-2">
                Net Profit: {formatCurrency(plData.collections.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) - plData.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0))}
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base">
                <span>Collection: {formatCurrency(plData.collections.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}</span>
                <span>|</span>
                <span>Expense: {formatCurrency(plData.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0))}</span>
              </div>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">From Date</label>
              <input
                type="date"
                value={plFilters.from_date}
                onChange={(e) => setPLFilters({ ...plFilters, from_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">To Date</label>
              <input
                type="date"
                value={plFilters.to_date}
                onChange={(e) => setPLFilters({ ...plFilters, to_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setPLFilters({ from_date: '', to_date: '' })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setPLData({ ...plData, activeTab: 'collection' })}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
                plData.activeTab === 'collection'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Collection
            </button>
            <button
              onClick={() => setPLData({ ...plData, activeTab: 'expense' })}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
                plData.activeTab === 'expense'
                  ? 'text-gray-600 border-b-2 border-gray-600 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Collection List */}
          {plData.activeTab === 'collection' && (
            <div className="space-y-2">
              {plData.collections.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No collections found</p>
                </div>
              ) : (
                plData.collections.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {format(new Date(payment.payment_date), 'dd MMM, yyyy')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{payment.member_name}</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Expense List */}
          {plData.activeTab === 'expense' && (
            <div className="space-y-2">
              {plData.expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No expenses found</p>
                </div>
              ) : (
                plData.expenses.map((expense, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {format(new Date(expense.expense_date), 'dd MMM, yyyy')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{expense.title || expense.description}</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Yearly Collection Graph */}
      {showCollectionReport && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-primary/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Yearly Collection Report</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Monthly revenue breakdown for {selectedYear}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-muted rounded-lg p-3 sm:p-4 border border-primary/20">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{formatCurrency(totalYearlyRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{totalYearlyPayments} payments</p>
            </div>
            <button
              onClick={() => {
                setSelectedPaymentMethod('cash')
                setShowPaymentMethodModal(true)
              }}
              className="bg-gradient-muted rounded-lg p-3 sm:p-4 border border-green-200 hover:shadow-lg transition-all cursor-pointer text-left"
            >
              <p className="text-xs sm:text-sm font-medium text-gray-600">Cash Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(paymentMethodData.cash.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}</p>
              <p className="text-xs text-gray-500 mt-1">{paymentMethodData.cash.length} transactions</p>
            </button>
            <button
              onClick={() => {
                setSelectedPaymentMethod('online')
                setShowPaymentMethodModal(true)
              }}
              className="bg-gradient-muted rounded-lg p-3 sm:p-4 border border-purple-200 hover:shadow-lg transition-all cursor-pointer text-left"
            >
              <p className="text-xs sm:text-sm font-medium text-gray-600">Online Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">{formatCurrency(paymentMethodData.online.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}</p>
              <p className="text-xs text-gray-500 mt-1">{paymentMethodData.online.length} transactions</p>
            </button>
          </div>

          {/* Pie Chart */}
          <div className="bg-gradient-muted rounded-lg p-4 sm:p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
              {/* Pie Chart SVG */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
                  {(() => {
                    const total = yearlyData.reduce((sum, d) => sum + d.amount, 0)
                    if (total === 0) return null
                    
                    let cumulativePercent = 0
                    const colors = [
                      '#2DB36C', '#4FC98A', '#F59E0B', '#EF4444', '#7C3AED', '#1F2933',
                      '#1F8F5F', '#16A34A', '#D97706', '#DC2626', '#6D28D9', '#6B7280'
                    ]
                    
                    return yearlyData.map((data, idx) => {
                      if (data.amount === 0) return null
                      
                      const percent = (data.amount / total) * 100
                      const startAngle = (cumulativePercent / 100) * 360
                      const endAngle = ((cumulativePercent + percent) / 100) * 360
                      
                      cumulativePercent += percent
                      
                      // Calculate path for pie slice
                      const startX = 100 + 90 * Math.cos((Math.PI * startAngle) / 180)
                      const startY = 100 + 90 * Math.sin((Math.PI * startAngle) / 180)
                      const endX = 100 + 90 * Math.cos((Math.PI * endAngle) / 180)
                      const endY = 100 + 90 * Math.sin((Math.PI * endAngle) / 180)
                      
                      const largeArcFlag = percent > 50 ? 1 : 0
                      
                      const pathData = [
                        `M 100 100`,
                        `L ${startX} ${startY}`,
                        `A 90 90 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        'Z'
                      ].join(' ')
                      
                      return (
                        <g key={idx} className="group cursor-pointer">
                          <path
                            d={pathData}
                            fill={colors[idx]}
                            className="transition-all duration-300 hover:opacity-80"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <title>{`${data.month}: ${formatCurrency(data.amount)} (${percent.toFixed(1)}%)`}</title>
                        </g>
                      )
                    })
                  })()}
                </svg>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(totalYearlyRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedYear}</p>
                </div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3 max-w-md">
                {yearlyData.map((data, idx) => {
                  const total = yearlyData.reduce((sum, d) => sum + d.amount, 0)
                  const percent = total > 0 ? ((data.amount / total) * 100).toFixed(1) : 0
                  const colors = [
                    'bg-primary', 'bg-success', 'bg-info', 'bg-accent', 'bg-warning', 'bg-danger',
                    'bg-neutral', 'bg-primary-dark', 'bg-success-dark', 'bg-info-dark', 'bg-accent-dark', 'bg-warning-dark'
                  ]
                  
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:shadow-sm transition-all">
                      <div className={`w-3 h-3 rounded-full ${colors[idx]} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{data.month}</p>
                        <p className="text-[10px] text-gray-500">{data.amount > 0 ? `${percent}%` : '0%'}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 whitespace-nowrap">{data.amount > 0 ? `${(data.amount / 1000).toFixed(0)}k` : '-'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Month Details */}
          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {yearlyData.map((data, idx) => (
              <div key={idx} className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all">
                <p className="text-xs font-semibold text-gray-600">{data.month}</p>
                <p className="text-base sm:text-lg font-bold text-primary mt-1 break-words">₹{data.amount.toLocaleString('en-IN')}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{data.count} payments</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && selectedPaymentMethod && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className={`p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-muted`}>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedPaymentMethod === 'cash' ? 'Cash Payments' : 'Online Payments'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPaymentMethod === 'cash' ? paymentMethodData.cash.length : paymentMethodData.online.length} transactions - 
                  Year {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {(selectedPaymentMethod === 'cash' ? paymentMethodData.cash : paymentMethodData.online).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-sm mt-2">No {selectedPaymentMethod} payment records</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedPaymentMethod === 'cash' ? paymentMethodData.cash : paymentMethodData.online).map((payment, idx) => (
                    <div key={payment.id || idx} className={`p-4 rounded-lg border hover:shadow-sm transition-all ${
                      selectedPaymentMethod === 'cash' 
                        ? 'bg-gradient-muted border-green-200' 
                        : 'bg-gradient-muted border-purple-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              selectedPaymentMethod === 'cash' ? 'bg-success text-white' : 'bg-accent text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{payment.member_name}</p>
                              <p className="text-xs text-gray-500">ID: {payment.member_id}</p>
                            </div>
                          </div>
                          <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium text-gray-900">
                                {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Type</p>
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                                payment.payment_type === 'enrollment' ? 'bg-info/10 text-info' :
                                payment.payment_type === 'subscription' ? 'bg-green-100 text-green-800' :
                                payment.payment_type === 'renewal' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.payment_type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-2xl font-bold ${
                            selectedPaymentMethod === 'cash' ? 'text-success' : 'text-accent'
                          }`}>
                            ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - Totals */}
            <div className={`p-6 border-t border-gray-200 ${
              selectedPaymentMethod === 'cash' ? 'bg-gradient-success' : 'bg-gradient-accent'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedPaymentMethod === 'cash' ? paymentMethodData.cash.length : paymentMethodData.online.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className={`text-3xl font-bold ${
                    selectedPaymentMethod === 'cash' ? 'text-success' : 'text-accent'
                  }`}>
                    ₹{(selectedPaymentMethod === 'cash' 
                      ? paymentMethodData.cash.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                      : paymentMethodData.online.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                    ).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              {reportTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input type="date" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input type="date" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
              <FileText className="w-5 h-5" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Results</h2>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="w-5 h-5" />Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <pre className="text-sm bg-gray-50 p-4 rounded">{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
