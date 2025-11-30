import { useState, useEffect } from 'react'
import { Users, CreditCard, TrendingUp, UserCheck, UserX, Clock, IndianRupee, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import { membersAPI, paymentsAPI, attendanceAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [memberStats, setMemberStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [membersStatsRes, paymentsStatsRes, attendanceStatsRes, recentPayments] = await Promise.all([
        membersAPI.getStats().catch(() => ({ success: false, data: null })),
        paymentsAPI.getStats().catch(() => ({ success: false, data: null })),
        attendanceAPI.getStats().catch(() => ({ success: false, data: null })),
        paymentsAPI.getAll({ limit: 5 }).catch(() => ({ success: false, data: [] }))
      ])

      if (membersStatsRes.success && membersStatsRes.data) {
        setMemberStats(membersStatsRes.data)
      }

      if (paymentsStatsRes.success && paymentsStatsRes.data) {
        setPaymentStats(paymentsStatsRes.data)
      }

      if (attendanceStatsRes.success && attendanceStatsRes.data) {
        setAttendanceStats(attendanceStatsRes.data)
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your library overview</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn btn-primary sm:w-auto"
        >
          Refresh Data
        </button>
      </div>

      {/* Member Stats */}
      {memberStats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {memberStats.total_members || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {memberStats.active_members || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Plans</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {memberStats.expired_members || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {memberStats.expiring_soon || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Stats */}
      {paymentStats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    ₹{(paymentStats.total_year || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This year</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ₹{(paymentStats.total_month || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Current month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {paymentStats.pending_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Payments</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Count</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {paymentStats.total_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All payments</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Stats */}
      {attendanceStats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today Present</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {attendanceStats.today_present || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today Absent</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {attendanceStats.today_absent || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {attendanceStats.month_count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rate</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {attendanceStats.average_rate ? `${attendanceStats.average_rate}%` : '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="/members"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-lg transition-all"
          >
            <Users className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-700 text-center">Add Member</span>
          </a>
          <a
            href="/payments"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-lg transition-all"
          >
            <CreditCard className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-700 text-center">Record Payment</span>
          </a>
          <a
            href="/attendance"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-lg transition-all"
          >
            <UserCheck className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-700 text-center">Mark Attendance</span>
          </a>
          <a
            href="/reports"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-lg transition-all"
          >
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-700 text-center">View Reports</span>
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
    </div>
  )
}

export default Dashboard
