import { useState, useEffect } from 'react'
import { Plus, Users, Trash2, UserPlus, Phone, User as UserIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { waitingListAPI } from '../services/api'

const WaitingList = () => {
  const [waitingList, setWaitingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    notes: ''
  })

  useEffect(() => {
    fetchWaitingList()
  }, [])

  const fetchWaitingList = async () => {
    try {
      setLoading(true)
      const response = await waitingListAPI.getAll()
      if (response.success) {
        setWaitingList(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching waiting list:', error)
      toast.error('Failed to load waiting list')
      setWaitingList([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone number are required')
      return
    }

    try {
      const response = await waitingListAPI.create(formData)
      if (response.success) {
        toast.success('Added to waiting list successfully')
        fetchWaitingList()
        closeModal()
      }
    } catch (error) {
      console.error('Error adding to waiting list:', error)
      toast.error(error.response?.data?.message || 'Failed to add to waiting list')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove from waiting list?')) return
    
    try {
      const response = await waitingListAPI.delete(id)
      if (response.success) {
        toast.success('Removed from waiting list')
        fetchWaitingList()
      }
    } catch (error) {
      console.error('Error removing from waiting list:', error)
      toast.error('Failed to remove from waiting list')
    }
  }

  const handleConvertToMember = (person) => {
    // Navigate to members page with pre-filled data
    const memberData = {
      full_name: person.name,
      phone: person.phone,
      gender: person.gender
    }
    sessionStorage.setItem('newMemberData', JSON.stringify(memberData))
    window.location.href = '/members'
  }

  const openModal = () => {
    setFormData({ name: '', phone: '', gender: '', notes: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ name: '', phone: '', gender: '', notes: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Waiting List</h1>
          <p className="text-gray-600 mt-1">Manage prospective members waiting for seats</p>
        </div>
        <button
          onClick={openModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add to Waiting List
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-danger rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold opacity-90 mb-2">Total Waiting</p>
            <p className="text-5xl font-bold">{waitingList.length}</p>
            <p className="text-sm opacity-75 mt-2">People waiting for seats</p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Users className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Waiting List */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading waiting list...</p>
            </div>
          </div>
        ) : waitingList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No one waiting</h3>
            <p className="text-gray-600 mb-6">The waiting list is empty</p>
            <button
              onClick={openModal}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Person
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {waitingList.map((person) => (
                <div
                  key={person.id}
                  className="bg-gradient-muted rounded-lg p-4 sm:p-5 border-2 border-gray-200 hover:border-danger/40 hover:shadow-md transition-all"
                >
                  {/* Person Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-danger rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gender & Date */}
                  <div className="space-y-2 mb-4 text-sm">
                    {person.gender && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-semibold text-gray-900 capitalize">{person.gender}</span>
                      </div>
                    )}
                    {person.created_at && (
                      <div className="text-xs text-gray-500">
                        Added: {format(new Date(person.created_at), 'dd MMM, yyyy')}
                      </div>
                    )}
                    {person.notes && (
                      <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded border border-gray-200">
                        {person.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-300">
                    <button
                      onClick={() => handleConvertToMember(person)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Convert to Member
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to Waiting List Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add to Waiting List</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WaitingList
