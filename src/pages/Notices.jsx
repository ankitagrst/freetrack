import { useState, useEffect } from 'react'
import { noticesAPI } from '../services/api'
import { useLibrary } from '../context/LibraryContext'
import { Plus, Bell, Edit, Trash2, AlertCircle, Info, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const Notices = () => {
  const { selectedLibrary } = useLibrary()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentNotice, setCurrentNotice] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notice_type: 'general',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_audience: 'all',
    is_active: 1
  })

  useEffect(() => {
    if (selectedLibrary?.id) {
      fetchNotices()
    }
  }, [selectedLibrary])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await noticesAPI.getAll({ library_id: selectedLibrary.id }).catch(() => ({ success: false, data: [] }))
      let noticesList = []
      if (response.success && response.data?.notices) {
        noticesList = response.data.notices
      } else if (Array.isArray(response.data)) {
        noticesList = response.data
      }
      setNotices(noticesList)
    } catch (error) {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentNotice) {
        await noticesAPI.update(currentNotice.id, formData)
        toast.success('Notice updated successfully')
      } else {
        await noticesAPI.create({ ...formData, library_id: selectedLibrary.id })
        toast.success('Notice created successfully')
      }
      fetchNotices()
      closeModal()
    } catch (error) {
      toast.error('Failed to save notice')
    }
  }

  const openModal = (notice = null) => {
    if (notice) {
      setCurrentNotice(notice)
      setFormData({
        title: notice.title,
        content: notice.content,
        notice_type: notice.notice_type || 'general',
        start_date: notice.start_date,
        end_date: notice.end_date || '',
        target_audience: notice.target_audience || 'all',
        is_active: notice.is_active || 1
      })
    } else {
      setCurrentNotice(null)
      setFormData({
        title: '',
        content: '',
        notice_type: 'general',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        target_audience: 'all',
        is_active: 1
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentNotice(null)
  }

  const getNoticeIcon = (type) => {
    switch(type) {
      case 'urgent': return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'important': return <AlertCircle className="w-6 h-6 text-orange-600" />
      default: return <Bell className="w-6 h-6 text-blue-600" />
    }
  }

  const getNoticeColor = (type) => {
    switch(type) {
      case 'urgent': return 'border-l-4 border-red-600 bg-red-50'
      case 'important': return 'border-l-4 border-orange-600 bg-orange-50'
      default: return 'border-l-4 border-blue-600'
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return
    try {
      await noticesAPI.delete(id)
      toast.success('Notice deleted')
      fetchNotices()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-600 mt-1">Manage library notices and important announcements</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Notice
        </button>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading notices...</p>
            </div>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notices Yet</h3>
            <p className="text-gray-600 mb-6">Create your first notice to keep members informed</p>
            <button 
              onClick={() => openModal()} 
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Notice
            </button>
          </div>
        ) : (
          notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`bg-white rounded-lg shadow-sm border p-6 ${getNoticeColor(notice.notice_type)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {getNoticeIcon(notice.notice_type)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">{notice.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                        notice.notice_type === 'urgent' ? 'bg-red-100 text-red-800' :
                        notice.notice_type === 'important' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notice.notice_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{notice.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notice.start_date).toLocaleDateString('en-IN')}
                        {notice.end_date && ` - ${new Date(notice.end_date).toLocaleDateString('en-IN')}`}
                      </div>
                      <span>•</span>
                      <span>{notice.target_audience === 'all' ? 'All Members' : notice.target_audience}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(notice)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentNotice ? 'Edit Notice' : 'Create New Notice'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  className="input" 
                  placeholder="Notice title"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                <textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  className="input resize-none" 
                  rows="5"
                  placeholder="Notice content..."
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notice Type *</label>
                  <select 
                    value={formData.notice_type} 
                    onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })} 
                    className="input"
                  >
                    <option value="general">General</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                  <select 
                    value={formData.target_audience} 
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} 
                    className="input"
                  >
                    <option value="all">All Members</option>
                    <option value="members">Members Only</option>
                    <option value="staff">Staff Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input 
                    type="date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                    className="input"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    className="input"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active == 1}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Active Notice</span>
                    <span className="text-xs text-gray-600">Display this notice to members</span>
                  </div>
                </label>
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
                  {currentNotice ? 'Update' : 'Create'} Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notices
