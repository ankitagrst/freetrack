import { useState, useEffect } from 'react'
import { adminAPI, subscriptionPlansAPI } from '../services/api'
import { Users, Building, AlertTriangle, Clock, DollarSign, TrendingUp, Plus, Search, Edit, Trash2, X, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('libraries') // 'libraries' or 'plans'
  const [stats, setStats] = useState(null)
  const [libraries, setLibraries] = useState([])
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'subscription', 'status', 'create', 'plan'
  const [selectedLibrary, setSelectedLibrary] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formData, setFormData] = useState({
    subscription_plan_id: '',
    subscription_start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  })
  const [planFormData, setPlanFormData] = useState({
    plan_name: '',
    plan_type: 'monthly',
    duration_months: 1,
    price: '',
    seat_limit: '',
    features: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, librariesRes, plansRes] = await Promise.all([
        adminAPI.getStats().catch(() => ({ success: false, data: null })),
        adminAPI.getLibraries().catch(() => ({ success: false, data: [] })),
        subscriptionPlansAPI.getAll().catch(() => ({ success: false, data: [] }))
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      if (librariesRes.success && librariesRes.data?.libraries) {
        setLibraries(librariesRes.data.libraries)
      }

      if (Array.isArray(plansRes)) {
        setSubscriptionPlans(plansRes)
      } else if (plansRes.success && plansRes.data) {
        setSubscriptionPlans(Array.isArray(plansRes.data) ? plansRes.data : [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const openSubscriptionModal = (library) => {
    setSelectedLibrary(library)
    setFormData({
      subscription_plan_id: library.subscription_plan_id || '',
      subscription_start_date: library.subscription_start_date || new Date().toISOString().split('T')[0],
      status: library.status
    })
    setModalType('subscription')
    setShowModal(true)
  }

  const openStatusModal = (library) => {
    setSelectedLibrary(library)
    setFormData({ ...formData, status: library.status })
    setModalType('status')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setSelectedLibrary(null)
  }

  const handleUpdateSubscription = async (e) => {
    e.preventDefault()
    try {
      await adminAPI.updateSubscription({
        library_id: selectedLibrary.id,
        subscription_plan_id: formData.subscription_plan_id,
        subscription_start_date: formData.subscription_start_date
      })
      toast.success('Subscription updated successfully')
      fetchData()
      closeModal()
    } catch (error) {
      toast.error('Failed to update subscription')
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    try {
      await adminAPI.updateStatus({
        library_id: selectedLibrary.id,
        status: formData.status
      })
      toast.success('Status updated successfully')
      fetchData()
      closeModal()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDeleteLibrary = async (id) => {
    if (!confirm('Are you sure you want to delete this library? This action cannot be undone.')) return
    try {
      await adminAPI.deleteLibrary(id)
      toast.success('Library deleted successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete library')
    }
  }

  const openPlanModal = (plan = null) => {
    if (plan) {
      setSelectedPlan(plan)
      setPlanFormData({
        plan_name: plan.plan_name,
        plan_type: plan.plan_type,
        duration_months: plan.duration_months,
        price: plan.price,
        seat_limit: plan.seat_limit,
        features: plan.features || ''
      })
      setModalType('editPlan')
    } else {
      setSelectedPlan(null)
      setPlanFormData({
        plan_name: '',
        plan_type: 'monthly',
        duration_months: 1,
        price: '',
        seat_limit: '',
        features: ''
      })
      setModalType('createPlan')
    }
    setShowModal(true)
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    try {
      if (modalType === 'createPlan') {
        await subscriptionPlansAPI.create(planFormData)
        toast.success('Subscription plan created successfully')
      } else {
        await subscriptionPlansAPI.update(selectedPlan.id, planFormData)
        toast.success('Subscription plan updated successfully')
      }
      fetchData()
      closeModal()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subscription plan')
    }
  }

  const handleDeletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan? Libraries using this plan will be affected.')) return
    try {
      await subscriptionPlansAPI.delete(id)
      toast.success('Subscription plan deleted successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan')
    }
  }

  const filteredLibraries = libraries.filter(library => {
    const matchesSearch = library.library_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      library.library_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      library.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || library.status === statusFilter
    const matchesPlan = planFilter === 'all' || library.subscription_plan_id === parseInt(planFilter)
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpired = (endDate) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  const daysUntilExpiry = (endDate) => {
    if (!endDate) return null
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage libraries and subscriptions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('libraries')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'libraries'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="w-5 h-5 inline-block mr-2" />
            Libraries Management
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'plans'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5 inline-block mr-2" />
            Subscription Plans
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'libraries' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Libraries</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_libraries || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Libraries</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_libraries || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.expiring_soon || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.expired_libraries || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_members || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">₹{stats.total_revenue || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {activeTab === 'libraries' && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search libraries by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Plans</option>
              {subscriptionPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'all' || planFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPlanFilter('all')
              }}
              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 self-start"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
      )}

      {/* Libraries Table */}
      {activeTab === 'libraries' && (
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading libraries...</p>
            </div>
          </div>
        ) : filteredLibraries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No libraries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Library</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Subscription</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Seats</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Expiry</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLibraries.map((library) => {
                  const days = daysUntilExpiry(library.subscription_end_date)
                  const expired = isExpired(library.subscription_end_date)
                  
                  return (
                    <tr key={library.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{library.library_name}</div>
                        <div className="text-sm text-gray-500">{library.library_code}</div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900">{library.email}</div>
                        <div className="text-sm text-gray-500">{library.phone}</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">{library.subscription_plan_name || 'No Plan'}</div>
                        <div className="text-sm text-gray-500">₹{library.subscription_price || 0}</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">{library.seats_occupied}/{library.seat_limit}</div>
                        <div className="text-xs text-gray-500">{library.member_count} members</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {library.subscription_end_date ? (
                          <div className={`text-sm ${expired ? 'text-red-600 font-semibold' : days <= 7 ? 'text-yellow-600 font-semibold' : 'text-gray-900'}`}>
                            {format(new Date(library.subscription_end_date), 'MMM dd, yyyy')}
                            {!expired && days !== null && (
                              <div className="text-xs text-gray-500">{days} days left</div>
                            )}
                            {expired && <div className="text-xs">Expired</div>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(library.status)}`}>
                          {library.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openSubscriptionModal(library)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manage Subscription"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openStatusModal(library)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Change Status"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLibrary(library.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Library"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Subscription Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Add Plan Button */}
          <div className="flex justify-end">
            <button onClick={() => openPlanModal()} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Plan
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 mt-4">Loading plans...</p>
                </div>
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No subscription plans found</p>
                <button onClick={() => openPlanModal()} className="btn btn-primary mt-4">
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Create First Plan
                </button>
              </div>
            ) : (
              subscriptionPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.plan_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{plan.plan_type}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-xl font-bold text-primary">₹{plan.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-semibold text-gray-900">{plan.duration_months} months</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Seat Limit</span>
                      <span className="text-sm font-semibold text-gray-900">{plan.seat_limit} seats</span>
                    </div>
                  </div>

                  {plan.features && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">Features</p>
                      <p className="text-sm text-gray-700">{plan.features}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openPlanModal(plan)}
                      className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="px-4 btn bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modalType === 'subscription' && 'Update Subscription'}
              {modalType === 'status' && 'Update Status'}
              {modalType === 'createPlan' && 'Create Subscription Plan'}
              {modalType === 'editPlan' && 'Edit Subscription Plan'}
            </h2>
            
            {modalType === 'subscription' ? (
              <form onSubmit={handleUpdateSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                  <select
                    required
                    value={formData.subscription_plan_id}
                    onChange={(e) => setFormData({ ...formData, subscription_plan_id: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select Plan</option>
                    {subscriptionPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - ₹{plan.price} ({plan.duration_months} months, {plan.seat_limit} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.subscription_start_date}
                    onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Subscription
                  </button>
                </div>
              </form>
            ) : modalType === 'status' ? (
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Status
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planFormData.plan_name}
                    onChange={(e) => setPlanFormData({ ...planFormData, plan_name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. Premium Plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type *</label>
                  <select
                    required
                    value={planFormData.plan_type}
                    onChange={(e) => setPlanFormData({ ...planFormData, plan_type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planFormData.duration_months}
                    onChange={(e) => setPlanFormData({ ...planFormData, duration_months: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. 12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. 15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seat Limit *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planFormData.seat_limit}
                    onChange={(e) => setPlanFormData({ ...planFormData, seat_limit: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <textarea
                    value={planFormData.features}
                    onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                    className="input w-full min-h-[80px]"
                    placeholder="List key features..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === 'createPlan' ? 'Create Plan' : 'Update Plan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
