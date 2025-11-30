import { useState, useEffect } from 'react'
import { seatsAPI, membersAPI } from '../services/api'
import { Plus, Users, CheckCircle, XCircle, Edit, Trash2, Armchair } from 'lucide-react'
import toast from 'react-hot-toast'

const Seats = () => {
  const [seats, setSeats] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, occupancy_rate: '0%' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create') // 'create' or 'allocate'
  const [currentSeat, setCurrentSeat] = useState(null)
  const [formData, setFormData] = useState({ 
    seat_number: '', 
    floor: '', 
    section: '',
    member_id: '' 
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [seatsRes, membersRes, statsRes] = await Promise.all([
        seatsAPI.getAll().catch(() => ({ success: false, data: [] })),
        membersAPI.getAll({ status: 'active' }).catch(() => ({ success: false, data: [] })),
        seatsAPI.getStats().catch(() => ({ success: false, data: {} }))
      ])
      
      let seatsList = []
      if (seatsRes.success && seatsRes.data?.seats) {
        seatsList = seatsRes.data.seats
      } else if (Array.isArray(seatsRes.data)) {
        seatsList = seatsRes.data
      }
      
      let membersList = []
      if (membersRes.success && membersRes.data?.members) {
        membersList = membersRes.data.members
      } else if (Array.isArray(membersRes.data)) {
        membersList = membersRes.data
      }
      
      setSeats(seatsList)
      setMembers(membersList)
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Error:', error)
      setSeats([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (modalType === 'create') {
        // Create new seat(s)
        const count = parseInt(formData.seat_number) || 1
        await seatsAPI.create({ 
          prefix: formData.floor || 'S',
          start: 1,
          count: count,
          floor: formData.floor,
          section: formData.section
        })
        toast.success(`${count} seat(s) created successfully`)
      } else {
        // Allocate seat to member
        await seatsAPI.allocate(currentSeat.id, { member_id: formData.member_id })
        toast.success('Seat allocated successfully')
      }
      fetchData()
      closeModal()
    } catch (error) {
      toast.error(modalType === 'create' ? 'Failed to create seats' : 'Failed to allocate seat')
    }
  }

  const handleDeallocate = async (seat) => {
    if (!confirm('Deallocate this seat?')) return
    try {
      // Find the member and update their seat_id to null
      if (seat.member_id) {
        await membersAPI.update(seat.member_id, { seat_id: null })
        toast.success('Seat deallocated successfully')
        // Wait a moment for DB to update, then refresh
        setTimeout(() => {
          fetchData()
        }, 300)
      }
    } catch (error) {
      console.error('Deallocate error:', error)
      toast.error('Failed to deallocate')
    }
  }

  const handleDelete = async (seatId) => {
    if (!confirm('Delete this seat permanently?')) return
    try {
      await seatsAPI.delete(seatId)
      toast.success('Seat deleted successfully')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete seat')
    }
  }

  const openCreateModal = () => {
    setModalType('create')
    setCurrentSeat(null)
    setFormData({ seat_number: '1', floor: '', section: '', member_id: '' })
    setShowModal(true)
  }

  const openAllocateModal = (seat) => {
    setModalType('allocate')
    setCurrentSeat(seat)
    setFormData({ seat_number: seat.seat_number, floor: '', section: '', member_id: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentSeat(null)
    setFormData({ seat_number: '', floor: '', section: '', member_id: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seats Management</h1>
          <p className="text-gray-600 mt-1">Manage library seats and allocations</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Seats
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Seats</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Armchair className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.available}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.occupied}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.occupancy_rate}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading seats...</p>
            </div>
          </div>
        ) : seats.length === 0 ? (
          <div className="text-center py-12">
            <Armchair className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Seats Yet</h3>
            <p className="text-gray-600 mb-6">Create seats to start managing allocations</p>
            <button 
              onClick={openCreateModal}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Seat
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {seats.map((seat) => {
              const isOccupied = seat.member_id != null && seat.member_id !== ''
              return (
                <div 
                  key={seat.id} 
                  className={`relative p-4 rounded-lg border-2 text-center transition-all ${
                    isOccupied 
                      ? 'bg-red-50 border-red-300 hover:shadow-md' 
                      : 'bg-green-50 border-green-300 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isOccupied && openAllocateModal(seat)}
                >
                  <div className="text-lg font-bold text-gray-900">{seat.seat_number}</div>
                  {seat.floor && (
                    <div className="text-xs text-gray-500">Floor: {seat.floor}</div>
                  )}
                  <div className="text-xs mt-1 font-medium">
                    {isOccupied ? (
                      <span className="text-red-600">{seat.member_name || 'Occupied'}</span>
                    ) : (
                      <span className="text-green-600">Available</span>
                    )}
                  </div>
                  {isOccupied && (
                    <div className="flex items-center gap-1 justify-center mt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeallocate(seat)
                        }}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                        title="Deallocate"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(seat.id)
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {!isOccupied && (
                    <div className="mt-2 text-xs text-gray-500">Click to allocate</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {modalType === 'create' ? 'Create New Seats' : `Allocate Seat ${currentSeat?.seat_number}`}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {modalType === 'create' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Seats *
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={formData.seat_number} 
                      onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })} 
                      className="input" 
                      placeholder="e.g., 10"
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">Seats will be auto-numbered</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Floor/Area
                    </label>
                    <input 
                      type="text" 
                      value={formData.floor} 
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })} 
                      className="input" 
                      placeholder="e.g., Ground Floor, 1st Floor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Section
                    </label>
                    <input 
                      type="text" 
                      value={formData.section} 
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })} 
                      className="input" 
                      placeholder="e.g., A, B, Reading Hall"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Member *
                  </label>
                  <select 
                    value={formData.member_id} 
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                    className="input"
                    required
                  >
                    <option value="">Choose a member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || m.name} {m.phone && `- ${m.phone}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {modalType === 'create' ? 'Create Seats' : 'Allocate Seat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Seats
