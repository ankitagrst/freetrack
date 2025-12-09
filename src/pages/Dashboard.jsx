import { useState, useEffect } from 'react'
import { Users, CreditCard, TrendingUp, UserCheck, UserX, Clock, IndianRupee, AlertCircle, Calendar, DollarSign, Plus, IdCard, X } from 'lucide-react'
import { membersAPI, paymentsAPI, attendanceAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [memberStats, setMemberStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [monthlyCollections, setMonthlyCollections] = useState([])
  const [todayCollection, setTodayCollection] = useState(0)
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [monthPayments, setMonthPayments] = useState([])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMemberType, setSelectedMemberType] = useState(null)
  const [filteredMembers, setFilteredMembers] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [membersStatsRes, paymentsStatsRes, attendanceStatsRes, recentPayments, monthlyStats] = await Promise.all([
        membersAPI.getStats().catch(() => ({ success: false, data: null })),
        paymentsAPI.getStats().catch(() => ({ success: false, data: null })),
        attendanceAPI.getStats().catch(() => ({ success: false, data: null })),
        paymentsAPI.getAll({ limit: 5 }).catch(() => ({ success: false, data: [] })),
        paymentsAPI.getMonthlyStats().catch(() => ({ success: false, data: [] }))
      ])

      if (membersStatsRes.success && membersStatsRes.data) {
        console.log('Member Stats Response:', membersStatsRes.data)
        setMemberStats(membersStatsRes.data)
      }

      if (paymentsStatsRes.success && paymentsStatsRes.data) {
        setPaymentStats(paymentsStatsRes.data)
        // Extract today's collection from payment stats
        setTodayCollection(paymentsStatsRes.data.total_today || 0)
      }

      if (attendanceStatsRes.success && attendanceStatsRes.data) {
        setAttendanceStats(attendanceStatsRes.data)
      }

      // Process monthly collections
      if (monthlyStats.success && monthlyStats.data) {
        console.log('Monthly Stats Response:', monthlyStats)
        const months = Array.isArray(monthlyStats.data) ? monthlyStats.data : monthlyStats.data.monthly || []
        console.log('Monthly Collections:', months)
        setMonthlyCollections(months.slice(0, 3)) // Last 3 months
      }

      // Process recent payments for activity
      let payments = []
      if (recentPayments.success && recentPayments.data?.payments) {
        payments = recentPayments.data.payments
      } else if (Array.isArray(recentPayments.data)) {
        payments = recentPayments.data
      }
      setRecentActivity(payments.slice(0, 5))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberStatClick = async (type) => {
    setSelectedMemberType(type)
    setShowMemberModal(true)
    
    try {
      const response = await membersAPI.getAll()
      console.log('Members API Response:', response)
      
      let members = []
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          members = response.data
        } else if (response.data.members && Array.isArray(response.data.members)) {
          members = response.data.members
        }
      }
      
      console.log('All Members:', members)
      
      // Filter based on type
      let filtered = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      switch(type) {
        case 'total':
          filtered = members
          break
        case 'active':
          // Active: status is active AND plan hasn't expired
          filtered = members.filter(m => {
            const planEndDate = new Date(m.plan_end_date)
            return m.status === 'active' && planEndDate >= today
          })
          break
        case 'expired':
          // Expired: plan_end_date is in the past
          filtered = members.filter(m => {
            if (!m.plan_end_date) return false
            const planEndDate = new Date(m.plan_end_date)
            return planEndDate < today
          })
          break
        case 'expiring':
          // Expiring Soon: plan ends within next 7 days
          filtered = members.filter(m => {
            if (!m.plan_end_date) return false
            const planEndDate = new Date(m.plan_end_date)
            const diffTime = planEndDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays >= 0 && diffDays <= 7
          })
          break
        default:
          filtered = members
      }
      
      console.log(`Filtered ${type} Members:`, filtered)
      setFilteredMembers(filtered)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    }
  }

  const handleMonthClick = async (month) => {
    setSelectedMonth(month)
    setShowMonthModal(true)
    
    try {
      // Fetch payments for this specific month
      const response = await paymentsAPI.getAll()
      console.log('Full API Response:', response)
      
      let allPayments = []
      
      // Extract payments array from response - check all possible structures
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          allPayments = response.data
          console.log('Using response.data (array):', allPayments)
        } else if (response.data.payments && Array.isArray(response.data.payments)) {
          allPayments = response.data.payments
          console.log('Using response.data.payments:', allPayments)
        } else if (response.data.data && Array.isArray(response.data.data)) {
          allPayments = response.data.data
          console.log('Using response.data.data:', allPayments)
        }
      } else if (response.payments && Array.isArray(response.payments)) {
        allPayments = response.payments
        console.log('Using response.payments:', allPayments)
      }
      
      console.log('All Payments:', allPayments)
      console.log('Selected Month:', month)
      
      // Filter payments for the selected month/year
      const filtered = allPayments.filter(payment => {
        const paymentDate = new Date(payment.payment_date)
        const paymentMonth = paymentDate.getMonth() + 1
        const paymentYear = paymentDate.getFullYear()
        
        console.log(`Payment ${payment.id}: ${paymentDate} -> Month ${paymentMonth}, Year ${paymentYear}`)
        
        return paymentMonth === month.month_number && paymentYear === month.year
      })
      
      console.log('Filtered Payments:', filtered)
      setMonthPayments(filtered)
    } catch (error) {
      console.error('Error fetching month payments:', error)
      toast.error('Failed to load payment details')
    }
  }

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'enrollment': return 'bg-blue-100 text-blue-800'
      case 'subscription': return 'bg-green-100 text-green-800'
      case 'renewal': return 'bg-purple-100 text-purple-800'
      case 'fine': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to FeeTrack! 👋</h1>
            <p className="text-blue-100 text-sm sm:text-base">Manage your library efficiently with our comprehensive dashboard</p>
          </div>
          <a
            href="/members"
            className="btn bg-white text-primary hover:bg-gray-100 w-full sm:w-auto text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Member
          </a>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Here's your library overview</p>
        </div>
      </div>

      {/* Member Stats */}
      {memberStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Member Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => handleMemberStatClick('total')}
              className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6 sm:p-8 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-3 break-words">
                    {memberStats.total_members || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('active')}
              className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 sm:p-8 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-3 break-words">
                    {memberStats.active_members || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('expired')}
              className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6 sm:p-8 hover:shadow-lg hover:border-red-300 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Expired Members</p>
                  <p className="text-3xl sm:text-4xl font-bold text-red-600 mt-3 break-words">
                    {memberStats.expired_members || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserX className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('expiring')}
              className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6 sm:p-8 hover:shadow-lg hover:border-yellow-300 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-3xl sm:text-4xl font-bold text-yellow-600 mt-3 break-words">
                    {memberStats.expiring_soon || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Payment Stats */}
      {paymentStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 sm:mt-2 break-words">
                    ₹{(paymentStats.total_year || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This year</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2 break-words">
                    ₹{(paymentStats.total_month || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Current month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-2 break-words">
                    {paymentStats.pending_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Payments</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Count</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                    {paymentStats.total_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All payments</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Tracking */}  
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Collection Tracking</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Collection */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Today Collection</h3>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
            <p className="text-5xl font-bold mb-2">₹{todayCollection.toLocaleString('en-IN')}</p>
            <p className="text-sm opacity-75">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
          </div>

          {/* Monthly Collections */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collections</h3>
              <div className="space-y-3">
              {monthlyCollections.length > 0 ? (
                monthlyCollections.map((month, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMonthClick(month)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {month.month_name || `Month ${idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Year {month.year || new Date().getFullYear()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        ₹{(month.total || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500">{month.count || 0} payments</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No collection data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      {/* {attendanceStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Today Present</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                    {attendanceStats.today_present || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Today Absent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                    {attendanceStats.today_absent || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
                    {attendanceStats.month_count || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                    {attendanceStats.average_rate ? `${attendanceStats.average_rate}%` : '0%'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Quick Actions - Horizontal Scroll */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <a
            href="/members"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-lg transition-all min-w-[200px]"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Profile</span>
          </a>
          <a
            href="/members"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-lg transition-all min-w-[200px]"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <IdCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">ID Card</span>
          </a>
          <a
            href="/payments"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 rounded-lg transition-all min-w-[200px]"
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Invoice</span>
          </a>
          <a
            href="/reports"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 rounded-lg transition-all min-w-[200px]"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Reports</span>
          </a>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Payments</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No recent payments</p>
            <p className="text-sm mt-2">Payment activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{payment.member_name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentTypeColor(payment.payment_type)}`}>
                      {payment.payment_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'} • {payment.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{payment.amount}</p>
                  <p className="text-xs text-gray-500">{payment.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Payment Details Modal */}
      {showMonthModal && selectedMonth && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMonth.month_name}</h2>
                <p className="text-sm text-gray-600 mt-1">Payment Details - Year {selectedMonth.year}</p>
              </div>
              <button
                onClick={() => setShowMonthModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {monthPayments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-sm mt-2">No payment records for this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {monthPayments.map((payment, idx) => (
                    <div key={payment.id} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{payment.member_name}</p>
                              <p className="text-xs text-gray-500">ID: {payment.member_id}</p>
                            </div>
                          </div>
                          <div className="ml-10 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium text-gray-900">
                                {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Method</p>
                              <p className="font-medium text-gray-900 capitalize">{payment.payment_method}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Type</p>
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentTypeColor(payment.payment_type)}`}>
                                {payment.payment_type}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-500">Status</p>
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-blue-600">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - Totals */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-lg font-bold text-gray-900">{monthPayments.length} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ₹{monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-center text-sm text-gray-500">
                  {selectedMonth.month_name} - Year {selectedMonth.year}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Stats Modal */}
      {showMemberModal && selectedMemberType && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMemberType === 'total' && 'All Members'}
                  {selectedMemberType === 'active' && 'Active Members'}
                  {selectedMemberType === 'expired' && 'Expired Members'}
                  {selectedMemberType === 'expiring' && 'Members Expiring Soon'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{filteredMembers.length} members found</p>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No members found</p>
                  <p className="text-sm mt-2">No members match this criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {member.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500">ID: {member.id}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                              member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status}
                            </span>
                            {member.plan_status && (
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                                member.plan_status === 'active' ? 'bg-blue-100 text-blue-800' : 
                                member.plan_status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {member.plan_status}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Phone: {member.phone}</p>
                            {member.plan_end_date && (
                              <p>Plan Ends: {format(new Date(member.plan_end_date), 'MMM dd, yyyy')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
