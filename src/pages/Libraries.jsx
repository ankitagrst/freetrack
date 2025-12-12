import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Building2, MapPin, Phone, Mail, Users, CreditCard, X, Trash2, Lock, Unlock, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { librariesAPI, libraryOwnersAPI, subscriptionPlansAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'

const Libraries = () => {
  const [libraries, setLibraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentLibrary, setCurrentLibrary] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [libraryToDelete, setLibraryToDelete] = useState(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [userToBlock, setUserToBlock] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [formData, setFormData] = useState({
    library_name: '',
    library_code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    seat_limit: '',
    subscription_plan_id: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchLibraries()
    fetchSubscriptionPlans()
  }, [])

  const fetchLibraries = async () => {
    try {
      setLoading(true)
      const response = await librariesAPI.getAll()
      if (response.success) {
        setLibraries(response.data || [])
      }
    } catch (error) {
      toast.error('Failed to load libraries')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await subscriptionPlansAPI.getAll()
      if (response && response.success && Array.isArray(response.data)) {
        setSubscriptionPlans(response.data)
      } else if (Array.isArray(response)) {
        setSubscriptionPlans(response)
      }
    } catch (error) {
      console.error('Failed to load subscription plans:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentLibrary) {
        await librariesAPI.update(currentLibrary.id, formData)
        toast.success('Library updated successfully')
      } else {
        await librariesAPI.create(formData)
        toast.success('Library created successfully')
      }
      setShowModal(false)
      resetForm()
      fetchLibraries()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save library')
    }
  }

  const openModal = (library = null) => {
    if (library) {
      setCurrentLibrary(library)
      setFormData({
        library_name: library.library_name || '',
        library_code: library.library_code || '',
        address: library.address || '',
        city: library.city || '',
        state: library.state || '',
        pincode: library.pincode || '',
        seat_limit: library.seat_limit || '',
        subscription_plan_id: library.subscription_plan_id || ''
      })
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setCurrentLibrary(null)
    setFormData({
      library_name: '',
      library_code: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      seat_limit: '',
      subscription_plan_id: ''
    })
  }

  const handleDelete = async () => {
    if (!libraryToDelete) return
    
    try {
      await librariesAPI.delete(libraryToDelete.id)
      toast.success('Library deleted successfully')
      setShowDeleteModal(false)
      setLibraryToDelete(null)
      fetchLibraries()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete library')
    }
  }

  const openDeleteModal = (library) => {
    setLibraryToDelete(library)
    setShowDeleteModal(true)
  }

  const handleBlockUnblock = async () => {
    if (!userToBlock) return
    
    const isBlocking = userToBlock.user_status === 'active'
    
    try {
      await libraryOwnersAPI.updateStatus(userToBlock.id, isBlocking ? 'blocked' : 'active')
      toast.success(`User ${isBlocking ? 'blocked' : 'unblocked'} successfully`)
      setShowBlockModal(false)
      setUserToBlock(null)
      fetchLibraries()
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isBlocking ? 'block' : 'unblock'} user`)
    }
  }

  const openBlockModal = (library) => {
    setUserToBlock(library)
    setShowBlockModal(true)
  }

  const handleDeleteUser = async (library) => {
    if (!confirm(`Are you sure you want to permanently delete the user and library "${library.library_name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await libraryOwnersAPI.delete(library.id)
      toast.success('User and library deleted successfully')
      fetchLibraries()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const filteredLibraries = libraries.filter(library =>
    library.status === 'active' && (
      library.library_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      library.library_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      library.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Libraries</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all library locations under your account</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Library
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search libraries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Libraries</p>
              <p className="text-3xl font-bold text-primary mt-2">{filteredLibraries.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {filteredLibraries.reduce((sum, lib) => sum + (parseInt(lib.total_members) || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {formatCurrency(filteredLibraries.reduce((sum, lib) => sum + (parseFloat(lib.total_revenue) || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You can create and manage multiple libraries. Each library operates independently with its own members, payments, and settings. Select a library from the dropdown above to manage its data.
        </p>
      </div>

      {/* Libraries Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading your libraries...</p>
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Libraries Found</h3>
          <p className="text-gray-600 mb-6">Start by adding your first library location</p>
          <button
            onClick={() => openModal()}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Library
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLibraries.map((library) => (
            <div key={library.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{library.library_name}</h3>
                    <p className="text-sm text-gray-500">Code: {library.library_code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(library)}
                      className="text-gray-400 hover:text-primary p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Library"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {user?.role === 'system_admin' && (
                      <>
                        <button
                          onClick={() => openBlockModal(library)}
                          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                            library.user_status === 'active' 
                              ? 'text-orange-500 hover:text-orange-600' 
                              : 'text-green-500 hover:text-green-600'
                          }`}
                          title={library.user_status === 'active' ? 'Block User' : 'Unblock User'}
                        >
                          {library.user_status === 'active' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(library)}
                          className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User & Library"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDeleteModal(library)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Library"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{library.city}, {library.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{library.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{library.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Seats</p>
                    <p className="text-lg font-bold text-gray-900">{library.seat_limit || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Members</p>
                    <p className="text-lg font-bold text-green-600">{library.total_members || 0}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    library.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {library.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Library Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentLibrary ? 'Edit Library' : 'Add New Library'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Library Name *</label>
                  <input
                    type="text"
                    value={formData.library_name}
                    onChange={(e) => setFormData({...formData, library_name: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Library Code *</label>
                  <input
                    type="text"
                    value={formData.library_code}
                    onChange={(e) => setFormData({...formData, library_code: e.target.value})}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Seat Limit</label>
                  <input
                    type="number"
                    value={formData.seat_limit}
                    onChange={(e) => setFormData({...formData, seat_limit: e.target.value})}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Subscription Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subscription_plan_id}
                    onChange={(e) => setFormData({...formData, subscription_plan_id: e.target.value})}
                    className="input"
                  >
                    <option value="">Select a plan</option>
                    {subscriptionPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - {formatCurrency(plan.price)} ({plan.duration_months} months, {plan.seat_limit} seats)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose a subscription plan to set expiry date automatically</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {currentLibrary ? 'Update Library' : 'Add Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && libraryToDelete && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setLibraryToDelete(null); }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{libraryToDelete.library_name}</p>
                  <p className="text-sm text-gray-500">Code: {libraryToDelete.library_code}</p>
                </div>
              </div>
              <p className="text-gray-600">Are you sure you want to delete this library? This will mark it as inactive and cannot be undone.</p>
              {libraryToDelete.total_members > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Warning:</strong> This library has {libraryToDelete.total_members} active member(s). Deletion may be prevented.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setLibraryToDelete(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Delete Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirmation Modal */}
      {showBlockModal && userToBlock && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {userToBlock.user_status === 'active' ? 'Block User' : 'Unblock User'}
              </h3>
              <button
                onClick={() => { setShowBlockModal(false); setUserToBlock(null); }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userToBlock.user_status === 'active' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  {userToBlock.user_status === 'active' ? (
                    <Lock className="w-6 h-6 text-orange-600" />
                  ) : (
                    <Unlock className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userToBlock.library_name}</p>
                  <p className="text-sm text-gray-500">{userToBlock.email}</p>
                </div>
              </div>
              <p className="text-gray-600">
                {userToBlock.user_status === 'active' 
                  ? 'Are you sure you want to block this user? They will not be able to access the system.'
                  : 'Are you sure you want to unblock this user? They will regain access to the system.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowBlockModal(false); setUserToBlock(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUnblock}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold ${
                  userToBlock.user_status === 'active'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {userToBlock.user_status === 'active' ? 'Block User' : 'Unblock User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Libraries
