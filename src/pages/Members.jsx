import { useState, useEffect, useRef } from 'react'
import { membersAPI, plansAPI, seatsAPI, paymentsAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency } from '../utils/formatters'
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Clock, X, CreditCard, User, IdCard, RefreshCw, Ban, CheckCircle, Phone, MapPin, Calendar, IndianRupee, Printer, Camera, MessageSquare, Image, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays, addMonths, addDays } from 'date-fns'
import InvoiceGenerator from '../components/InvoiceGenerator'
import QRCode from 'qrcode'

const Members = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library' || orgType === 'tution' || orgType === 'organization'
  
  const getOrgLabel = () => {
    switch(orgType) {
      case 'gym': return 'Gym'
      case 'dance': return 'Dance Studio'
      case 'yoga': return 'Yoga Center'
      case 'tution': return 'Tuition Center'
      default: return 'Library'
    }
  }

  const getMemberLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Member'
  }

  const getMemberLabelPlural = () => {
    return `${getMemberLabel()}s`
  }

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
    phone: '',
    plan_id: '1',
    gender: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    id_proof_type: '',
    id_proof_number: '',
    id_proof_photo: '',
    seat_id: '',
    photo: ''
  })
  const [planAmount, setPlanAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('online')
  const [paidAmount, setPaidAmount] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [idProofPhotoPreview, setIdProofPhotoPreview] = useState(null)
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

  const getTemplates = () => {
    const base = [
      { key: 'membership', label: 'Membership' },
      { key: 'due', label: 'Due Payment Reminder' },
      { key: 'renewal', label: 'Renewal' },
      { key: 'birthday', label: 'Birthday' },
      { key: 'offers', label: 'Offers' },
      { key: 'holiday', label: 'Holiday' }
    ]
    if (orgType === 'tution') {
      return [
        { key: 'admission', label: 'Admission' },
        { key: 'fees', label: 'Fees Reminder' },
        { key: 'test', label: 'Test Result' },
        { key: 'holiday', label: 'Holiday' }
      ]
    }
    return base
  }

  const templates = getTemplates()

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
    if (selectedOrg?.id) {
      fetchMembers()
      fetchStats()
      fetchPlans()
      fetchSeats()
    }
  }, [selectedOrg])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await membersAPI.getAll({
        org_id: selectedOrg.id,
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
      const response = await membersAPI.getStats({ org_id: selectedOrg.id })
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] }))

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
      const response = await seatsAPI.getAll({ org_id: selectedOrg.id })
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

    if (!selectedOrg?.id) {
      toast.error('Please select an organization first')
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
      org_id: selectedOrg.id,
      full_name: formData.full_name?.trim(),
      phone: trimmedPhone,
      plan_id: Number(formData.plan_id),
      gender: formData.gender,
      address: formData.address,
      id_proof_type: formData.id_proof_type,
      id_proof_photo: formData.id_proof_photo || null,
      seat_id: seatIdValue,
      photo: formData.photo,
      plan_start_date: startDate,
      plan_end_date: expiryDate
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
    const orgName = selectedOrg?.name || 'Organization'
    const line1 = `Hello ${name},`
    const line2 = `Your payment due: ₹${Number(amount || 0).toLocaleString('en-IN')}`
    const line3 = `Member ID: ${code}${endDate ? ` | Valid till: ${endDate}` : ''}`
    const line4 = `Organization: ${orgName}`
    return [line1, line2, line3, line4, '', 'QR attached for payment.'].join('\n')
  }

  const buildTemplateMessage = (templateKey, member) => {
    const name = member.full_name || member.name || 'Member'
    const code = member.member_code || 'N/A'
    const orgName = selectedOrg?.name || 'Organization'
    const endDate = member.plan_end_date ? format(new Date(member.plan_end_date), 'dd MMM, yyyy') : ''
    const amount = member.plan_price || 0

    switch (templateKey) {
      case 'membership':
        return `Hello ${name},\nWelcome to ${orgName}! Your Member ID is ${code}. Plan valid till ${endDate || 'N/A'}.`
      case 'due':
        return `Hello ${name},\nThis is a reminder that your payment of ₹${Number(amount).toLocaleString('en-IN')} is due. Member ID: ${code}. Plan valid till ${endDate || 'N/A'}.\nOrganization: ${orgName}`
      case 'renewal':
        return `Hello ${name},\nYour membership is expiring on ${endDate || 'N/A'}. Please renew to continue access. Member ID: ${code}. Organization: ${orgName}`
      case 'birthday':
        return `Happy Birthday ${name}! 🎉\nWishing you a wonderful year ahead. - ${organizationName}`
      case 'offers':
        return `Hello ${name},\nWe have a new offer for members at ${organizationName}. Reply to know more!`
      case 'holiday':
        return `Hello ${name},\n${organizationName} will remain closed for the upcoming holiday. Please plan your visits accordingly.`
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
      const qrText = `FeeTrack Payment\nOrganization: ${selectedOrg?.name || ''}\nMember: ${member.full_name || member.name || ''}\nMember ID: ${member.member_code || ''}\nAmount: ${amount}`
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
        phone: member.phone,
        plan_id: member.plan_id || '1',
        gender: member.gender || '',
        address: member.address || '',
        id_proof_type: member.id_proof_type || '',
        id_proof_photo: member.id_proof_photo || '',
        seat_id: member.seat_id || '',
        photo: member.photo || ''
      })
      setPhotoPreview(member.photo || null)
      setIdProofPhotoPreview(member.id_proof_photo || null)
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
        phone: '',
        plan_id: '1',
        gender: '',
        address: '',
        id_proof_type: '',
        id_proof_photo: '',
        seat_id: '',
        photo: ''
      })
      setPhotoPreview(null)
      setIdProofPhotoPreview(null)
      setPlanAmount('')
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
      const defaultPlan = plans.find(p => String(p.id) === '1') || plans[0]
      setExpiryDate(computeEndDate(defaultPlan || {}, today))
      setPaymentMode('online')
      setPaidAmount(defaultPlan?.price != null ? String(defaultPlan.price) : '')
    }
    // Refresh seats when opening modal to ensure seating options are up to date
    if (selectedOrg?.id) fetchSeats()
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
      member.member_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <p className="text-gray-600 mt-1">Manage your members</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add {getMemberLabel()}
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
                <p className="stats-card-label">Total {getMemberLabelPlural()}</p>
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
                <p className="stats-card-label">Active {getMemberLabelPlural()}</p>
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
                <p className="stats-card-label">Expired {getMemberLabelPlural()}</p>
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
            <h2 className="text-lg font-bold text-gray-900">Blocked {getMemberLabelPlural()}</h2>
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
              <p className="text-gray-600 mt-4">Loading {getMemberLabelPlural().toLowerCase()}...</p>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No {getMemberLabel().toLowerCase()}s found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const planEndDate = member.plan_end_date && member.plan_end_date !== '0000-00-00' ? new Date(member.plan_end_date) : null
            const isValidDate = planEndDate && !isNaN(planEndDate.getTime()) && planEndDate.getFullYear() > 2000
            const daysRemaining = isValidDate 
              ? differenceInDays(planEndDate, new Date())
              : null
            const isExpired = daysRemaining !== null && daysRemaining < 0
            const isExpiring = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7
            
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow overflow-hidden">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.full_name || member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-lg font-bold">${(member.full_name || member.name || 'U').charAt(0).toUpperCase()}</div>`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-lg font-bold">
                          {(member.full_name || member.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {member.full_name || member.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{member.member_code || 'N/A'}</span>
                        {isLibrary && member.seat_number && (
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                            🪑 {member.seat_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
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
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {isExpired ? `${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Plan Summary */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <a href={`tel:${member.phone}`} className="text-xs font-bold truncate">{member.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold truncate">{member.plan_name || 'No Plan'}</span>
                  </div>
                </div>

                {/* Dates & Type */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-3">
                  <div className="text-center border-r border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Type</p>
                    <p className="text-[11px] font-black text-gray-900 truncate">{member.plan_type || 'Fullday'}</p>
                  </div>
                  <div className="text-center border-r border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Join</p>
                    <p className="text-[11px] font-black text-gray-900">
                      {(() => {
                        if (!member.plan_start_date || member.plan_start_date === '0000-00-00') return 'N/A'
                        const d = new Date(member.plan_start_date)
                        return isNaN(d.getTime()) ? 'N/A' : format(d, 'dd MMM, yy')
                      })()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Expiry</p>
                    <p className={`text-[11px] font-black ${isExpired ? 'text-red-500' : isExpiring ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {(() => {
                        if (!member.plan_end_date || member.plan_end_date === '0000-00-00') return 'N/A'
                        const d = new Date(member.plan_end_date)
                        return isNaN(d.getTime()) ? 'N/A' : format(d, 'dd MMM, yy')
                      })()}
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Amount</p>
                    <p className="text-xs font-black text-gray-900">₹{member.plan_price || '0'}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-0.5">Paid</p>
                    <p className="text-xs font-black text-green-700">₹{member.plan_price || '0'}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-0.5">Due</p>
                    <p className="text-xs font-black text-red-700">₹0</p>
                  </div>
                </div>

                {/* Action Buttons - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => openWhatsAppChat(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-green-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WA Chat
                  </button>
                  <button
                    onClick={() => openWhatsAppReminderModal(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-green-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reminder
                  </button>
                  <button
                    onClick={() => openProfileModal(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-primary text-white rounded-lg transition-all active:scale-95"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </button>
                  <button
                    onClick={() => openInvoice(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-accent text-white rounded-lg transition-all active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Invoice
                  </button>
                  <button
                    onClick={() => openRenewModal(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-purple-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Renew
                  </button>
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-gray-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
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
              {currentMember ? `Edit ${getMemberLabel()}` : `Add New ${getMemberLabel()}`}
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
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById('photoInputCamera').click()}
                      className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                      title="Take Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('photoInputGallery').click()}
                      className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center shadow-lg hover:bg-success-dark transition-colors"
                      title="Select from Gallery"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    id="photoInputCamera"
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
                  <input
                    id="photoInputGallery"
                    type="file"
                    accept="image/*"
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
                  onChange={(e) => {
                    const newPlanId = e.target.value
                    setFormData({...formData, plan_id: newPlanId})
                    const selectedPlan = plans.find(p => String(p.id) === String(newPlanId))
                    if (selectedPlan) {
                      setExpiryDate(computeEndDate(selectedPlan, startDate))
                      setPaidAmount(String(selectedPlan.price || ''))
                    }
                  }}
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

              {/* Plan Start and End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStart = e.target.value
                      setStartDate(newStart)
                      const selectedPlan = plans.find(p => String(p.id) === String(formData.plan_id))
                      if (selectedPlan) {
                        setExpiryDate(computeEndDate(selectedPlan, newStart))
                      }
                    }}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan End Date *</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              {/* Legal ID Proof Fields */}
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

              {/* ID Proof Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ID Proof Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      {idProofPhotoPreview || formData.id_proof_photo ? (
                        <img 
                          src={idProofPhotoPreview || formData.id_proof_photo} 
                          alt="ID Proof" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IdCard className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('idProofPhotoInputCamera').click()}
                        className="btn btn-secondary flex-1 flex items-center justify-center gap-2 text-xs"
                      >
                        <Camera className="w-4 h-4" />
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('idProofPhotoInputGallery').click()}
                        className="btn btn-success flex-1 flex items-center justify-center gap-2 text-xs text-white"
                      >
                        <Image className="w-4 h-4" />
                        Gallery
                      </button>
                    </div>
                    <input
                      id="idProofPhotoInputCamera"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setIdProofPhotoPreview(reader.result)
                            setFormData({...formData, id_proof_photo: reader.result})
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                    <input
                      id="idProofPhotoInputGallery"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setIdProofPhotoPreview(reader.result)
                            setFormData({...formData, id_proof_photo: reader.result})
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a photo of your ID card/document</p>
                  </div>
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

              {/* Allot Seat - Visual Selection */}
              {isLibrary && (
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
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary/30'
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
              )}

              {/* Initial Payment Section - Only for New Members */}
              {!currentMember && (
                <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Initial Payment</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount Paid</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-primary outline-none font-bold text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Method</label>
                      <div className="flex bg-white p-1 rounded-xl border-2 border-gray-100">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('cash')}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            paymentMode === 'cash' 
                              ? 'bg-primary text-white shadow-sm' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode('online')}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            paymentMode === 'online' 
                              ? 'bg-primary text-white shadow-sm' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          Online
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium italic">
                    * This will create an enrollment payment record automatically.
                  </p>
                </div>
              )}

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
            
            <div className="mb-4 p-4 bg-primary/10 rounded-lg">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0">
                    {profileMember.photo ? (
                      <img 
                        src={profileMember.photo} 
                        alt={profileMember.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {(profileMember.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">
                      {profileMember.full_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-gray-500">
                      <IdCard className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">
                        {profileMember.member_code || 'MEM-N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-xl">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href={`tel:${profileMember.phone}`} className="text-base font-bold hover:text-primary transition-colors">
                  {profileMember.phone}
                </a>
              </div>
            </div>

            {/* Details Section - Scrollable if needed */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan</p>
                  <p className="text-base font-black text-gray-900">{profileMember.plan_name || 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</p>
                  <p className="text-base font-black text-gray-900">{profileMember.plan_type || 'Fullday'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Join</p>
                  <p className="text-base font-black text-gray-900">
                    {profileMember.plan_start_date ? format(new Date(profileMember.plan_start_date), 'dd MMM, yy') : 'N/A'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expiry</p>
                  <p className="text-base font-black text-red-500">
                    {profileMember.plan_end_date ? format(new Date(profileMember.plan_end_date), 'dd MMM, yy') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Financials in a more compact grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
                  <p className="text-sm font-black text-gray-900">{formatCurrency(profileMember.plan_price || 0)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid</p>
                  <p className="text-sm font-black text-primary">{formatCurrency(profileMember.total_paid || 0)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Due</p>
                  <p className="text-sm font-black text-red-500">{formatCurrency(profileMember.due_amount || 0)}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {isLibrary && (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Seat</p>
                    <p className="text-xs font-black text-gray-900">{profileMember.seat_number || 'N/A'}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gender</p>
                  <p className="text-xs font-black text-gray-900 capitalize">{profileMember.gender || 'N/A'}</p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-xs font-black text-gray-900 truncate">{profileMember.email || 'N/A'}</p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Emergency</p>
                  <p className="text-xs font-black text-gray-900">{profileMember.emergency_contact || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="p-4 bg-gray-50 flex gap-3 mt-auto">
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  openPaymentModal(profileMember)
                }}
                className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Add Payment
              </button>
              <button
                onClick={() => openWhatsAppChat(profileMember)}
                className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-green-600 hover:bg-green-50 transition-all active:scale-95 shadow-sm"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {showPaymentModal && paymentMember && (
        <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">Add Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="font-bold text-gray-900">{paymentMember.full_name || paymentMember.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Plan: {paymentMember.plan_name}</p>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white transition-all outline-none font-black text-lg"
                  placeholder="0.00"
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
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPayment} 
                className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
              >
                Confirm
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
          org={selectedOrg}
          onClose={closeInvoice}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {showWhatsAppModal && whatsAppMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="bg-red-500 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-base font-black text-red-500">{(whatsAppMember.full_name || whatsAppMember.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-lg font-black leading-tight">Send WhatsApp</p>
                <p className="text-white/80 text-xs font-bold truncate">{whatsAppMember.full_name || whatsAppMember.name}</p>
              </div>
              <button
                onClick={() => { setShowWhatsAppModal(false); setWhatsAppMember(null); }}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                  <p className="text-sm font-black text-gray-900">{whatsAppMember.full_name || whatsAppMember.name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile</p>
                  <p className="text-sm font-black text-gray-900">{whatsAppMember.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2 relative" ref={templateRef}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Template</label>
                <button
                  type="button"
                  onClick={() => setShowTemplateList(!showTemplateList)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl hover:border-primary/30 transition-all"
                >
                  <span className={`text-sm font-bold ${selectedTemplate ? 'text-gray-900' : 'text-gray-400'}`}>{selectedTemplate ? templates.find(t => t.key === selectedTemplate)?.label : 'Select template'}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTemplateList ? 'rotate-180' : ''}`} />
                </button>

                {showTemplateList && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl max-h-48 overflow-y-auto border border-gray-100 z-50 p-2 space-y-1">
                    {templates.map(t => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setSelectedTemplate(t.key)
                          setShowTemplateList(false)
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedTemplate === t.key 
                            ? 'bg-primary text-white' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message Preview</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white transition-all outline-none font-medium text-sm min-h-[120px] resize-none"
                  placeholder="Type your message..."
                />
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto">
              <button
                onClick={handleSendWhatsApp}
                disabled={!message.trim()}
                className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black shadow-lg shadow-green-500/20 hover:bg-[#22c35e] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                <MessageSquare className="w-5 h-5" />
                Send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Confirm Delete</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 truncate">{memberToDelete.full_name || memberToDelete.name}</p>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{memberToDelete.member_code || 'Member'}</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed px-1">
                Deleting removes member access and seat allocation but keeps payment records intact for reports and audits.
              </p>
              
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[11px] text-amber-700 font-bold leading-tight">
                  <span className="uppercase tracking-widest mr-1">Note:</span>
                  Attendance and profile data will be removed. Payments stay saved.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Members
