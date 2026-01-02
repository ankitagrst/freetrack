import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, ArrowRight, Search, MapPin, Phone, Mail, Users, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useOrg } from '../context/OrgContext'
import { useAuth } from '../context/AuthContext'
import { orgsAPI } from '../services/api'

export default function OrgSelection() {
  const navigate = useNavigate()
  const { selectOrg, setOrgs } = useOrg()
  const { user, logout } = useAuth()
  const [orgs, setOrgsState] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'library',
    address: '',
    city: '',
    state: '',
    pincode: '',
    seat_limit: ''
  })

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      const response = await orgsAPI.getAll()
      
      if (response.success) {
        setOrgsState(response.data || [])
        setOrgs(response.data || [])
        
        // If no orgs, show add modal
        if (!response.data || response.data.length === 0) {
          setShowAddModal(true)
        }
      }
    } catch (error) {
      console.error('Org fetch error:', error)
      toast.error(error.response?.data?.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrg = (org) => {
    selectOrg(org)
    toast.success(`Selected ${org.name}`)
    navigate('/dashboard')
  }

  const handleAddOrg = async (e) => {
    e.preventDefault()
    try {
      const initialCount = orgs.length
      const response = await orgsAPI.create(formData)
      
      if (response.success) {
        toast.success('Organization created successfully!')
        setShowAddModal(false)
        await fetchOrgs()
        
        // Auto-select automatically if this was the first org
        if (initialCount === 0 && response.data) {
          handleSelectOrg(response.data)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const filteredOrgs = orgs.filter(org =>
    org.status === 'active' && (
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-muted">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Feestrack" className="w-12 h-12" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Feestrack</h1>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Organization</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-primary bg-clip-text text-transparent mb-4">
            {orgs.length === 0 ? 'Welcome to Feestrack!' : 'Select Your Organization'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {orgs.length === 0 
              ? 'Get started by creating your first organization and unlock powerful management features' 
              : 'Choose an organization to manage members, track payments, and access detailed analytics'}
          </p>
        </div>

        {orgs.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center border border-gray-100">
            <div className="w-24 h-24 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/10">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Organizations Yet</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Create your first organization to start managing members, tracking payments, generating reports, and much more.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-primary text-white px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 w-full flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Organization
            </button>
          </div>
        ) : (
          /* organizations Grid */
          <>
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map(org => (
                <div
                  key={org.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-primary hover:-translate-y-1 transform"
                  onClick={() => handleSelectOrg(org)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/15 rounded-xl flex items-center justify-center transition-all duration-300 ring-4 ring-primary/10">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      org.status === 'active' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {org.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{org.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {org.code} • {
                      org.type === 'gym' ? '🏋️ Gym' :
                      org.type === 'dance' ? '💃 Dance Studio' :
                      org.type === 'yoga' ? '🧘 Yoga Center' :
                      org.type === 'tution' ? '📚 Tuition Center' :
                      '📚 Library'
                    }
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-5 bg-gray-50 rounded-lg p-3">
                    {org.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{org.city}, {org.state}</span>
                      </div>
                    )}
                    {org.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-xs truncate">{org.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span>{org.total_members || 0} Members</span>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-all duration-300 shadow-md">
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="sticky top-0 bg-gradient-primary px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Add New Organization</h3>
              </div>
            </div>
            
            <form onSubmit={handleAddOrg} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="e.g., Downtown Study Center"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="e.g., DSC001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="library">Library</option>
                    <option value="gym">Gym</option>
                    <option value="dance">Dance Studio</option>
                    <option value="yoga">Yoga Center</option>
                    <option value="tution">Tuition Center</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seat Limit *
                  </label>
                  <input
                    type="number"
                    name="seat_limit"
                    value={formData.seat_limit}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="State"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="123456"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    if (orgs.length === 0) {
                      // Don't allow closing if no organizations exist
                      toast.error('Please create an organization to continue')
                      setShowAddModal(true)
                    }
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={orgs.length === 0}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-primary text-white px-6 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
