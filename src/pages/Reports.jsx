import { useState } from 'react'
import { reportsAPI } from '../services/api'
import { FileText, Download, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const Reports = () => {
  const [reportType, setReportType] = useState('payments')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({ from_date: '', to_date: '' })

  const reportTypes = [
    { value: 'payments', label: 'Payment Report' },
    { value: 'members', label: 'Members Report' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'revenue', label: 'Revenue Report' }
  ]

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

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
