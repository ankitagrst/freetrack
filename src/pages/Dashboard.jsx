import { useState, useEffect } from 'react'
import { Users, CreditCard, TrendingUp, UserCheck, UserX, Clock, IndianRupee, AlertCircle, Calendar, Plus, IdCard, X, Check, CheckCircle2, Sofa, Sparkles, UserMinus } from 'lucide-react'
import { membersAPI, paymentsAPI, attendanceAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency, formatNumber } from '../utils/formatters'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Dashboard = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library' || orgType === 'tution' || orgType === 'organization'
  
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

  const [loading, setLoading] = useState(true)
  const [memberStats, setMemberStats] = useState(null)
  const [orgInfo, setOrgInfo] = useState(null)
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
    if (selectedOrg?.id) {
      fetchDashboardData()
    }
  }, [selectedOrg])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const params = { org_id: selectedOrg.id }
      
      const [membersStatsRes, orgInfoRes, paymentsStatsRes, attendanceStatsRes, recentPayments, monthlyStats] = await Promise.all([
        membersAPI.getStats(params).catch(() => ({ success: false, data: null })),
        membersAPI.getOrgInfo(params).catch(() => ({ success: false, data: null })),
        paymentsAPI.getStats(params).catch(() => ({ success: false, data: null })),
        attendanceAPI.getStats(params).catch(() => ({ success: false, data: null })),
        paymentsAPI.getAll({ ...params, limit: 5 }).catch(() => ({ success: false, data: [] })),
        paymentsAPI.getMonthlyStats(params).catch(() => ({ success: false, data: [] }))
      ])

      if (membersStatsRes.success && membersStatsRes.data) {
        console.log('Member Stats Response:', membersStatsRes.data)
        setMemberStats(membersStatsRes.data)
      }

      if (orgInfoRes.success && orgInfoRes.data) {
        setOrgInfo(orgInfoRes.data)
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
      const response = await membersAPI.getAll({ org_id: selectedOrg.id })
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
      const response = await paymentsAPI.getAll({ org_id: selectedOrg.id })
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
      case 'enrollment': return 'bg-info/10 text-info'
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

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    console.log('Selected Org:', selectedOrg)
    console.log('Subscription End Date:', selectedOrg?.subscription_end_date)
    
    if (!selectedOrg?.subscription_end_date) {
      console.log('No subscription_end_date found')
      return null
    }
    
    const today = new Date()
    const endDate = new Date(selectedOrg.subscription_end_date)
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    console.log('Days until expiry:', diffDays)
    return diffDays
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
  
  console.log('Days until expiry:', daysUntilExpiry, 'Expiring soon:', isExpiringSoon, 'Expired:', isExpired)

  return (
    <div className="space-y-6">
      {/* Expiry Warning */}
      {isExpired && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">
                Subscription Expired
              </h3>
              <p className="text-sm text-red-700">
                Your subscription expired {Math.abs(daysUntilExpiry)} day{Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago. 
                Please contact the administrator to renew your subscription and continue using the system.
              </p>
            </div>
          </div>
        </div>
      )}

      {isExpiringSoon && !isExpired && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-yellow-600 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-1">
                Subscription Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700">
                Your subscription will expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} 
                {selectedOrg?.subscription_end_date && (
                  <> on {format(new Date(selectedOrg.subscription_end_date), 'MMM dd, yyyy')}</>
                )}. 
                Please contact the administrator to renew.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-primary rounded-xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to {selectedOrg?.name || 'FeeTrack'}! 👋</h1>
            <p className="text-white/80 text-sm sm:text-base">Manage your {getOrgLabel()} efficiently with our comprehensive dashboard</p>
          </div>
          <a
            href="/members"
            className="btn bg-white text-primary hover:bg-gray-100 w-full sm:w-auto text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New {getMemberLabel()}
          </a>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Here's your {getOrgLabel()} overview</p>
        </div>
      </div>

      {/* Member Stats */}
      {memberStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{getMemberLabel()} Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => handleMemberStatClick('total')}
              className="stats-card stats-card-primary hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer text-left"
            >
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Total {getMemberLabel()}s</p>
                  <p className="stats-card-value">
                    {memberStats.total_members || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <Users className="w-7 h-7" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('active')}
              className="stats-card stats-card-success hover:shadow-lg hover:border-green-300 transition-all cursor-pointer text-left"
            >
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Active {getMemberLabel()}s</p>
                  <p className="stats-card-value">
                    {memberStats.active_members || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <UserCheck className="w-7 h-7" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('expired')}
              className="stats-card stats-card-danger hover:shadow-lg hover:border-red-300 transition-all cursor-pointer text-left"
            >
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Expired {getMemberLabel()}s</p>
                  <p className="stats-card-value">
                    {memberStats.expired_members || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <UserX className="w-7 h-7" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMemberStatClick('expiring')}
              className="stats-card stats-card-warning hover:shadow-lg hover:border-yellow-300 transition-all cursor-pointer text-left"
            >
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Expiring Soon</p>
                  <p className="stats-card-value">
                    {memberStats.expiring_soon || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <Clock className="w-7 h-7" />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Seat Utilization - Only for Libraries and Tuition Centers */}
      {isLibrary && orgInfo && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Seat Utilization</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-primary/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Seats</p>
                  <p className="text-3xl font-bold text-primary mt-1">{orgInfo.seat_limit || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sofa className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{orgInfo.seats_occupied || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{orgInfo.seats_available || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Occupancy Rate</span>
              <span className="text-sm font-bold text-primary">{orgInfo.seat_utilization_percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${orgInfo.seat_utilization_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Tracking */}  
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Collection Tracking</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Collection */}
          <div className="bg-gradient-success rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Today Collection</h3>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
            <p className="text-5xl font-bold mb-2">{formatCurrency(todayCollection)}</p>
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
                    className="w-full flex items-center justify-between p-4 bg-gradient-muted rounded-lg border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
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
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(month.total || 0)}
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

      {/* Payment Stats */}
      {paymentStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="stats-card stats-card-success">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Total Revenue</p>
                  <p className="stats-card-value">
                    {formatCurrency(paymentStats.total_year || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This year</p>
                </div>
                <div className="stats-card-icon">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-primary">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">This Month</p>
                  <p className="stats-card-value">
                    {formatCurrency(paymentStats.total_month || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Current month</p>
                </div>
                <div className="stats-card-icon">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-warning">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Pending</p>
                  <p className="stats-card-value">
                    {paymentStats.pending_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Payments</p>
                </div>
                <div className="stats-card-icon">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-info">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Total Count</p>
                  <p className="stats-card-value">
                    {paymentStats.total_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All payments</p>
                </div>
                <div className="stats-card-icon">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Stats */}
      {attendanceStats && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="stats-card stats-card-success">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Today Present</p>
                  <p className="stats-card-value">
                    {attendanceStats.today_present || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-danger">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Today Absent</p>
                  <p className="stats-card-value">
                    {attendanceStats.today_absent || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <UserX className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-primary">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">This Month</p>
                  <p className="stats-card-value">
                    {attendanceStats.month_count || 0}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card-info">
              <div className="stats-card-header">
                <div className="stats-card-content">
                  <p className="stats-card-label">Avg Rate</p>
                  <p className="stats-card-value">
                    {attendanceStats.average_rate ? `${attendanceStats.average_rate}%` : '0%'}
                  </p>
                </div>
                <div className="stats-card-icon">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Horizontal Scroll */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <a
            href="/members"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-primary border-2 border-primary/30 rounded-lg transition-all min-w-[200px] text-white"
          >
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold">Profile</span>
          </a>
          <a
            href="/members"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-accent border-2 border-accent/30 rounded-lg transition-all min-w-[200px] text-white"
          >
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <IdCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold">ID Card</span>
          </a>
          <a
            href="/payments"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-success border-2 border-success/30 rounded-lg transition-all min-w-[200px] text-white"
          >
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold">Invoice</span>
          </a>
          <a
            href="/reports"
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-gradient-info border-2 border-info/30 rounded-lg transition-all min-w-[200px] text-white"
          >
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold">Reports</span>
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
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">{payment.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Payment Details Modal */}
      {showMonthModal && selectedMonth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-primary text-white relative">
              <h2 className="text-2xl font-bold">{selectedMonth.month_name}</h2>
              <p className="text-white/90 text-sm font-medium mt-0.5">Payment Details - Year {selectedMonth.year}</p>
              <button
                onClick={() => setShowMonthModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
              {monthPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium">No payments found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {monthPayments.map((payment, idx) => (
                    <div key={payment.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      {/* Member Info & Amount */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{payment.member_name}</h3>
                            <p className="text-primary text-xs font-semibold capitalize">{payment.payment_method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-primary">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="font-medium capitalize">{payment.payment_method}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-green-100 text-[#15803d] px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span className="capitalize">{payment.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Payments</p>
                  <p className="text-lg font-bold text-gray-900">{monthPayments.length} transaction{monthPayments.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs font-medium">Total Amount</p>
                  <p className="text-2xl font-black text-primary">
                    {formatCurrency(monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Stats Modal */}
      {showMemberModal && selectedMemberType && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-primary text-white">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedMemberType === 'total' && `All ${getMemberLabel()}s`}
                  {selectedMemberType === 'active' && `Active ${getMemberLabel()}s`}
                  {selectedMemberType === 'expired' && `Expired ${getMemberLabel()}s`}
                  {selectedMemberType === 'expiring' && `${getMemberLabel()}s Expiring Soon`}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">{filteredMembers.length} {getMemberLabel().toLowerCase()}s found</p>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50/50">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium">No members found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 group-hover:scale-110 transition-transform">
                          {member.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-gray-900 truncate text-base">{member.name}</p>
                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg ${
                              member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                            <IdCard className="w-3 h-3" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                              {member.member_code || `MEM-${member.id}`}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                              <p className="text-xs font-black text-gray-900 truncate">{member.phone}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expiry</p>
                              <p className={`text-xs font-black ${member.plan_status === 'expired' ? 'text-red-500' : 'text-gray-900'}`}>
                                {member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yy') : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {member.plan_status && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                                member.plan_status === 'active' ? 'bg-primary/10 text-primary' : 
                                member.plan_status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${
                                  member.plan_status === 'active' ? 'bg-primary' : 
                                  member.plan_status === 'expiring_soon' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`} />
                                {member.plan_status.replace('_', ' ')}
                              </span>
                            </div>
                          )}
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
