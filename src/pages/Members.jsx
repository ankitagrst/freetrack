import { useState, useEffect } from 'react'
import { membersAPI, plansAPI, seatsAPI, paymentsAPI } from '../services/api'
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Clock, X, CreditCard, User, IdCard, RefreshCw, Ban, CheckCircle, Phone, MapPin, Calendar, IndianRupee, Printer, Camera, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'
import InvoiceGenerator from '../components/InvoiceGenerator'

const Members = () => {
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentMember, setCurrentMember] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    plan_id: '1',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact: '',
    id_proof_type: '',
    id_proof_number: '',
    seat_id: '',
    photo: ''
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useState(null)
  const [plans, setPlans] = useState([])
  const [seats, setSeats] = useState([])
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewMember, setRenewMember] = useState(null)
  const [renewPlanId, setRenewPlanId] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileMember, setProfileMember] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMember, setPaymentMember] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceMember, setInvoiceMember] = useState(null)
  const [invoicePayment, setInvoicePayment] = useState(null)

  useEffect(() => {
    fetchData()
    
    // Check for pre-filled data from waiting list
    const storedData = sessionStorage.getItem('newMemberData')
    if (storedData) {
      try {
        const memberData = JSON.parse(storedData)
        setFormData(prev => ({
          ...prev,
          ...memberData
        }))
        sessionStorage.removeItem('newMemberData')
        openModal() // Open the modal automatically
      } catch (error) {
        console.error('Error parsing member data:', error)
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchMembers(),
        fetchStats(),
        fetchPlans(),
        fetchSeats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await membersAPI.getStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll()
      if (response.success && response.data?.plans) {
        setPlans(response.data.plans)
      } else if (Array.isArray(response.data)) {
        setPlans(response.data)
      } else if (Array.isArray(response)) {
        setPlans(response)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchSeats = async () => {
    try {
      const response = await seatsAPI.getAll({ status: 'available' })
      if (response.success && response.data?.seats) {
        setSeats(response.data.seats)
      } else if (Array.isArray(response.data)) {
        setSeats(response.data)
      } else if (Array.isArray(response)) {
        setSeats(response)
      }
    } catch (error) {
      console.error('Error fetching seats:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await membersAPI.getAll()
      console.log('Members API response:', response)
      
      // Handle different response structures
      let membersList = []
      if (response.success && response.data?.members) {
        membersList = response.data.members
      } else if (Array.isArray(response.data)) {
        membersList = response.data
      } else if (Array.isArray(response)) {
        membersList = response
      }
      
      setMembers(membersList)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
      setMembers([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentMember) {
        await membersAPI.update(currentMember.id, formData)
        toast.success('Member updated successfully')
      } else {
        await membersAPI.create(formData)
        toast.success('Member added successfully')
      }
      fetchMembers()
      fetchStats()
      closeModal()
    } catch (error) {
      toast.error('Failed to save member')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    
    try {
      await membersAPI.delete(id)
      toast.success('Member deleted successfully')
      fetchMembers()
      fetchStats()
    } catch (error) {
      toast.error('Failed to delete member')
    }
  }

  const handleBlockUnblock = async (member) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended'
    const action = newStatus === 'suspended' ? 'block' : 'unblock'
    
    if (!confirm(`Are you sure you want to ${action} this member?`)) return
    
    try {
      await membersAPI.update(member.id, { status: newStatus })
      toast.success(`Member ${action}ed successfully`)
      fetchMembers()
      fetchStats()
    } catch (error) {
      toast.error(`Failed to ${action} member`)
    }
  }

  const openRenewModal = (member) => {
    setRenewMember(member)
    setRenewPlanId(member.plan_id || '')
    setShowRenewModal(true)
  }

  const handleRenew = async () => {
    if (!renewPlanId) {
      toast.error('Please select a plan')
      return
    }

    try {
      await membersAPI.renewMembership(renewMember.id, renewPlanId)
      toast.success('Membership renewed successfully')
      setShowRenewModal(false)
      fetchMembers()
      fetchStats()
    } catch (error) {
      toast.error('Failed to renew membership')
    }
  }

  const openProfileModal = (member) => {
    setProfileMember(member)
    setShowProfileModal(true)
  }

  const openPaymentModal = (member) => {
    setPaymentMember(member)
    setPaymentAmount('')
    setShowPaymentModal(true)
  }

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await paymentsAPI.create({
        member_id: paymentMember.id,
        amount: parseFloat(paymentAmount),
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        notes: 'Quick payment'
      })
      toast.success('Payment added successfully')
      setShowPaymentModal(false)
      fetchMembers()
    } catch (error) {
      toast.error('Failed to add payment')
    }
  }

  const generateIdCard = (member) => {
    // Open member details in new window/modal for ID card printing
    toast.success('ID Card generation - Coming soon!')
  }

  const openInvoice = (member, payment = null) => {
    setInvoiceMember(member)
    setInvoicePayment(payment)
    setShowInvoice(true)
  }

  const closeInvoice = () => {
    setShowInvoice(false)
    setInvoiceMember(null)
    setInvoicePayment(null)
  }

  const openModal = (member = null) => {
    if (member) {
      setCurrentMember(member)
      setFormData({
        full_name: member.full_name || member.name,
        email: member.email,
        phone: member.phone,
        password: '',
        plan_id: member.plan_id || '1',
        date_of_birth: member.date_of_birth || '',
        gender: member.gender || '',
        address: member.address || '',
        city: member.city || '',
        state: member.state || '',
        pincode: member.pincode || '',
        emergency_contact: member.emergency_contact || '',
        id_proof_type: member.id_proof_type || '',
        id_proof_number: member.id_proof_number || '',
        seat_id: member.seat_id || '',
        photo: member.photo || ''
      })
      setPhotoPreview(member.photo || null)
    } else {
      setCurrentMember(null)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        plan_id: '1',
        date_of_birth: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        emergency_contact: '',
        id_proof_type: '',
        id_proof_number: '',
        seat_id: '',
        photo: ''
      })
      setPhotoPreview(null)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentMember(null)
  }

  const filteredMembers = Array.isArray(members) ? members.filter(member => {
    // Search filter
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    
    // Plan filter
    const matchesPlan = planFilter === 'all' || member.plan_id === parseInt(planFilter)
    
    return matchesSearch && matchesStatus && matchesPlan
  }) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">Manage your library members</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
                  {stats.total_members || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                  {stats.active_members || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                  {stats.expired_members || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
                  {stats.expiring_soon || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
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

      {/* Members List - Enhanced Card View */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading members...</p>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No members found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const daysRemaining = member.plan_end_date 
              ? differenceInDays(new Date(member.plan_end_date), new Date())
              : null
            const isExpired = daysRemaining !== null && daysRemaining < 0
            const isExpiring = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7
            
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.full_name || member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">${(member.full_name || member.name || 'U').charAt(0).toUpperCase()}</div>`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                          {(member.full_name || member.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {member.full_name || member.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <IdCard className="w-4 h-4" />
                        <span className="font-mono font-semibold">{member.member_code || 'N/A'}</span>
                      </p>
                      {member.seat_number && (
                        <p className="text-sm text-blue-600 font-semibold mt-1">
                          🪑 Seat: {member.seat_number}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                        member.status === 'suspended' 
                          ? 'bg-red-100 text-red-800' 
                          : isExpired
                          ? 'bg-gray-100 text-gray-800'
                          : isExpiring
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {member.status === 'suspended' ? 'BLOCKED' : isExpired ? 'EXPIRED' : isExpiring ? 'EXPIRING' : 'ACTIVE'}
                      </span>
                      {(isExpired || isExpiring) && daysRemaining !== null && (
                        <span className="text-xs text-gray-500">
                          {isExpired ? `${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                  {member.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{member.city}</span>
                    </div>
                  )}
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Plan</p>
                    <p className="font-semibold text-gray-900 truncate">{member.plan_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">Fullday</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Join</p>
                    <p className="font-semibold text-gray-900">
                      {member.plan_start_date ? format(new Date(member.plan_start_date), 'dd MMM, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expiry</p>
                    <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="font-bold text-gray-900 flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {member.plan_price || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid</p>
                    <p className="font-bold text-green-600 flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {member.plan_price || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due</p>
                    <p className="font-bold text-red-600 flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      0
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Horizontal Scroll */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  <a
                    href={`https://wa.me/91${member.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`sms:${member.phone}`}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </a>
                  <button
                    onClick={() => openProfileModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => generateIdCard(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm"
                  >
                    <IdCard className="w-4 h-4" />
                    ID-Card
                  </button>
                  <button
                    onClick={() => openInvoice(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Invoice
                  </button>
                  <button
                    onClick={() => openModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openPaymentModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Add Pay
                  </button>
                  <button
                    onClick={() => openRenewModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renew
                  </button>
                  <button
                    onClick={() => handleBlockUnblock(member)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${
                      member.status === 'suspended'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    }`}
                  >
                    {member.status === 'suspended' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Block
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {currentMember ? 'Edit Member' : 'Add New Member'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload - At Top */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                    {photoPreview || formData.photo ? (
                      <img 
                        src={photoPreview || formData.photo} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('photoInput').click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    id="photoInput"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setPhotoPreview(reader.result)
                          setFormData({...formData, photo: reader.result})
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="input"
                  required
                />
              </div>

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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plan *</label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                  className="input"
                  required
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  className="input"
                  placeholder="Emergency contact number"
                />
              </div>

              {/* Allot Seat - Visual Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Allot Seat (Optional)</label>
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">Select an available seat by clicking on it</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, seat_id: ''})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        !formData.seat_id 
                          ? 'bg-blue-500 border-blue-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <p className="text-xs font-bold">No Seat</p>
                    </button>
                    {seats.filter(seat => !seat.member_id || seat.id === formData.seat_id).map(seat => (
                      <button
                        type="button"
                        key={seat.id}
                        onClick={() => setFormData({...formData, seat_id: seat.id})}
                        className={`p-3 rounded-lg border-2 transition-all transform hover:scale-105 ${
                          formData.seat_id === seat.id
                            ? 'bg-green-500 border-green-600 text-white shadow-lg'
                            : 'bg-green-50 border-green-300 text-gray-700 hover:bg-green-100 hover:border-green-400'
                        }`}
                      >
                        <p className="text-sm font-bold">{seat.seat_number}</p>
                        {seat.floor && <p className="text-xs opacity-75">F{seat.floor}</p>}
                      </button>
                    ))}
                  </div>
                  {formData.seat_id && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-center">
                      <p className="text-sm font-semibold text-green-800">
                        ✓ Seat {seats.find(s => s.id === formData.seat_id)?.seat_number} Selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {currentMember ? 'Update' : 'Add'} Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Membership Modal */}
      {showRenewModal && renewMember && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Renew Membership</h2>
              <button onClick={() => setShowRenewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-gray-900">{renewMember.full_name || renewMember.name}</p>
              <p className="text-sm text-gray-600 mt-1">Current Plan: {renewMember.plan_name}</p>
              <p className="text-sm text-gray-600">
                Expires: {renewMember.plan_end_date ? format(new Date(renewMember.plan_end_date), 'dd MMM, yyyy') : 'N/A'}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Plan *</label>
              <select
                value={renewPlanId}
                onChange={(e) => setRenewPlanId(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name} - ₹{plan.price} ({plan.duration_days} days)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowRenewModal(false)} 
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleRenew} 
                className="btn btn-primary flex-1"
              >
                Renew Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && profileMember && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Member Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {profileMember.photo ? (
                  <img 
                    src={profileMember.photo} 
                    alt={profileMember.full_name || profileMember.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">${(profileMember.full_name || profileMember.name || 'U').charAt(0).toUpperCase()}</div>`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(profileMember.full_name || profileMember.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{profileMember.full_name || profileMember.name}</h3>
                <p className="text-gray-600 font-mono">{profileMember.member_code || 'N/A'}</p>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full mt-2 ${
                  profileMember.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : profileMember.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profileMember.status}
                </span>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{profileMember.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="font-semibold text-gray-900">{profileMember.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.date_of_birth ? format(new Date(profileMember.date_of_birth), 'dd MMM, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Gender</p>
                <p className="font-semibold text-gray-900 capitalize">{profileMember.gender || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.address || 'N/A'}
                  {profileMember.city && `, ${profileMember.city}`}
                  {profileMember.state && `, ${profileMember.state}`}
                  {profileMember.pincode && ` - ${profileMember.pincode}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Emergency Contact</p>
                <p className="font-semibold text-gray-900">{profileMember.emergency_contact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ID Proof</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.id_proof_type ? `${profileMember.id_proof_type.toUpperCase()}: ${profileMember.id_proof_number || 'N/A'}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan</p>
                <p className="font-semibold text-gray-900">{profileMember.plan_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Seat Number</p>
                <p className="font-semibold text-gray-900">{profileMember.seat_number || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Enrollment Date</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.enrollment_date ? format(new Date(profileMember.enrollment_date), 'dd MMM, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan Start Date</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.plan_start_date ? format(new Date(profileMember.plan_start_date), 'dd MMM, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan End Date</p>
                <p className="font-semibold text-gray-900">
                  {profileMember.plan_end_date ? format(new Date(profileMember.plan_end_date), 'dd MMM, yyyy') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowProfileModal(false)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {showPaymentModal && paymentMember && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-gray-900">{paymentMember.full_name || paymentMember.name}</p>
              <p className="text-sm text-gray-600 mt-1">Plan: {paymentMember.plan_name}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input w-full pl-8"
                  placeholder="Enter amount"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowPaymentModal(false)} 
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPayment} 
                className="btn btn-primary flex-1"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoice && invoiceMember && (
        <InvoiceGenerator
          member={invoiceMember}
          payment={invoicePayment}
          onClose={closeInvoice}
        />
      )}
    </div>
  )
}

export default Members
