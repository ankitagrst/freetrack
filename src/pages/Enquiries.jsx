import { useState, useEffect } from 'react'
import { enquiriesAPI, plansAPI } from '../services/api'
import { useLibrary } from '../context/LibraryContext'
import { Mail, MessageSquare, Plus, Edit, Trash2, Phone, Calendar, User, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const Enquiries = () => {
  const { selectedLibrary } = useLibrary()
  const [enquiries, setEnquiries] = useState([])
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentEnquiry, setCurrentEnquiry] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    enquiry_date: new Date().toISOString().split('T')[0],
    interested_plan: '',
    message: '',
    status: 'new',
    follow_up_date: '',
    notes: ''
  })

  useEffect(() => {
    if (selectedLibrary?.id) {
      fetchData()
    }
  }, [selectedLibrary])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [enquiriesRes, plansRes, statsRes] = await Promise.all([
        enquiriesAPI.getAll({ library_id: selectedLibrary.id }).catch(() => ({ success: false, data: [] })),
        plansAPI.getAll({ library_id: selectedLibrary.id }).catch(() => ({ success: false, data: [] })),
        enquiriesAPI.getStats({ library_id: selectedLibrary.id }).catch(() => ({ success: false, data: null }))
      ])
      
      let enquiriesList = []
      if (enquiriesRes.success && enquiriesRes.data?.enquiries) {
        enquiriesList = enquiriesRes.data.enquiries
      } else if (Array.isArray(enquiriesRes.data)) {
        enquiriesList = enquiriesRes.data
      }
      
      let plansList = []
      if (plansRes.success && plansRes.data?.plans) {
        plansList = plansRes.data.plans
      } else if (Array.isArray(plansRes.data)) {
        plansList = plansRes.data
      }
      
      let statsData = null
      if (statsRes.success && statsRes.data) {
        statsData = statsRes.data
      }
      
      setEnquiries(enquiriesList)
      setPlans(plansList)
      setStats(statsData)
    } catch (error) {
      setEnquiries([])
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentEnquiry) {
        await enquiriesAPI.update(currentEnquiry.id, formData)
        toast.success('Enquiry updated successfully')
      } else {
        await enquiriesAPI.create({ ...formData, library_id: selectedLibrary.id })
        toast.success('Enquiry created successfully')
      }
      fetchData()
      closeModal()
    } catch (error) {
      toast.error('Failed to save enquiry')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return
    try {
      await enquiriesAPI.delete(id)
      toast.success('Enquiry deleted successfully')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete enquiry')
    }
  }

  const openModal = (enquiry = null) => {
    if (enquiry) {
      setCurrentEnquiry(enquiry)
      setFormData({
        full_name: enquiry.full_name,
        email: enquiry.email || '',
        phone: enquiry.phone,
        enquiry_date: enquiry.enquiry_date,
        interested_plan: enquiry.interested_plan || '',
        message: enquiry.message || '',
        status: enquiry.status,
        follow_up_date: enquiry.follow_up_date || '',
        notes: enquiry.notes || ''
      })
    } else {
      setCurrentEnquiry(null)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        enquiry_date: new Date().toISOString().split('T')[0],
        interested_plan: '',
        message: '',
        status: 'new',
        follow_up_date: '',
        notes: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentEnquiry(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'follow_up': return 'bg-purple-100 text-purple-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'not_interested': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-600 mt-1">Manage and track potential member enquiries</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Enquiry
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="stats-card stats-card-primary">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Total</p>
                <p className="stats-card-value">{stats.total || 0}</p>
              </div>
              <div className="stats-card-icon">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="stats-card stats-card-primary">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">New</p>
                <p className="stats-card-value">{stats.new_enquiries || 0}</p>
              </div>
              <div className="stats-card-icon">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="stats-card stats-card-success">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Converted</p>
                <p className="stats-card-value">{stats.converted || 0}</p>
              </div>
              <div className="stats-card-icon">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="stats-card stats-card-info">
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">This Month</p>
                <p className="stats-card-value">{stats.this_month || 0}</p>
              </div>
              <div className="stats-card-icon">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiries List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading enquiries...</p>
            </div>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No enquiries yet</p>
            <p className="text-sm">Add your first enquiry to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">Message</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{enq.full_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        {enq.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{enq.phone}</div>}
                        {enq.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{enq.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      <div className="max-w-xs truncate">{enq.message || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${getStatusColor(enq.status)}`}>
                        {enq.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {new Date(enq.enquiry_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(enq)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(enq.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
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
        <div className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentEnquiry ? 'Edit Enquiry' : 'Add New Enquiry'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enquiry Date</label>
                  <input
                    type="date"
                    value={formData.enquiry_date}
                    onChange={(e) => setFormData({...formData, enquiry_date: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Interested Plan</label>
                  <select
                    value={formData.interested_plan}
                    onChange={(e) => setFormData({...formData, interested_plan: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - ₹{plan.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="converted">Converted</option>
                    <option value="not_interested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Follow Up Date</label>
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="input resize-none"
                  rows="3"
                  placeholder="Enquiry message or requirements"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input resize-none"
                  rows="2"
                  placeholder="Internal notes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                >
                  {currentEnquiry ? 'Update' : 'Create'} Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Enquiries
