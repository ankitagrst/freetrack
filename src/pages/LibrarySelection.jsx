import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, ArrowRight, Search, MapPin, Phone, Mail, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLibrary } from '../context/LibraryContext'
import { useAuth } from '../context/AuthContext'
import { librariesAPI } from '../services/api'

export default function LibrarySelection() {
  const navigate = useNavigate()
  const { selectLibrary, setLibraries } = useLibrary()
  const { user } = useAuth()
  const [libraries, setLibrariesState] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    library_name: '',
    library_code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    seat_limit: ''
  })

  useEffect(() => {
    fetchLibraries()
  }, [])

  const fetchLibraries = async () => {
    try {
      setLoading(true)
      const response = await librariesAPI.getAll()
      
      if (response.success) {
        setLibrariesState(response.data || [])
        setLibraries(response.data || [])
        
        // If no libraries, show add modal
        if (!response.data || response.data.length === 0) {
          setShowAddModal(true)
        }
      }
    } catch (error) {
      console.error('Library fetch error:', error)
      toast.error(error.response?.data?.message || 'Failed to load libraries')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLibrary = (library) => {
    selectLibrary(library)
    toast.success(`Selected ${library.library_name}`)
    navigate('/dashboard')
  }

  const handleAddLibrary = async (e) => {
    e.preventDefault()
    try {
      const response = await librariesAPI.create(formData)
      
      if (response.success) {
        toast.success('Library created successfully!')
        setShowAddModal(false)
        await fetchLibraries()
        
        // Auto-select if first library
        if (libraries.length === 0) {
          handleSelectLibrary(response.data)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create library')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const filteredLibraries = libraries.filter(lib =>
    lib.status === 'active' && (
      lib.library_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading your libraries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">FeeTrack</h1>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Library</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-primary to-blue-600 bg-clip-text text-transparent mb-4">
            {libraries.length === 0 ? 'Welcome to FeeTrack!' : 'Select Your Library'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {libraries.length === 0 
              ? 'Get started by creating your first library and unlock powerful management features' 
              : 'Choose a library to manage members, track payments, and access detailed analytics'}
          </p>
        </div>

        {libraries.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center border border-gray-100">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/10">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Libraries Yet</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Create your first library to start managing members, tracking payments, generating reports, and much more.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Library
            </button>
          </div>
        ) : (
          /* Libraries Grid */
          <>
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search libraries by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibraries.map(library => (
                <div
                  key={library.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-primary hover:-translate-y-1 transform"
                  onClick={() => handleSelectLibrary(library)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover:from-primary/30 group-hover:to-blue-600/30 rounded-xl flex items-center justify-center transition-all duration-300 ring-4 ring-primary/10">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      library.status === 'active' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {library.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{library.library_name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {library.library_code}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-5 bg-gray-50 rounded-lg p-3">
                    {library.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{library.city}, {library.state}</span>
                      </div>
                    )}
                    {library.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-xs truncate">{library.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span>{library.total_members || 0} Members</span>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-blue-600 transition-all duration-300 shadow-md">
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Library Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Add New Library</h3>
              </div>
            </div>
            
            <form onSubmit={handleAddLibrary} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Library Name *
                  </label>
                  <input
                    type="text"
                    name="library_name"
                    value={formData.library_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="e.g., Downtown Study Center"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Library Code *
                  </label>
                  <input
                    type="text"
                    name="library_code"
                    value={formData.library_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="e.g., DSC001"
                  />
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
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
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
                    if (libraries.length === 0) {
                      // Don't allow closing if no libraries exist
                      toast.error('Please create a library to continue')
                      setShowAddModal(true)
                    }
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={libraries.length === 0}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Create Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
