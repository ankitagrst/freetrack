import { useState, useEffect } from 'react'
import { attendanceAPI, membersAPI } from '../services/api'
import { UserCheck, UserX, Search, Calendar, Edit, Trash2, Clock, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Attendance = () => {
  const [attendance, setAttendance] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [attendanceRes, membersRes, statsRes] = await Promise.all([
        attendanceAPI.getAll({ 
          from_date: selectedDate, 
          to_date: selectedDate 
        }).catch(err => {
          console.error('Attendance fetch error:', err)
          return { success: false, data: [] }
        }),
        membersAPI.getAll({ status: 'active' }).catch(err => {
          console.error('Members fetch error:', err)
          return { success: false, data: [] }
        }),
        attendanceAPI.getStats().catch(err => {
          console.error('Stats fetch error:', err)
          return { success: false, data: null }
        })
      ])
      
      console.log('Attendance response:', attendanceRes)
      console.log('Members response:', membersRes)
      console.log('Stats response:', statsRes)
      
      // Handle attendance response
      let attendanceList = []
      if (attendanceRes.success && attendanceRes.data?.attendance) {
        attendanceList = attendanceRes.data.attendance
      } else if (attendanceRes.success && Array.isArray(attendanceRes.data)) {
        attendanceList = attendanceRes.data
      } else if (Array.isArray(attendanceRes.data)) {
        attendanceList = attendanceRes.data
      } else if (Array.isArray(attendanceRes)) {
        attendanceList = attendanceRes
      }
      
      // Handle members response - improved parsing
      let membersList = []
      if (membersRes.success && membersRes.data?.members) {
        membersList = membersRes.data.members
      } else if (membersRes.success && membersRes.data?.items) {
        membersList = membersRes.data.items
      } else if (membersRes.data?.members) {
        membersList = membersRes.data.members
      } else if (membersRes.data?.items) {
        membersList = membersRes.data.items
      } else if (Array.isArray(membersRes.data)) {
        membersList = membersRes.data
      } else if (Array.isArray(membersRes)) {
        membersList = membersRes
      }
      
      console.log('Parsed members list:', membersList, 'Count:', membersList.length)
      
      console.log('Parsed members list:', membersList, 'Count:', membersList.length)
      
      // Handle stats response
      let statsData = null
      if (statsRes.success && statsRes.data) {
        statsData = statsRes.data
      } else if (statsRes.data) {
        statsData = statsRes.data
      }
      
      setAttendance(attendanceList)
      setMembers(membersList)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load attendance data')
      setAttendance([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    try {
      await attendanceAPI.mark({
        member_id: selectedMember,
        date: selectedDate,
        status: 'present',
        marked_at: new Date().toISOString()
      })
      toast.success('Attendance marked successfully')
      fetchData()
      setShowMarkModal(false)
      setSelectedMember('')
    } catch (error) {
      toast.error('Failed to mark attendance')
    }
  }

  const isMarked = (memberId) => {
    return attendance.some(a => a.member_id == memberId)
  }

  const getAttendanceForMember = (memberId) => {
    return attendance.find(a => a.member_id == memberId)
  }

  const handleDelete = async (attendanceId) => {
    if (!confirm('Remove this attendance record?')) return
    try {
      await attendanceAPI.delete(attendanceId)
      toast.success('Attendance removed successfully')
      fetchData()
    } catch (error) {
      toast.error('Failed to remove attendance')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track member attendance</p>
        </div>
        <button onClick={() => setShowMarkModal(true)} className="btn btn-primary flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Mark Attendance
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today Present</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {attendance.filter(a => a.status === 'present').length}
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
                  {members.length - attendance.filter(a => a.status === 'present').length}
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
                  {stats.monthly_count || 0}
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
                <p className="text-sm font-medium text-gray-600">Avg. Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.attendance_rate || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input max-w-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Members Attendance View */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Attendance for {format(new Date(selectedDate), 'dd MMM yyyy')}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Members</h3>
            <p className="text-gray-600">No active members found to track attendance</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const marked = isMarked(member.id)
              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border-2 ${
                    marked 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{member.full_name}</h4>
                      <p className="text-sm text-gray-600">{member.member_code}</p>
                    </div>
                    <div>
                      {marked ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <UserCheck className="w-5 h-5" />
                          <span className="text-sm font-medium">Present</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <UserX className="w-5 h-5" />
                          <span className="text-sm font-medium">Absent</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => {
                  const attendanceRecord = getAttendanceForMember(member.id)
                  const marked = !!attendanceRecord
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {member.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.member_code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {marked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <UserCheck className="w-3 h-3" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <UserX className="w-3 h-3" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {marked && attendanceRecord.marked_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(attendanceRecord.marked_at).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {marked && attendanceRecord ? (
                          <button
                            onClick={() => handleDelete(attendanceRecord.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mark Attendance</h2>
            
            <form onSubmit={handleMarkAttendance} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Member *</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose a member</option>
                  {members.length === 0 ? (
                    <option value="" disabled>No members available</option>
                  ) : members.filter(m => !isMarked(m.id)).length === 0 ? (
                    <option value="" disabled>All members already marked</option>
                  ) : (
                    members.filter(m => !isMarked(m.id)).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.name} ({member.member_code || 'N/A'})
                      </option>
                    ))
                  )}
                </select>
                {members.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {members.filter(m => !isMarked(m.id)).length} of {members.length} members available
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Marking attendance for: <strong>{format(new Date(selectedDate), 'dd MMMM yyyy')}</strong></span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowMarkModal(false)
                    setSelectedMember('')
                  }} 
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Mark Present
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance
