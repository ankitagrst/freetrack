import { useState, useEffect, useRef } from 'react'
import { membersAPI, plansAPI, seatsAPI, paymentsAPI } from '../services/api'
import { useLibrary } from '../context/LibraryContext'
import { formatCurrency } from '../utils/formatters'
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Clock, X, CreditCard, User, IdCard, RefreshCw, Ban, CheckCircle, Phone, MapPin, Calendar, IndianRupee, Printer, Camera, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays, addMonths, addDays } from 'date-fns'
import InvoiceGenerator from '../components/InvoiceGenerator'
import QRCode from 'qrcode'

const Members = () => {
  const { selectedLibrary } = useLibrary()
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentMember, setCurrentMember] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [membershipFilter, setMembershipFilter] = useState('all') // all|active|expired|expiring
  const [planFilter, setPlanFilter] = useState('all')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan_id: '1',
    gender: '',
    address: '',
    emergency_contact: '',
    id_proof_type: '',
    id_proof_number: '',
    seat_id: '',
    photo: ''
  })
  const [planAmount, setPlanAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('online')
  const [paidAmount, setPaidAmount] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [plans, setPlans] = useState([])
  const [seats, setSeats] = useState([])
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewMember, setRenewMember] = useState(null)
  const [renewPlanId, setRenewPlanId] = useState('')
  const [renewPaymentMode, setRenewPaymentMode] = useState('cash') // cash|upi
  const [renewAmount, setRenewAmount] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileMember, setProfileMember] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMember, setPaymentMember] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceMember, setInvoiceMember] = useState(null)
  const [invoicePayment, setInvoicePayment] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppMember, setWhatsAppMember] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showTemplateList, setShowTemplateList] = useState(false)
  const templateRef = useRef(null)

  const templates = [
    { key: 'membership', label: 'Membership' },
    { key: 'due', label: 'Due Payment Reminder' },
    { key: 'renewal', label: 'Renewal' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'offers', label: 'Offers' },
    { key: 'holiday', label: 'Holiday' }
  ]

  const computeEndDate = (planObj, start) => {
    if (!planObj || !start) return ''
    const planType = (planObj.plan_type || '').toLowerCase()
    const durationDays = Number(planObj.duration_days || 0)
    const startDateObj = new Date(start)
    
    const monthsMap = {
      'monthly': 1,
      'quarterly': 3,
      'half_yearly': 6,
      'yearly': 12,
    }

    if (monthsMap[planType]) {
      // Add months with same-day logic
      const months = monthsMap[planType]
      const year = startDateObj.getFullYear()
      const month = startDateObj.getMonth()
      const day = startDateObj.getDate()
      
      const targetMonthIndex = (year * 12) + month + months
      const targetYear = Math.floor(targetMonthIndex / 12)
      const targetMonth = targetMonthIndex % 12
      
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const targetDay = Math.min(day, daysInTargetMonth)
      
      return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
    } else {
      // Add days
      const endDate = new Date(startDateObj)
      endDate.setDate(endDate.getDate() + durationDays)
      return endDate.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    if (selectedLibrary?.id) {
      fetchMembers()
      fetchStats()
      fetchPlans()
      fetchSeats()
    }
  }, [selectedLibrary])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await membersAPI.getAll({
        library_id: selectedLibrary.id,
        page: 1,
        limit: 1000 // Get all members for now
      })
      
      if (response.success && response.data?.members) {
        setMembers(response.data.members)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await membersAPI.getStats({ library_id: selectedLibrary.id })
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll({ library_id: selectedLibrary.id }).catch(() => ({ success: false, data: [] }))

      let plansList = []
      if (response.success && response.data?.plans) {
        plansList = response.data.plans
      } else if (Array.isArray(response.data)) {
        plansList = response.data
      } else if (Array.isArray(response)) {
        plansList = response
      }

      setPlans(plansList)

      if (!plansList.length) {
        toast.error('No plans found. Please create a plan first.')
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      setPlans([])
      toast.error('Unable to load plans')
    }
  }

  // When plans load, default the selection to the first plan to avoid empty dropdowns
  useEffect(() => {
    if (plans.length > 0 && !formData.plan_id) {
      const firstPlanId = String(plans[0].id)
      setFormData((prev) => ({ ...prev, plan_id: firstPlanId }))
      const today = startDate || new Date().toISOString().split('T')[0]
      setExpiryDate(computeEndDate(plans[0], today))
    }
  }, [plans])

  const fetchSeats = async () => {
    try {
      const response = await seatsAPI.getAll({ library_id: selectedLibrary.id })
      let seatsList = []
      if (response.success && response.data?.seats) {
        seatsList = response.data.seats
      } else if (Array.isArray(response?.data)) {
        seatsList = response.data
      }

      // Sort seats by floor and numeric seat number for predictable ordering
      seatsList.sort((a, b) => {
        const fa = a.floor || ''
        const fb = b.floor || ''
        if (fa < fb) return -1
        if (fa > fb) return 1
        const getNum = (sn) => parseInt((sn || '').replace(/[^0-9]+/g, '')) || 0
        return getNum(a.seat_number) - getNum(b.seat_number)
      })

      setSeats(seatsList)
    } catch (error) {
      console.error('Failed to fetch seats:', error)
      setSeats([])
      toast.error('Unable to load seats')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedLibrary?.id) {
      toast.error('Please select a library first')
      return
    }

    const seatIdValue = formData.seat_id ? Number(formData.seat_id) : null
    const trimmedPhone = formData.phone?.trim() || ''
    const phoneDigits = trimmedPhone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    const payload = {
      library_id: selectedLibrary.id,
      full_name: formData.full_name?.trim(),
      email: formData.email?.trim(),
      phone: trimmedPhone,
      plan_id: Number(formData.plan_id),
      gender: formData.gender,
      address: formData.address,
      emergency_contact: formData.emergency_contact,
      id_proof_type: formData.id_proof_type,
      id_proof_number: formData.id_proof_number,
      seat_id: seatIdValue,
      photo: formData.photo
    }

    try {
      if (currentMember) {
        const response = await membersAPI.update(currentMember.id, payload)
        if (response.success) {
          toast.success('Member updated successfully')
        }
      } else {
        const response = await membersAPI.create(payload)
        if (response.success) {
          toast.success('Member added successfully')

          const amount = parseFloat(paidAmount)
          if (!Number.isNaN(amount) && amount > 0) {
            await paymentsAPI.create({
              member_id: response.data.member_id,
              amount,
              payment_method: paymentMode === 'online' ? 'upi' : 'cash',
              payment_type: 'enrollment',
              payment_date: format(new Date(), 'yyyy-MM-dd'),
              notes: 'Initial enrollment payment'
            })
          }
        }
      }

      closeModal()
      fetchMembers()
      fetchStats()
    } catch (error) {
      console.error('Member submit error:', error)
      toast.error((error.response?.data?.message) || 'Something went wrong')
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

  const openRenewModal = (member) => {
    setRenewMember(member)
    setRenewPlanId(member.plan_id || '')
    setRenewAmount(member.plan_price != null ? String(member.plan_price) : '')
    setRenewPaymentMode('cash')
    setShowRenewModal(true)
  }

  const handleRenew = async () => {
    if (!renewMember) return toast.error('No member selected')
    if (!renewPlanId) return toast.error('Please select a plan')

    try {
      const amount = Number(renewAmount) > 0 ? Number(renewAmount) : undefined
      const response = await membersAPI.renewMembership(renewMember.id, renewPlanId, {
        payment_mode: renewPaymentMode === 'cash' ? 'cash' : 'online',
        payment_method: renewPaymentMode === 'cash' ? 'cash' : 'upi',
        amount,
        payment_type: 'renewal',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: 'Membership renewal'
      })

      if (response.success) {
        toast.success('Membership renewed successfully')
        setShowRenewModal(false)
        setRenewMember(null)
        setRenewPlanId('')
        setRenewAmount('')
        fetchMembers()
        fetchStats()
      } else {
        toast.error(response.message || 'Failed to renew membership')
      }
    } catch (error) {
      console.error('Renew error:', error)
      toast.error(error.response?.data?.message || 'Failed to renew membership')
    }
  }

  const handleBlockUnblock = async (member) => {
    if (!member) return

    const isBlocking = member.status !== 'suspended'
    if (isBlocking) {
      const confirmBlock = window.confirm(`Are you sure you want to block ${member.full_name || member.name}?`)
      if (!confirmBlock) return
    }

    try {
      const newStatus = isBlocking ? 'suspended' : 'active'
      const response = await membersAPI.update(member.id, { status: newStatus })
      if (response.success) {
        toast.success(`${isBlocking ? 'Blocked' : 'Unblocked'} member successfully`)
        fetchMembers()
        fetchStats()
      } else {
        toast.error(response.message || `Failed to ${isBlocking ? 'block' : 'unblock'} member`)
      }
    } catch (error) {
      console.error('Block/Unblock error:', error)
      toast.error(error.response?.data?.message || `Failed to ${isBlocking ? 'block' : 'unblock'} member`)
    }
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
        payment_method: paymentMode === 'online' ? 'upi' : 'cash',
        payment_type: 'subscription',
        notes: 'Quick payment'
      })
      toast.success('Payment added successfully')
      setShowPaymentModal(false)
      fetchMembers()
    } catch (error) {
      toast.error('Failed to add payment')
    }
  }

  const buildPaymentShareMessage = ({ member, amount }) => {
    const name = member.full_name || member.name || 'Member'
    const code = member.member_code || 'N/A'
    const endDate = member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yyyy') : ''
    const libraryName = selectedLibrary?.library_name || 'Library'
    const line1 = `Hello ${name},`
    const line2 = `Your payment due: ₹${Number(amount || 0).toLocaleString('en-IN')}`
    const line3 = `Member ID: ${code}${endDate ? ` | Valid till: ${endDate}` : ''}`
    const line4 = `Library: ${libraryName}`
    return [line1, line2, line3, line4, '', 'QR attached for payment.'].join('\n')
  }

  const buildTemplateMessage = (templateKey, member) => {
    const name = member.full_name || member.name || 'Member'
    const code = member.member_code || 'N/A'
    const libraryName = selectedLibrary?.library_name || 'Library'
    const endDate = member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yyyy') : ''
    const amount = member.plan_price || 0

    switch (templateKey) {
      case 'membership':
        return `Hello ${name},\nWelcome to ${libraryName}! Your Member ID is ${code}. Plan valid till ${endDate || 'N/A'}.`
      case 'due':
        return `Hello ${name},\nThis is a reminder that your payment of ₹${Number(amount).toLocaleString('en-IN')} is due. Member ID: ${code}. Plan valid till ${endDate || 'N/A'}.\nLibrary: ${libraryName}`
      case 'renewal':
        return `Hello ${name},\nYour membership is expiring on ${endDate || 'N/A'}. Please renew to continue access. Member ID: ${code}. Library: ${libraryName}`
      case 'birthday':
        return `Happy Birthday ${name}! 🎉\nWishing you a wonderful year ahead. - ${libraryName}`
      case 'offers':
        return `Hello ${name},\nWe have a new offer for members at ${libraryName}. Reply to know more!`
      case 'holiday':
        return `Hello ${name},\n${libraryName} will remain closed for the upcoming holiday. Please plan your visits accordingly.`
      default:
        return buildPaymentShareMessage({ member, amount })
    }
  }

  const generateQrFile = async (text, filename = 'payment-qr.png') => {
    const dataUrl = await QRCode.toDataURL(text, { width: 512, margin: 1 })
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    return new File([blob], filename, { type: blob.type || 'image/png' })
  }

  const openWhatsAppChat = (member) => {
    const phone = String(member?.phone || '').replace(/\D/g, '')
    if (!phone) {
      toast.error('No phone number available')
      return
    }
    const url = `https://wa.me/91${phone}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const openWhatsAppReminderModal = (member) => {
    setWhatsAppMember(member)
    setSelectedTemplate('')
    setCustomMessage('')
    setShowWhatsAppModal(true)
  }

  const handleTemplateSelect = (value) => {
    setSelectedTemplate(value)
    if (value && whatsAppMember) {
      setCustomMessage(buildTemplateMessage(value, whatsAppMember))
    }
  }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!templateRef.current) return
      if (!templateRef.current.contains(e.target)) {
        setShowTemplateList(false)
      }
    }
    if (showTemplateList) document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [showTemplateList])

  const sendWhatsAppReminder = async () => {
    if (!whatsAppMember) {
      toast.error('No member selected')
      return
    }
    try {
      const member = whatsAppMember
      const amount = member?.plan_price || 0
      const message = (customMessage || '').trim() || buildPaymentShareMessage({ member, amount })

      // QR encodes payment details (scannable content); if you later add UPI/VPA settings,
      // you can switch this text to a real UPI deep link.
      const qrText = `FeeTrack Payment\nLibrary: ${selectedLibrary?.library_name || ''}\nMember: ${member.full_name || member.name || ''}\nMember ID: ${member.member_code || ''}\nAmount: ${amount}`
      const qrFile = await generateQrFile(qrText, `payment-qr-${member.member_code || member.id}.png`)

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [qrFile] }))) {
        await navigator.share({
          text: message,
          files: [qrFile]
        })
        return
      }

      // Fallback: open WhatsApp with prefilled editable text
      const phone = String(member.phone || '').replace(/\D/g, '')
      const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
      setShowWhatsAppModal(false)
      setWhatsAppMember(null)
    } catch (e) {
      console.error('WhatsApp share failed:', e)
      toast.error('Unable to open WhatsApp share')
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

  const openDeleteModal = (member) => {
    setMemberToDelete(member)
    setShowDeleteModal(true)
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return
    
    try {
      const response = await membersAPI.delete(memberToDelete.id)
      if (response.success) {
        toast.success('Member deleted successfully')
        setShowDeleteModal(false)
        setMemberToDelete(null)
        fetchMembers()
        fetchStats()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete member')
    }
  }

  const openModal = (member = null) => {
    if (member) {
      setCurrentMember(member)
      setFormData({
        full_name: member.full_name || member.name,
        email: member.email,
        phone: member.phone,
        plan_id: member.plan_id || '1',
        gender: member.gender || '',
        address: member.address || '',
        emergency_contact: member.emergency_contact || '',
        id_proof_type: member.id_proof_type || '',
        id_proof_number: member.id_proof_number || '',
        seat_id: member.seat_id || '',
        photo: member.photo || ''
      })
      setPhotoPreview(member.photo || null)
      setPlanAmount(member.plan_price != null ? String(member.plan_price) : '')
      const sd = member.plan_start_date ? format(new Date(member.plan_start_date), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]
      setStartDate(sd)
      setExpiryDate(member.plan_end_date ? format(new Date(member.plan_end_date), 'yyyy-MM-dd') : computeEndDate(plans.find(p => String(p.id) === String(member.plan_id)), sd))
      setPaymentMode('online')
      setPaidAmount('')
    } else {
      setCurrentMember(null)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        plan_id: '1',
        gender: '',
        address: '',
        emergency_contact: '',
        id_proof_type: '',
        id_proof_number: '',
        seat_id: '',
        photo: ''
      })
      setPhotoPreview(null)
      setPlanAmount('')
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
      const defaultPlan = plans.find(p => String(p.id) === '1') || plans[0]
      setExpiryDate(computeEndDate(defaultPlan || {}, today))
      setPaymentMode('online')
      setPaidAmount('')
    }
    // Refresh seats when opening modal to ensure seating options are up to date
    if (selectedLibrary?.id) fetchSeats()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentMember(null)
    setPaymentMode('online')
    setPaidAmount('')
  }

  const filteredMembers = Array.isArray(members) ? members.filter(member => {
    // Search filter
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter

    // Membership status filter (active/expired/expiring) based on plan_end_date
    const ms = member.membership_status || (member.plan_end_date ? (differenceInDays(new Date(member.plan_end_date), new Date()) < 0 ? 'expired' : (differenceInDays(new Date(member.plan_end_date), new Date()) <= 7 ? 'expiring' : 'active')) : 'active')
    const matchesMembership = membershipFilter === 'all' || ms === membershipFilter
    
    // Plan filter
    const matchesPlan = planFilter === 'all' || member.plan_id === parseInt(planFilter)
    
    return matchesSearch && matchesStatus && matchesMembership && matchesPlan
  }) : []

  const blockedMembers = Array.isArray(members)
    ? members.filter(m => m.status === 'suspended')
    : []

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
          <button
            type="button"
            onClick={() => setMembershipFilter('all')}
            className="stats-card stats-card-primary text-left"
          >
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Total Members</p>
                <p className="stats-card-value">
                  {stats.total_members || 0}
                </p>
              </div>
              <div className="stats-card-icon">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMembershipFilter('active')}
            className="stats-card stats-card-success text-left"
          >
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Active Members</p>
                <p className="stats-card-value">
                  {stats.active_members || 0}
                </p>
              </div>
              <div className="stats-card-icon">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMembershipFilter('expired')}
            className="stats-card stats-card-danger text-left"
          >
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Expired</p>
                <p className="stats-card-value">
                  {stats.expired_members || 0}
                </p>
              </div>
              <div className="stats-card-icon">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMembershipFilter('expiring')}
            className="stats-card stats-card-warning text-left"
          >
            <div className="stats-card-header">
              <div className="stats-card-content">
                <p className="stats-card-label">Expiring Soon</p>
                <p className="stats-card-value">
                  {stats.expiring_soon || 0}
                </p>
              </div>
              <div className="stats-card-icon">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 sm:p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'expiring', label: 'Expiring' },
            { key: 'expired', label: 'Expired' },
            { key: 'suspended', label: 'Blocked' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'suspended') {
                  setStatusFilter('suspended')
                  setMembershipFilter('all')
                } else {
                  setStatusFilter('all')
                  setMembershipFilter(item.key)
                }
              }}
              className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
                (item.key === 'suspended' ? statusFilter === 'suspended' : membershipFilter === item.key || (item.key === 'all' && membershipFilter === 'all' && statusFilter === 'all'))
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Plan Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {(statusFilter !== 'all' || planFilter !== 'all' || membershipFilter !== 'all') && (
          <button
            onClick={() => {
              setStatusFilter('all')
              setPlanFilter('all')
              setMembershipFilter('all')
            }}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 self-start"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Blocked Members Section */}
      {blockedMembers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Blocked Members</h2>
            <span className="text-sm text-gray-600">{blockedMembers.length}</span>
          </div>
          <div className="space-y-2">
            {blockedMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{m.full_name || m.name}</div>
                  <a href={`tel:${m.phone}`} className="text-sm text-gray-600 hover:underline">{m.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBlockUnblock(m)}
                    className="px-3 py-2 text-sm font-semibold btn-success rounded-lg"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">${(member.full_name || member.name || 'U').charAt(0).toUpperCase()}</div>`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
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

                {/* Contact */}
                <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${member.phone}`} className="hover:underline">{member.phone}</a>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Plan</p>
                    <p className="font-semibold text-gray-900 truncate">{member.plan_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">{member.plan_type || 'Fullday'}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-gray-200">
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
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide [&>button]:min-w-[120px] [&>a]:min-w-[120px]">
                  <button
                    onClick={() => openWhatsAppChat(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-success rounded-lg transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WA Chat
                  </button>
                  <button
                    onClick={() => openWhatsAppReminderModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-success rounded-lg transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Reminder
                  </button>
                  <a
                    href={`sms:${member.phone}`}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-info rounded-lg transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </a>
                  <button
                    onClick={() => openProfileModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-primary rounded-lg transition-all shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => generateIdCard(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-accent rounded-lg transition-all shadow-sm"
                  >
                    <IdCard className="w-4 h-4" />
                    ID-Card
                  </button>
                  <button
                    onClick={() => openInvoice(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-primary rounded-lg transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Invoice
                  </button>
                  <button
                    onClick={() => openModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-success rounded-lg transition-all shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openPaymentModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-primary rounded-lg transition-all shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Add Pay
                  </button>
                  <button
                    onClick={() => openRenewModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-warning rounded-lg transition-all shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renew
                  </button>
                  <button
                    onClick={() => handleBlockUnblock(member)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${
                      member.status === 'suspended'
                        ? 'bg-success text-white hover:bg-success-dark'
                        : 'bg-danger text-white hover:bg-danger-dark'
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
                    onClick={() => openDeleteModal(member)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold btn-danger rounded-lg transition-all shadow-sm"
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
                      {plan.plan_name} - {formatCurrency(plan.price)}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                  placeholder="member@example.com"
                />
              </div>

              {/* Legal ID Proof Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ID Proof Type</label>
                  <select
                    value={formData.id_proof_type}
                    onChange={(e) => setFormData({...formData, id_proof_type: e.target.value})}
                    className="input"
                  >
                    <option value="">Select ID Type</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    value={formData.id_proof_number}
                    onChange={(e) => setFormData({...formData, id_proof_number: e.target.value})}
                    className="input"
                    placeholder="Enter ID number"
                  />
                </div>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Full address"
                />
              </div>

              {/* Emergency Contact */}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
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

                    {seats.map(seat => {
                      const isSelected = formData.seat_id === seat.id
                      const isOccupiedByOther = seat.member_id && seat.id !== formData.seat_id
                      const baseClasses = isOccupiedByOther
                        ? 'bg-red-50 border-red-300 text-red-700 cursor-not-allowed'
                        : 'bg-green-50 border-green-300 text-gray-700 hover:bg-green-100 hover:border-green-400'

                      return (
                        <button
                          type="button"
                          key={seat.id}
                          disabled={isOccupiedByOther}
                          onClick={() => !isOccupiedByOther && setFormData({...formData, seat_id: seat.id})}
                          className={`p-3 rounded-lg border-2 transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'bg-green-500 border-green-600 text-white shadow-lg'
                              : baseClasses
                          } ${isOccupiedByOther ? 'opacity-70' : ''}`}
                        >
                          <p className="text-sm font-bold">{seat.seat_number}</p>
                          {seat.floor && <p className="text-xs opacity-75">F{seat.floor}</p>}
                          <p className="text-[11px] mt-1 font-semibold">
                            {isSelected
                              ? 'Selected'
                              : isOccupiedByOther
                                ? 'Occupied'
                                : 'Available'}
                          </p>
                        </button>
                      )
                    })}
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
                onChange={(e) => {
                  setRenewPlanId(e.target.value)
                  const p = plans.find(pl => String(pl.id) === String(e.target.value))
                  if (p?.price != null) setRenewAmount(String(p.price))
                }}
                className="input w-full"
                required
              >
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name} - {formatCurrency(plan.price)} ({plan.duration_days} days)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
              <select
                value={renewPaymentMode}
                onChange={(e) => setRenewPaymentMode(e.target.value)}
                className="input w-full"
              >
                <option value="cash">Cash</option>
                <option value="upi">Online</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(e.target.value)}
                  className="input w-full pl-8"
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
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
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header with Photo */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="bg-gradient-primary p-6 pb-20 rounded-t-xl">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg border-4 border-white">
                    {profileMember.photo ? (
                      <img 
                        src={profileMember.photo} 
                        alt={profileMember.full_name || profileMember.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">${(profileMember.full_name || profileMember.name || 'U').charAt(0).toUpperCase()}</div>`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                        {(profileMember.full_name || profileMember.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Info Card */}
            <div className="px-6 -mt-12 relative z-10">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                {/* Name and Status */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{profileMember.full_name || profileMember.name}</h3>
                  <p className="text-sm text-gray-500 font-mono mb-2">{profileMember.member_code || 'N/A'}</p>
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                    profileMember.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : profileMember.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profileMember.status}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="flex items-center gap-2 text-gray-600 mb-3 pb-4 border-b">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${profileMember.phone}`} className="text-sm font-medium hover:underline">{profileMember.phone}</a>
                </div>

                {/* Plan & Type */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Plan</p>
                    <p className="text-base font-bold text-gray-900">{profileMember.plan_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-base font-bold text-gray-900">{profileMember.plan_type || 'Fullday'}</p>
                  </div>
                </div>

                {/* Join & Expiry */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Join</p>
                    <p className="text-base font-bold text-gray-900">
                      {profileMember.plan_start_date ? format(new Date(profileMember.plan_start_date), 'dd MMM, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expiry</p>
                    <p className="text-base font-bold text-gray-900">
                      {profileMember.plan_end_date ? format(new Date(profileMember.plan_end_date), 'dd MMM, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(profileMember.plan_price || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(profileMember.total_paid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(profileMember.due_amount || 0)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openWhatsAppChat(profileMember)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    WA Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsAppReminderModal(profileMember)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Reminder
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileModal(false)
                      openPaymentModal(profileMember)
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <CreditCard className="w-5 h-5" />
                    Add Pay
                  </button>
                </div>
              </div>

              {/* Additional Details (Collapsible) */}
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Additional Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{profileMember.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat:</span>
                    <span className="font-medium text-gray-900">{profileMember.seat_number || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium text-gray-900 capitalize">{profileMember.gender || 'N/A'}</span>
                  </div>
                  {profileMember.emergency_contact && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emergency:</span>
                      <span className="font-medium text-gray-900">{profileMember.emergency_contact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6"></div>
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
          library={selectedLibrary}
          onClose={closeInvoice}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {showWhatsAppModal && whatsAppMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-danger px-6 py-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center">
                <span className="text-lg font-bold text-red-600">{(whatsAppMember.full_name || whatsAppMember.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-xl font-semibold">Send WhatsApp</p>
                <p className="text-white text-sm opacity-90">{whatsAppMember.full_name || whatsAppMember.name}</p>
              </div>
              <button
                onClick={() => { setShowWhatsAppModal(false); setWhatsAppMember(null); }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-gray-800">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p>{whatsAppMember.full_name || whatsAppMember.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mobile</p>
                  <p>{whatsAppMember.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2 relative" ref={templateRef}>
                <label className="text-sm font-semibold text-gray-700">Template</label>
                <button
                  type="button"
                  onClick={() => setShowTemplateList(!showTemplateList)}
                  className="input flex items-center justify-between"
                  aria-haspopup="listbox"
                  aria-expanded={showTemplateList}
                >
                  <span className={`${selectedTemplate ? 'text-gray-900' : 'text-gray-400'}`}>{selectedTemplate ? templates.find(t => t.key === selectedTemplate)?.label : 'Select template'}</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {showTemplateList && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-64 overflow-y-auto border border-gray-100 z-50">
                    {templates.map(t => (
                      <button
                        key={t.key}
                        onClick={() => { handleTemplateSelect(t.key); setShowTemplateList(false); }}
                        className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors text-lg font-medium"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Message</label>
                <textarea
                  rows="5"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="input"
                  placeholder="Select a template to auto-fill message"
                />
              </div>

              <button
                onClick={sendWhatsAppReminder}
                className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
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
                  <p className="font-semibold text-gray-900">{memberToDelete.full_name || memberToDelete.name}</p>
                  <p className="text-sm text-gray-500">{memberToDelete.email}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Deleting removes member access and seat allocation but keeps payment records intact for reports and audits.
              </p>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> Attendance and profile data will be removed. Payments stay saved.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Members
