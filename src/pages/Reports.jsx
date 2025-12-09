import { useState, useEffect } from 'react'
import { reportsAPI, paymentsAPI, expensesAPI } from '../services/api'
import { FileText, Download, Calendar, TrendingUp, BarChart3, DollarSign, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Reports = () => {
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

  const reportTypes = [
    { value: 'payments', label: 'Payment Report' },
    { value: 'members', label: 'Members Report' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'revenue', label: 'Revenue Report' }
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const fetchYearlyData = async () => {
    try {
      const response = await paymentsAPI.getAll()
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
      
      allPayments.forEach(payment => {
        const date = new Date(payment.payment_date)
        if (date.getFullYear() === selectedYear) {
          const monthIdx = date.getMonth()
          monthlyData[monthIdx].amount += parseFloat(payment.amount || 0)
          monthlyData[monthIdx].count += 1
        }
      })
      
      setYearlyData(monthlyData)
    } catch (error) {
      console.error('Error fetching yearly data:', error)
      toast.error('Failed to load collection data')
    }
  }

  const fetchPLData = async () => {
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        paymentsAPI.getAll(),
        expensesAPI.getAll()
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
      switch (reportType) {
        case 'payments':
          response = await reportsAPI.getPayments(filters)
          break
        case 'members':
          response = await reportsAPI.getMembers(filters)
          break
        case 'attendance':
          response = await reportsAPI.getAttendance(filters)
          break
        case 'revenue':
          response = await reportsAPI.getRevenue(filters)
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 shadow-sm text-sm font-semibold"
          >
            <DollarSign className="w-5 h-5" />
            {showPLReport ? 'Hide P&L Report' : 'P&L Report'}
          </button>
          <button
            onClick={() => setShowCollectionReport(!showCollectionReport)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-sm text-sm font-semibold"
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
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-4 sm:p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">P&L Report</h2>
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold mb-2">
                Net Profit: ₹{(plData.collections.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) - plData.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base">
                <span>Collection: ₹{plData.collections.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString('en-IN')}</span>
                <span>|</span>
                <span>Expense: ₹{plData.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toLocaleString('en-IN')}</span>
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
                    <p className="text-lg sm:text-xl font-bold text-green-600">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</p>
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
                    <p className="text-lg sm:text-xl font-bold text-red-600">₹{parseFloat(expense.amount).toLocaleString('en-IN')}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Yearly Collection Graph */}
      {showCollectionReport && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
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
                className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">₹{totalYearlyRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{totalYearlyPayments}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Average/Month</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">₹{Math.round(totalYearlyRevenue / 12).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
              {/* Pie Chart SVG */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
                  {(() => {
                    const total = yearlyData.reduce((sum, d) => sum + d.amount, 0)
                    if (total === 0) return null
                    
                    let cumulativePercent = 0
                    const colors = [
                      '#facc15', '#fb923c', '#34d399', '#f472b6', '#60a5fa', '#f9a8d4',
                      '#94a3b8', '#d946ef', '#6366f1', '#a78bfa', '#22d3ee', '#2dd4bf'
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
                          <title>{`${data.month}: ₹${data.amount.toLocaleString('en-IN')} (${percent.toFixed(1)}%)`}</title>
                        </g>
                      )
                    })
                  })()}
                </svg>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">₹{totalYearlyRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedYear}</p>
                </div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3 max-w-md">
                {yearlyData.map((data, idx) => {
                  const total = yearlyData.reduce((sum, d) => sum + d.amount, 0)
                  const percent = total > 0 ? ((data.amount / total) * 100).toFixed(1) : 0
                  const colors = [
                    'bg-yellow-400', 'bg-orange-400', 'bg-green-400', 'bg-pink-400', 'bg-blue-400', 'bg-rose-400',
                    'bg-slate-400', 'bg-fuchsia-400', 'bg-indigo-400', 'bg-violet-400', 'bg-cyan-400', 'bg-teal-400'
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
              <div key={idx} className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                <p className="text-xs font-semibold text-gray-600">{data.month}</p>
                <p className="text-base sm:text-lg font-bold text-blue-600 mt-1 break-words">₹{data.amount.toLocaleString('en-IN')}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{data.count} payments</p>
              </div>
            ))}
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
